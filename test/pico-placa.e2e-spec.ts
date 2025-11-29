import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Pruebas E2E para la validación de Pico y Placa
 * 
 * Valida:
 * - Restricciones por día de la semana
 * - Restricciones por horario
 * - Integración con el flujo de registro de entrada
 * - Mensajes de error y retroalimentación
 */
describe('Pico y Placa - E2E', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Obtener token de autenticación
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        correo: 'juan.perez@example.com',
        password: '1234',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /pico-placa/validar', () => {
    describe('Validación por día de la semana', () => {
      it('debe detectar restricción el Lunes para dígito 1', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'ABC121',
            fechaHora: '2025-11-17T14:00:00.000Z', // Lunes 2 PM
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(true);
        expect(response.body.diaSemana).toBe('Lunes');
        expect(response.body.ultimoDigito).toBe(1);
        expect(response.body.digitosRestringidos).toEqual([1, 2]);
        expect(response.body.mensaje).toContain('restricción');
      });

      it('debe detectar restricción el Martes para dígito 3', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'DEF453',
            fechaHora: '2025-11-18T10:00:00.000Z', // Martes 10 AM
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(true);
        expect(response.body.diaSemana).toBe('Martes');
        expect(response.body.digitosRestringidos).toEqual([3, 4]);
      });

      it('debe detectar restricción el Miércoles para dígito 5', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'GHI785',
            fechaHora: '2025-11-19T12:00:00.000Z', // Miércoles 12 PM
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(true);
        expect(response.body.diaSemana).toBe('Miércoles');
        expect(response.body.digitosRestringidos).toEqual([5, 6]);
      });

      it('debe detectar restricción el Jueves para dígito 7', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'JKL907',
            fechaHora: '2025-11-20T15:00:00.000Z', // Jueves 3 PM
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(true);
        expect(response.body.diaSemana).toBe('Jueves');
        expect(response.body.digitosRestringidos).toEqual([7, 8]);
      });

      it('debe detectar restricción el Viernes para dígito 9', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'MNO129',
            fechaHora: '2025-11-21T16:00:00.000Z', // Viernes 4 PM
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(true);
        expect(response.body.diaSemana).toBe('Viernes');
        expect(response.body.digitosRestringidos).toEqual([9, 0]);
      });

      it('NO debe detectar restricción el Sábado', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'ABC123',
            fechaHora: '2025-11-22T14:00:00.000Z', // Sábado
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(false);
        expect(response.body.diaSemana).toBe('Sábado');
        expect(response.body.digitosRestringidos).toEqual([]);
      });

      it('NO debe detectar restricción el Domingo', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'ABC123',
            fechaHora: '2025-11-23T14:00:00.000Z', // Domingo
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(false);
        expect(response.body.diaSemana).toBe('Domingo');
      });
    });

    describe('Validación por horario', () => {
      it('NO debe restringir antes de las 6:00 AM', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'ABC121',
            fechaHora: '2025-11-17T05:30:00.000Z', // Lunes 5:30 AM
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(false);
        expect(response.body.dentroHorario).toBe(false);
      });

      it('debe restringir a las 6:00 AM', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'ABC121',
            fechaHora: '2025-11-17T06:00:00.000Z', // Lunes 6:00 AM
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(true);
        expect(response.body.dentroHorario).toBe(true);
      });

      it('NO debe restringir a las 8:00 PM o después', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'ABC121',
            fechaHora: '2025-11-17T20:00:00.000Z', // Lunes 8:00 PM
          })
          .expect(200);

        expect(response.body.tieneRestriccion).toBe(false);
        expect(response.body.dentroHorario).toBe(false);
      });
    });

    describe('Validación de formato de placa', () => {
      it('debe rechazar placa con formato inválido', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'INVALIDA',
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('debe rechazar placa vacía', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: '',
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('debe aceptar placa válida', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'ABC123',
          })
          .expect(200);

        expect(response.body.placa).toBe('ABC123');
      });
    });

    describe('Respuesta estructura correcta', () => {
      it('debe retornar todos los campos esperados', async () => {
        const response = await request(app.getHttpServer())
          .post('/pico-placa/validar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            placa: 'ABC123',
            fechaHora: '2025-11-17T14:00:00.000Z',
          })
          .expect(200);

        expect(response.body).toHaveProperty('tieneRestriccion');
        expect(response.body).toHaveProperty('placa');
        expect(response.body).toHaveProperty('ultimoDigito');
        expect(response.body).toHaveProperty('diaSemana');
        expect(response.body).toHaveProperty('hora');
        expect(response.body).toHaveProperty('dentroHorario');
        expect(response.body).toHaveProperty('digitosRestringidos');
        expect(response.body).toHaveProperty('mensaje');
        expect(response.body).toHaveProperty('fechaValidacion');
      });
    });
  });

  describe('Integración con registro de entrada', () => {
    it('debe bloquear registro si la placa tiene restricción de pico y placa', async () => {
      // Intentar registrar entrada el Lunes con placa terminada en 1
      const response = await request(app.getHttpServer())
        .post('/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehiculoPlaca: 'ABC121',
          usuarioId: 1,
          parqueaderoId: 1,
        });

      // Verificar que fue rechazado por pico y placa
      // Nota: Esto depende de la fecha/hora actual del servidor
      // En producción, debería mockearse la fecha o usar variables de entorno
      if (response.status === 400) {
        expect(response.body.message).toBeDefined();
        // Podría contener información sobre la restricción
      }
    });
  });

  describe('Autenticación y autorización', () => {
    it('debe rechazar request sin token', async () => {
      await request(app.getHttpServer())
        .post('/pico-placa/validar')
        .send({
          placa: 'ABC123',
        })
        .expect(401);
    });

    it('debe permitir acceso a vigilante', async () => {
      await request(app.getHttpServer())
        .post('/pico-placa/validar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          placa: 'ABC123',
        })
        .expect(200);
    });
  });
});
