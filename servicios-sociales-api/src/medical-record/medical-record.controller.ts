import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalRecordService } from './medical-record.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('medical-record')
@ApiBearerAuth('JWT-auth')
@Controller('medical-record')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MedicalRecordController {
  constructor(private readonly medicalRecordService: MedicalRecordService) {}

  /** Registrar una nueva consulta médica */
  @Post()
  @Roles('doctor', 'admin', 'super_admin')
  async create(@Body() createData: any, @Req() req: any) {
    return this.medicalRecordService.create({
      ...createData,
      adminId: req.user.id,
      adminEmail: req.user.email,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
  }

  /** Listar todos los expedientes */
  @Get()
  @Roles('doctor', 'institution_staff', 'super_admin')
  async findAll() {
    return this.medicalRecordService.findAll();
  }

  /** Obtener un expediente por ID */
  @Get(':id')
  @Roles('doctor', 'institution_staff', 'super_admin', 'citizen')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const record = await this.medicalRecordService.findOne(id);
    
    // SEGURIDAD: Si es ciudadano, solo puede ver SU propio expediente
    if (req.user.roles.includes('citizen') && record.citizenId !== req.user.id) {
      throw new ForbiddenException('No tienes permiso para ver expedientes de otros ciudadanos');
    }
    
    return record;
  }

  /** Obtener expedientes de un ciudadano específico */
  @Get('citizen/:citizenId')
  @Roles('doctor', 'institution_staff', 'super_admin', 'citizen')
  async findByCitizenId(@Param('citizenId') citizenId: string, @Req() req: any) {
    // SEGURIDAD: Evitar que un ciudadano vea el expediente de otro (IDOR)
    if (req.user.roles.includes('citizen') && req.user.id !== citizenId) {
      throw new ForbiddenException('No tienes permiso para ver expedientes de otros ciudadanos');
    }
    return this.medicalRecordService.findByCitizenId(citizenId);
  }
}
