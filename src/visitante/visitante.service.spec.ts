import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { VisitanteService } from './visitante.service';
import { VisitanteConductor } from './entities/visitante-conductor.entity';
import { Vehiculo } from '../vehiculo/entities/vehiculo.entity';
import { Registro } from '../registro/entities/registro.entity';
import { ParqueaderoService } from '../parqueadero/parqueadero.service';
import { PicoPlacaService } from '../pico-placa/pico-placa.service';
import { TipoPropietario } from '../vehiculo/enums/tipo-propietario.enum';
import { TipoVehiculo } from '../vehiculo/enums/tipo-vehiculo.enum';
import { EstadoRegistro } from '../registro/enums/estado-registro.enum';

describe('VisitanteService', () => {
  let service: VisitanteService;
  let visitanteConductorRepository: Repository<VisitanteConductor>;
  let vehiculoRepository: Repository<Vehiculo>;
  let registroRepository: Repository<Registro>;
  let parqueaderoService: ParqueaderoService;
  let picoPlacaService: PicoPlacaService;

  const mockVisitanteConductorRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockVehiculoRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRegistroRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockParqueaderoService = {
    findOne: jest.fn(),
  };

  const mockPicoPlacaService = {
    validarPicoPlaca: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitanteService,
        {
          provide: getRepositoryToken(VisitanteConductor),
          useValue: mockVisitanteConductorRepository,
        },
        {
          provide: getRepositoryToken(Vehiculo),
          useValue: mockVehiculoRepository,
        },
        {
          provide: getRepositoryToken(Registro),
          useValue: mockRegistroRepository,
        },
        {
          provide: ParqueaderoService,
          useValue: mockParqueaderoService,
        },
        {
          provide: PicoPlacaService,
          useValue: mockPicoPlacaService,
        },
      ],
    }).compile();

    service = module.get<VisitanteService>(VisitanteService);
    visitanteConductorRepository = module.get<Repository<VisitanteConductor>>(
      getRepositoryToken(VisitanteConductor),
    );
    vehiculoRepository = module.get<Repository<Vehiculo>>(
      getRepositoryToken(Vehiculo),
    );
    registroRepository = module.get<Repository<Registro>>(
      getRepositoryToken(Registro),
    );
    parqueaderoService = module.get<ParqueaderoService>(ParqueaderoService);
    picoPlacaService = module.get<PicoPlacaService>(PicoPlacaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registrarVisitante', () => {
    const dto = {
      conductor: {
        cedula: '1234567890',
        nombre: 'Juan',
        apellido: 'Pérez',
        telefono: '3001234567',
      },
      placa: 'ABC123',
      tipoVehiculo: TipoVehiculo.CARRO,
      marca: 'Toyota',
      modelo: 'Corolla',
      color: 'Rojo',
      fechaCaducidad: '2025-12-31T23:59:59.000Z',
      motivoVisita: 'Reunión académica',
      parqueaderoId: 1,
    };

    const usuarioId = 1;

    it('debe rechazar fecha de caducidad vencida', async () => {
      const dtoFechaVencida = {
        ...dto,
        fechaCaducidad: '2020-01-01T00:00:00.000Z',
      };

      await expect(
        service.registrarVisitante(dtoFechaVencida, usuarioId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar por restricción de pico y placa', async () => {
      mockPicoPlacaService.validarPicoPlaca.mockResolvedValue({
        tieneRestriccion: true,
        mensaje: 'Placa termina en 3, restringida los lunes',
      });

      await expect(
        service.registrarVisitante(dto, usuarioId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar cuando el parqueadero no existe', async () => {
      mockPicoPlacaService.validarPicoPlaca.mockResolvedValue({
        tieneRestriccion: false,
        mensaje: 'Sin restricción',
      });
      mockParqueaderoService.findOne.mockResolvedValue(null);

      await expect(
        service.registrarVisitante(dto, usuarioId),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar cuando el parqueadero está lleno', async () => {
      mockPicoPlacaService.validarPicoPlaca.mockResolvedValue({
        tieneRestriccion: false,
        mensaje: 'Sin restricción',
      });
      mockParqueaderoService.findOne.mockResolvedValue({
        id: 1,
        nombre: 'Parqueadero Central',
        capacidad: 10,
      });
      mockRegistroRepository.count.mockResolvedValue(10);

      await expect(
        service.registrarVisitante(dto, usuarioId),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear nuevo visitante y vehículo cuando no existen', async () => {
      const parqueadero = {
        id: 1,
        nombre: 'Parqueadero Central',
        capacidad: 10,
      };

      const nuevoVisitante = {
        cedula: dto.conductor.cedula,
        ...dto.conductor,
      };

      const nuevoVehiculo = {
        placa: dto.placa,
        tipo: dto.tipoVehiculo,
        tipoPropietario: TipoPropietario.VISITANTE,
        propietarioId: dto.conductor.cedula,
        marca: dto.marca,
        modelo: dto.modelo,
        color: dto.color,
        fechaCaducidad: new Date(dto.fechaCaducidad),
      };

      const nuevoRegistro = {
        id: 1,
        vehiculoPlaca: dto.placa,
        usuarioId: usuarioId,
        parqueaderoId: dto.parqueaderoId,
        motivoVisita: dto.motivoVisita,
        estado: EstadoRegistro.ACTIVO,
      };

      mockPicoPlacaService.validarPicoPlaca.mockResolvedValue({
        tieneRestriccion: false,
        mensaje: 'Sin restricción',
      });
      mockParqueaderoService.findOne.mockResolvedValue(parqueadero);
      mockRegistroRepository.count.mockResolvedValue(5);
      mockVisitanteConductorRepository.findOne.mockResolvedValue(null);
      mockVisitanteConductorRepository.create.mockReturnValue(nuevoVisitante);
      mockVisitanteConductorRepository.save.mockResolvedValue(nuevoVisitante);
      mockVehiculoRepository.findOne.mockResolvedValue(null);
      mockVehiculoRepository.create.mockReturnValue(nuevoVehiculo);
      mockVehiculoRepository.save.mockResolvedValue(nuevoVehiculo);
      mockRegistroRepository.findOne.mockResolvedValue(null);
      mockRegistroRepository.create.mockReturnValue(nuevoRegistro);
      mockRegistroRepository.save.mockResolvedValue(nuevoRegistro);

      const resultado = await service.registrarVisitante(dto, usuarioId);

      expect(resultado).toEqual(nuevoRegistro);
      expect(mockVisitanteConductorRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cedula: dto.conductor.cedula,
          nombre: dto.conductor.nombre,
        }),
      );
      expect(mockVehiculoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          placa: dto.placa,
          tipoPropietario: TipoPropietario.VISITANTE,
        }),
      );
      expect(mockRegistroRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vehiculoPlaca: dto.placa,
          motivoVisita: dto.motivoVisita,
        }),
      );
    });

    it('debe actualizar visitante existente', async () => {
      const visitanteExistente = {
        cedula: dto.conductor.cedula,
        nombre: 'Nombre Antiguo',
        apellido: 'Apellido Antiguo',
        telefono: '3009999999',
      };

      mockPicoPlacaService.validarPicoPlaca.mockResolvedValue({
        tieneRestriccion: false,
        mensaje: 'Sin restricción',
      });
      mockParqueaderoService.findOne.mockResolvedValue({
        id: 1,
        capacidad: 10,
      });
      mockRegistroRepository.count.mockResolvedValue(5);
      mockVisitanteConductorRepository.findOne.mockResolvedValue(visitanteExistente);
      mockVisitanteConductorRepository.save.mockResolvedValue({
        ...visitanteExistente,
        ...dto.conductor,
      });
      mockVehiculoRepository.findOne.mockResolvedValue(null);
      mockVehiculoRepository.create.mockReturnValue({});
      mockVehiculoRepository.save.mockResolvedValue({});
      mockRegistroRepository.findOne.mockResolvedValue(null);
      mockRegistroRepository.create.mockReturnValue({});
      mockRegistroRepository.save.mockResolvedValue({ id: 1 });

      await service.registrarVisitante(dto, usuarioId);

      expect(mockVisitanteConductorRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: dto.conductor.nombre,
          apellido: dto.conductor.apellido,
        }),
      );
    });

    it('debe rechazar vehículo institucional usado como visitante', async () => {
      const vehiculoInstitucional = {
        placa: dto.placa,
        tipoPropietario: TipoPropietario.INSTITUCIONAL,
      };

      mockPicoPlacaService.validarPicoPlaca.mockResolvedValue({
        tieneRestriccion: false,
        mensaje: 'Sin restricción',
      });
      mockParqueaderoService.findOne.mockResolvedValue({ id: 1, capacidad: 10 });
      mockRegistroRepository.count.mockResolvedValue(5);
      mockVisitanteConductorRepository.findOne.mockResolvedValue(null);
      mockVisitanteConductorRepository.create.mockReturnValue({});
      mockVisitanteConductorRepository.save.mockResolvedValue({});
      mockVehiculoRepository.findOne.mockResolvedValue(vehiculoInstitucional);

      await expect(
        service.registrarVisitante(dto, usuarioId),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar cuando el vehículo ya tiene un registro activo', async () => {
      const registroActivo = {
        id: 1,
        vehiculoPlaca: dto.placa,
        horaSalida: null,
      };

      mockPicoPlacaService.validarPicoPlaca.mockResolvedValue({
        tieneRestriccion: false,
        mensaje: 'Sin restricción',
      });
      mockParqueaderoService.findOne.mockResolvedValue({ id: 1, capacidad: 10 });
      mockRegistroRepository.count.mockResolvedValue(5);
      mockVisitanteConductorRepository.findOne.mockResolvedValue(null);
      mockVisitanteConductorRepository.create.mockReturnValue({});
      mockVisitanteConductorRepository.save.mockResolvedValue({});
      mockVehiculoRepository.findOne.mockResolvedValue(null);
      mockVehiculoRepository.create.mockReturnValue({});
      mockVehiculoRepository.save.mockResolvedValue({});
      mockRegistroRepository.findOne.mockResolvedValue(registroActivo);

      await expect(
        service.registrarVisitante(dto, usuarioId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByCedula', () => {
    it('debe encontrar visitante por cédula', async () => {
      const visitante = {
        cedula: '1234567890',
        nombre: 'Juan',
        apellido: 'Pérez',
      };

      mockVisitanteConductorRepository.findOne.mockResolvedValue(visitante);

      const resultado = await service.findByCedula('1234567890');

      expect(resultado).toEqual(visitante);
      expect(mockVisitanteConductorRepository.findOne).toHaveBeenCalledWith({
        where: { cedula: '1234567890' },
      });
    });

    it('debe lanzar NotFoundException cuando no existe', async () => {
      mockVisitanteConductorRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCedula('9999999999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los visitantes ordenados por fecha de creación', async () => {
      const visitantes = [
        { cedula: '1234567890', nombre: 'Juan' },
        { cedula: '0987654321', nombre: 'María' },
      ];

      mockVisitanteConductorRepository.find.mockResolvedValue(visitantes);

      const resultado = await service.findAll();

      expect(resultado).toEqual(visitantes);
      expect(mockVisitanteConductorRepository.find).toHaveBeenCalledWith({
        order: {
          fechaCreacion: 'DESC',
        },
      });
    });
  });

  describe('createOrUpdate', () => {
    const dto = {
      cedula: '1234567890',
      nombre: 'Juan',
      apellido: 'Pérez',
      telefono: '3001234567',
    };

    it('debe crear nuevo visitante si no existe', async () => {
      mockVisitanteConductorRepository.findOne.mockResolvedValue(null);
      mockVisitanteConductorRepository.create.mockReturnValue(dto);
      mockVisitanteConductorRepository.save.mockResolvedValue(dto);

      const resultado = await service.createOrUpdate(dto);

      expect(resultado).toEqual(dto);
      expect(mockVisitanteConductorRepository.create).toHaveBeenCalledWith(dto);
    });

    it('debe actualizar visitante existente', async () => {
      const visitanteExistente = {
        cedula: dto.cedula,
        nombre: 'Nombre Antiguo',
        apellido: 'Apellido Antiguo',
      };

      mockVisitanteConductorRepository.findOne.mockResolvedValue(visitanteExistente);
      mockVisitanteConductorRepository.save.mockResolvedValue({
        ...visitanteExistente,
        ...dto,
      });

      const resultado = await service.createOrUpdate(dto);

      expect(resultado.nombre).toEqual(dto.nombre);
      expect(mockVisitanteConductorRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar visitante existente', async () => {
      const visitante = {
        cedula: '1234567890',
        nombre: 'Juan',
      };

      mockVisitanteConductorRepository.findOne.mockResolvedValue(visitante);
      mockVisitanteConductorRepository.remove.mockResolvedValue(visitante);

      await service.remove('1234567890');

      expect(mockVisitanteConductorRepository.remove).toHaveBeenCalledWith(
        visitante,
      );
    });

    it('debe lanzar NotFoundException si visitante no existe', async () => {
      mockVisitanteConductorRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('9999999999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
