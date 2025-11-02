import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RegistroController } from '../src/registro/registro.controller';
import { RegistroService } from '../src/registro/registro.service';
import { EstadoRegistro } from '../src/registro/enums/estado-registro.enum';

describe('RegistroController - Registrar Salida por Placa', () => {
  let controller: RegistroController;
  let service: jest.Mocked<RegistroService>;

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<RegistroService>> = {
      findByVehiculo: jest.fn(),
      registrarSalida: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistroController],
      providers: [{ provide: RegistroService, useValue: mockService }],
    }).compile();

    controller = module.get<RegistroController>(RegistroController);
    service = module.get(RegistroService) as jest.Mocked<RegistroService>;
  });

  it('debe buscar registro activo por placa y registrar salida', async () => {
    const placa = 'ABC123';
    const registros = [
      { id: 1, estado: EstadoRegistro.INACTIVO },
      { id: 2, estado: EstadoRegistro.ACTIVO },
    ] as any;
    const salida = { horaSalida: '2030-01-01T01:00:00Z' };

    service.findByVehiculo.mockResolvedValue(registros);
    service.registrarSalida.mockResolvedValue({ id: 2, estado: EstadoRegistro.INACTIVO, horaSalida: new Date(salida.horaSalida) } as any);

    const result = await controller.registrarSalidaPorPlaca(placa, salida);

    expect(service.findByVehiculo).toHaveBeenCalledWith(placa);
    expect(service.registrarSalida).toHaveBeenCalledWith(2, salida);
    expect(result.estado).toBe(EstadoRegistro.INACTIVO);
  });

  it('debe lanzar NotFound si no existe registro activo para la placa', async () => {
    const placa = 'XYZ789';
    service.findByVehiculo.mockResolvedValue([{ id: 3, estado: EstadoRegistro.INACTIVO }] as any);

    await expect(controller.registrarSalidaPorPlaca(placa)).rejects.toThrow(NotFoundException);
    await expect(controller.registrarSalidaPorPlaca(placa)).rejects.toThrow('Registro activo para la placa no encontrado');
  });
});