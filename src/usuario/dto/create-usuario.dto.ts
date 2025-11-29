import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../enums/rol-usuario.enum';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: '1234567890', description: 'Cédula del usuario, identificador único' })
  @IsString()
  @MinLength(6)
  cedula: string;

  @ApiProperty({ example: 'juan.perez@example.com', description: 'Correo electrónico único' })
  @IsEmail()
  correo: string;

  @ApiProperty({ example: 'Secr3t0!', description: 'Contraseña en texto plano (se encriptará)' })
  @IsString()
  @MinLength(6)
  contraseña: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario',
    enum: RolUsuario,
    examples: [RolUsuario.ADMINISTRADOR, RolUsuario.VIGILANTE, RolUsuario.SUPERVISOR, RolUsuario.SUPERUSUARIO],
    default: RolUsuario.VIGILANTE,
  })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario = RolUsuario.VIGILANTE;
}