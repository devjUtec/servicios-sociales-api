import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { OAuthModule } from './oauth/oauth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AffiliationModule } from './affiliation/affiliation.module';
import { ContributionModule } from './contribution/contribution.module';
import { MedicalRecordModule } from './medical-record/medical-record.module';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { StatsModule } from './stats/stats.module';
import { OpaModule } from './opa/opa.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisHost = config.get<string>('REDIS_HOST', '127.0.0.1');
        const redisPort = config.get<number>('REDIS_PORT', 6379);
        // Soporta tanto REDIS_URL (local) como REDIS_HOST+REDIS_PORT (ECS/AWS)
        const redisUrl = config.get<string>('REDIS_URL') || `redis://${redisHost}:${redisPort}`;
        return {
          throttlers: [{ ttl: 60000, limit: 100 }],
          storage: new ThrottlerStorageRedisService(
            new Redis(redisUrl),
          ),
        };
      },
    }),
    PrismaModule,
    AuthModule,
    OAuthModule,
    UsersModule,
    RolesModule,
    AffiliationModule,
    ContributionModule,
    MedicalRecordModule,
    AuditModule,
    HealthModule,
    MailModule,
    StatsModule,
    OpaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule { }
