import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);
    private pool: any;

    constructor(configService: ConfigService) {
        const connectionString = configService.get<string>('DATABASE_URL');
        const { Pool } = pg;
        const poolInstance = new Pool({ connectionString });

        // Forzamos el cast para evitar conflictos de versiones de tipos de 'pg'
        const adapter = new PrismaPg(poolInstance as any);

        super({
            adapter,
            log: ['query', 'info', 'warn', 'error'],
        } as any);

        this.pool = poolInstance;
    }

    async onModuleInit() {
        // @ts-ignore
        await this.$connect();
        this.logger.log('✅ Conectado a PostgreSQL via Prisma (Adapter)');
    }

    async onModuleDestroy() {
        // @ts-ignore
        await this.$disconnect();
        if (this.pool) await this.pool.end();
        this.logger.log('🔌 Desconectado de PostgreSQL');
    }
}
