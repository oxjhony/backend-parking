import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConductorDto {
  @ApiProperty({ example: '0000028932' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({ example: 'juan.perez@ucaldas.edu.co' })
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @IsNotEmpty()
  telefono: string;
}
