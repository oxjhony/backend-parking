import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Gestión de Vehículos de Personas Internas (E2E)
 * Rol: Administrador
 * Objetivo: Crear, editar y eliminar vehículos asociados a personas internas.
 * Alcance (backend): CRUD de vehículo, placa única, asociación por conductorCodigo.
 */

describe('Vehículo - Administración (E2E)', () => {
  let app: INestApplication;

  const buildVehiculoDto = (placa: string, conductorCodigo?: string) => ({
    placa,
    tipo: 'CARRO',
    marca: 'Toyota',
    modelo: 'Corolla',
    color: 'Rojo',
    fechaCaducidad: '2099-12-31T23:59:59Z',
    conductorCodigo: conductorCodigo ?? `INT-${Date.now()}`,
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('POST /vehiculo - debe crear un vehículo asociado a una persona interna', async () => {
    const placa = `ADMCR${String(Date.now()).slice(-8)}`;
    const dto = buildVehiculoDto(placa, '0000028932');

    const crear = await request(app.getHttpServer()).post('/vehiculo').send(dto).expect(201);
    expect(crear.body.placa).toBe(placa);
    expect(crear.body.conductorCodigo).toBe(dto.conductorCodigo);

    const obtener = await request(app.getHttpServer()).get(`/vehiculo/${placa}`).expect(200);
    expect(obtener.body.placa).toBe(placa);
    expect(obtener.body.tipo).toBe('CARRO');
    expect(obtener.body.marca).toBe('Toyota');
    expect(obtener.body.modelo).toBe('Corolla');
    expect(obtener.body.color).toBe('Rojo');
    expect(obtener.body.conductorCodigo).toBe(dto.conductorCodigo);
  });

  it('PATCH /vehiculo/:placa - debe editar datos del vehículo', async () => {
    const placa = `ADMUP${String(Date.now()).slice(-8)}`;
    const dto = buildVehiculoDto(placa);

    await request(app.getHttpServer()).post('/vehiculo').send(dto).expect(201);

    const actualizar = await request(app.getHttpServer())
      .patch(`/vehiculo/${placa}`)
      .send({ marca: 'Ford', modelo: 'Focus', color: 'Azul' })
      .expect(200);
    expect(actualizar.body.marca).toBe('Ford');
    expect(actualizar.body.modelo).toBe('Focus');
    expect(actualizar.body.color).toBe('Azul');

    const obtener = await request(app.getHttpServer()).get(`/vehiculo/${placa}`).expect(200);
    expect(obtener.body.marca).toBe('Ford');
    expect(obtener.body.modelo).toBe('Focus');
    expect(obtener.body.color).toBe('Azul');
  });

  it.todo('POST /vehiculo - rechazar placas duplicadas (pendiente de validar comportamiento actual del API)');

  it('DELETE /vehiculo/:placa - debe eliminar vehículo y devolver 404 luego en consulta', async () => {
    const placa = `ADMDE${String(Date.now()).slice(-8)}`;
    const dto = buildVehiculoDto(placa);

    await request(app.getHttpServer()).post('/vehiculo').send(dto).expect(201);

    await request(app.getHttpServer()).delete(`/vehiculo/${placa}`).expect(200);

    await request(app.getHttpServer()).get(`/vehiculo/${placa}`).expect(404);
  });

  it.todo('DELETE /vehiculo/:placa - impedir eliminación si tiene registros de entrada/salida activos');
  it.todo('Mensajes de éxito y error en la interfaz administrativa (capa frontend)');
});