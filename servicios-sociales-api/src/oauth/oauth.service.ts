import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class OAuthService {
    constructor(
        private prisma: PrismaService,
        private authService: AuthService,
    ) { }

    async validateOAuthUser(profile: any) {
        const { email, firstName, lastName, provider, providerId } = profile;

        // 1. Buscar si el usuario ya existe por email y traer sus roles
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { 
                roles: { include: { role: true } },
                oauthIdentities: true 
            },
        });

        // 2. RESTRICCIÓN SEGURA: Nadie entra si no está pre-registrado en la BD.
        if (!user) {
            throw new UnauthorizedException('Acceso denegado: Este correo no está registrado en el sistema.');
        }

        // 3. RESTRICCIÓN DE PERSONAL: Solo staff administrativo o médico.
        const staffRoles = ['admin', 'superadmin', 'doctor', 'staff'];
        const hasStaffRole = user.roles.some((ur: any) => 
            staffRoles.includes(ur.role.name.toLowerCase())
        );

        if (!hasStaffRole) {
            throw new UnauthorizedException('No tienes permisos de personal para acceder por este medio.');
        }

        // 4. Vincular identidad de Google si es la primera vez que la usa
        const hasIdentity = user.oauthIdentities.some(
            (id: any) => id.provider === provider && id.providerUserId === providerId,
        );

        if (!hasIdentity) {
            // Vinculamos la nueva cuenta de red social al usuario existente
            // Y activamos la cuenta automáticamente si era una invitación
            await this.prisma.user.update({
                where: { id: user.id },
                data: { 
                    isActive: true, 
                    isVerified: true 
                }
            });

            await this.prisma.oAuthIdentity.create({
                data: {
                    userId: user.id,
                    provider,
                    providerUserId: providerId,
                    email,
                },
            });
        }

        // 5. Login seguro
        return this.authService.loginAsUser({ ...user, provider });
    }
}
