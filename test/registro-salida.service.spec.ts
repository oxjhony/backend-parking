import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RegistroService } from '../src/registro/registro.service';
import { Registro } from '../src/registro/entities/registro.entity';
import { VehiculoService } from '../src/vehiculo/vehiculo.service';
import { UsuarioService } from '../src/usuario/usuario.service';
import { ParqueaderoService } from '../src/parqueadero/parqueadero.service';
import { EstadoRegistro } from '../src/registro/enums/estado-registro.enum';
import { TipoVehiculo } from '../src/vehiculo/enums/tipo-vehiculo.enum';

describe('RegistroService - Registrar Salida de Vehículo', () => {
  let service: RegistroService;
  let registroRepository: Repository<Registro>;
  let vehiculoService: VehiculoService;
  let parqueaderoService: ParqueaderoService;

  const mockRegistroRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  } as any;

  const mockVehiculoService = {
    findOne: jest.fn(),
  } as any;

  const mockUsuarioService = {} as any; // no se usa en registrarSalida

  const mockParqueaderoService = {
    actualizarCuposDisponibles: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistroService,
        { provide: getRepositoryToken(Registro), useValue: mockRegistroRepository },
        { provide: VehiculoService, useValue: mockVehiculoService },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: ParqueaderoService, useValue: mockParqueaderoService },
      ],
    }).compile();

    service = module.get<RegistroService>(RegistroService);
    registroRepository = module.get<Repository<Registro>>(getRepositoryToken(Registro));
    vehiculoService = module.get<VehiculoService>(VehiculoService);
    parqueaderoService = module.get<ParqueaderoService>(ParqueaderoService);

    jest.clearAllMocks();
  });

  it('debe registrar salida automáticamente (hora actual), marcar INACTIVO y liberar cupo', async () => {
    const registroActivo: Registro = {
      id: 10,
      estado: EstadoRegistro.ACTIVO,
      horaEntrada: new Date(Date.now() - 60_000),
      horaSalida: null,
      vehiculoPlaca: 'ABC123',
      usuarioId: 1,
      parqueaderoId: 1,
      vehiculo: undefined as any,
      usuario: undefined as any,
      parqueadero: undefined as any,
    };

    mockRegistroRepository.findOne.mockResolvedValue(registroActivo);
    mockVehiculoService.findOne.mockResolvedValue({ placa: 'ABC123', tipo: TipoVehiculo.CARRO });
    mockRegistroRepository.save.mockImplementation(async (r: Registro) => ({ ...r }));

    const result = await service.registrarSalida(registroActivo.id);

    expect(result.estado).toBe(EstadoRegistro.INACTIVO);
    expect(result.horaSalida).toBeInstanceOf(Date);
    expect(parqueaderoService.actualizarCuposDisponibles).toHaveBeenCalledWith(1, TipoVehiculo.CARRO, 1);
  });

  it('debe utilizar horaSalida proporcionada si se envía en el DTO', async () => {
    const registroActivo: Registro = {
      id: 20,
      estado: EstadoRegistro.ACTIVO,
      horaEntrada: new Date(Date.now() - 120_000),
      horaSalida: null,
      vehiculoPlaca: 'XYZ78A',
      usuarioId: 2,
      parqueaderoId: 2,
      vehiculo: undefined as any,
      usuario: undefined as any,
      parqueadero: undefined as any,
    };

    const salida = '2030-01-01T00:00:00Z';

    mockRegistroRepository.findOne.mockResolvedValue(registroActivo);
    mockVehiculoService.findOne.mockResolvedValue({ placa: 'XYZ78A', tipo: TipoVehiculo.MOTO });
    mockRegistroRepository.save.mockImplementation(async (r: Registro) => ({ ...r }));

    const result = await service.registrarSalida(registroActivo.id, { horaSalida: salida });

    expect(result.estado).toBe(EstadoRegistro.INACTIVO);
    expect(result.horaSalida?.toISOString()).toBe(new Date(salida).toISOString());
    expect(parqueaderoService.actualizarCuposDisponibles).toHaveBeenCalledWith(2, TipoVehiculo.MOTO, 1);
  });

  it('debe rechazar salida si el registro ya está cerrado', async () => {
    const registroInactivo: Registro = {
      id: 30,
      estado: EstadoRegistro.INACTIVO,
      horaEntrada: new Date(Date.now() - 300_000),
      horaSalida: new Date(),
      vehiculoPlaca: 'DEF456',
      usuarioId: 3,
      parqueaderoId: 3,
      vehiculo: undefined as any,
      usuario: undefined as any,
      parqueadero: undefined as any,
    };

    mockRegistroRepository.findOne.mockResolvedValue(registroInactivo);

    await expect(service.registrarSalida(registroInactivo.id)).rejects.toThrow(BadRequestException);
    await expect(service.registrarSalida(registroInactivo.id)).rejects.toThrow('El registro ya está cerrado');
  });

  it('debe lanzar NotFound si el registro no existe', async () => {
    mockRegistroRepository.findOne.mockResolvedValue(null);

    await expect(service.registrarSalida(9999)).rejects.toThrow(NotFoundException);
  });
});