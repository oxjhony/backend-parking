import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroService } from './registro.service';
import { RegistroController } from './registro.controller';
import { ReporteController } from './reporte.controller';
import { ReporteService } from './reporte.service';
import { Registro } from './entities/registro.entity';
import { VehiculoModule } from '../vehiculo/vehiculo.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { ParqueaderoModule } from '../parqueadero/parqueadero.module';
import { PicoPlacaModule } from '../pico-placa/pico-placa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registro]),
    VehiculoModule,
    UsuarioModule,
    ParqueaderoModule,
    PicoPlacaModule,
  ],
  controllers: [RegistroController, ReporteController],
  providers: [RegistroService, ReporteService],
  exports: [RegistroService, ReporteService],
})
export class RegistroModule {}
