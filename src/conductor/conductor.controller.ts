import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConductorService } from './conductor.service';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('conductor')
@Controller('conductor')
export class ConductorController {
  constructor(private readonly conductorService: ConductorService) {}

  @Post()
  @ApiOperation({ summary: 'Crear conductor' })
  @ApiResponse({ status: 201, description: 'Conductor creado exitosamente.' })
  @ApiBody({ type: CreateConductorDto })
  create(@Body() createConductorDto: CreateConductorDto) {
    return this.conductorService.create(createConductorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar conductores' })
  @ApiResponse({ status: 200, description: 'Listado de conductores.' })
  findAll() {
    return this.conductorService.findAll();
  }

  @Get(':codigo')
  @ApiOperation({ summary: 'Obtener conductor por código' })
  @ApiParam({ name: 'codigo', example: '0000028932' })
  @ApiResponse({ status: 200, description: 'Conductor encontrado.' })
  findOne(@Param('codigo') codigo: string) {
    return this.conductorService.findOne(codigo);
  }

  @Patch(':codigo')
  @ApiOperation({ summary: 'Actualizar conductor por código' })
  @ApiParam({ name: 'codigo', example: '0000028932' })
  @ApiBody({ type: UpdateConductorDto })
  @ApiResponse({ status: 200, description: 'Conductor actualizado.' })
  update(@Param('codigo') codigo: string, @Body() updateConductorDto: UpdateConductorDto) {
    return this.conductorService.update(codigo, updateConductorDto);
  }

  @Delete(':codigo')
  @ApiOperation({ summary: 'Eliminar conductor por código' })
  @ApiParam({ name: 'codigo', example: '0000028932' })
  @ApiResponse({ status: 200, description: 'Conductor eliminado.' })
  remove(@Param('codigo') codigo: string) {
    return this.conductorService.remove(codigo);
  }
}
