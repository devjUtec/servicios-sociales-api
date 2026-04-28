import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async createLog(data: {
        userId?: string;
        citizenId?: string;
        email?: string;
        action: string;
        resourceType?: string;
        resourceId?: string;
        ipAddress?: string;
        userAgent?: string;
        metadata?: any;
        success?: boolean;
        errorMessage?: string;
    }) {
        try {
            return await this.prisma.auditLog.create({
                data: {
                    ...data,
                    metadata: data.metadata || {},
                },
            });
        } catch (error) {
            console.error('Error creando log de auditoría:', error);
        }
    }

    async findAll() {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: { user: true },
        });
    }
}
