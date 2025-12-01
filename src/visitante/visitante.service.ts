import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitanteConductor } from './entities/visitante-conductor.entity';
import { Vehiculo } from '../vehiculo/entities/vehiculo.entity';
import { Registro } from '../registro/entities/registro.entity';
import { TipoPropietario } from '../vehiculo/enums/tipo-propietario.enum';
import { TipoVehiculo } from '../vehiculo/enums/tipo-vehiculo.enum';
import { RegistrarVisitanteDto } from './dto/registrar-visitante.dto';
import { CreateVisitanteConductorDto } from './dto/create-visitante-conductor.dto';
import { ParqueaderoService } from '../parqueadero/parqueadero.service';
import { PicoPlacaService } from '../pico-placa/pico-placa.service';

/**
 * Servicio para gestionar visitantes y su registro en el sistema
 */
@Injectable()
export class VisitanteService {
  constructor(
    @InjectRepository(VisitanteConductor)
    private readonly visitanteConductorRepository: Repository<VisitanteConductor>,
    @InjectRepository(Vehiculo)
    private readonly vehiculoRepository: Repository<Vehiculo>,
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
    private readonly parqueaderoService: ParqueaderoService,
    private readonly picoPlacaService: PicoPlacaService,
  ) {}

  /**
   * Registra un nuevo visitante con su vehículo y genera el registro de entrada
   * Flujo completo:
   * 1. Valida que la fecha de caducidad no esté vencida
   * 2. Valida restricción de pico y placa
   * 3. Valida capacidad del parqueadero según tipo de vehículo
   * 4. Crea/actualiza el conductor visitante
   * 5. Crea/actualiza el vehículo
   * 6. Crea el registro de entrada
   * 7. Decrementa cupos disponibles
   */
  async registrarVisitante(
    dto: RegistrarVisitanteDto,
    usuarioId: number,
  ): Promise<Registro> {
    // 1. Validar fecha de caducidad
    const fechaCaducidad = new Date(dto.fechaCaducidad);
    const ahora = new Date();
    
    if (fechaCaducidad <= ahora) {
      throw new BadRequestException(
        'La fecha de caducidad del permiso debe ser futura',
      );
    }

    // 2. Validar pico y placa
    const validacionPicoPlaca = await this.picoPlacaService.validarPicoPlaca({
      placa: dto.placa,
      fechaHora: ahora.toISOString(),
    });

    if (validacionPicoPlaca.tieneRestriccion) {
      throw new BadRequestException(
        `No puede ingresar por restricción de pico y placa: ${validacionPicoPlaca.mensaje}`,
      );
    }

    // 3. Validar capacidad del parqueadero según tipo de vehículo
    const parqueadero = await this.parqueaderoService.findOne(
      dto.parqueaderoId,
    );

    if (!parqueadero) {
      throw new NotFoundException(
        `Parqueadero con ID ${dto.parqueaderoId} no encontrado`,
      );
    }

    // ✅ CORREGIDO: Validar cupos según tipo de vehículo
    if (dto.tipoVehiculo === TipoVehiculo.CARRO) {
      if (parqueadero.cuposDisponiblesCarros <= 0) {
        throw new BadRequestException(
          `No hay cupos disponibles para carros en el parqueadero ${parqueadero.nombre}`,
        );
      }
    } else if (dto.tipoVehiculo === TipoVehiculo.MOTO) {
      if (parqueadero.cuposDisponiblesMotos <= 0) {
        throw new BadRequestException(
          `No hay cupos disponibles para motos en el parqueadero ${parqueadero.nombre}`,
        );
      }
    }

    // 4. Crear o actualizar conductor visitante
    let visitanteConductor = await this.visitanteConductorRepository.findOne({
      where: { cedula: dto.conductor.cedula },
    });

    if (visitanteConductor) {
      // Actualizar datos del visitante existente
      visitanteConductor.nombre = dto.conductor.nombre;
      visitanteConductor.apellido = dto.conductor.apellido;
      visitanteConductor.telefono = dto.conductor.telefono;
      visitanteConductor.correo = dto.conductor.correo || null;
      await this.visitanteConductorRepository.save(visitanteConductor);
    } else {
      // Crear nuevo visitante
      visitanteConductor = this.visitanteConductorRepository.create({
        cedula: dto.conductor.cedula,
        nombre: dto.conductor.nombre,
        apellido: dto.conductor.apellido,
        telefono: dto.conductor.telefono,
        correo: dto.conductor.correo || null,
      });
      await this.visitanteConductorRepository.save(visitanteConductor);
    }

    // 5. Crear o actualizar vehículo
    let vehiculo = await this.vehiculoRepository.findOne({
      where: { placa: dto.placa },
    });

    if (vehiculo) {
      // Verificar si el vehículo ya está registrado como institucional
      if (vehiculo.tipoPropietario === TipoPropietario.INSTITUCIONAL) {
        throw new ConflictException(
          `El vehículo con placa ${dto.placa} ya está registrado como vehículo institucional`,
        );
      }

      // Actualizar vehículo existente de visitante
      vehiculo.tipo = dto.tipoVehiculo;
      vehiculo.marca = dto.marca || vehiculo.marca;
      vehiculo.modelo = dto.modelo || vehiculo.modelo;
      vehiculo.color = dto.color || vehiculo.color;
      vehiculo.fechaCaducidad = fechaCaducidad;
      vehiculo.propietarioId = dto.conductor.cedula;
      await this.vehiculoRepository.save(vehiculo);
    } else {
      // Crear nuevo vehículo
      vehiculo = this.vehiculoRepository.create({
        placa: dto.placa,
        tipo: dto.tipoVehiculo,
        tipoPropietario: TipoPropietario.VISITANTE,
        propietarioId: dto.conductor.cedula,
        marca: dto.marca || null,
        modelo: dto.modelo || null,
        color: dto.color || null,
        fechaCaducidad: fechaCaducidad,
      });
      await this.vehiculoRepository.save(vehiculo);
    }

    // 6. Verificar que no haya un registro activo para este vehículo
    const registroActivo = await this.registroRepository.findOne({
      where: {
        vehiculoPlaca: dto.placa,
        horaSalida: null,
      },
    });

    if (registroActivo) {
      throw new ConflictException(
        `El vehículo con placa ${dto.placa} ya tiene un registro de entrada activo`,
      );
    }

    // 7. Crear registro de entrada con el motivo de visita
    const registro = this.registroRepository.create({
      vehiculoPlaca: dto.placa,
      usuarioId: usuarioId,
      parqueaderoId: dto.parqueaderoId,
      motivoVisita: dto.motivoVisita,
    });

    const savedRegistro = await this.registroRepository.save(registro);

    await this.parqueaderoService.actualizarCuposDisponibles(
      dto.parqueaderoId,
      dto.tipoVehiculo,
      -1,
    );
    return savedRegistro;
  }

  /**
   * Busca un conductor visitante por cédula
   */
  async findByCedula(cedula: string): Promise<VisitanteConductor> {
    const visitante = await this.visitanteConductorRepository.findOne({
      where: { cedula },
    });

    if (!visitante) {
      throw new NotFoundException(
        `Visitante con cédula ${cedula} no encontrado`,
      );
    }

    return visitante;
  }

  /**
   * Obtiene todos los visitantes registrados
   */
  async findAll(): Promise<VisitanteConductor[]> {
    return await this.visitanteConductorRepository.find({
      order: {
        fechaCreacion: 'DESC',
      },
    });
  }

  /**
   * Crea o actualiza un conductor visitante
   */
  async createOrUpdate(
    dto: CreateVisitanteConductorDto,
  ): Promise<VisitanteConductor> {
    let visitante = await this.visitanteConductorRepository.findOne({
      where: { cedula: dto.cedula },
    });

    if (visitante) {
      visitante.nombre = dto.nombre;
      visitante.apellido = dto.apellido;
      visitante.telefono = dto.telefono;
      visitante.correo = dto.correo || null;
    } else {
      visitante = this.visitanteConductorRepository.create(dto);
    }

    return await this.visitanteConductorRepository.save(visitante);
  }

  /**
   * Elimina un conductor visitante
   */
  async remove(cedula: string): Promise<void> {
    const visitante = await this.findByCedula(cedula);
    await this.visitanteConductorRepository.remove(visitante);
  }
}