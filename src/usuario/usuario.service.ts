import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async register(dto: CreateUsuarioDto) {
    const exists = await this.usuarioRepository.findOne({
      where: [{ correo: dto.correo }, { cedula: dto.cedula }],
    });
    
    if (exists) {
      if (exists.correo === dto.correo) {
        throw new BadRequestException('El correo ya está registrado');
      }
      if (exists.cedula === dto.cedula) {
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
      cedula: saved.cedula,
      correo: saved.correo,
      rol: saved.rol,
    };
  }

  async findAll(): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      select: ['id', 'nombre', 'cedula', 'correo', 'rol'],
    });
  }

  async findOne(id: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      select: ['id', 'nombre', 'cedula', 'correo', 'rol'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  async findByEmail(correo: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { correo },
      select: ['id', 'nombre', 'cedula', 'correo', 'rol'],
    });
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto): Promise<Usuario> {
    const usuario = await this.findOne(id);

    if (updateUsuarioDto.correo && updateUsuarioDto.correo !== usuario.correo) {
      const existingUsuario = await this.usuarioRepository.findOne({
        where: { correo: updateUsuarioDto.correo },
      });
      if (existingUsuario) {
        throw new BadRequestException('El correo ya está en uso');
      }
    }

    if (updateUsuarioDto.cedula && updateUsuarioDto.cedula !== usuario.cedula) {
      const existingUsuario = await this.usuarioRepository.findOne({
        where: { cedula: updateUsuarioDto.cedula },
      });
      if (existingUsuario) {
        throw new BadRequestException('La cédula ya está en uso');
      }
    }

    if (updateUsuarioDto.password) {
      const passwordHash = await bcrypt.hash(updateUsuarioDto.password, 10);
      Object.assign(usuario, { ...updateUsuarioDto, passwordHash });
      delete updateUsuarioDto.password;
    } else {
      Object.assign(usuario, updateUsuarioDto);
    }

    const updated = await this.usuarioRepository.save(usuario);
    
    return {
      id: updated.id,
      nombre: updated.nombre,
      cedula: updated.cedula,
      correo: updated.correo,
      rol: updated.rol,
    } as Usuario;
  }

  async remove(id: number): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
  }
}