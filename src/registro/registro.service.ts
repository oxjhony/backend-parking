import {
  Injectable,
  NotFoundException,
  BadRequestException,
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
import { TipoVehiculo } from '../vehiculo/enums/tipo-vehiculo.enum';

@Injectable()
export class RegistroService {
  constructor(
    @InjectRepository(Registro)
    private readonly registroRepository: Repository<Registro>,
    private readonly vehiculoService: VehiculoService,
    private readonly usuarioService: UsuarioService,
    private readonly parqueaderoService: ParqueaderoService,
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

  async remove(id: number): Promise<void> {
    const registro = await this.findOne(id);

    if (registro.estado === EstadoRegistro.ACTIVO) {
      const vehiculo = await this.vehiculoService.findOne(registro.vehiculoPlaca);

      await this.parqueaderoService.actualizarCuposDisponibles(
        registro.parqueaderoId,
        vehiculo.tipo,
        1,
      );
    }

    await this.registroRepository.remove(registro);
  }

  async obtenerReporteCarrosPorFecha(fecha: string): Promise<{ entradas: Registro[]; salidas: Registro[] }> {
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo: 'CARRO' })
      .andWhere('DATE("r"."horaEntrada") = :fecha', { fecha })
      .orderBy('"r"."horaEntrada"', 'ASC')
      .getMany();

    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo: 'CARRO' })
      .andWhere('"r"."horaSalida" IS NOT NULL')
      .andWhere('DATE("r"."horaSalida") = :fecha', { fecha })
      .orderBy('"r"."horaSalida"', 'ASC')
      .getMany();

    return { entradas, salidas };
  }

  async obtenerReporteParqueaderoPorSemana(inicio: string, fin: string): Promise<{ entradas: number; salidas: number }> {
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .where('DATE("r"."horaEntrada") BETWEEN :inicio AND :fin', { inicio, fin })
      .getCount();
    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .where('"r"."horaSalida" IS NOT NULL')
      .andWhere('DATE("r"."horaSalida") BETWEEN :inicio AND :fin', { inicio, fin })
      .getCount();
    return { entradas, salidas };
  }

  async obtenerReporteParqueaderoPorMes(anio: number, mes: number): Promise<{ entradas: number; salidas: number }> {
    const m = mes.toString().padStart(2, '0');
    const inicio = `${anio}-${m}-01`;
    const nextMonth = mes === 12 ? 1 : mes + 1;
    const nextYear = mes === 12 ? anio + 1 : anio;
    const fin = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .where('"r"."horaEntrada" >= :inicio AND "r"."horaEntrada" < :fin', { inicio, fin })
      .getCount();
    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .where('"r"."horaSalida" IS NOT NULL')
      .andWhere('"r"."horaSalida" >= :inicio AND "r"."horaSalida" < :fin', { inicio, fin })
      .getCount();
    return { entradas, salidas };
  }

  async obtenerReportePorTipoVehiculoSemana(tipo: TipoVehiculo, inicio: string, fin: string): Promise<{ entradas: number; salidas: number }> {
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo })
      .andWhere('DATE("r"."horaEntrada") BETWEEN :inicio AND :fin', { inicio, fin })
      .getCount();
    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo })
      .andWhere('"r"."horaSalida" IS NOT NULL')
      .andWhere('DATE("r"."horaSalida") BETWEEN :inicio AND :fin', { inicio, fin })
      .getCount();
    return { entradas, salidas };
  }

  async obtenerReportePorTipoVehiculoMes(tipo: TipoVehiculo, anio: number, mes: number): Promise<{ entradas: number; salidas: number }> {
    const m = mes.toString().padStart(2, '0');
    const inicio = `${anio}-${m}-01`;
    const nextMonth = mes === 12 ? 1 : mes + 1;
    const nextYear = mes === 12 ? anio + 1 : anio;
    const fin = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    const entradas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo })
      .andWhere('"r"."horaEntrada" >= :inicio AND "r"."horaEntrada" < :fin', { inicio, fin })
      .getCount();
    const salidas = await this.registroRepository
      .createQueryBuilder('r')
      .innerJoin('r.vehiculo', 'v')
      .where('v.tipo = :tipo', { tipo })
      .andWhere('"r"."horaSalida" IS NOT NULL')
      .andWhere('"r"."horaSalida" >= :inicio AND "r"."horaSalida" < :fin', { inicio, fin })
      .getCount();
    return { entradas, salidas };
  }
}
