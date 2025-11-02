import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Pruebas E2E para Consultar disponibilidad de cupos en parqueaderos
 *
 * Criterio: Consultar disponibilidad de cupos
 * - Debe listar parqueaderos con campos de capacidad y cupos disponibles
 * - Los cupos disponibles deben estar entre 0 y su capacidad correspondiente
 */

describe('Parqueadero - Disponibilidad de cupos (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let guardiaId: number;
  const ensureVehiculo = async (placa: string) => {
    const exists = await request(app.getHttpServer()).get(`/vehiculo/${placa}`);
    if (exists.status !== 200) {
      await request(app.getHttpServer())
        .post('/vehiculo')
        .send({
          placa,
          tipo: 'CARRO',
          marca: 'Toyota',
          modelo: 'Corolla',
          color: 'Rojo',
          fechaCaducidad: '2099-12-31T23:59:59Z',
          conductorCodigo: '0000028932',
        })
        .expect(201);
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Seed: crear un parqueadero si no existe ninguno
    const list = await request(app.getHttpServer()).get('/parqueadero').expect(200);
    if (!Array.isArray(list.body) || list.body.length === 0) {
      await request(app.getHttpServer())
        .post('/parqueadero')
        .send({
          nombre: 'Parqueadero Central',
          direccion: 'Cra 23 #26-10',
          capacidadCarros: 10,
          capacidadMotos: 10,
          cuposDisponiblesCarros: 10,
          cuposDisponiblesMotos: 10,
        })
        .expect(201);
    }

    // Login como guardia para pruebas que requieren autorización
    // Registrar usuario de prueba (idempotente: si existe, continuar)
    const registroUsuario = await request(app.getHttpServer())
      .post('/usuario/register')
      .send({
        nombre: 'Guardia E2E',
        cedula: 'E2E-999999',
        correo: 'e2e.guard@example.com',
        contraseña: 'secr3t0',
      });
    if (![201, 400].includes(registroUsuario.status)) {
      throw new Error(`Fallo al registrar usuario de prueba: status ${registroUsuario.status}`);
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correo: 'e2e.guard@example.com',
        contraseña: 'secr3t0',
      })
      .expect(201);
    authToken = loginResponse.body.access_token;
    guardiaId = loginResponse.body.user.id;

    // Asegurar vehículos necesarios para las pruebas
    await ensureVehiculo('PQR678');
    await ensureVehiculo('ABC123');
    await ensureVehiculo('DEF456');
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('GET /parqueadero - debe mostrar capacidades y cupos disponibles válidos', async () => {
    console.info('[E2E Disponibilidad] Caso: listar parqueaderos con campos y rangos válidos');
    const res = await request(app.getHttpServer())
      .get('/parqueadero')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    console.info('[E2E Disponibilidad] Total parqueaderos encontrados:', res.body.length);

    for (const p of res.body) {
      expect(p).toHaveProperty('capacidadCarros');
      expect(p).toHaveProperty('capacidadMotos');
      expect(p).toHaveProperty('cuposDisponiblesCarros');
      expect(p).toHaveProperty('cuposDisponiblesMotos');

      expect(typeof p.capacidadCarros).toBe('number');
      expect(typeof p.capacidadMotos).toBe('number');
      expect(typeof p.cuposDisponiblesCarros).toBe('number');
      expect(typeof p.cuposDisponiblesMotos).toBe('number');

      expect(p.cuposDisponiblesCarros).toBeGreaterThanOrEqual(0);
      expect(p.cuposDisponiblesMotos).toBeGreaterThanOrEqual(0);
      expect(p.cuposDisponiblesCarros).toBeLessThanOrEqual(p.capacidadCarros);
      expect(p.cuposDisponiblesMotos).toBeLessThanOrEqual(p.capacidadMotos);
    }
  });

  it('GET /parqueadero/:id - debe devolver parqueadero con campos de disponibilidad', async () => {
    console.info('[E2E Disponibilidad] Caso: detalle de parqueadero con campos y rangos válidos');
    // Tomar el primero de la lista
    const list = await request(app.getHttpServer())
      .get('/parqueadero')
      .expect(200);

    const primero = list.body[0];
    const id = primero.id;
    console.info('[E2E Disponibilidad] Consultando parqueadero id:', id);

    const res = await request(app.getHttpServer())
      .get(`/parqueadero/${id}`)
      .expect(200);

    const p = res.body;
    expect(p.id).toBe(id);
    expect(p).toHaveProperty('capacidadCarros');
    expect(p).toHaveProperty('capacidadMotos');
    expect(p).toHaveProperty('cuposDisponiblesCarros');
    expect(p).toHaveProperty('cuposDisponiblesMotos');

    expect(p.cuposDisponiblesCarros).toBeGreaterThanOrEqual(0);
    expect(p.cuposDisponiblesMotos).toBeGreaterThanOrEqual(0);
    expect(p.cuposDisponiblesCarros).toBeLessThanOrEqual(p.capacidadCarros);
    expect(p.cuposDisponiblesMotos).toBeLessThanOrEqual(p.capacidadMotos);
  });

  it('POST /registro - debe decrementar cupos disponibles (parqueadero nuevo)', async () => {
    console.info('[E2E Disponibilidad] Caso: decrementar cupos tras entrada en parqueadero nuevo');
    // Crear parqueadero nuevo para aislamiento
    const nombreDecremento = `Parqueadero Prueba Decremento ${Date.now()}`;
    const crear = await request(app.getHttpServer())
      .post('/parqueadero')
      .send({
        nombre: nombreDecremento,
        direccion: 'Test 123',
        capacidadCarros: 3,
        capacidadMotos: 3,
        cuposDisponiblesCarros: 3,
        cuposDisponiblesMotos: 3,
      })
      .expect(201);
    const id = crear.body.id;
    console.info('[E2E Disponibilidad] Parqueadero creado id:', id);

    // Estado inicial
    const antes = await request(app.getHttpServer())
      .get(`/parqueadero/${id}`)
      .expect(200);
    const cuposAntes = antes.body.cuposDisponiblesCarros;
    console.info('[E2E Disponibilidad] Cupos disponibles carros (antes):', cuposAntes);

    // Registrar entrada de carro
    const registro = await request(app.getHttpServer())
      .post('/registro')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vehiculoPlaca: 'PQR678',
        usuarioId: guardiaId,
        parqueaderoId: id,
      })
      .expect(201);
    console.info('[E2E Disponibilidad] Registro de entrada creado id:', registro.body.id);

    // Verificar decremento
    const despues = await request(app.getHttpServer())
      .get(`/parqueadero/${id}`)
      .expect(200);
    expect(despues.body.cuposDisponiblesCarros).toBe(cuposAntes - 1);
    console.info('[E2E Disponibilidad] Cupos disponibles carros (después):', despues.body.cuposDisponiblesCarros);

    // Limpiar
    await request(app.getHttpServer())
      .patch(`/registro/${registro.body.id}/salida`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ usuarioId: guardiaId })
      .expect(200);
    console.info('[E2E Disponibilidad] Salida registrada para id:', registro.body.id);
  });

  it('POST /registro - debe rechazar entrada si no hay cupos disponibles para carros', async () => {
    console.info('[E2E Disponibilidad] Caso: rechazar entrada de carro sin cupos disponibles');
    // Crear parqueadero con 1 cupo de carros
    const nombreSinCupo = `Parqueadero Sin Cupos Carros ${Date.now()}`;
    const crear = await request(app.getHttpServer())
      .post('/parqueadero')
      .send({
        nombre: nombreSinCupo,
        direccion: 'Test 456',
        capacidadCarros: 1,
        capacidadMotos: 5,
        cuposDisponiblesCarros: 1,
        cuposDisponiblesMotos: 5,
      })
      .expect(201);
    const id = crear.body.id;
    console.info('[E2E Disponibilidad] Parqueadero creado id:', id);

    // Placas únicas para evitar conflictos con registros activos previos
    const suffix = Date.now();
    const placa1 = `CAR${suffix}`;
    const placa2 = `CAR${suffix + 1}`;
    await ensureVehiculo(placa1);
    await ensureVehiculo(placa2);

    // Ocupa el único cupo con un carro
    await request(app.getHttpServer())
      .post('/registro')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vehiculoPlaca: placa1,
        usuarioId: guardiaId,
        parqueaderoId: id,
      })
      .expect(201);
    console.info('[E2E Disponibilidad] Primer registro de entrada OK para placa', placa1);

    // Segundo intento con otro carro debe fallar por falta de cupo
    const segundo = await request(app.getHttpServer())
      .post('/registro')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        vehiculoPlaca: placa2,
        usuarioId: guardiaId,
        parqueaderoId: id,
      })
      .expect(400);
    expect(segundo.body.message).toContain('No hay cupos disponibles para carros en el parqueadero');
    console.info('[E2E Disponibilidad] Segundo registro rechazado (status):', segundo.status);
  });
});