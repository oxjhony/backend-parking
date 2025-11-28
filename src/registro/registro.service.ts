import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registro } from './entities/registro.entity';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { RegistrarSalidaDto } from './dto/registrar-salida.dto';
import { EstadoRegistro } from './enums/estado-registro.enum';
import { VehiculoService } from '../vehiculo/vehiculo.service';
import { UsuarioService } from '../usuario/usuario.service';
import { ParqueaderoService } from '../parqueadero/parqueadero.service';
import { PicoPlacaService } from '../pico-placa/pico-placa.service';

@Injectable()
export class RegistroService {
  private readonly logger = new Logger(RegistroService.name);

  constructor(
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
    private readonly vehiculoService: VehiculoService,
    private readonly usuarioService: UsuarioService,
    private readonly parqueaderoService: ParqueaderoService,
    private readonly picoPlacaService: PicoPlacaService,
  ) {}

  async create(createRegistroDto: CreateRegistroDto): Promise<Registro> {
    // Validar que el vehículo existe
    const vehiculo = await this.vehiculoService.findOne(
      createRegistroDto.vehiculoPlaca,
    );

    // Validar que el usuario existe
    const usuario = await this.usuarioService.findOne(
      createRegistroDto.usuarioId,
    );

    // Validar que el parqueadero existe
    const parqueadero = await this.parqueaderoService.findOne(
      createRegistroDto.parqueaderoId,
    );

    // Verificar que hay cupos disponibles según el tipo de vehículo
    if (vehiculo.tipo === 'CARRO' && parqueadero.cuposDisponiblesCarros <= 0) {
      throw new BadRequestException('No hay cupos disponibles para carros en el parqueadero');
    }

    if (vehiculo.tipo === 'MOTO' && parqueadero.cuposDisponiblesMotos <= 0) {
      throw new BadRequestException('No hay cupos disponibles para motos en el parqueadero');
    }

    // Verificar que el vehículo no esté actualmente en el parqueadero
    const registroActivo = await this.registroRepository.findOne({
      where: {
        vehiculoPlaca: createRegistroDto.vehiculoPlaca,
        estado: EstadoRegistro.ACTIVO,
      },
    });

    if (registroActivo) {
      throw new BadRequestException(
        'El vehículo ya tiene un registro activo en un parqueadero',
      );
    }

    // Verificar que no exista en el mismo parqueadero un registro activo
    // asociado al mismo conductor del vehículo
    const conductorCodigo = (vehiculo as any).conductorCodigo;
    if (conductorCodigo) {
      const registroConductorActivo = await this.registroRepository
        .createQueryBuilder('r')
        .innerJoinAndSelect('r.vehiculo', 'v')
        .where('r.parqueaderoId = :pid', { pid: createRegistroDto.parqueaderoId })
        .andWhere('r.estado = :estado', { estado: EstadoRegistro.ACTIVO })
        .andWhere('v.conductorCodigo = :codigo', { codigo: conductorCodigo })
        .getOne();

      if (registroConductorActivo) {
        throw new BadRequestException(
          'Ya existe un registro activo en este parqueadero para el conductor del vehículo',
        );
      }
    }

    // ⚠️ VALIDAR PICO Y PLACA
    const validacionPicoPlaca = this.picoPlacaService.validarPicoPlaca({
      placa: createRegistroDto.vehiculoPlaca,
    });

    if (validacionPicoPlaca.tieneRestriccion) {
      this.logger.warn(
        `⚠️ Intento de ingreso con restricción de pico y placa: ${validacionPicoPlaca.mensaje}`,
      );
      throw new BadRequestException({
        message: 'No se puede registrar el ingreso del vehículo',
        restriccion: validacionPicoPlaca.mensaje,
        detalles: {
          placa: validacionPicoPlaca.placa,
          diaSemana: validacionPicoPlaca.diaSemana,
          digitosRestringidos: validacionPicoPlaca.digitosRestringidos,
        },
      });
    }

    // Crear el registro
    const registro = this.registroRepository.create({
      vehiculoPlaca: createRegistroDto.vehiculoPlaca,
      usuarioId: createRegistroDto.usuarioId,
      parqueaderoId: createRegistroDto.parqueaderoId,
      estado: EstadoRegistro.ACTIVO,
      horaSalida: null,
    });

    const savedRegistro = await this.registroRepository.save(registro);

    // Decrementar cupos disponibles según el tipo de vehículo
    await this.parqueaderoService.actualizarCuposDisponibles(
      createRegistroDto.parqueaderoId,
      vehiculo.tipo,
      -1,
    );

    return savedRegistro;
  }

  async registrarSalida(
    id: number,
    registrarSalidaDto?: RegistrarSalidaDto,
  ): Promise<Registro> {
    const registro = await this.findOne(id);

    // Validar que el registro está activo
    if (registro.estado !== EstadoRegistro.ACTIVO) {
      throw new BadRequestException('El registro ya está cerrado');
    }

    // Obtener el vehículo para conocer su tipo
    const vehiculo = await this.vehiculoService.findOne(registro.vehiculoPlaca);

    // Actualizar el registro
    registro.horaSalida = registrarSalidaDto?.horaSalida
      ? new Date(registrarSalidaDto.horaSalida)
      : new Date();
    registro.estado = EstadoRegistro.INACTIVO;

    const updatedRegistro = await this.registroRepository.save(registro);

    // Incrementar cupos disponibles según el tipo de vehículo
    await this.parqueaderoService.actualizarCuposDisponibles(
      registro.parqueaderoId,
      vehiculo.tipo,
      1,
    );

    return updatedRegistro;
  }

  async findAll(): Promise<Registro[]> {
    return await this.registroRepository.find({
      order: { horaEntrada: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Registro> {
    const registro = await this.registroRepository.findOne({
      where: { id },
      relations: ['vehiculo', 'usuario', 'parqueadero'],
    });

    if (!registro) {
      throw new NotFoundException(`Registro con ID ${id} no encontrado`);
    }

    return registro;
  }

  async findByEstado(estado: EstadoRegistro): Promise<Registro[]> {
    return await this.registroRepository.find({
      where: { estado },
      order: { horaEntrada: 'DESC' },
    });
  }

  async findByVehiculo(vehiculoPlaca: string): Promise<Registro[]> {
    return await this.registroRepository.find({
      where: { vehiculoPlaca },
      order: { horaEntrada: 'DESC' },
    });
  }

  async findByParqueadero(parqueaderoId: number): Promise<Registro[]> {
    return await this.registroRepository.find({
      where: { parqueaderoId },
      order: { horaEntrada: 'DESC' },
    });
  }

  async findByUsuario(usuarioId: number): Promise<Registro[]> {
    return await this.registroRepository.find({
      where: { usuarioId },
      order: { horaEntrada: 'DESC' },
    });
  }

  /**
   * Obtener registros activos discriminados por tipo de conductor
   * @returns Objeto con registros institucionales y visitantes
   */
  async findActivosDiscriminados(): Promise<{
    institucionales: Registro[];
    visitantes: Registro[];
    total: number;
  }> {
    // Obtener todos los registros activos con relaciones
    const registrosActivos = await this.registroRepository.find({
      where: { estado: EstadoRegistro.ACTIVO },
      relations: ['vehiculo', 'usuario', 'parqueadero'],
      order: { horaEntrada: 'DESC' },
    });

    // Discriminar por tipo de propietario del vehículo
    const institucionales = registrosActivos.filter(
      (registro) => registro.vehiculo.tipoPropietario === 'INSTITUCIONAL',
    );

    const visitantes = registrosActivos.filter(
      (registro) => registro.vehiculo.tipoPropietario === 'VISITANTE',
    );

    return {
      institucionales,
      visitantes,
      total: registrosActivos.length,
    };
  }

  async remove(id: number): Promise<void> {
    const registro = await this.findOne(id);

    // Si el registro está activo, liberar el cupo antes de eliminar
    if (registro.estado === EstadoRegistro.ACTIVO) {
      // Obtener el vehículo para conocer su tipo
      const vehiculo = await this.vehiculoService.findOne(registro.vehiculoPlaca);

      await this.parqueaderoService.actualizarCuposDisponibles(
        registro.parqueaderoId,
        vehiculo.tipo,
        1,
      );
    }

    await this.registroRepository.remove(registro);
  }
}
