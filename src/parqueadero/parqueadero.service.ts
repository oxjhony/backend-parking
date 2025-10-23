import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParqueaderoDto } from './dto/create-parqueadero.dto';
import { UpdateParqueaderoDto } from './dto/update-parqueadero.dto';
import { Parqueadero } from './entities/parqueadero.entity';
import { TipoVehiculo } from '../vehiculo/enums/tipo-vehiculo.enum';

@Injectable()
export class ParqueaderoService {
  constructor(
    @InjectRepository(Parqueadero)
    private readonly parqueaderoRepository: Repository<Parqueadero>,
  ) {}

  async create(createParqueaderoDto: CreateParqueaderoDto): Promise<Parqueadero> {
    // Validar que los cupos disponibles no sean mayores a la capacidad
    if (createParqueaderoDto.cuposDisponiblesCarros > createParqueaderoDto.capacidadCarros) {
      throw new BadRequestException('Los cupos disponibles de carros no pueden ser mayores a la capacidad de carros');
    }

    if (createParqueaderoDto.cuposDisponiblesMotos > createParqueaderoDto.capacidadMotos) {
      throw new BadRequestException('Los cupos disponibles de motos no pueden ser mayores a la capacidad de motos');
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

    // Validar cupos disponibles de carros si se actualiza
    if (updateParqueaderoDto.capacidadCarros !== undefined || updateParqueaderoDto.cuposDisponiblesCarros !== undefined) {
      const capacidadCarros = updateParqueaderoDto.capacidadCarros ?? parqueadero.capacidadCarros;
      const cuposDisponiblesCarros = updateParqueaderoDto.cuposDisponiblesCarros ?? parqueadero.cuposDisponiblesCarros;
      
      if (cuposDisponiblesCarros > capacidadCarros) {
        throw new BadRequestException('Los cupos disponibles de carros no pueden ser mayores a la capacidad de carros');
      }
    }

    // Validar cupos disponibles de motos si se actualiza
    if (updateParqueaderoDto.capacidadMotos !== undefined || updateParqueaderoDto.cuposDisponiblesMotos !== undefined) {
      const capacidadMotos = updateParqueaderoDto.capacidadMotos ?? parqueadero.capacidadMotos;
      const cuposDisponiblesMotos = updateParqueaderoDto.cuposDisponiblesMotos ?? parqueadero.cuposDisponiblesMotos;
      
      if (cuposDisponiblesMotos > capacidadMotos) {
        throw new BadRequestException('Los cupos disponibles de motos no pueden ser mayores a la capacidad de motos');
      }
    }
    
    Object.assign(parqueadero, updateParqueaderoDto);
    
    return await this.parqueaderoRepository.save(parqueadero);
  }

  async remove(id: number): Promise<void> {
    const parqueadero = await this.findOne(id);
    await this.parqueaderoRepository.remove(parqueadero);
  }

  async actualizarCuposDisponibles(id: number, tipoVehiculo: TipoVehiculo, incremento: number): Promise<Parqueadero> {
    const parqueadero = await this.findOne(id);

    if (tipoVehiculo === TipoVehiculo.CARRO) {
      const nuevosCupos = parqueadero.cuposDisponiblesCarros + incremento;

      if (nuevosCupos < 0) {
        throw new BadRequestException('No hay cupos disponibles para carros');
      }

      if (nuevosCupos > parqueadero.capacidadCarros) {
        throw new BadRequestException('Los cupos disponibles de carros no pueden exceder la capacidad');
      }

      return await this.update(id, { cuposDisponiblesCarros: nuevosCupos });
    } else {
      const nuevosCupos = parqueadero.cuposDisponiblesMotos + incremento;

      if (nuevosCupos < 0) {
        throw new BadRequestException('No hay cupos disponibles para motos');
      }

      if (nuevosCupos > parqueadero.capacidadMotos) {
        throw new BadRequestException('Los cupos disponibles de motos no pueden exceder la capacidad');
      }

      return await this.update(id, { cuposDisponiblesMotos: nuevosCupos });
    }
  }
}
