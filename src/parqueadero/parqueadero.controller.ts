import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParqueaderoService } from './parqueadero.service';
import { CreateParqueaderoDto } from './dto/create-parqueadero.dto';
import { UpdateParqueaderoDto } from './dto/update-parqueadero.dto';

@Controller('parqueadero')
export class ParqueaderoController {
  constructor(private readonly parqueaderoService: ParqueaderoService) {}

  @Post()
  create(@Body() createParqueaderoDto: CreateParqueaderoDto) {
    return this.parqueaderoService.create(createParqueaderoDto);
  }

  @Get()
  findAll() {
    return this.parqueaderoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parqueaderoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParqueaderoDto: UpdateParqueaderoDto) {
    return this.parqueaderoService.update(+id, updateParqueaderoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parqueaderoService.remove(+id);
  }

  @Patch(':id/cupos')
  actualizarCupos(@Param('id') id: string, @Body() body: { incremento: number }) {
    return this.parqueaderoService.actualizarCuposDisponibles(+id, body.incremento);
  }
}
