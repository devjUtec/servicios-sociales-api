import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private mailService: MailService
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        roles: {
          include: { role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    const { email, firstName, lastName, roleName, adminId, adminEmail, userAgent, ipAddress } = data;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('El correo ya está registrado.');
    }

    const role = await this.prisma.role.findUnique({ where: { name: roleName.toLowerCase() } });
    if (!role) {
      throw new BadRequestException(`El rol ${roleName} no existe.`);
    }

    // Generamos un token de invitación único
    const invitationToken = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        isActive: false, // Inactivo hasta que acepte la invitación
        isVerified: false,
        passwordHash: '', // Sin contraseña aún
        roles: {
          create: {
            roleId: role.id,
            assignedBy: adminEmail || 'system',
          },
        },
      },
    });

    // Guardar el token (podríamos agregarlo a la tabla User o tener una tabla específica)
    // Para simplificar, lo guardaremos en la tabla User (añadiremos el campo si no existe, o lo mandamos por mail directamente)
    // Vamos a enviarlo por correo. 
    const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/activate-account?token=${invitationToken}&email=${email}`;
    
    try {
      // Usaremos un método de mailService para enviar la invitación (lo crearé si no existe)
      await this.mailService.sendEmail(
        email,
        'Invitación al Sistema de Servicios Sociales',
        `Hola ${firstName}, has sido invitado como ${roleName}. Activa tu cuenta aquí: ${activationUrl}`
      );
    } catch (error) {
       console.error('Error enviando mail:', error);
       // No bloqueamos la creación, pero registramos el error
    }

    await this.auditService.createLog({
      action: 'INVITE_USER',
      email: adminEmail,
      userId: adminId,
      resourceType: 'USER',
      resourceId: user.id,
      userAgent,
      ipAddress,
      metadata: { newUserEmail: email, role: roleName, status: 'INVITED' }
    });

    return { ...user, invitationToken };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, updateData: any) {
    const { firstName, lastName, email, isActive, adminId, adminEmail, userAgent, ipAddress } = updateData;
    
    const user = await this.prisma.user.update({
      where: { id },
      data: { firstName, lastName, email, isActive },
    });

    // AUDITORÍA (CORREGIDO)
    await this.auditService.createLog({
      action: 'UPDATE_USER',
      email: adminEmail,
      userId: adminId,
      resourceType: 'USER',
      resourceId: id,
      userAgent,
      ipAddress,
      metadata: { changes: { firstName, lastName, isActive } }
    });

    return user;
  }

  async remove(id: string, adminData: any) {
    const user = await this.findOne(id);
    const deleted = await this.prisma.user.delete({ where: { id: user.id } });

    // AUDITORÍA (CORREGIDO)
    await this.auditService.createLog({
      action: 'DELETE_USER',
      email: adminData.adminEmail,
      userId: adminData.adminId,
      resourceType: 'USER',
      resourceId: id,
      userAgent: adminData.userAgent,
      ipAddress: adminData.ipAddress,
      metadata: { deletedUserEmail: user.email }
    });

    return deleted;
  }

  async setRole(userId: string, roleName: string) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException('Rol no encontrado');

    await this.prisma.userRole.deleteMany({ where: { userId } });

    return this.prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
    });
  }
}
