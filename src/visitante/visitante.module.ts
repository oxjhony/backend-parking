import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitanteController } from './visitante.controller';
import { VisitanteService } from './visitante.service';
import { VisitanteConductor } from './entities/visitante-conductor.entity';
import { Vehiculo } from '../vehiculo/entities/vehiculo.entity';
import { Registro } from '../registro/entities/registro.entity';
import { ParqueaderoModule } from '../parqueadero/parqueadero.module';
import { PicoPlacaModule } from '../pico-placa/pico-placa.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VisitanteConductor, Vehiculo, Registro]),
    ParqueaderoModule,
    PicoPlacaModule,
  ],
  controllers: [VisitanteController],
  providers: [VisitanteService],
  exports: [VisitanteService],
})
export class VisitanteModule {}
