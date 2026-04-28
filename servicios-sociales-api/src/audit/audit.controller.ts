import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('audit')
@ApiBearerAuth('JWT-auth')
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    /** Listar los últimos 100 logs de auditoría (Solo Admin) */
    @Get()
    @UseGuards(AuthGuard('jwt'))
    async findAll() {
        return this.auditService.findAll();
    }
}
