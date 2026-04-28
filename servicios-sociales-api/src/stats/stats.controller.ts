import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('stats')
@ApiBearerAuth('JWT-auth')
@Controller('stats')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    /** Obtener estadísticas reales para el Panel de Control */
    @Get('dashboard')
    @Roles('admin', 'super_admin', 'institution_staff', 'doctor')
    async getDashboardStats() {
        return this.statsService.getDashboardStats();
    }
}
