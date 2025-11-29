import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';
import { TipoPropietario } from './enums/tipo-propietario.enum';

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
      // Mantener compatibilidad con columna antigua
      conductorCodigo: createVehiculoDto.tipoPropietario === TipoPropietario.INSTITUCIONAL 
        ? createVehiculoDto.propietarioId 
        : null,
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

    // Migrar datos automáticamente si es necesario
    if (vehiculo.conductorCodigo && !vehiculo.propietarioId) {
      vehiculo.propietarioId = vehiculo.conductorCodigo;
      vehiculo.tipoPropietario = TipoPropietario.INSTITUCIONAL;
      await this.vehiculoRepository.save(vehiculo);
    }
    
    return vehiculo;
  }

  async findByPlaca(placa: string): Promise<Vehiculo> {
    return this.findOne(placa);
  }

  /**
   * Busca vehículos por propietario
   * @param propietarioId - Código del conductor institucional o cédula del visitante
   * @param tipoPropietario - Tipo de propietario (INSTITUCIONAL o VISITANTE)
   */
  async findByPropietario(
    propietarioId: string,
    tipoPropietario: TipoPropietario,
  ): Promise<Vehiculo[]> {
    return await this.vehiculoRepository.find({
      where: { 
        propietarioId,
        tipoPropietario,
      },
    });
  }

  /**
   * Busca vehículos por conductor institucional (compatibilidad con código anterior)
   * @deprecated Usar findByPropietario con TipoPropietario.INSTITUCIONAL
   */
  async findByConductor(conductorCodigo: string): Promise<Vehiculo[]> {
    return this.findByPropietario(conductorCodigo, TipoPropietario.INSTITUCIONAL);
  }

  async update(placa: string, updateVehiculoDto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.findOne(placa);
    
    Object.assign(vehiculo, updateVehiculoDto);
    
    if (updateVehiculoDto.fechaCaducidad) {
      vehiculo.fechaCaducidad = new Date(updateVehiculoDto.fechaCaducidad);
    }

    // Mantener sincronización con columna antigua
    if (updateVehiculoDto.propietarioId && updateVehiculoDto.tipoPropietario === TipoPropietario.INSTITUCIONAL) {
      vehiculo.conductorCodigo = updateVehiculoDto.propietarioId;
    }
    
    return await this.vehiculoRepository.save(vehiculo);
  }

  async remove(placa: string): Promise<void> {
    const vehiculo = await this.findOne(placa);
    await this.vehiculoRepository.remove(vehiculo);
  }
}
