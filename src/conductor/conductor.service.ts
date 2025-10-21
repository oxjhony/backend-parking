import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';
import { Conductor } from './entities/conductor.entity';

@Injectable()
export class ConductorService {
  constructor(
    @InjectRepository(Conductor)
    private readonly conductorRepository: Repository<Conductor>,
  ) {}

  async create(createConductorDto: CreateConductorDto): Promise<Conductor> {
    const conductor = this.conductorRepository.create(createConductorDto);
    return await this.conductorRepository.save(conductor);
  }

  async findAll(): Promise<Conductor[]> {
    return await this.conductorRepository.find();
  }

  async findOne(codigo: string): Promise<Conductor> {
    const conductor = await this.conductorRepository.findOne({
      where: { codigo },
    });
    
    if (!conductor) {
      throw new NotFoundException(`Conductor con código ${codigo} no encontrado`);
    }
    
    return conductor;
  }

  async update(codigo: string, updateConductorDto: UpdateConductorDto): Promise<Conductor> {
    const conductor = await this.findOne(codigo);
    
    Object.assign(conductor, updateConductorDto);
    
    return await this.conductorRepository.save(conductor);
  }

  async remove(codigo: string): Promise<void> {
    const conductor = await this.findOne(codigo);
    await this.conductorRepository.remove(conductor);
  }
}
