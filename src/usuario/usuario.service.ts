import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginUsuarioDto } from './dto/login-usuario.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUsuarioDto) {
    const exists = await this.usuarioRepository.findOne({
      where: [{ correo: dto.correo }, { cedula: dto.cedula }],
    });
    if (exists) {
      if (exists.correo === dto.correo) {
        throw new BadRequestException('El correo ya está registrado');
      }
      if ((exists as any).cedula === dto.cedula) {
        throw new BadRequestException('La cédula ya está registrada');
      }
      throw new BadRequestException('Correo o cédula ya registrados');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuario = this.usuarioRepository.create({
      nombre: dto.nombre,
      cedula: dto.cedula,
      correo: dto.correo,
      passwordHash,
      rol: dto.rol ?? undefined,
    });

    const saved = await this.usuarioRepository.save(usuario);

    return {
      id: saved.id,
      nombre: saved.nombre,
      cedula: (saved as any).cedula,
      correo: saved.correo,
      rol: saved.rol,
    };
  }

  async login(dto: LoginUsuarioDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { correo: dto.correo },
      select: ['id', 'nombre', 'correo', 'rol', 'passwordHash'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const ok = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: usuario.id, correo: usuario.correo, rol: usuario.rol, nombre: usuario.nombre };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    };
  }
}