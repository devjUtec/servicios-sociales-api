import { Module } from '@nestjs/common';
import { ContributionService } from './contribution.service';
import { ContributionController } from './contribution.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ContributionService],
    controllers: [ContributionController],
    exports: [ContributionService],
})
export class ContributionModule { }
