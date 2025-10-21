import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParqueaderoService } from './parqueadero.service';
import { ParqueaderoController } from './parqueadero.controller';
import { Parqueadero } from './entities/parqueadero.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Parqueadero])],
  controllers: [ParqueaderoController],
  providers: [ParqueaderoService],
  exports: [ParqueaderoService],
})
export class ParqueaderoModule {}
