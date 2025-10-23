import { IsString, IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegistroDto {
  @ApiProperty({ 
    example: 'ABC123',
    description: 'Placa del vehículo que ingresa al parqueadero'
  })
  @IsString()
  @IsNotEmpty()
  vehiculoPlaca: string;

  @ApiProperty({ 
    example: 1,
    description: 'ID del usuario que registra la entrada'
  })
  @IsInt()
  @IsNotEmpty()
  usuarioId: number;

  @ApiProperty({ 
    example: 1,
    description: 'ID del parqueadero donde ingresa el vehículo'
  })
  @IsInt()
  @IsNotEmpty()
  parqueaderoId: number;
}
