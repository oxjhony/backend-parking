import { IsString, IsNotEmpty, Length, Matches, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear o actualizar un conductor visitante
 */
export class CreateVisitanteConductorDto {
  @ApiProperty({
    description: 'Número de cédula del visitante',
    example: '1234567890',
    minLength: 6,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  @Matches(/^[0-9]+$/, {
    message: 'La cédula solo debe contener dígitos',
  })
  cedula: string;

  @ApiProperty({
    description: 'Nombre del visitante',
    example: 'Juan',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nombre: string;

  @ApiProperty({
    description: 'Apellido del visitante',
    example: 'Pérez',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  apellido: string;

  @ApiProperty({
    description: 'Número de teléfono del visitante',
    example: '3001234567',
    minLength: 7,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(7, 20)
  @Matches(/^[0-9+\-\s()]+$/, {
    message: 'El teléfono solo debe contener dígitos, espacios y símbolos +, -, (, )',
  })
  telefono: string;

  @ApiProperty({
    description: 'Correo electrónico del visitante (opcional)',
    example: 'juan.perez@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, {
    message: 'El correo electrónico no tiene un formato válido',
  })
  @Length(5, 100)
  correo?: string;
}
