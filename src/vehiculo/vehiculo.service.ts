import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';

@Injectable()
export class VehiculoService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepository: Repository<Vehiculo>,
  ) {}

  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = this.vehiculoRepository.create({
      ...createVehiculoDto,
      fechaCaducidad: new Date(createVehiculoDto.fechaCaducidad),
    });
    return await this.vehiculoRepository.save(vehiculo);
  }

  async findAll(): Promise<Vehiculo[]> {
    return await this.vehiculoRepository.find();
  }

  async findOne(placa: string): Promise<Vehiculo> {
    const vehiculo = await this.vehiculoRepository.findOne({
      where: { placa },
    });
    
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con placa ${placa} no encontrado`);
    }
    
    return vehiculo;
  }

  async findByPlaca(placa: string): Promise<Vehiculo> {
    return this.findOne(placa);
  }

  async findByConductor(conductorCodigo: string): Promise<Vehiculo[]> {
    return await this.vehiculoRepository.find({
      where: { conductorCodigo },
    });
  }

  async update(placa: string, updateVehiculoDto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.findOne(placa);
    
    Object.assign(vehiculo, updateVehiculoDto);
    
    if (updateVehiculoDto.fechaCaducidad) {
      vehiculo.fechaCaducidad = new Date(updateVehiculoDto.fechaCaducidad);
    }
    
    return await this.vehiculoRepository.save(vehiculo);
  }

  async remove(placa: string): Promise<void> {
    const vehiculo = await this.findOne(placa);
    await this.vehiculoRepository.remove(vehiculo);
  }
}
