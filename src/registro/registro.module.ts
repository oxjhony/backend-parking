import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistroService } from './registro.service';
import { RegistroController } from './registro.controller';
import { Registro } from './entities/registro.entity';
import { VehiculoModule } from '../vehiculo/vehiculo.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { ParqueaderoModule } from '../parqueadero/parqueadero.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registro]),
    VehiculoModule,
    UsuarioModule,
    ParqueaderoModule,
  ],
  controllers: [RegistroController],
  providers: [RegistroService],
  exports: [RegistroService],
})
export class RegistroModule {}
