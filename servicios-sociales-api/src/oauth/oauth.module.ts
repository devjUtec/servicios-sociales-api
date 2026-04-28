import { Module } from '@nestjs/common';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { AzureStrategy } from './strategies/azure.strategy';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [AuthModule, PrismaModule],
    controllers: [OAuthController],
    providers: [
        OAuthService,
        GoogleStrategy,
        AzureStrategy
    ],
})
export class OAuthModule { }
