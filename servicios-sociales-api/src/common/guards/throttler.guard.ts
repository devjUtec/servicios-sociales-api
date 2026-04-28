import { Injectable, ExecutionContext, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as Throttler from '@nestjs/throttler';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomThrottlerGuard extends Throttler.ThrottlerGuard {
  private readonly logger = new Logger('Security-RateLimit');
  protected customErrorMessage = 'Hemos detectado un comportamiento inusual (posible bot). Por seguridad, tu acceso ha sido pausado temporalmente. Si crees que es un error, contacta a soporte@test.sv';

  @Inject(AuditService)
  private readonly auditService: AuditService;

  @Inject(PrismaService)
  private readonly prisma: PrismaService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const url = request.url;

    // Desactivar validación de IP y rate limit para endpoints que deben ser inmediatos
    if (url.includes('/captcha') || url.includes('/health') || url.includes('/docs')) {
      return true;
    }

    try {
      const blacklistEntry = await this.prisma.ipBlacklist.findUnique({
        where: { ipAddress: ip }
      });

      if (blacklistEntry && blacklistEntry.isPermanent) {
        this.logger.error(`🚫 ACCESO DENEGADO PERMANENTE: IP=${ip} está en la lista negra.`);
        throw new HttpException(
          'Tu acceso ha sido bloqueado permanentemente debido a múltiples intentos sospechosos. Contacta a soporte técnico para revisión.',
          HttpStatus.FORBIDDEN
        );
      }
    } catch (e) {
      if (e instanceof HttpException) throw e;
      this.logger.error(`Error verificando blacklist para IP ${ip}`, e);
    }

    return super.canActivate(context);
  }

  protected async throwThrottlingException(context: ExecutionContext, details: Throttler.ThrottlerLimitDetail): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const url = request.url;
    const method = request.method;

    this.logger.warn(`🔴 BLOQUEO POR TASA EXCEDIDA: IP=${ip} intentando acceder a ${method} ${url}`);

    // Manejar el sistema de STRIKES
    try {
      const blacklistEntry = await this.prisma.ipBlacklist.findUnique({
        where: { ipAddress: ip }
      });

      if (!blacklistEntry) {
        await this.prisma.ipBlacklist.create({
          data: {
            ipAddress: ip,
            strikes: 1,
            reason: 'Primer aviso por exceso de peticiones'
          }
        });
      } else {
        const newStrikes = blacklistEntry.strikes + 1;
        const isPermanent = newStrikes >= 3;

        await this.prisma.ipBlacklist.update({
          where: { ipAddress: ip },
          data: {
            strikes: newStrikes,
            isPermanent: isPermanent,
            lastBlockedAt: new Date(),
            reason: isPermanent ? 'Bloqueo permanente por reincidencia (3 strikes)' : `Reincidencia #${newStrikes}`
          }
        });

        if (isPermanent) {
          this.logger.error(`🔥 BLOQUEO PERMANENTE ACTIVADO para IP=${ip}`);
        }
      }

      // Registrar en el log de auditoría
      await this.auditService.createLog({
        action: 'RATE_LIMIT_BLOCK',
        ipAddress: ip,
        resourceType: 'API_ENDPOINT',
        resourceId: url,
        success: false,
        errorMessage: 'Límite de peticiones excedido (Throttling)',
        metadata: {
          method,
          url,
          strikes: (blacklistEntry?.strikes || 0) + 1,
          userAgent: request.headers['user-agent']
        }
      });
    } catch (e) {
      this.logger.error('Error procesando strikes en el Guard de seguridad', e);
    }

    throw new HttpException(this.customErrorMessage, HttpStatus.TOO_MANY_REQUESTS);
  }
}
