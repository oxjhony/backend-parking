import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@ucaldas.edu.co' })
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @ApiProperty({ example: 'securePass123' })
  @IsString()
  @IsNotEmpty()
  contraseña: string;
}
