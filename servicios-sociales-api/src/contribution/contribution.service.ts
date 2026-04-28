import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContributionDto } from './dto/create-contribution.dto';

@Injectable()
export class ContributionService {
    constructor(private prisma: PrismaService) { }

    async create(createContributionDto: CreateContributionDto) {
        const existing = await this.prisma.contribution.findFirst({
            where: {
                affiliationId: createContributionDto.affiliationId,
                period: createContributionDto.period,
            },
        });

        if (existing) {
            throw new ConflictException(
                `Ya existe una contribución registrada para el periodo ${createContributionDto.period}`,
            );
        }

        return this.prisma.contribution.create({
            // @ts-ignore - Handle local decimal conversion if needed
            data: createContributionDto,
        });
    }

    async findByCitizenId(citizenId: string) {
        return this.prisma.contribution.findMany({
            where: { citizenId },
            orderBy: { period: 'desc' },
            include: { affiliation: true },
        });
    }

    async findByAffiliationId(affiliationId: string) {
        return this.prisma.contribution.findMany({
            where: { affiliationId },
            orderBy: { period: 'desc' },
        });
    }

    async getSummary(citizenId: string) {
        try {
            console.log('[DEBUG] getSummary for citizenId:', citizenId);
            const contributions = await this.prisma.contribution.findMany({
                where: { citizenId },
                orderBy: { period: 'desc' },
            });

            console.log(`[DEBUG] Found ${contributions.length} contributions`);

            const totalAmount = contributions.reduce(
                (acc, curr) => acc + Number(curr.contributionAmount),
                0,
            );

            const result = {
                totalPeriods: contributions.length,
                totalAccumulated: totalAmount,
                lastPeriod: contributions[0]?.period || 'N/A',
            };
            console.log('[DEBUG] Result:', result);
            return result;
        } catch (error) {
            console.error('[CRITICAL ERROR] getSummary failed:', error);
            throw error;
        }
    }

    async findAll() {
        return this.prisma.contribution.findMany({
            orderBy: { period: 'desc' },
            include: { 
                citizen: {
                    select: { firstName: true, lastName: true, email: true }
                },
                affiliation: true 
            },
        });
    }
}
