import { Test, TestingModule } from '@nestjs/testing';
import { ReporteController } from './registro.controller';
import { RegistroService } from './registro.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import * as fs from 'fs';
import * as path from 'path';
import { TipoVehiculo } from '../vehiculo/enums/tipo-vehiculo.enum';

describe('ReporteController', () => {
  let controller: ReporteController;
  const mockRegistroService = {
    obtenerReporteCarrosPorFecha: jest.fn(),
    obtenerReporteParqueaderoPorSemana: jest.fn(),
    obtenerReporteParqueaderoPorMes: jest.fn(),
    obtenerReportePorTipoVehiculoSemana: jest.fn(),
    obtenerReportePorTipoVehiculoMes: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReporteController],
      providers: [
        { provide: RegistroService, useValue: mockRegistroService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReporteController>(ReporteController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('debe generar PDF con detalles de entradas y salidas por fecha', async () => {
    const entradas = [
      {
        horaEntrada: new Date('2025-11-30T08:15:00Z'),
        vehiculoPlaca: 'ABC123',
        vehiculo: { tipo: TipoVehiculo.CARRO, marca: 'Toyota', modelo: 'Corolla', color: 'Rojo' },
      },
    ];
    const salidas = [
      {
        horaSalida: new Date('2025-11-30T10:45:00Z'),
        vehiculoPlaca: 'XYZ789',
        vehiculo: { tipo: TipoVehiculo.CARRO, marca: 'Mazda', modelo: '3', color: 'Azul' },
      },
    ];
    mockRegistroService.obtenerReporteCarrosPorFecha.mockResolvedValue({ entradas, salidas });

    const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as any);
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined as any);
    const res: any = { download: jest.fn() };

    await controller.reportePdf('2025-11-30', res);

    expect(mockRegistroService.obtenerReporteCarrosPorFecha).toHaveBeenCalledWith('2025-11-30');
    expect(mkdirSpy).toHaveBeenCalled();
    expect(writeSpy).toHaveBeenCalled();
    const args = writeSpy.mock.calls[0];
    expect(args[0]).toContain(path.join(process.cwd(), 'reports', 'reporte-2025-11-30.pdf'));
    expect(typeof args[1]).toBe('string');
    expect(args[1]).toContain('ABC123');
    expect(args[1]).toContain('Toyota');
    expect(res.download).toHaveBeenCalledWith(args[0]);
  });

  it('debe generar PDF de parqueadero por semana', async () => {
    mockRegistroService.obtenerReporteParqueaderoPorSemana.mockResolvedValue({ entradas: 5, salidas: 2 });
    const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as any);
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined as any);
    const res: any = { download: jest.fn() };

    await controller.parqueaderoSemana('2025-11-10', '2025-11-16', res);

    expect(mockRegistroService.obtenerReporteParqueaderoPorSemana).toHaveBeenCalledWith('2025-11-10', '2025-11-16');
    const args = writeSpy.mock.calls[0];
    expect(args[1]).toContain('Entradas: 5');
    expect(args[1]).toContain('Salidas: 2');
    expect(res.download).toHaveBeenCalledWith(args[0]);
  });

  it('debe generar PDF de parqueadero por mes', async () => {
    mockRegistroService.obtenerReporteParqueaderoPorMes.mockResolvedValue({ entradas: 12, salidas: 7 });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as any);
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined as any);
    const res: any = { download: jest.fn() };

    await controller.parqueaderoMes('2025', '11', res);

    expect(mockRegistroService.obtenerReporteParqueaderoPorMes).toHaveBeenCalledWith(2025, 11);
    const args = writeSpy.mock.calls[0];
    expect(args[1]).toContain('Entradas: 12');
    expect(args[1]).toContain('Salidas: 7');
    expect(res.download).toHaveBeenCalledWith(args[0]);
  });

  it('debe generar PDF por tipo de vehículo por semana', async () => {
    mockRegistroService.obtenerReportePorTipoVehiculoSemana.mockResolvedValue({ entradas: 3, salidas: 1 });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as any);
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined as any);
    const res: any = { download: jest.fn() };

    await controller.vehiculoSemana(TipoVehiculo.CARRO, '2025-11-10', '2025-11-16', res);

    expect(mockRegistroService.obtenerReportePorTipoVehiculoSemana).toHaveBeenCalledWith(TipoVehiculo.CARRO, '2025-11-10', '2025-11-16');
    const args = writeSpy.mock.calls[0];
    expect(args[1]).toContain('Entradas: 3');
    expect(args[1]).toContain('Salidas: 1');
    expect(res.download).toHaveBeenCalledWith(args[0]);
  });

  it('debe generar PDF por tipo de vehículo por mes', async () => {
    mockRegistroService.obtenerReportePorTipoVehiculoMes.mockResolvedValue({ entradas: 9, salidas: 4 });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as any);
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined as any);
    const res: any = { download: jest.fn() };

    await controller.vehiculoMes(TipoVehiculo.MOTO, '2025', '11', res);

    expect(mockRegistroService.obtenerReportePorTipoVehiculoMes).toHaveBeenCalledWith(TipoVehiculo.MOTO, 2025, 11);
    const args = writeSpy.mock.calls[0];
    expect(args[1]).toContain('Entradas: 9');
    expect(args[1]).toContain('Salidas: 4');
    expect(res.download).toHaveBeenCalledWith(args[0]);
  });
});

