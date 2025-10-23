import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParqueaderoService } from './parqueadero.service';
import { CreateParqueaderoDto } from './dto/create-parqueadero.dto';
import { UpdateParqueaderoDto } from './dto/update-parqueadero.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('parqueadero')
@Controller('parqueadero')
@Public()
export class ParqueaderoController {
  constructor(private readonly parqueaderoService: ParqueaderoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear parqueadero' })
  @ApiResponse({ status: 201, description: 'Parqueadero creado exitosamente.' })
  @ApiBody({ type: CreateParqueaderoDto })
  create(@Body() createParqueaderoDto: CreateParqueaderoDto) {
    return this.parqueaderoService.create(createParqueaderoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar parqueaderos' })
  @ApiResponse({ status: 200, description: 'Listado de parqueaderos.' })
  findAll() {
    return this.parqueaderoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener parqueadero por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Parqueadero encontrado.' })
  findOne(@Param('id') id: string) {
    return this.parqueaderoService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parqueadero por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ type: UpdateParqueaderoDto })
  @ApiResponse({ status: 200, description: 'Parqueadero actualizado.' })
  update(@Param('id') id: string, @Body() updateParqueaderoDto: UpdateParqueaderoDto) {
    return this.parqueaderoService.update(+id, updateParqueaderoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar parqueadero por ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Parqueadero eliminado.' })
  remove(@Param('id') id: string) {
    return this.parqueaderoService.remove(+id);
  }

  @Patch(':id/cupos')
  @ApiOperation({ summary: 'Actualizar cupos disponibles del parqueadero según tipo de vehículo' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({ 
    schema: { 
      properties: { 
        tipoVehiculo: { type: 'string', enum: ['CARRO', 'MOTO'], example: 'CARRO' },
        incremento: { type: 'number', example: -1 } 
      }, 
      required: ['tipoVehiculo', 'incremento'] 
    } 
  })
  @ApiResponse({ status: 200, description: 'Cupos disponibles actualizados.' })
  actualizarCupos(@Param('id') id: string, @Body() body: { tipoVehiculo: string; incremento: number }) {
    return this.parqueaderoService.actualizarCuposDisponibles(+id, body.tipoVehiculo as any, body.incremento);
  }
}
