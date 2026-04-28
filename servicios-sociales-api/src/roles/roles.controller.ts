import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /** Listar todos los roles */
  @Get()
  @Roles('super_admin', 'admin')
  async findAll() {
    return this.rolesService.findAll();
  }

  /** Obtener un rol por ID */
  @Get(':id')
  @Roles('super_admin', 'admin')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }
}
