import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
    ) { }

    /** Verificar el estado de salud del sistema */
    @Get()
    @ApiResponse({ status: 200, description: 'Sistema operativo' })
    async check() {
        let dbStatus = 'connected';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch (e) {
            dbStatus = 'disconnected';
        }

        return {
            status: 'ok',
            database: dbStatus,
            redis: 'awaiting_integration', // Se validará en fase de cache
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
        };
    }
}
