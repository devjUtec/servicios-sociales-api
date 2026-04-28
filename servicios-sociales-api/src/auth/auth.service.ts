import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';

import { CitizenLoginDto } from './dto/citizen-login.dto';
import * as svgCaptcha from 'svg-captcha';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private auditService: AuditService,
        private mailService: MailService,
    ) { }

    private visualCaptchas = new Map<string, { code: string; expires: number }>();

    async activateAccount(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (user.isActive) {
            throw new ConflictException('La cuenta ya ha sido activada anteriormente.');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                isActive: true,
                isVerified: true,
            },
        });

        await this.auditService.createLog({
            userId: user.id,
            email: user.email,
            action: 'ACTIVATE_ACCOUNT_SUCCESS',
            success: true,
            metadata: { method: 'PASSWORD' }
        });

        return { message: 'Cuenta activada exitosamente' };
    }

    async activateCitizenAccount(email: string, code: string, password: string, userAgent?: string, ipAddress?: string) {
        // Encontrar ciudadano
        const citizen = await this.prisma.citizen.findUnique({
            where: { email },
        });

        if (!citizen) {
            throw new NotFoundException('Ciudadano no encontrado');
        }

        if (citizen.isVerified) {
            throw new ConflictException('La cuenta ciudadana ya ha sido verificada y activada anteriormente.');
        }

        // Validar el código de activación (OTP)
        const otpRecord = await this.prisma.oTP.findFirst({
            where: {
                citizenId: citizen.id,
                code,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });

        if (!otpRecord) {
            throw new UnauthorizedException('El enlace de activación es inválido o ha expirado');
        }

        // Marcar OTP como usado
        await this.prisma.oTP.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });

        // Generar hash para la nueva contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Actualizar el estado del ciudadano configurando la contraseña
        await this.prisma.citizen.update({
            where: { id: citizen.id },
            data: {
                passwordHash,
                isVerified: true,
                isActive: true, // asumiendo que el modelo Citizen tiene isActive o derivado
            },
        });

        await this.auditService.createLog({
            citizenId: citizen.id,
            email: citizen.email,
            action: 'CITIZEN_ACTIVATE_ACCOUNT',
            success: true,
            metadata: { method: 'EMAIL_INVITATION_LINK' },
            userAgent,
            ipAddress
        });

        return { message: 'Cuenta ciudadana activada y contraseña establecida exitosamente' };
    }

    async register(dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('El correo ya está registrado');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                isActive: true,
                isVerified: false,
            },
        });

        const cotizanteRole = await this.prisma.role.findUnique({
            where: { name: 'citizen' },
        });

        if (cotizanteRole) {
            await this.prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId: cotizanteRole.id,
                },
            });
        }

        return { message: 'Usuario registrado exitosamente' };
    }

    async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
        // Validar el CAPTCHA antes de cualquier otra cosa
        const isCaptchaValid = await this.validateCaptcha(dto.captchaToken, dto.captchaAnswer, dto.captchaId);
        if (!isCaptchaValid) {
            throw new UnauthorizedException('El CAPTCHA ingresado es incorrecto o ha expirado');
        }

        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                roles: {
                    include: { role: true },
                },
            },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Tu cuenta está desactivada');
        }

        // --- PASO OTP INTERNO ---
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Log para entorno de desarrollo (No se envía en la respuesta)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Seguridad] OTP Generado para Staff ${user.email}: ${otpCode}`);
        }

        await this.prisma.oTP.create({
            data: {
                code: otpCode,
                email: user.email,
                expiresAt,
            },
        });

        const emailSent = await this.mailService.sendOtpEmail(user.email, otpCode);

        await this.auditService.createLog({
            userId: user.id,
            email: user.email,
            action: emailSent ? 'LOGIN_INTERNAL_OTP_SENT' : 'LOGIN_INTERNAL_OTP_SEND_FAILED',
            success: emailSent,
            userAgent,
            ipAddress,
        });

        return {
            message: emailSent
                ? 'Paso 1 exitoso. Se ha enviado un código OTP a su correo.'
                : 'Paso 1 exitoso. (Simulación) El código no pudo ser enviado pero se generó correctamente.',
            email: user.email,
            expiresIn: '10m'
        };
    }

    async verifyInternalOtp(email: string, code: string) {
        const otpEntry = await this.prisma.oTP.findFirst({
            where: {
                email,
                code,
                used: false,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!otpEntry) {
            throw new UnauthorizedException('Código OTP inválido o expirado');
        }

        // Marcar como usado
        await this.prisma.oTP.update({
            where: { id: otpEntry.id },
            data: { used: true }
        });

        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { roles: { include: { role: true } } }
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const roles = user.roles.map((ur: any) => ur.role.name);
        const payload = {
            sub: user.id,
            email: user.email,
            roles,
            type: 'internal'
        };

        await this.auditService.createLog({
            userId: user.id,
            email: user.email,
            action: 'LOGIN_INTERNAL_SUCCESS',
            success: true
        });

        return {
            accessToken: await this.jwtService.signAsync(payload),
            refreshToken: await this.generateRefreshToken(user.id),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles
            }
        };
    }

    async citizenLogin(dto: CitizenLoginDto, userAgent?: string, ipAddress?: string) {
        // Validar el CAPTCHA antes de cualquier otra cosa
        const isCaptchaValid = await this.validateCaptcha(dto.captchaToken, dto.captchaAnswer, dto.captchaId);
        if (!isCaptchaValid) {
            throw new UnauthorizedException('El CAPTCHA ingresado es incorrecto o ha expirado');
        }

        const citizen = await this.prisma.citizen.findUnique({
            where: { email: dto.email },
        });

        if (!citizen) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (citizen.affiliationNumber !== dto.affiliationNumber) {
            throw new UnauthorizedException('Número de afiliación incorrecto');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, citizen.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!citizen.isActive) {
            throw new UnauthorizedException('Tu cuenta de ciudadano está desactivada');
        }

        // --- PASO OTP (Simulado sin SMTP) ---
        // 1. Generar código de 6 dígitos
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Log para entorno de desarrollo (No se envía en la respuesta)
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Seguridad] OTP Generado para ${citizen.email}: ${otpCode}`);
        }

        // 2. Guardar en BD con expiración de 10 minutos
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        await this.prisma.oTP.create({
            data: {
                code: otpCode,
                email: citizen.email,
                citizenId: citizen.id,
                expiresAt,
            },
        });

        const emailSent = await this.mailService.sendOtpEmail(citizen.email, otpCode);

        await this.auditService.createLog({
            citizenId: citizen.id,
            email: citizen.email,
            action: emailSent ? 'LOGIN_CITIZEN_OTP_SENT' : 'LOGIN_CITIZEN_OTP_SEND_FAILED',
            success: emailSent,
            userAgent,
            ipAddress,
            metadata: { note: emailSent ? 'OTP sent to email' : 'Failed to send email' }
        });

        return {
            message: emailSent
                ? 'Paso 1 exitoso. Se ha enviado un código OTP a su correo.'
                : 'Paso 1 exitoso. (Simulación) El código no pudo ser enviado pero se generó correctamente.',
            citizenId: citizen.id,
            email: citizen.email,
            expiresIn: '10m'
        };
    }

    async verifyCitizenOtp(email: string, code: string) {
        const otpEntry = await this.prisma.oTP.findFirst({
            where: {
                email,
                code,
                used: false,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!otpEntry) {
            throw new UnauthorizedException('Código OTP inválido o expirado');
        }

        // Marcar como usado
        await this.prisma.oTP.update({
            where: { id: otpEntry.id },
            data: { used: true }
        });

        const citizen = await this.prisma.citizen.findUnique({
            where: { email }
        });

        if (!citizen) {
            throw new NotFoundException('Ciudadano no encontrado');
        }

        // Generar Tokens finales
        const roles = ['citizen'];
        const payload = {
            sub: citizen.id,
            email: citizen.email,
            roles,
            type: 'citizen'
        };

        await this.auditService.createLog({
            citizenId: citizen.id,
            email: citizen.email,
            action: 'LOGIN_CITIZEN_STEP2_SUCCESS',
            success: true
        });

        return {
            accessToken: await this.jwtService.signAsync(payload),
            refreshToken: await this.generateCitizenRefreshToken(citizen.id),
            user: {
                id: citizen.id,
                email: citizen.email,
                firstName: citizen.firstName,
                lastName: citizen.lastName,
                roles
            }
        };
    }

    async loginAsUser(user: any) {
        let roles: string[] = [];
        if (user.roles && Array.isArray(user.roles)) {
            roles = user.roles.map((ur: any) => ur.role?.name || ur.roleName || 'citizen');
        } else {
            const userWithRoles = await this.prisma.user.findUnique({
                where: { id: user.id },
                include: { roles: { include: { role: true } } },
            });
            roles = userWithRoles?.roles.map((ur: any) => ur.role.name) || ['citizen'];
        }

        const payload = {
            sub: user.id,
            email: user.email,
            roles,
            type: 'internal',
        };

        await this.auditService.createLog({
            userId: user.id,
            email: user.email,
            action: `LOGIN_OAUTH_${(user.provider || 'EXTERNAL').toUpperCase()}`,
            success: true,
        });

        return {
            accessToken: await this.jwtService.signAsync(payload),
            refreshToken: await this.generateRefreshToken(user.id),
            expiresIn: 900,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles,
            },
        };
    }

    private async generateRefreshToken(userId: string) {
        const token = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.refreshToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });

        return token;
    }

    private async generateCitizenRefreshToken(citizenId: string) {
        const token = Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await this.prisma.citizenRefreshToken.create({
            data: {
                citizenId,
                token,
                expiresAt,
            },
        });

        return token;
    }

    async refreshToken(token: string) {
        let refreshToken: any = await this.prisma.refreshToken.findUnique({
            where: { token },
            include: { user: { include: { roles: { include: { role: true } } } } },
        });

        let isCitizen = false;

        if (!refreshToken) {
            // Check if it's a citizen refresh token
            refreshToken = await this.prisma.citizenRefreshToken.findUnique({
                where: { token },
                include: { citizen: true },
            });
            isCitizen = true;
        }

        if (!refreshToken || refreshToken.revoked || refreshToken.expiresAt < new Date()) {
            throw new UnauthorizedException('Refresh token inválido o expirado');
        }

        if (isCitizen) {
            await this.prisma.citizenRefreshToken.update({
                where: { id: refreshToken.id },
                data: { revoked: true, revokedAt: new Date() },
            });

            const citizen = refreshToken.citizen;
            const roles = ['citizen'];
            const payload = { sub: citizen.id, email: citizen.email, roles, type: 'citizen' };

            return {
                accessToken: await this.jwtService.signAsync(payload),
                refreshToken: await this.generateCitizenRefreshToken(citizen.id),
                expiresIn: 900,
            };
        } else {
            await this.prisma.refreshToken.update({
                where: { id: refreshToken.id },
                data: { revoked: true, revokedAt: new Date() },
            });

            const user = refreshToken.user;
            const roles = user.roles.map((ur: any) => ur.role.name);
            const payload = { sub: user.id, email: user.email, roles, type: 'internal' };

            return {
                accessToken: await this.jwtService.signAsync(payload),
                refreshToken: await this.generateRefreshToken(user.id),
                expiresIn: 900,
            };
        }
    }

    async logout(token: string, userAgent?: string, ipAddress?: string) {
        let userId: string | null = null;
        let citizenId: string | null = null;
        let email: string | null = null;
        
        let refreshToken: any = await this.prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true }
        });

        if (refreshToken) {
            userId = refreshToken.userId;
            email = refreshToken.user.email;
        } else {
            let citizenToken = await this.prisma.citizenRefreshToken.findUnique({
                where: { token },
                include: { citizen: true }
            });
            if (citizenToken) {
                citizenId = citizenToken.citizenId;
                email = citizenToken.citizen.email;
            }
        }

        if (userId || citizenId) {
            await this.auditService.createLog({
                userId: userId || undefined,
                citizenId: citizenId || undefined,
                email: email || undefined,
                action: userId ? 'LOGOUT_INTERNAL' : 'LOGOUT_CITIZEN',
                success: true,
                userAgent,
                ipAddress,
            });
        }

        await this.prisma.refreshToken.updateMany({
            where: { token },
            data: { revoked: true, revokedAt: new Date() },
        });

        // Also try citizen tokens
        await this.prisma.citizenRefreshToken.updateMany({
            where: { token },
            data: { revoked: true, revokedAt: new Date() },
        });
    }

    /** Generar un nuevo CAPTCHA visual */
    async generateVisualCaptcha() {
        const captcha = svgCaptcha.create({
            size: 4,
            noise: 3,
            color: true,
            background: '#f0f0f0',
        });

        const id = uuidv4();
        // Expira en 5 minutos
        const expires = Date.now() + 5 * 60 * 1000;
        
        this.visualCaptchas.set(id, {
            code: captcha.text.toLowerCase(),
            expires
        });

        // Limpiar captchas viejos cada vez que se genera uno (básico)
        this.cleanupCaptchas();

        return {
            id,
            data: captcha.data, // Imagen SVG
        };
    }

    private cleanupCaptchas() {
        const now = Date.now();
        for (const [id, data] of this.visualCaptchas.entries()) {
            if (data.expires < now) {
                this.visualCaptchas.delete(id);
            }
        }
    }

    async validateCaptcha(token?: string, answer?: string, id?: string): Promise<boolean> {
        // --- MODO DESARROLLADOR / MASTER KEY ---
        // Esto permite pruebas fáciles en Postman sin comprometer la seguridad de producción
        const isDev = process.env.NODE_ENV !== 'production';
        const masterKey = '777-DEMO-MASTER-KEY'; // Esto debería estar en .env idealmente
        
        if (isDev && token === masterKey) {
            console.log('[SEGURIDAD] Bypass de CAPTCHA detectado mediante Master Key');
            return true;
        }

        // 1. Validar CAPTCHA Visual (Letras) si se proporciona
        if (answer && id) {
            const stored = this.visualCaptchas.get(id);
            if (!stored) return false;
            
            if (Date.now() > stored.expires) {
                this.visualCaptchas.delete(id);
                return false;
            }

            if (stored.code !== answer.toLowerCase()) {
                return false;
            }
            
            // Consumir el captcha para que no se use dos veces
            this.visualCaptchas.delete(id);
            return true;
        }

        // 2. Validar Google reCAPTCHA v3
        try {
            if (!token) return false;
            const secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
            
            // Si no hay secret key (ej: local sin config), solo validamos por letras
            if (!secretKey) {
                console.warn('[SEGURIDAD] RECAPTCHA_SECRET_KEY no configurado, validando solo manual');
                return false; 
            }

            const response = await fetch(
                `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
                { method: 'POST' }
            );
            const data: any = await response.json();
            return data.success === true && data.score >= 0.5;
        } catch {
            return false;
        }
    }
}
