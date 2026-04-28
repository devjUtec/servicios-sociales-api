import { Controller, Get, Post, Param, Patch, Body, UseGuards, Delete, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Registrar un nuevo usuario (Personal Interno) */
  @Post()
  @Roles('super_admin', 'admin')
  async create(@Body() createUserData: any, @Req() req: any) {
    return this.usersService.create({
      ...createUserData,
      adminId: req.user.id,
      adminEmail: req.user.email,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
  }

  /** Listar usuarios del sistema (Personal) */
  @Get()
  @Roles('super_admin', 'admin')
  async findAll() {
    return this.usersService.findAll();
  }

  /** Obtener un usuario por ID */
  @Get(':id')
  @Roles('super_admin', 'admin')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /** Actualizar datos básicos de un usuario */
  @Patch(':id')
  @Roles('super_admin', 'admin')
  async update(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
    return this.usersService.update(id, {
      ...updateData,
      adminId: req.user.id,
      adminEmail: req.user.email,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
  }

  /** Eliminar un usuario del sistema */
  @Delete(':id')
  @Roles('super_admin')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.usersService.remove(id, {
      adminId: req.user.id,
      adminEmail: req.user.email,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
  }
}
