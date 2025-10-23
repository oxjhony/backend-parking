import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RegistroService } from './registro.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { RegistrarSalidaDto } from './dto/registrar-salida.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolUsuario } from '../usuario/enums/rol-usuario.enum';
import { EstadoRegistro } from './enums/estado-registro.enum';

@ApiTags('registro')
@Controller('registro')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RegistroController {
  constructor(private readonly registroService: RegistroService) {}

  @Post()
  @Roles(RolUsuario.VIGILANTE, RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({ summary: 'Registrar entrada de vehículo al parqueadero' })
  @ApiBody({ type: CreateRegistroDto })
  @ApiResponse({ status: 201, description: 'Entrada registrada exitosamente.' })
  @ApiResponse({ status: 400, description: 'No hay cupos disponibles o vehículo ya tiene registro activo.' })
  @ApiResponse({ status: 404, description: 'Vehículo, usuario o parqueadero no encontrado.' })
  create(@Body() createRegistroDto: CreateRegistroDto) {
    return this.registroService.create(createRegistroDto);
  }

  @Patch(':id/salida')
  @Roles(RolUsuario.VIGILANTE, RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({ summary: 'Registrar salida de vehículo del parqueadero' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: RegistrarSalidaDto, required: false })
  @ApiResponse({ status: 200, description: 'Salida registrada exitosamente.' })
  @ApiResponse({ status: 400, description: 'El registro ya está cerrado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  registrarSalida(
    @Param('id') id: string,
    @Body() registrarSalidaDto?: RegistrarSalidaDto,
  ) {
    return this.registroService.registrarSalida(+id, registrarSalidaDto);
  }

  @Patch('vehiculo/:placa/salida')
  @Roles(RolUsuario.VIGILANTE, RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({ summary: 'Registrar salida por placa de vehículo' })
  @ApiParam({ name: 'placa', example: 'ABC123' })
  @ApiBody({ type: RegistrarSalidaDto, required: false })
  @ApiResponse({ status: 200, description: 'Salida registrada exitosamente.' })
  @ApiResponse({ status: 400, description: 'El registro ya está cerrado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  async registrarSalidaPorPlaca(
    @Param('placa') placa: string,
    @Body() registrarSalidaDto?: RegistrarSalidaDto,
  ) {
    // Buscar registro activo por placa
    const registros = await this.registroService.findByVehiculo(placa);
    const registroActivo = registros.find(r => r.estado === EstadoRegistro.ACTIVO);
    if (!registroActivo) {
      // No hay registro activo con esa placa
      throw new NotFoundException('Registro activo para la placa no encontrado');
    }

    return this.registroService.registrarSalida(registroActivo.id, registrarSalidaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los registros' })
  @ApiResponse({ status: 200, description: 'Listado de registros.' })
  findAll() {
    return this.registroService.findAll();
  }

  @Get('estado/:estado')
  @ApiOperation({ summary: 'Listar registros por estado' })
  @ApiParam({ name: 'estado', enum: EstadoRegistro, example: EstadoRegistro.ACTIVO })
  @ApiResponse({ status: 200, description: 'Registros encontrados por estado.' })
  findByEstado(@Param('estado') estado: EstadoRegistro) {
    return this.registroService.findByEstado(estado);
  }

  @Get('vehiculo/:placa')
  @ApiOperation({ summary: 'Listar registros por vehículo' })
  @ApiParam({ name: 'placa', example: 'ABC123' })
  @ApiResponse({ status: 200, description: 'Registros encontrados por vehículo.' })
  findByVehiculo(@Param('placa') placa: string) {
    return this.registroService.findByVehiculo(placa);
  }

  @Get('parqueadero/:id')
  @ApiOperation({ summary: 'Listar registros por parqueadero' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Registros encontrados por parqueadero.' })
  findByParqueadero(@Param('id') id: string) {
    return this.registroService.findByParqueadero(+id);
  }

  @Get('usuario/:id')
  @ApiOperation({ summary: 'Listar registros por usuario' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Registros encontrados por usuario.' })
  findByUsuario(@Param('id') id: string) {
    return this.registroService.findByUsuario(+id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener registro por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Registro encontrado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.registroService.findOne(+id);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.SUPERUSUARIO)
  @ApiOperation({ summary: 'Eliminar registro por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Registro eliminado.' })
  @ApiResponse({ status: 404, description: 'Registro no encontrado.' })
  remove(@Param('id') id: string) {
    return this.registroService.remove(+id);
  }
}
