import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConductorService } from './conductor.service';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';

@Controller('conductor')
export class ConductorController {
  constructor(private readonly conductorService: ConductorService) {}

  @Post()
  create(@Body() createConductorDto: CreateConductorDto) {
    return this.conductorService.create(createConductorDto);
  }

  @Get()
  findAll() {
    return this.conductorService.findAll();
  }

  @Get(':codigo')
  findOne(@Param('codigo') codigo: string) {
    return this.conductorService.findOne(codigo);
  }

  @Patch(':codigo')
  update(@Param('codigo') codigo: string, @Body() updateConductorDto: UpdateConductorDto) {
    return this.conductorService.update(codigo, updateConductorDto);
  }

  @Delete(':codigo')
  remove(@Param('codigo') codigo: string) {
    return this.conductorService.remove(codigo);
  }
}
