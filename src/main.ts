import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { UsuarioService } from './usuario/usuario.service';
import { RolUsuario } from './usuario/enums/rol-usuario.enum';
import { ConductorService } from './conductor/conductor.service';
import { ParqueaderoService } from './parqueadero/parqueadero.service';
import { VehiculoService } from './vehiculo/vehiculo.service';
import { RegistroService } from './registro/registro.service';
import { TipoVehiculo } from './vehiculo/enums/tipo-vehiculo.enum';
import { TipoPropietario } from './vehiculo/enums/tipo-propietario.enum';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extras
      transform: true, // Transforma los tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos implícitamente
      },
    }),
  );

  // Configuración de CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
    allowedHeaders: 'Content-Type,Authorization,Accept',
  });

  const config = new DocumentBuilder()
    .setTitle('Campus Parking API')
    .setDescription('API del sistema de parqueadero con autenticación JWT')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  try {
    const usuarioService = app.get(UsuarioService);
    const conductorService = app.get(ConductorService);
    const parqueaderoService = app.get(ParqueaderoService);
    const vehiculoService = app.get(VehiculoService);
    const registroService = app.get(RegistroService);

    const today = new Date('2025-11-17T00:00:00Z');
    const todayIso = today.toISOString();

    const ensureUser = async (nombre: string, cedula: string, correo: string, contraseña: string, rol: RolUsuario) => {
      const u = await usuarioService.findByEmail(correo);
      if (!u) {
        await usuarioService.register({ nombre, cedula, correo, contraseña, rol });
      }
      return await usuarioService.findByEmail(correo);
    };

    const admin = await ensureUser('Administrador', '0000000001', process.env.ADMIN_EMAIL || 'admin@parking.local', process.env.ADMIN_PASSWORD || 'Admin!2025', RolUsuario.ADMINISTRADOR);
    const superuser = await ensureUser('Superusuario', '0000000002', 'super@parking.local', 'Super!2025', RolUsuario.SUPERUSUARIO);
    const supervisor = await ensureUser('Supervisor', '0000000003', 'supervisor@parking.local', 'Supervisor!2025', RolUsuario.SUPERVISOR);
    const vigilante = await ensureUser('Vigilante', '0000000004', 'vigilante@parking.local', 'Vigilante!2025', RolUsuario.VIGILANTE);

    const parques = await parqueaderoService.findAll();
    let parque = parques[0];
    if (!parque) {
      parque = await parqueaderoService.create({
        nombre: 'Parqueadero Central',
        direccion: 'Cra 23 #26-10',
        capacidadCarros: 100,
        capacidadMotos: 80,
        cuposDisponiblesCarros: 100,
        cuposDisponiblesMotos: 80,
      });
    }

    const conductores = await conductorService.findAll();
    const ensureConductor = async (codigo: string, nombre: string, apellido: string, correo: string, telefono: string) => {
      if (!conductores.find(c => c.codigo === codigo)) {
        await conductorService.create({ codigo, nombre, apellido, correo, telefono });
      }
    };
    await ensureConductor('INT-0001', 'Ana', 'García', 'ana.garcia@example.com', '3000000001');
    await ensureConductor('EXT-0001', 'Luis', 'Martínez', 'luis.martinez@example.com', '3000000002');

    const vehiculos = await vehiculoService.findAll();
    const ensureVehiculo = async (placa: string, tipo: TipoVehiculo, marca: string, modelo: string, color: string, conductorCodigo: string) => {
      if (!vehiculos.find(v => v.placa === placa)) {
        const tipoPropietario = conductorCodigo && conductorCodigo.startsWith('INT-')
          ? TipoPropietario.INSTITUCIONAL
          : TipoPropietario.VISITANTE;

        await vehiculoService.create({
          placa,
          tipo,
          marca,
          modelo,
          color,
          fechaCaducidad: todayIso,
          tipoPropietario,
          propietarioId: conductorCodigo,
        });
      }
    };
    await ensureVehiculo('ADM-001', TipoVehiculo.CARRO, 'Toyota', 'Corolla', 'Rojo', 'INT-0001');
    await ensureVehiculo('EXT-001', TipoVehiculo.MOTO, 'Yamaha', 'FZ', 'Azul', 'EXT-0001');

    const registrosAdm = await registroService.findByVehiculo('ADM-001');
    if (registrosAdm.length === 0) {
      const r = await registroService.create({ vehiculoPlaca: 'ADM-001', usuarioId: vigilante!.id, parqueaderoId: parque.id });
      await registroService.registrarSalida(r.id, { horaSalida: new Date('2025-11-17T10:00:00Z').toISOString() });
    }

    const registrosExt = await registroService.findByVehiculo('EXT-001');
    if (registrosExt.length === 0) {
      await registroService.create({ vehiculoPlaca: 'EXT-001', usuarioId: supervisor!.id, parqueaderoId: parque.id });
    }
  } catch {}

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);

}
bootstrap();
