import { Module } from '@nestjs/common';
import { AffiliationService } from './affiliation.service';
import { AffiliationController } from './affiliation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [PrismaModule, MailModule],
    providers: [AffiliationService],
    controllers: [AffiliationController],
    exports: [AffiliationService],
})
export class AffiliationModule { }
