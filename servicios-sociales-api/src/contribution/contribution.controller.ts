import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContributionService } from './contribution.service';
import { CreateContributionDto } from './dto/create-contribution.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('contribution')
@ApiBearerAuth('JWT-auth')
@Controller('contribution')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ContributionController {
    constructor(private readonly contributionService: ContributionService) { }

    /** Registrar una nueva contribución */
    @Post()
    @Roles('admin', 'super_admin', 'institution_staff', 'staff')
    async create(@Body() createContributionDto: CreateContributionDto) {
        return this.contributionService.create(createContributionDto);
    }

    // --- ORDEN CRÍTICO ---
    /** Listar mis propias cotizaciones */
    @Get('me')
    @Roles('citizen', 'super_admin', 'admin')
    async findMyContributions(@Req() req: any) {
        return this.contributionService.findByCitizenId(req.user.id);
    }

    /** Obtener historial de contribuciones de un ciudadano */
    @Get('citizen/:citizenId')
    @Roles('admin', 'super_admin', 'citizen', 'institution_staff', 'staff')
    async findByCitizenId(@Param('citizenId') citizenId: string, @Req() req: any) {
        // SEGURIDAD: Bloqueo de IDOR
        if (req.user.roles.includes('citizen') && req.user.id !== citizenId) {
            throw new ForbiddenException('No tienes permiso para ver cotizaciones de otros ciudadanos');
        }
        return this.contributionService.findByCitizenId(citizenId);
    }

    /** Obtener resumen de contribuciones (Total acumulado) */
    @Get('summary/:citizenId')
    @Roles('admin', 'super_admin', 'citizen', 'institution_staff', 'staff')
    async getSummary(@Param('citizenId') citizenId: string, @Req() req: any) {
        // SEGURIDAD: Bloqueo de IDOR en resumen
        if (req.user.roles.includes('citizen') && req.user.id !== citizenId) {
            throw new ForbiddenException('No tienes permiso para ver el resumen de otro ciudadano');
        }
        return this.contributionService.getSummary(citizenId);
    }

    /** Listar todas las cotizaciones (Personal Interno) */
    @Get()
    @Roles('admin', 'super_admin', 'institution_staff', 'staff')
    async findAll() {
        return this.contributionService.findAll();
    }
}
