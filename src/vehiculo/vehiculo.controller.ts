import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VehiculoService } from './vehiculo.service';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';

@Controller('vehiculo')
export class VehiculoController {
  constructor(private readonly vehiculoService: VehiculoService) {}

  @Post()
  create(@Body() createVehiculoDto: CreateVehiculoDto) {
    return this.vehiculoService.create(createVehiculoDto);
  }

  @Get()
  findAll() {
    return this.vehiculoService.findAll();
  }

  @Get('conductor/:conductorCodigo')
  findByConductor(@Param('conductorCodigo') conductorCodigo: string) {
    return this.vehiculoService.findByConductor(conductorCodigo);
  }

  @Get(':placa')
  findOne(@Param('placa') placa: string) {
    return this.vehiculoService.findOne(placa);
  }

  @Patch(':placa')
  update(@Param('placa') placa: string, @Body() updateVehiculoDto: UpdateVehiculoDto) {
    return this.vehiculoService.update(placa, updateVehiculoDto);
  }

  @Delete(':placa')
  remove(@Param('placa') placa: string) {
    return this.vehiculoService.remove(placa);
  }
}
