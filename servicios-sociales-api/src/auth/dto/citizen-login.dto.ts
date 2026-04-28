import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CitizenLoginDto {
    /** Correo del ciudadano */
    @IsEmail()
    @IsNotEmpty()
    email: string;

    /** Número de carnet/afiliación */
    @IsString()
    @IsNotEmpty()
    affiliationNumber: string;

    /** Contraseña del ciudadano */
    @IsString()
    @IsNotEmpty()
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
