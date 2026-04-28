import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateContributionDto {
    /** ID de la afiliación relacionada */
    @IsUUID()
    @IsNotEmpty()
    affiliationId: string;

    /** ID del ciudadano */
    @IsUUID()
    @IsNotEmpty()
    citizenId: string;

    /** Período de la cotización (ej: 2024-03) */
    @IsString()
    @IsNotEmpty()
    period: string;

    /** Salario base reportado */
    @IsNumber()
    @IsNotEmpty()
    baseAmount: number;

    /** Monto de la contribución */
    @IsNumber()
    @IsNotEmpty()
    contributionAmount: number;

    /** Nombre del empleador */
    @IsString()
    @IsNotEmpty()
    employer: string;

    /** NIT del empleador */
    @IsString()
    @IsNotEmpty()
    employerTaxId: string;

    /** Estado del pago (paid, pending) */
    @IsString()
    @IsOptional()
    status?: string;

    /** Fecha de pago */
    @IsOptional()
    paymentDate?: Date;
}
