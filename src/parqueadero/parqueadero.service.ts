import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParqueaderoDto } from './dto/create-parqueadero.dto';
import { UpdateParqueaderoDto } from './dto/update-parqueadero.dto';
import { Parqueadero } from './entities/parqueadero.entity';

@Injectable()
export class ParqueaderoService {
  constructor(
    @InjectRepository(Parqueadero)
    private readonly parqueaderoRepository: Repository<Parqueadero>,
  ) {}

  async create(createParqueaderoDto: CreateParqueaderoDto): Promise<Parqueadero> {
    // Validar que los cupos disponibles no sean mayores a la capacidad
    if (createParqueaderoDto.cuposDisponibles > createParqueaderoDto.capacidad) {
      throw new BadRequestException('Los cupos disponibles no pueden ser mayores a la capacidad');
    }

    const parqueadero = this.parqueaderoRepository.create(createParqueaderoDto);
    return await this.parqueaderoRepository.save(parqueadero);
  }

  async findAll(): Promise<Parqueadero[]> {
    return await this.parqueaderoRepository.find();
  }

  async findOne(id: number): Promise<Parqueadero> {
    const parqueadero = await this.parqueaderoRepository.findOne({
      where: { id },
    });
    
    if (!parqueadero) {
      throw new NotFoundException(`Parqueadero con ID ${id} no encontrado`);
    }
    
    return parqueadero;
  }

  async update(id: number, updateParqueaderoDto: UpdateParqueaderoDto): Promise<Parqueadero> {
    const parqueadero = await this.findOne(id);

    // Validar cupos disponibles si se actualiza
    const capacidad = updateParqueaderoDto.capacidad ?? parqueadero.capacidad;
    const cuposDisponibles = updateParqueaderoDto.cuposDisponibles ?? parqueadero.cuposDisponibles;
    
    if (cuposDisponibles > capacidad) {
      throw new BadRequestException('Los cupos disponibles no pueden ser mayores a la capacidad');
    }
    
    Object.assign(parqueadero, updateParqueaderoDto);
    
    return await this.parqueaderoRepository.save(parqueadero);
  }

  async remove(id: number): Promise<void> {
    const parqueadero = await this.findOne(id);
    await this.parqueaderoRepository.remove(parqueadero);
  }

  async actualizarCuposDisponibles(id: number, incremento: number): Promise<Parqueadero> {
    const parqueadero = await this.findOne(id);
    const nuevosCupos = parqueadero.cuposDisponibles + incremento;

    if (nuevosCupos < 0) {
      throw new BadRequestException('No hay cupos disponibles');
    }

    if (nuevosCupos > parqueadero.capacidad) {
      throw new BadRequestException('Los cupos disponibles no pueden exceder la capacidad');
    }

    return await this.update(id, { cuposDisponibles: nuevosCupos });
  }
}
