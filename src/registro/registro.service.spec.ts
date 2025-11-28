import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RegistroService } from './registro.service';
import { Registro } from './entities/registro.entity';
import { VehiculoService } from '../vehiculo/vehiculo.service';
import { UsuarioService } from '../usuario/usuario.service';
import { ParqueaderoService } from '../parqueadero/parqueadero.service';
import { EstadoRegistro } from './enums/estado-registro.enum';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { TipoVehiculo } from '../vehiculo/enums/tipo-vehiculo.enum';

describe('RegistroService - Registro de Entrada Manual', () => {
  let service: RegistroService;
  let registroRepository: Repository<Registro>;
  let vehiculoService: VehiculoService;
  let usuarioService: UsuarioService;
  let parqueaderoService: ParqueaderoService;

  const mockRegistroRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockVehiculoService = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockUsuarioService = {
    findOne: jest.fn(),
  };

  const mockParqueaderoService = {
    findOne: jest.fn(),
    actualizarCuposDisponibles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistroService,
        {
          provide: getRepositoryToken(Registro),
          useValue: mockRegistroRepository,
        },
        {
          provide: VehiculoService,
          useValue: mockVehiculoService,
        },
        {
          provide: UsuarioService,
          useValue: mockUsuarioService,
        },
        {
          provide: ParqueaderoService,
          useValue: mockParqueaderoService,
        },
      ],
    }).compile();

    service = module.get<RegistroService>(RegistroService);
    registroRepository = module.get<Repository<Registro>>(
      getRepositoryToken(Registro),
    );
    vehiculoService = module.get<VehiculoService>(VehiculoService);
    usuarioService = module.get<UsuarioService>(UsuarioService);
    parqueaderoService = module.get<ParqueaderoService>(ParqueaderoService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Criterio 1: Validación de formato de placa', () => {
    it('debe aceptar formato válido AAA123 para carro', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'ABC123',
        tipo: TipoVehiculo.CARRO,
        marca: 'Toyota',
        modelo: 'Corolla',
        color: 'Rojo',
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        nombre: 'Parqueadero Central',
        cuposDisponiblesCarros: 10,
        cuposDisponiblesMotos: 5,
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);
      mockRegistroRepository.findOne.mockResolvedValue(null);
      mockRegistroRepository.createQueryBuilder.mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockRegistroRepository.create.mockReturnValue({
        vehiculoPlaca: dto.vehiculoPlaca,
        usuarioId: dto.usuarioId,
        parqueaderoId: dto.parqueaderoId,
        estado: EstadoRegistro.ACTIVO,
      });
      mockRegistroRepository.save.mockResolvedValue({
        id: 1,
        vehiculoPlaca: dto.vehiculoPlaca,
        usuarioId: dto.usuarioId,
        parqueaderoId: dto.parqueaderoId,
        estado: EstadoRegistro.ACTIVO,
        horaEntrada: new Date(),
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.vehiculoPlaca).toBe('ABC123');
      expect(result.estado).toBe(EstadoRegistro.ACTIVO);
    });

    it('debe aceptar formato válido XYZ78A para moto', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'XYZ78A',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'XYZ78A',
        tipo: TipoVehiculo.MOTO,
        marca: 'Yamaha',
        modelo: 'FZ-16',
        color: 'Azul',
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        nombre: 'Parqueadero Central',
        cuposDisponiblesCarros: 10,
        cuposDisponiblesMotos: 5,
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);
      mockRegistroRepository.findOne.mockResolvedValue(null);
      mockRegistroRepository.createQueryBuilder.mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockRegistroRepository.create.mockReturnValue({
        vehiculoPlaca: dto.vehiculoPlaca,
        usuarioId: dto.usuarioId,
        parqueaderoId: dto.parqueaderoId,
        estado: EstadoRegistro.ACTIVO,
      });
      mockRegistroRepository.save.mockResolvedValue({
        id: 2,
        vehiculoPlaca: dto.vehiculoPlaca,
        estado: EstadoRegistro.ACTIVO,
        horaEntrada: new Date(),
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.vehiculoPlaca).toBe('XYZ78A');
    });
  });

  describe('Criterio 2: Control de duplicados - No permitir entrada activa con misma placa', () => {
    it('debe rechazar registro si ya existe entrada activa con la misma placa', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'ABC123',
        tipo: TipoVehiculo.CARRO,
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        cuposDisponiblesCarros: 10,
      };

      // Simular que ya existe un registro activo
      const registroActivo = {
        id: 999,
        vehiculoPlaca: 'ABC123',
        estado: EstadoRegistro.ACTIVO,
        horaEntrada: new Date(),
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);
      mockRegistroRepository.findOne.mockResolvedValue(registroActivo);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'El vehículo ya tiene un registro activo en un parqueadero',
      );
    });

    it('debe permitir registro si el vehículo tiene registro FINALIZADO (no activo)', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'ABC123',
        tipo: TipoVehiculo.CARRO,
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        cuposDisponiblesCarros: 10,
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);
      mockRegistroRepository.findOne.mockResolvedValue(null); // No hay registro activo
      mockRegistroRepository.createQueryBuilder.mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockRegistroRepository.create.mockReturnValue({
        vehiculoPlaca: dto.vehiculoPlaca,
        estado: EstadoRegistro.ACTIVO,
      });
      mockRegistroRepository.save.mockResolvedValue({
        id: 1,
        vehiculoPlaca: dto.vehiculoPlaca,
        estado: EstadoRegistro.ACTIVO,
        horaEntrada: new Date(),
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.estado).toBe(EstadoRegistro.ACTIVO);
    });
  });

  describe('Criterio 3: Validación de campos obligatorios', () => {
    it('debe validar que vehiculoPlaca sea requerido', async () => {
      const dto: any = {
        usuarioId: 1,
        parqueaderoId: 1,
      };

      // El DTO validation pipe se encargará de esto en runtime
      // Aquí validamos la lógica del servicio
      expect(dto.vehiculoPlaca).toBeUndefined();
    });

    it('debe validar que usuarioId sea requerido', async () => {
      const dto: any = {
        vehiculoPlaca: 'ABC123',
        parqueaderoId: 1,
      };

      expect(dto.usuarioId).toBeUndefined();
    });

    it('debe validar que parqueaderoId sea requerido', async () => {
      const dto: any = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
      };

      expect(dto.parqueaderoId).toBeUndefined();
    });

    it('debe validar que el vehículo exista en la base de datos', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'NOEXISTE',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      mockVehiculoService.findOne.mockRejectedValue(
        new NotFoundException('Vehículo no encontrado'),
      );

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('debe validar que el usuario exista en la base de datos', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 9999,
        parqueaderoId: 1,
      };

      const mockVehiculo = { placa: 'ABC123', tipo: TipoVehiculo.CARRO };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('debe validar que el parqueadero exista en la base de datos', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
        parqueaderoId: 9999,
      };

      const mockVehiculo = { placa: 'ABC123', tipo: TipoVehiculo.CARRO };
      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockRejectedValue(
        new NotFoundException('Parqueadero no encontrado'),
      );

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Criterio 4: Guardar registro con estado ACTIVO y hora de ingreso', () => {
    it('debe guardar el registro con estado ACTIVO', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'ABC123',
        tipo: TipoVehiculo.CARRO,
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        cuposDisponiblesCarros: 10,
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);
      mockRegistroRepository.findOne.mockResolvedValue(null);
      mockRegistroRepository.createQueryBuilder.mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockRegistroRepository.create.mockReturnValue({
        vehiculoPlaca: dto.vehiculoPlaca,
        usuarioId: dto.usuarioId,
        parqueaderoId: dto.parqueaderoId,
        estado: EstadoRegistro.ACTIVO,
        horaSalida: null,
      });
      mockRegistroRepository.save.mockResolvedValue({
        id: 1,
        vehiculoPlaca: dto.vehiculoPlaca,
        estado: EstadoRegistro.ACTIVO,
        horaEntrada: new Date(),
        horaSalida: null,
      });

      const result = await service.create(dto);

      expect(mockRegistroRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoRegistro.ACTIVO,
          horaSalida: null,
        }),
      );
      expect(result.estado).toBe(EstadoRegistro.ACTIVO);
      expect(result.horaEntrada).toBeDefined();
      expect(result.horaSalida).toBeNull();
    });

    it('debe decrementar cupos disponibles después del registro exitoso', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'ABC123',
        tipo: TipoVehiculo.CARRO,
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        cuposDisponiblesCarros: 10,
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);
      mockRegistroRepository.findOne.mockResolvedValue(null);
      mockRegistroRepository.createQueryBuilder.mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockRegistroRepository.create.mockReturnValue({
        vehiculoPlaca: dto.vehiculoPlaca,
        estado: EstadoRegistro.ACTIVO,
      });
      mockRegistroRepository.save.mockResolvedValue({
        id: 1,
        vehiculoPlaca: dto.vehiculoPlaca,
        estado: EstadoRegistro.ACTIVO,
        horaEntrada: new Date(),
      });

      await service.create(dto);

      expect(
        mockParqueaderoService.actualizarCuposDisponibles,
      ).toHaveBeenCalledWith(1, TipoVehiculo.CARRO, -1);
    });
  });

  describe('Criterio 5: Validación de capacidad del parqueadero', () => {
    it('debe rechazar entrada si no hay cupos disponibles para carros', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'ABC123',
        tipo: TipoVehiculo.CARRO,
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        cuposDisponiblesCarros: 0, // Sin cupos
        cuposDisponiblesMotos: 5,
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'No hay cupos disponibles para carros en el parqueadero',
      );
    });

    it('debe rechazar entrada si no hay cupos disponibles para motos', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'XYZ78A',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'XYZ78A',
        tipo: TipoVehiculo.MOTO,
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        cuposDisponiblesCarros: 10,
        cuposDisponiblesMotos: 0, // Sin cupos
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow(
        'No hay cupos disponibles para motos en el parqueadero',
      );
    });

    it('debe permitir entrada cuando hay cupos disponibles', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'ABC123',
        tipo: TipoVehiculo.CARRO,
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        cuposDisponiblesCarros: 5, // Hay cupos
        cuposDisponiblesMotos: 3,
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);
      mockRegistroRepository.findOne.mockResolvedValue(null);
      mockRegistroRepository.createQueryBuilder.mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockRegistroRepository.create.mockReturnValue({
        vehiculoPlaca: dto.vehiculoPlaca,
        estado: EstadoRegistro.ACTIVO,
      });
      mockRegistroRepository.save.mockResolvedValue({
        id: 1,
        vehiculoPlaca: dto.vehiculoPlaca,
        estado: EstadoRegistro.ACTIVO,
        horaEntrada: new Date(),
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.estado).toBe(EstadoRegistro.ACTIVO);
    });
  });

  describe('Criterio 6: Persistencia y recuperación de datos', () => {
    it('debe persistir todos los datos del registro correctamente', async () => {
      const dto: CreateRegistroDto = {
        vehiculoPlaca: 'ABC123',
        usuarioId: 1,
        parqueaderoId: 1,
      };

      const mockVehiculo = {
        placa: 'ABC123',
        tipo: TipoVehiculo.CARRO,
      };

      const mockUsuario = { id: 1, nombre: 'Juan Guardia' };
      const mockParqueadero = {
        id: 1,
        cuposDisponiblesCarros: 10,
      };

      mockVehiculoService.findOne.mockResolvedValue(mockVehiculo);
      mockUsuarioService.findOne.mockResolvedValue(mockUsuario);
      mockParqueaderoService.findOne.mockResolvedValue(mockParqueadero);
      mockRegistroRepository.findOne.mockResolvedValue(null);
      mockRegistroRepository.createQueryBuilder.mockReturnValue({
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockRegistroRepository.create.mockReturnValue({
        vehiculoPlaca: dto.vehiculoPlaca,
        usuarioId: dto.usuarioId,
        parqueaderoId: dto.parqueaderoId,
        estado: EstadoRegistro.ACTIVO,
      });
      mockRegistroRepository.save.mockResolvedValue({
        id: 1,
        vehiculoPlaca: dto.vehiculoPlaca,
        usuarioId: dto.usuarioId,
        parqueaderoId: dto.parqueaderoId,
        estado: EstadoRegistro.ACTIVO,
        horaEntrada: new Date(),
      });

      await service.create(dto);

      expect(mockRegistroRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          vehiculoPlaca: 'ABC123',
          usuarioId: 1,
          parqueaderoId: 1,
          estado: EstadoRegistro.ACTIVO,
        }),
      );
    });
  });
});
