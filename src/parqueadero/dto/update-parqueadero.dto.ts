import { PartialType } from '@nestjs/swagger';
import { CreateParqueaderoDto } from './create-parqueadero.dto';

export class UpdateParqueaderoDto extends PartialType(CreateParqueaderoDto) {}
