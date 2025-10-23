import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VehiculoService } from './vehiculo.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('vehiculo')
@Controller('vehiculo')
@Public()
export class VehiculoController {
  constructor(private readonly vehiculoService: VehiculoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear vehículo' })
  @ApiResponse({ status: 201, description: 'Vehículo creado exitosamente.' })
  @ApiBody({ type: CreateVehiculoDto })
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculoService.create(createVehiculoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos' })
  @ApiResponse({ status: 200, description: 'Listado de vehículos.' })
  findAll() {
    return this.vehiculoService.findAll();
  }

  @Get('conductor/:conductorCodigo')
  @ApiOperation({ summary: 'Listar vehículos por conductor' })
  @ApiParam({ name: 'conductorCodigo', example: '0000028932' })
  @ApiResponse({ status: 200, description: 'Vehículos encontrados por conductor.' })
  findByConductor(@Param('conductorCodigo') conductorCodigo: string) {
    return this.vehiculoService.findByConductor(conductorCodigo);
  }

  @Get(':placa')
  @ApiOperation({ summary: 'Obtener vehículo por placa' })
  @ApiParam({ name: 'placa', example: 'ABC123' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado.' })
  findOne(@Param('placa') placa: string) {
    return this.vehiculoService.findOne(placa);
  }

  @Patch(':placa')
  @ApiOperation({ summary: 'Actualizar vehículo por placa' })
  @ApiParam({ name: 'placa', example: 'ABC123' })
  @ApiBody({ type: UpdateVehiculoDto })
  @ApiResponse({ status: 200, description: 'Vehículo actualizado.' })
  update(@Param('placa') placa: string, @Body() updateVehiculoDto: UpdateVehiculoDto) {
    return this.vehiculoService.update(placa, updateVehiculoDto);
  }

  @Delete(':placa')
  @ApiOperation({ summary: 'Eliminar vehículo por placa' })
  @ApiParam({ name: 'placa', example: 'ABC123' })
  @ApiResponse({ status: 200, description: 'Vehículo eliminado.' })
  remove(@Param('placa') placa: string) {
    return this.vehiculoService.remove(placa);
  }
}
