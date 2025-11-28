import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Visitante Module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let vigilanteToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configurar ValidationPipe igual que en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Obtener token de autenticación ADMIN (superusuario existente)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correo: 'superusuario@ucaldas.edu.co',
        contrasena: 'admin1234',
      });

    authToken = loginResponse.body.access_token;

    // Obtener token de vigilante (juan.perez con contraseña '1234')
    const vigilanteResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correo: 'juan.perez@example.com',
        contrasena: '1234',
      });

    vigilanteToken = vigilanteResponse.body.access_token;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (dataSource) {
      await dataSource.query(
        `DELETE FROM registros WHERE "vehiculoPlaca" LIKE 'TEST%'`,
      );
      await dataSource.query(`DELETE FROM vehiculos WHERE placa LIKE 'TEST%'`);
      await dataSource.query(
        `DELETE FROM visitantes_conductores WHERE cedula LIKE '9999%'`,
      );
    }
    await app.close();
  });

  describe('/visitantes/registrar (POST)', () => {
    const registroDto = {
      conductor: {
        cedula: '9999999999',
        nombre: 'Pedro',
        apellido: 'González',
        telefono: '3201112222',
      },
      placa: 'TEST01',
      tipoVehiculo: 'CARRO',
      marca: 'Ford',
      modelo: 'Fiesta',
      color: 'Azul',
      fechaCaducidad: '2025-12-31T23:59:59.000Z',
      motivoVisita: 'Prueba E2E',
      parqueaderoId: 1,
    };

    it('debe registrar un nuevo visitante completo con VIGILANTE', () => {
      return request(app.getHttpServer())
        .post('/visitantes/registrar')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send(registroDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.vehiculoPlaca).toBe('TEST01');
          expect(res.body.motivoVisita).toBe('Prueba E2E');
          expect(res.body.estado).toBe('ACTIVO');
        });
    });

    it('debe rechazar fecha de caducidad vencida', () => {
      const dtoFechaVencida = {
        ...registroDto,
        conductor: {
          ...registroDto.conductor,
          cedula: '9999999998',
        },
        placa: 'TEST02',
        fechaCaducidad: '2020-01-01T00:00:00.000Z',
      };

      return request(app.getHttpServer())
        .post('/visitantes/registrar')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send(dtoFechaVencida)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('caducidad');
        });
    });

    it('debe rechazar parqueadero inexistente', () => {
      const dtoParqueaderoInvalido = {
        ...registroDto,
        conductor: {
          ...registroDto.conductor,
          cedula: '9999999997',
        },
        placa: 'TEST03',
        parqueaderoId: 99999,
      };

      return request(app.getHttpServer())
        .post('/visitantes/registrar')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send(dtoParqueaderoInvalido)
        .expect(404);
    });

    it('debe rechazar cuando el vehículo ya tiene registro activo', async () => {
      // Usar la placa del primer test que ya tiene registro activo
      const dtoDuplicado = {
        ...registroDto,
        conductor: {
          ...registroDto.conductor,
          cedula: '9999999996',
        },
        placa: 'TEST01', // Placa que ya tiene registro activo
      };

      return request(app.getHttpServer())
        .post('/visitantes/registrar')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send(dtoDuplicado)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('registro de entrada activo');
        });
    });

    it('debe validar campos requeridos', () => {
      const dtoIncompleto = {
        conductor: {
          cedula: '9999999995',
          nombre: 'Test',
          // Falta apellido, telefono
        },
        placa: 'TEST04',
        tipoVehiculo: 'CARRO',
        // Falta motivoVisita
      };

      return request(app.getHttpServer())
        .post('/visitantes/registrar')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send(dtoIncompleto)
        .expect(400);
    });

    it('debe validar formato de placa', () => {
      const dtoPlacaInvalida = {
        ...registroDto,
        conductor: {
          ...registroDto.conductor,
          cedula: '9999999994',
        },
        placa: 'abc-123', // Minúsculas y guiones no permitidos
      };

      return request(app.getHttpServer())
        .post('/visitantes/registrar')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send(dtoPlacaInvalida)
        .expect(400);
    });

    it('debe rechazar sin autenticación', () => {
      return request(app.getHttpServer())
        .post('/visitantes/registrar')
        .send(registroDto)
        .expect(401);
    });

    it('debe actualizar visitante existente y crear nuevo vehículo', async () => {
      const dtoNuevoVehiculo = {
        ...registroDto,
        placa: 'TEST05', // Nueva placa
        // Misma cédula de visitante que ya existe
      };

      // Primero registrar salida del vehículo TEST01
      await dataSource.query(
        `UPDATE registros SET "horaSalida" = NOW(), estado = 'INACTIVO' WHERE "vehiculoPlaca" = 'TEST01'`,
      );

      return request(app.getHttpServer())
        .post('/visitantes/registrar')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send(dtoNuevoVehiculo)
        .expect(201)
        .expect((res) => {
          expect(res.body.vehiculoPlaca).toBe('TEST05');
          expect(res.body.motivoVisita).toBe('Prueba E2E');
        });
    });
  });

  describe('/visitantes (GET)', () => {
    it('debe listar todos los visitantes con ADMIN', () => {
      return request(app.getHttpServer())
        .get('/visitantes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('cedula');
          expect(res.body[0]).toHaveProperty('nombre');
          expect(res.body[0]).toHaveProperty('apellido');
        });
    });

    it('debe rechazar VIGILANTE para listar todos', () => {
      return request(app.getHttpServer())
        .get('/visitantes')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .expect(403);
    });
  });

  describe('/visitantes/:cedula (GET)', () => {
    it('debe buscar visitante por cédula con VIGILANTE', () => {
      return request(app.getHttpServer())
        .get('/visitantes/9999999999')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.cedula).toBe('9999999999');
          expect(res.body.nombre).toBe('Pedro');
          expect(res.body.apellido).toBe('González');
        });
    });

    it('debe retornar 404 para cédula inexistente', () => {
      return request(app.getHttpServer())
        .get('/visitantes/0000000000')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .expect(404);
    });
  });

  describe('/visitantes (POST)', () => {
    it('debe crear o actualizar visitante con ADMIN', () => {
      const visitanteDto = {
        cedula: '9999999993',
        nombre: 'María',
        apellido: 'López',
        telefono: '3009998877',
        motivoVisita: 'Visita de control',
      };

      return request(app.getHttpServer())
        .post('/visitantes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(visitanteDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.cedula).toBe('9999999993');
          expect(res.body.nombre).toBe('María');
        });
    });

    it('debe actualizar visitante existente', () => {
      const visitanteActualizado = {
        cedula: '9999999993',
        nombre: 'María Actualizada',
        apellido: 'López Actualizada',
        telefono: '3001111111',
        motivoVisita: 'Motivo actualizado',
      };

      return request(app.getHttpServer())
        .post('/visitantes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(visitanteActualizado)
        .expect(201)
        .expect((res) => {
          expect(res.body.nombre).toBe('María Actualizada');
          expect(res.body.telefono).toBe('3001111111');
        });
    });

    it('debe rechazar VIGILANTE para crear visitante', () => {
      return request(app.getHttpServer())
        .post('/visitantes')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send({
          cedula: '9999999992',
          nombre: 'Test',
          apellido: 'Test',
          telefono: '3001111111',
          motivoVisita: 'Test',
        })
        .expect(403);
    });
  });

  describe('/visitantes/:cedula (DELETE)', () => {
    it('debe eliminar visitante con ADMIN', async () => {
      // Primero crear un visitante para eliminar
      const createResponse = await request(app.getHttpServer())
        .post('/visitantes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cedula: '9999999991',
          nombre: 'Para Eliminar',
          apellido: 'Test',
          telefono: '3001111111',
          motivoVisita: 'Test eliminación',
        });

      expect(createResponse.status).toBe(201);

      const deleteResponse = await request(app.getHttpServer())
        .delete('/visitantes/9999999991')
        .set('Authorization', `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);
    });

    it('debe retornar 404 al eliminar cédula inexistente', () => {
      return request(app.getHttpServer())
        .delete('/visitantes/0000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('debe rechazar VIGILANTE para eliminar', () => {
      return request(app.getHttpServer())
        .delete('/visitantes/9999999993')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .expect(403);
    });
  });

  describe('Validaciones de Pico y Placa', () => {
    it('debe rechazar por restricción de pico y placa', async () => {
      // Este test depende del día y configuración de pico y placa
      // Usar una placa que termine en número restringido según el día actual
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Domingo, 1=Lunes, etc.
      
      // Determinar último dígito restringido según día
      const restrictedDigits = {
        1: ['1', '2'], // Lunes
        2: ['3', '4'], // Martes
        3: ['5', '6'], // Miércoles
        4: ['7', '8'], // Jueves
        5: ['9', '0'], // Viernes
      };

      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const digit = restrictedDigits[dayOfWeek][0];
        const placaRestringida = `TEST0${digit}`;

        const dtoRestringido = {
          conductor: {
            cedula: '9999999990',
            nombre: 'Test',
            apellido: 'Pico Placa',
            telefono: '3001111111',
          },
          placa: placaRestringida,
          tipoVehiculo: 'CARRO',
          marca: 'Test',
          modelo: 'Test',
          color: 'Test',
          fechaCaducidad: '2025-12-31T23:59:59.000Z',
          motivoVisita: 'Test pico y placa',
          parqueaderoId: 1,
        };

        return request(app.getHttpServer())
          .post('/visitantes/registrar')
          .set('Authorization', `Bearer ${vigilanteToken}`)
          .send(dtoRestringido)
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('pico y placa');
          });
      }
    });
  });

  describe('Integración completa: Registro de visitante con vehículo', () => {
    it('debe completar flujo completo de registro', async () => {
      // Limpiar registros de pruebas anteriores para evitar problema de cupos
      await dataSource.query(`UPDATE registros SET estado = 'INACTIVO', "horaSalida" = NOW() WHERE estado = 'ACTIVO' AND "vehiculoPlaca" LIKE 'TEST%'`);
      await dataSource.query(`UPDATE parqueaderos SET "cuposDisponiblesCarros" = "capacidadCarros", "cuposDisponiblesMotos" = "capacidadMotos" WHERE id = 1`);
      
      const cedula = '9999888777';
      const placa = 'TEST99';

      // 1. Registrar entrada del visitante con vehículo
      const registroResponse = await request(app.getHttpServer())
        .post('/visitantes/registrar')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send({
          conductor: {
            cedula: cedula,
            nombre: 'Flujo',
            apellido: 'Completo',
            telefono: '3001234567',
          },
          placa: placa,
          tipoVehiculo: 'CARRO',
          marca: 'Toyota',
          modelo: 'Corolla',
          color: 'Rojo',
          fechaCaducidad: '2025-12-31T23:59:59.000Z',
          motivoVisita: 'Test integración',
          parqueaderoId: 1,
        });

      expect(registroResponse.status).toBe(201);
      const registroId = registroResponse.body.id;

      // 2. Verificar que el visitante fue creado
      const visitanteResponse = await request(app.getHttpServer())
        .get(`/visitantes/${cedula}`)
        .set('Authorization', `Bearer ${vigilanteToken}`);

      expect(visitanteResponse.status).toBe(200);
      expect(visitanteResponse.body.nombre).toBe('Flujo');

      // 3. Verificar que el vehículo fue creado correctamente
      const vehiculoResponse = await request(app.getHttpServer())
        .get(`/vehiculo/${placa}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(vehiculoResponse.status).toBe(200);
      expect(vehiculoResponse.body.placa).toBe(placa);
      // Verificar que el vehículo existe y está asociado al visitante
      expect(vehiculoResponse.body.tipo_propietario || vehiculoResponse.body.tipoPropietario).toBe('VISITANTE');
      expect(vehiculoResponse.body.propietario_id || vehiculoResponse.body.propietarioId).toBe(cedula);

      // 4. Registrar salida
      const salidaResponse = await request(app.getHttpServer())
        .patch(`/registro/${registroId}/salida`)
        .set('Authorization', `Bearer ${vigilanteToken}`);

      if (salidaResponse.status !== 200) {
        console.log('Error en salida:', salidaResponse.status, salidaResponse.body);
      }
      expect(salidaResponse.status).toBe(200);
      expect(salidaResponse.body.horaSalida).toBeTruthy();

      // 5. Verificar que puede volver a ingresar
      const nuevoRegistro = await request(app.getHttpServer())
        .post('/visitantes/registrar')
        .set('Authorization', `Bearer ${vigilanteToken}`)
        .send({
          conductor: {
            cedula: cedula,
            nombre: 'Flujo',
            apellido: 'Completo',
            telefono: '3001234567',
          },
          placa: placa,
          tipoVehiculo: 'CARRO',
          fechaCaducidad: '2025-12-31T23:59:59.000Z',
          motivoVisita: 'Segunda visita',
          parqueaderoId: 1,
        });

      expect(nuevoRegistro.status).toBe(201);
      expect(nuevoRegistro.body.motivo_visita || nuevoRegistro.body.motivoVisita).toBe('Segunda visita');
    });
  });
});
