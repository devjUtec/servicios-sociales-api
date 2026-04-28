import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }

    async sendEmail(to: string, subject: string, html: string) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV] Enviando email a ${to} con asunto: ${subject}`);
        }
        try {
            await this.mailerService.sendMail({
                to,
                subject,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #4f46e5; text-align: center;">Servicios Sociales SV</h2>
                        <div style="margin-top: 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                            ${html}
                        </div>
                        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #eee; padding-top: 20px;">
                            Este es un mensaje institucional generado automáticamente.
                        </div>
                    </div>
                `,
            });
            return true;
        } catch (error) {
            console.error('Error enviando email genérico:', error);
            return false;
        }
    }

    async sendOtpEmail(email: string, otp: string) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV] Enviando email para ${email} enviando via ${process.env.SMTP_HOST}`);
            console.log(`[DEV] Código OTP generado: ${otp}`);
        }
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Código de Verificación - Servicios Sociales SV',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #1a73e8; text-align: center;">Servicios Sociales SV</h2>
            <p>Hola,</p>
            <p>Has solicitado iniciar sesión en el portal de Servicios Sociales. Tu código de verificación es:</p>
            <div style="background-color: #f1f3f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #202124; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p>Este código expirará en 10 minutos. Si no solicitaste este código, puedes ignorar este mensaje.</p>
            <hr style="border: none; border-top: 1px solid #e1e1e1; margin: 20px 0;">
            <p style="font-size: 12px; color: #70757a; text-align: center;">
              Este es un mensaje automático, por favor no respondas a este correo.
            </p>
          </div>
        `,
            });
            return true;
        } catch (error) {
            console.error('Error enviando email OTP:', error);
            return false;
        }
    }

    async sendCitizenInvitationEmail(email: string, affiliationNumber: string, activationCode: string) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEV Seguridad] Enlace de activación generado para ${email}: http://localhost:3002/portal/activate?email=${encodeURIComponent(email)}&code=${activationCode}`);
        }
        try {
            const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/portal/activate?email=${encodeURIComponent(email)}&code=${activationCode}`;
            await this.mailerService.sendMail({
                to: email,
                subject: '¡Bienvenido a Servicios Sociales! - Activa tu cuenta',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #1a73e8; text-align: center;">Servicios Sociales SV</h2>
            <p>Hola,</p>
            <p>Se te ha registrado exitosamente en el sistema de Servicios Sociales de El Salvador. 
            Tu Número de Afiliación Oficial es: <strong>${affiliationNumber}</strong></p>
            <p>Para poder ingresar al Portal del Ciudadano y revisar tus contribuciones y expedientes, por favor activa tu cuenta y crea una contraseña haciendo clic en el siguiente enlace seguro:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${activationLink}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Establecer mi Contraseña</a>
            </div>
            <p>Este enlace expirará en 7 días.</p>
            <hr style="border: none; border-top: 1px solid #e1e1e1; margin: 20px 0;">
            <p style="font-size: 12px; color: #70757a; text-align: center;">
              Si no esperabas este correo, por favor contáctanos inmediatamente. No respondas a este correo.
            </p>
          </div>
        `,
            });
            return true;
        } catch (error) {
            console.error('Error enviando email de invitación:', error);
            return false;
        }
    }
}
