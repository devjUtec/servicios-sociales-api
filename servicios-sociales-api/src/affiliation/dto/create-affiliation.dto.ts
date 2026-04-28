import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateAffiliationDto {
    /** ID del ciudadano relacionado */
    @IsUUID()
    @IsOptional()
    citizenId?: string;

    /** Número correlativo de afiliación */
    @IsString()
    @IsOptional()
    affiliationNumber?: string;

    /** Primer nombre */
    @IsString()
    @IsOptional()
    firstName?: string;

    /** Primer apellido */
    @IsString()
    @IsOptional()
    lastName?: string;

    /** Correo de contacto */
    @IsString()
    @IsOptional()
    email?: string;

    /** Número de DUI o Documento */
    @IsString()
    @IsOptional()
    idNumber?: string;

    /** Tipo de afiliación (ej: Trabajador Activo) */
    @IsString()
    @IsNotEmpty()
    affiliationType: string;

    /** Institución (ej: ISSS, AFP) */
    @IsString()
    @IsNotEmpty()
    institutionType: string;

    /** Nombre del empleador */
    @IsString()
    @IsOptional()
    employer?: string;

    /** NIT del empleador */
    @IsString()
    @IsOptional()
    employerTaxId?: string;

    /** Departamento de residencia */
    @IsString()
    @IsOptional()
    department?: string;

    /** Observaciones adicionales */
    @IsString()
    @IsOptional()
    observations?: string;
}
