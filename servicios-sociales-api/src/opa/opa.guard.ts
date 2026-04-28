import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OpaService } from './opa.service';

@Injectable()
export class OpaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly opaService: OpaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Obtener la acción y recurso requeridos de alguna metadata, por ejemplo
    // o inferirlos desde el objeto `request` (URL, Method, etc)
    const action = request.method.toLowerCase();
    const resource = request.route.path.split('/')[2] || 'general'; // ej: /api/affiliation -> affiliation

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado (OpaGuard)');
    }

    const { id, roles, institutionId } = user;
    
    const isAllowed = await this.opaService.checkPermission(
      { id, roles, institutionId },
      action,
      resource,
      { ip: request.ip }
    );

    if (!isAllowed) {
      throw new ForbiddenException(`Acceso denegado por políticas de seguridad (OPA). Recurso: ${resource}, Acción: ${action}`);
    }

    return true;
  }
}
