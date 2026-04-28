import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { CreateAffiliationDto } from './dto/create-affiliation.dto';

@Injectable()
export class AffiliationService {
    constructor(
        private prisma: PrismaService,
        private auditService: AuditService,
        private mailService: MailService
    ) { }

    async create(createAffiliationDto: CreateAffiliationDto, userId?: string, email?: string, userAgent?: string, ipAddress?: string) {
        let citizenId = createAffiliationDto.citizenId;

        // Auto-create citizen if missing
        if (!citizenId) {
            if (!createAffiliationDto.email || !createAffiliationDto.firstName || !createAffiliationDto.lastName || !createAffiliationDto.idNumber) {
                throw new ConflictException('Faltan datos del ciudadano para crearlo automáticamente (email, firstName, lastName, idNumber)');
            }
            
            // Check if citizen already exists by DUI or email
            let existingCitizen = await this.prisma.citizen.findFirst({
                where: {
                    OR: [
                        { email: createAffiliationDto.email },
                        { idNumber: createAffiliationDto.idNumber }
                    ]
                }
            });

            if (existingCitizen) {
                citizenId = existingCitizen.id;
            } else {
                // Nuevo flujo de invitación: Se crea sin contraseña (o con un string vacío) y con isVerified en false
                const newCitizen = await this.prisma.citizen.create({
                    data: {
                        email: createAffiliationDto.email,
                        firstName: createAffiliationDto.firstName,
                        lastName: createAffiliationDto.lastName,
                        idNumber: createAffiliationDto.idNumber,
                        passwordHash: '', // El usuario la creará en su link
                        isVerified: false,
                        affiliationNumber: createAffiliationDto.affiliationNumber || `AFF-${Date.now()}`
                    }
                });
                citizenId = newCitizen.id;
                
                // Generar Link de Activación
                const activationCode = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7); // 7 días para activar
                
                await this.prisma.oTP.create({
                    data: {
                        email: newCitizen.email,
                        citizenId: newCitizen.id,
                        code: activationCode,
                        expiresAt
                    }
                });

                await this.mailService.sendCitizenInvitationEmail(newCitizen.email, newCitizen.affiliationNumber, activationCode);

                // Log citizen creation
                await this.auditService.createLog({
                    userId,
                    email,
                    action: 'CITIZEN_CREATED_INVITED',
                    resourceType: 'Citizen',
                    resourceId: citizenId,
                    metadata: { method: 'auto_from_affiliation_invite' },
                    userAgent,
                    ipAddress,
                    success: true
                });
            }
        }

        const affiliationNumber = createAffiliationDto.affiliationNumber || `AFF-${Date.now()}-${Math.floor(Math.random()*1000)}`;

        const existing = await this.prisma.affiliation.findUnique({
            where: { affiliationNumber },
        });

        if (existing) {
            throw new ConflictException('El número de afiliación ya está registrado');
        }

        const affiliation = await this.prisma.affiliation.create({
            data: {
                citizenId,
                affiliationNumber,
                affiliationType: createAffiliationDto.affiliationType,
                institutionType: createAffiliationDto.institutionType,
                employer: createAffiliationDto.employer,
                employerTaxId: createAffiliationDto.employerTaxId,
                department: createAffiliationDto.department,
                observations: createAffiliationDto.observations,
            },
        });

        await this.auditService.createLog({
            userId,
            email,
            action: 'AFFILIATION_CREATED',
            resourceType: 'Affiliation',
            resourceId: affiliation.id,
            citizenId: affiliation.citizenId,
            userAgent,
            ipAddress,
            success: true
        });

        return affiliation;
    }

    async findAll() {
        return this.prisma.affiliation.findMany({
            include: { citizen: true },
        });
    }

    async findOne(id: string) {
        const affiliation = await this.prisma.affiliation.findUnique({
            where: { id },
            include: { citizen: true, contributions: true },
        });

        if (!affiliation) {
            throw new NotFoundException(`Afiliación con ID ${id} no encontrada`);
        }

        return affiliation;
    }

    async findByCitizenId(citizenId: string) {
        return this.prisma.affiliation.findMany({
            where: { citizenId },
            include: { contributions: true },
        });
    }

    async findByNumber(affiliationNumber: string) {
        return this.prisma.affiliation.findFirst({
            where: { affiliationNumber },
            include: { citizen: true }
        });
    }

    async update(id: string, updateData: any, userId?: string, email?: string, userAgent?: string, ipAddress?: string) {
        const affiliation = await this.prisma.affiliation.update({
            where: { id },
            data: updateData,
        });

        await this.auditService.createLog({
            userId,
            email,
            action: 'AFFILIATION_UPDATED',
            resourceType: 'Affiliation',
            resourceId: id,
            citizenId: affiliation.citizenId,
            userAgent,
            ipAddress,
            success: true
        });

        return affiliation;
    }

    async remove(id: string, userId?: string, email?: string, userAgent?: string, ipAddress?: string) {
        const target = await this.prisma.affiliation.findUnique({ where: { id } });
        await this.prisma.affiliation.delete({
            where: { id },
        });

        await this.auditService.createLog({
            userId,
            email,
            action: 'AFFILIATION_DELETED',
            resourceType: 'Affiliation',
            resourceId: id,
            citizenId: target?.citizenId,
            userAgent,
            ipAddress,
            success: true
        });

        return { success: true };
    }
}
