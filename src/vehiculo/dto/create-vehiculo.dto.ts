import { IsString, IsEnum, IsNotEmpty, IsDateString } from 'class-validator';
import { TipoVehiculo } from '../enums/tipo-vehiculo.enum';

export class CreateVehiculoDto {
  @IsString()
  @IsNotEmpty()
  placa: string;

  @IsEnum(TipoVehiculo)
  @IsNotEmpty()
  tipo: TipoVehiculo;

  @IsString()
  @IsNotEmpty()
  marca: string;

  @IsString()
  @IsNotEmpty()
  modelo: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsDateString()
  @IsNotEmpty()
  fechaCaducidad: string;

  @IsString()
  @IsNotEmpty()
  conductorCodigo: string;
}
