import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class VerifyOtpDto {
    /** Correo del usuario a verificar */
    @IsEmail()
    @IsNotEmpty()
    email: string;

    /** Código OTP recibido por correo */
    @IsString()
    @IsNotEmpty()
    code: string;
}
