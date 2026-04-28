import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete, Patch, Headers, Ip, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliationService } from './affiliation.service';
import { CreateAffiliationDto } from './dto/create-affiliation.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('affiliation')
@ApiBearerAuth('JWT-auth')
@Controller('affiliation')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AffiliationController {
    constructor(private readonly affiliationService: AffiliationService) { }

    /** Crear una nueva afiliación */
    @Post()
    @Roles('admin', 'super_admin', 'institution_staff', 'staff')
    async create(
        @Req() req: any, 
        @Body() createAffiliationDto: CreateAffiliationDto,
        @Headers('user-agent') userAgent: string,
        @Ip() ipAddress: string
    ) {
        return this.affiliationService.create(createAffiliationDto, req.user?.id, req.user?.email, userAgent, ipAddress);
    }

    // --- EL ORDEN ES CRÍTICO: RUTA FIJA "me" ANTES DE RUTA VARIABLE ":id" ---
    /** Listar afiliaciones del ciudadano logueado */
    @Get('me')
    @Roles('citizen', 'super_admin', 'admin')
    async findMyAffiliations(@Req() req: any) {
        return this.affiliationService.findByCitizenId(req.user.id);
    }

    /** Buscar una afiliación por número de carnet */
    @Get('find/:number')
    @Roles('doctor', 'admin', 'super_admin', 'institution_staff', 'staff')
    async findByNumber(@Param('number') number: string) {
        console.log(`[API] Buscando afiliación N°: ${number}`);
        const result = await this.affiliationService.findByNumber(number);
        console.log(`[API] Resultado encontrado: ${result ? result.id : 'NINGUNO'}`);
        return result;
    }

    /** Listar todas las afiliaciones (Personal Interno) */
    @Get()
    @Roles('admin', 'super_admin', 'institution_staff', 'staff')
    async findAll() {
        return this.affiliationService.findAll();
    }

    /** Obtener detalles de una afiliación por ID */
    @Get(':id')
    @Roles('admin', 'super_admin', 'citizen', 'institution_staff', 'staff')
    async findOne(@Param('id') id: string, @Req() req: any) {
        const affiliation = await this.affiliationService.findOne(id);
        
        // SEGURIDAD: Validación de propiedad
        if (req.user.roles.includes('citizen') && affiliation.citizenId !== req.user.id) {
            throw new ForbiddenException('No tienes permiso para ver afiliaciones de otros ciudadanos');
        }
        
        return affiliation;
    }

    /** Obtener afiliaciones de un ciudadano específico */
    @Get('citizen/:citizenId')
    @Roles('admin', 'super_admin', 'citizen')
    async findByCitizenId(@Param('citizenId') citizenId: string, @Req() req: any) {
        // SEGURIDAD: Bloqueo de IDOR
        if (req.user.roles.includes('citizen') && req.user.id !== citizenId) {
            throw new ForbiddenException('No tienes permiso para ver afiliaciones de otros ciudadanos');
        }
        return this.affiliationService.findByCitizenId(citizenId);
    }

    /** Actualizar una afiliación (Solo Super Admin) */
    @Patch(':id')
    @Roles('super_admin')
    async update(
        @Req() req: any, 
        @Param('id') id: string, 
        @Body() updateData: any,
        @Headers('user-agent') userAgent: string,
        @Ip() ipAddress: string
    ) {
        return this.affiliationService.update(id, updateData, req.user?.id, req.user?.email, userAgent, ipAddress);
    }

    /** Eliminar una afiliación (Solo Super Admin) */
    @Delete(':id')
    @Roles('super_admin')
    async remove(
        @Req() req: any, 
        @Param('id') id: string,
        @Headers('user-agent') userAgent: string,
        @Ip() ipAddress: string
    ) {
        return this.affiliationService.remove(id, req.user?.id, req.user?.email, userAgent, ipAddress);
    }

    /** Test público para afiliación */
    @Post('public-test-create')
    async publicTest(@Body() createAffiliationDto: CreateAffiliationDto) {
        try {
            return await this.affiliationService.create(createAffiliationDto, 'dummy-id', 'dummy@email.com', 'test-agent', '127.0.0.1');
        } catch (error: any) {
            console.error('ERROR CREANDO AFILIACION:', error);
            return {
                failed: true,
                message: error.message,
                stack: error.stack,
            };
        }
    }
}
