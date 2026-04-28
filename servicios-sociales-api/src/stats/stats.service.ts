import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        // 1. Total Affiliations
        const totalAffiliations = await this.prisma.affiliation.count();

        // 2. Monthly Revenue (sum all contributions for demo, normally would be monthly)
        const contributions = await this.prisma.contribution.findMany({
            where: {
                status: 'paid'
            },
            select: {
                contributionAmount: true
            }
        });

        const totalRevenue = contributions.reduce((acc, curr) => acc + (Number(curr.contributionAmount) || 0), 0);

        // 3. Open Medical Records (Count all for demo)
        const openMedicalRecords = await this.prisma.medicalRecord.count();

        // 4. Audit Logs (last 7 days count for more visibility)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const recentAuditLogs = await this.prisma.auditLog.count({
            where: {
                createdAt: {
                    gte: weekAgo
                }
            }
        });

        return {
            totalAffiliations,
            monthlyRevenue: totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            openMedicalRecords,
            recentAuditLogs
        };
    }
}
