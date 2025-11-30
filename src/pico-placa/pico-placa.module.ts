import { Module } from '@nestjs/common';
import { PicoPlacaService } from './pico-placa.service';
import { PicoPlacaController } from './pico-placa.controller';

@Module({
  controllers: [PicoPlacaController],
  providers: [PicoPlacaService],
  exports: [PicoPlacaService],
})
export class PicoPlacaModule {}
