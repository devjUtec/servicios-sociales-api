import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()  // Global para que PrismaService esté disponible en toda la app sin re-importar
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule { }
