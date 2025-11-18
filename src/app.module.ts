import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { VehiculoModule } from './vehiculo/vehiculo.module';
import { ParqueaderoModule } from './parqueadero/parqueadero.module';
import { ConductorModule } from './conductor/conductor.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { RegistroModule } from './registro/registro.module';
import { PicoPlacaModule } from './pico-placa/pico-placa.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsuarioModule,
    VehiculoModule,
    ParqueaderoModule,
    ConductorModule,
    RegistroModule,
    PicoPlacaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
