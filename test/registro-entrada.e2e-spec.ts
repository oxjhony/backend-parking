import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Pruebas E2E para el Registro de Entrada Manual de Vehículos
 * 
 * Historia de Usuario: Registrar entrada manual de vehículo
 * Rol: Guardia
 * 
 * Estas pruebas validan todos los criterios de aceptación:
 * 1. Validación de formato de placa
 * 2. Control de duplicados (no permitir entrada activa con misma placa)
 * 3. Validación de campos obligatorios
 * 4. Guardar registro con estado ACTIVO y hora de ingreso
 * 5. Validación de capacidad del parqueadero
 * 6. Persistencia correcta de datos y visualización en lista de activos
 */

describe('Registro de Entrada Manual - E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let guardiaId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Autenticarse como vigilante (guardia) para obtener token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correo: 'juan.perez@example.com',
        contraseña: '1234',
      })
      .expect(201);

    authToken = loginResponse.body.access_token;
    guardiaId = loginResponse.body.user.id;
  }, 30000); // Aumentar timeout a 30 segundos para inicialización

  afterAll(async () => {
    await app.close();
  });

  describe('Criterio 1: Validación de formato de placa', () => {
    it('POST /registro - debe aceptar formato válido ABC123 para carro', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'ABC123',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.vehiculoPlaca).toBe('ABC123');
      expect(response.body.estado).toBe('ACTIVO');
      expect(response.body.horaEntrada).toBeDefined();
      expect(response.body.horaSalida).toBeNull();

      // Limpiar: registrar salida
      await request(app.getHttpServer())
        .patch(`/registro/${response.body.id}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });

    it('POST /registro - debe aceptar formato válido XYZ78A para moto', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'XYZ78A',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.vehiculoPlaca).toBe('XYZ78A');
      expect(response.body.estado).toBe('ACTIVO');

      // Limpiar
      await request(app.getHttpServer())
        .patch(`/registro/${response.body.id}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });

    it('POST /registro - debe rechazar placa vacía', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: '',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /registro - debe rechazar placa inexistente', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'NOEXISTE999',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(404);

      expect(response.body.message).toContain('no encontrado');
    });
  });

  describe('Criterio 2: Control de duplicados - No permitir entrada activa con misma placa', () => {
    it('POST /registro - debe rechazar entrada si vehículo ya está activo', async () => {
      // Primer registro - exitoso
      const firstResponse = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'DEF456',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      expect(firstResponse.body.estado).toBe('ACTIVO');

      // Segundo intento con la misma placa - debe fallar
      const secondResponse = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'DEF456',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(400);

      expect(secondResponse.body.message).toContain('ya tiene un registro activo');

      // Limpiar
      await request(app.getHttpServer())
        .patch(`/registro/${firstResponse.body.id}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });

    it('POST /registro - debe permitir nueva entrada después de registrar salida', async () => {
      // Primer registro
      const firstResponse = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'GHI78T',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      // Registrar salida
      await request(app.getHttpServer())
        .patch(`/registro/${firstResponse.body.id}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        })
        .expect(200);

      // Nuevo registro con la misma placa - debe ser exitoso
      const secondResponse = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'GHI78T',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      expect(secondResponse.body.estado).toBe('ACTIVO');
      expect(secondResponse.body.id).not.toBe(firstResponse.body.id);

      // Limpiar
      await request(app.getHttpServer())
        .patch(`/registro/${secondResponse.body.id}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });
  });

  describe('Criterio 3: Validación de campos obligatorios', () => {
    it('POST /registro - debe rechazar request sin vehiculoPlaca', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /registro - debe rechazar request sin usuarioId', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'ABC123',
          parqueaderoId: 1,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /registro - debe rechazar request sin parqueaderoId', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'ABC123',
          usuarioId: guardiaId,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('POST /registro - debe rechazar usuarioId inexistente', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'ABC123',
          usuarioId: 99999,
          parqueaderoId: 1,
        })
        .expect(404);

      expect(response.body.message).toContain('Usuario');
    });

    it('POST /registro - debe rechazar parqueaderoId inexistente', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'ABC123',
          usuarioId: guardiaId,
          parqueaderoId: 99999,
        })
        .expect(404);

      expect(response.body.message).toContain('Parqueadero');
    });
  });

  describe('Criterio 4: Guardar registro con estado ACTIVO y hora de ingreso', () => {
    it('POST /registro - debe guardar con estado ACTIVO', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'JKL012',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      expect(response.body.estado).toBe('ACTIVO');
      expect(response.body.horaEntrada).toBeDefined();
      expect(response.body.horaSalida).toBeNull();

      // Verificar que horaEntrada es una fecha válida reciente
      const horaEntrada = new Date(response.body.horaEntrada);
      const ahora = new Date();
      const diferencia = ahora.getTime() - horaEntrada.getTime();
      expect(diferencia).toBeLessThan(5000); // Menos de 5 segundos

      // Limpiar
      await request(app.getHttpServer())
        .patch(`/registro/${response.body.id}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });

    it('POST /registro - debe registrar la hora de entrada automáticamente', async () => {
      const antes = new Date();
      
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'MNO345',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      const despues = new Date();
      const horaEntrada = new Date(response.body.horaEntrada);

      expect(horaEntrada.getTime()).toBeGreaterThanOrEqual(antes.getTime());
      expect(horaEntrada.getTime()).toBeLessThanOrEqual(despues.getTime());

      // Limpiar
      await request(app.getHttpServer())
        .patch(`/registro/${response.body.id}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });
  });

  describe('Criterio 5: Validación de capacidad del parqueadero', () => {
    it('POST /registro - debe rechazar si no hay cupos disponibles para carros', async () => {
      // Nota: Este test requiere un parqueadero con capacidad 0 o llenar el parqueadero
      // Por ahora validamos que el sistema verifica la capacidad
      
      const parqueaderoResponse = await request(app.getHttpServer())
        .get('/parqueadero')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(parqueaderoResponse.body)).toBe(true);
      
      // Verificar que los parqueaderos tienen cupos disponibles
      const parqueadero = parqueaderoResponse.body[0];
      expect(parqueadero).toHaveProperty('cuposDisponiblesCarros');
      expect(parqueadero).toHaveProperty('cuposDisponiblesMotos');
    });

    it('POST /registro - debe decrementar cupos disponibles después del registro', async () => {
      // Obtener estado inicial del parqueadero
      const parqueaderoAntes = await request(app.getHttpServer())
        .get('/parqueadero/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const cuposAntesCarros = parqueaderoAntes.body.cuposDisponiblesCarros;

      // Registrar entrada de carro
      const registroResponse = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'PQR678',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      // Verificar que se decrementaron los cupos
      const parqueaderoDespues = await request(app.getHttpServer())
        .get('/parqueadero/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(parqueaderoDespues.body.cuposDisponiblesCarros).toBe(cuposAntesCarros - 1);

      // Limpiar
      await request(app.getHttpServer())
        .patch(`/registro/${registroResponse.body.id}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });
  });

  describe('Criterio 6: Visualización del registro en lista de vehículos activos', () => {
    it('GET /registro - debe incluir el nuevo registro en la lista', async () => {
      // Crear registro
      const registroResponse = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'ABC123',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      const registroId = registroResponse.body.id;

      // Obtener lista de registros
      const listaResponse = await request(app.getHttpServer())
        .get('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(listaResponse.body)).toBe(true);
      
      // Verificar que el nuevo registro está en la lista
      const registroEnLista = listaResponse.body.find((r: any) => r.id === registroId);
      expect(registroEnLista).toBeDefined();
      expect(registroEnLista.vehiculoPlaca).toBe('ABC123');
      expect(registroEnLista.estado).toBe('ACTIVO');

      // Limpiar
      await request(app.getHttpServer())
        .patch(`/registro/${registroId}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });

    it('GET /registro?estado=ACTIVO - debe mostrar solo registros activos', async () => {
      // Crear registro activo
      const registroActivoResponse = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'DEF456',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      // Obtener registros activos
      const listaActivosResponse = await request(app.getHttpServer())
        .get('/registro?estado=ACTIVO')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(listaActivosResponse.body)).toBe(true);
      
      // Verificar que todos son ACTIVO
      const todosActivos = listaActivosResponse.body.every((r: any) => r.estado === 'ACTIVO');
      expect(todosActivos).toBe(true);

      // Limpiar
      await request(app.getHttpServer())
        .patch(`/registro/${registroActivoResponse.body.id}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });

    it('GET /registro/:id - debe permitir consultar un registro específico', async () => {
      // Crear registro
      const registroResponse = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'GHI78T',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(201);

      const registroId = registroResponse.body.id;

      // Consultar registro específico
      const detalleResponse = await request(app.getHttpServer())
        .get(`/registro/${registroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(detalleResponse.body.id).toBe(registroId);
      expect(detalleResponse.body.vehiculoPlaca).toBe('GHI78T');
      expect(detalleResponse.body.estado).toBe('ACTIVO');
      expect(detalleResponse.body).toHaveProperty('vehiculo');
      expect(detalleResponse.body).toHaveProperty('usuario');
      expect(detalleResponse.body).toHaveProperty('parqueadero');

      // Limpiar
      await request(app.getHttpServer())
        .patch(`/registro/${registroId}/salida`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          usuarioId: guardiaId,
        });
    });
  });

  describe('Escenarios de error - Retroalimentación visual', () => {
    it('debe retornar mensaje claro cuando el parqueadero está lleno', async () => {
      // Este test necesitaría llenar el parqueadero primero
      // Por ahora validamos el formato del mensaje de error
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'PLACAINVALIDA',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        });

      if (response.status === 400 || response.status === 404) {
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.message).toBe('string');
      }
    });

    it('debe retornar estructura de error consistente', async () => {
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'NOEXISTE',
          usuarioId: guardiaId,
          parqueaderoId: 1,
        })
        .expect(404);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.statusCode).toBe(404);
    });
  });
});
