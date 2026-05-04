import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
    ThrottlerModule.forRoot([
      {
        // Rate limiting en memoria (ElastiCache no provisionado aún en AWS)
        // Funciona correctamente con una sola instancia ECS
        ttl: 60000,
        limit: 100,
      },
    ]),
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
