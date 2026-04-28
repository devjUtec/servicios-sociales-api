import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
    /** Correo institucional o administrativo */
    @IsEmail({}, { message: 'Email inválido' })
    @IsNotEmpty()
    email: string;

    /** Contraseña de acceso */
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    password: string;

    /** Token de Google reCAPTCHA v3 (Invisible) */
    @IsString()
    @IsOptional()
    captchaToken?: string;

    /** Respuesta del CAPTCHA visual (Letras) */
    @IsString()
    @IsOptional()
    captchaAnswer?: string;

    /** ID del CAPTCHA visual generado */
    @IsString()
    @IsOptional()
    captchaId?: string;
}
