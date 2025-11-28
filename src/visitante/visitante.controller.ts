import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { VisitanteService } from './visitante.service';
import { RegistrarVisitanteDto } from './dto/registrar-visitante.dto';
import { CreateVisitanteConductorDto } from './dto/create-visitante-conductor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolUsuario } from '../usuario/enums/rol-usuario.enum';

@ApiTags('visitantes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visitantes')
export class VisitanteController {
  constructor(private readonly visitanteService: VisitanteService) {}

  @Post('registrar')
  @Roles(RolUsuario.VIGILANTE, RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({
    summary: 'Registra un visitante completo con vehículo y entrada',
    description:
      'Crea o actualiza un conductor visitante, registra su vehículo y genera el registro de entrada. ' +
      'Valida fecha de caducidad, pico y placa, y capacidad del parqueadero.',
  })
  @ApiBody({ type: RegistrarVisitanteDto })
  @ApiResponse({
    status: 201,
    description: 'Visitante registrado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description:
      'Error de validación (fecha vencida, pico y placa, parqueadero lleno)',
  })
  @ApiResponse({
    status: 404,
    description: 'Parqueadero no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Vehículo ya registrado o con entrada activa',
  })
  async registrar(
    @Body() dto: RegistrarVisitanteDto,
    @CurrentUser() user: any,
  ) {
    return await this.visitanteService.registrarVisitante(dto, user.id);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({
    summary: 'Obtiene todos los visitantes registrados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de visitantes',
  })
  async findAll() {
    return await this.visitanteService.findAll();
  }

  @Get(':cedula')
  @Roles(RolUsuario.VIGILANTE, RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({
    summary: 'Busca un visitante por cédula',
  })
  @ApiResponse({
    status: 200,
    description: 'Visitante encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Visitante no encontrado',
  })
  async findOne(@Param('cedula') cedula: string) {
    return await this.visitanteService.findByCedula(cedula);
  }

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({
    summary: 'Crea o actualiza un conductor visitante',
    description: 'Permite gestionar los datos de un visitante sin crear registro de entrada',
  })
  @ApiBody({ type: CreateVisitanteConductorDto })
  @ApiResponse({
    status: 201,
    description: 'Visitante creado/actualizado',
  })
  async createOrUpdate(@Body() dto: CreateVisitanteConductorDto) {
    return await this.visitanteService.createOrUpdate(dto);
  }

  @Delete(':cedula')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Elimina un visitante',
  })
  @ApiResponse({
    status: 204,
    description: 'Visitante eliminado',
  })
  @ApiResponse({
    status: 404,
    description: 'Visitante no encontrado',
  })
  async remove(@Param('cedula') cedula: string) {
    await this.visitanteService.remove(cedula);
  }
}
