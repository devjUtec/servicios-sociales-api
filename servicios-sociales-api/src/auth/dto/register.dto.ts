import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    Matches,
} from 'class-validator';

export class RegisterDto {
    /** Correo electrónico principal */
    @IsEmail()
    @IsNotEmpty()
    email: string;

    /** Contraseña con requisitos de seguridad */
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La contraseña es muy débil',
    })
    password: string;

    /** Nombres del usuario */
    @IsString()
    @IsNotEmpty()
    firstName: string;

    /** Apellidos del usuario */
    @IsString()
    @IsNotEmpty()
    lastName: string;

    /** Documento Único de Identidad (Opcional) */
    @IsOptional()
    @Matches(/^\d{8}-\d{1}$/, { message: 'Formato de DUI inválido (00000000-0)' })
    dui?: string;
}
