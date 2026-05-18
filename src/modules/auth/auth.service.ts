import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import type { Session } from '@supabase/supabase-js';
import { DataSource, EntityManager } from 'typeorm';
import { RolOrmEntity } from '../logistica/infrastructure/persistence/rol.orm-entity';
import { TipoDocumentoOrmEntity } from '../logistica/infrastructure/persistence/tipo-documento.orm-entity';
import { UsuarioOrmEntity } from '../logistica/infrastructure/persistence/usuario.orm-entity';
import { UsuarioRolOrmEntity } from '../logistica/infrastructure/persistence/usuario-rol.orm-entity';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { VAR } from '../configuracion/variable.keys';
import { VariablesService } from '../configuracion/variables.service';
import { createSupabaseAnonClient, createSupabaseServiceClient } from './supabase-clients.factory';

export type AuthProfileDto = {
  /** `usuarios.id_usuario` (entero). */
  idUsuario: number;
  correo: string;
  nombres: string;
  apellidos: string;
  documento: string;
  telefono: string;
  roles: string[];
};

export type AuthTokensDto = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  usuario: AuthProfileDto;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly variables: VariablesService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private supabaseUrl(): string {
    const url =
      this.config.get<string>('SUPABASE_URL')?.trim() ||
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_URL')?.trim();
    if (!url) throw new BadRequestException('Falta SUPABASE_URL en el entorno.');
    return url;
  }

  private serviceKey(): string {
    const k =
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim() ||
      this.config.get<string>('SUPABASE_SERVICE_KEY')?.trim();
    if (!k) throw new BadRequestException('Falta SUPABASE_SERVICE_ROLE_KEY para registro.');
    return k;
  }

  private anonKey(): string {
    const k =
      this.config.get<string>('SUPABASE_ANON_KEY')?.trim() ||
      this.config.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY')?.trim();
    if (!k) throw new BadRequestException('Falta SUPABASE_ANON_KEY para login/registro sesión.');
    return k;
  }

  /** Campos habituales del error GoTrue (sin tokens); útil cuando `message` es genérico. */
  private serializeGoTrueError(err: unknown): string {
    if (err == null || typeof err !== 'object') {
      return JSON.stringify({ value: String(err) });
    }
    const e = err as Record<string, unknown>;
    const keys = ['message', 'code', 'status', 'name', 'details', 'cause', 'weak_password'];
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      if (k in e && e[k] !== undefined) {
        out[k] = e[k];
      }
    }
    try {
      return JSON.stringify(out);
    } catch {
      return '{"serialize":"failed"}';
    }
  }

  private async resolverRol(manager: EntityManager, dto: RegisterDto): Promise<RolOrmEntity> {
    const id = dto.idRol;
    const r = await manager.getRepository(RolOrmEntity).findOne({ where: { idRol: id } });
    if (!r) {
      this.logger.warn(`register rechazado: rol no existe id_rol=${id}`);
      throw new BadRequestException(`Rol no encontrado: id_rol=${id}`);
    }
    return r;
  }

  private mapSessionUser(session: Session, profile: AuthProfileDto): AuthTokensDto {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in ?? 3600,
      token_type: session.token_type ?? 'bearer',
      usuario: profile,
    };
  }

  /** Resuelve `usuarios.id_usuario` (entero) desde el `sub` UUID del JWT de Supabase. */
  async idUsuarioFromAuthSub(authUserId: string): Promise<number> {
    const u = await this.dataSource.manager.getRepository(UsuarioOrmEntity).findOne({
      where: { authUserId: authUserId.trim() },
    });
    if (!u) {
      throw new NotFoundException(
        'Usuario autenticado en Supabase pero sin fila en `usuarios`. Complete POST /auth/register.',
      );
    }
    return u.idUsuario;
  }

  private async cargarPerfilPorAuthSub(authUserId: string): Promise<AuthProfileDto> {
    const u = await this.dataSource.manager.getRepository(UsuarioOrmEntity).findOne({
      where: { authUserId },
    });
    if (!u) {
      this.logger.warn(`cargarPerfil: sin fila usuarios auth_user_id=${authUserId}`);
      throw new NotFoundException(
        'Usuario autenticado en Supabase pero sin fila en `usuarios`. Complete el flujo de registro.',
      );
    }
    const urs = await this.dataSource.manager
      .getRepository(UsuarioRolOrmEntity)
      .find({ where: { idUsuario: u.idUsuario } });
    const roles: string[] = [];
    for (const ur of urs) {
      const rol = await this.dataSource.manager.getRepository(RolOrmEntity).findOne({
        where: { idRol: ur.idRol },
      });
      if (rol) roles.push(rol.nombre);
    }
    return {
      idUsuario: u.idUsuario,
      correo: u.correo,
      nombres: u.nombres,
      apellidos: u.apellidos,
      documento: u.documento,
      telefono: u.telefono,
      roles,
    };
  }

  /**
   * Orden: (1) crear fila en Auth (`auth.users`) vía Admin API — es lo que alimenta Authentication → Users;
   * (2) si eso OK, transacción en `usuarios` (`id_usuario` entero) + `usuario_rol`; UUID en `auth_user_id`.
   */
  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const url = this.supabaseUrl();
    const admin = createSupabaseServiceClient(url, this.serviceKey());
    const anon = createSupabaseAnonClient(url, this.anonKey());

    const correoNorm = dto.correo.trim().toLowerCase();
    this.logger.log(
      `register inicio correo=${correoNorm} idRol=${dto.idRol} fkTipoDocumento=${dto.fkTipoDocumento}`,
    );

    const tipoDoc = await this.dataSource.manager.getRepository(TipoDocumentoOrmEntity).findOne({
      where: { idTipoDocumento: dto.fkTipoDocumento },
    });
    if (!tipoDoc) {
      this.logger.warn(`register rechazado: tipo de documento no existe fk=${dto.fkTipoDocumento}`);
      throw new BadRequestException(`Tipo de documento no encontrado: ${dto.fkTipoDocumento}`);
    }

    const dup = await this.dataSource.manager.getRepository(UsuarioOrmEntity).findOne({
      where: { correo: correoNorm },
    });
    if (dup) {
      this.logger.warn(`register conflicto: correo ya existe en usuarios correo=${correoNorm}`);
      throw new ConflictException('Ya existe un usuario en BD con ese correo.');
    }

    const rol = await this.resolverRol(this.dataSource.manager, dto);
    this.logger.log(`register catálogo ok rol=${rol.nombre} (${rol.idRol})`);

    const emailConfirm = await this.variables.getBoolean(VAR.REGISTER_EMAIL_AUTO_CONFIRM, true);

    this.logger.log(
      `register llamando Supabase admin.createUser correo=${correoNorm} email_confirm=${emailConfirm}`,
    );
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: correoNorm,
      password: dto.password,
      email_confirm: emailConfirm,
    });

    if (createErr || !created.user?.id) {
      const msg = createErr?.message ?? 'No se pudo crear usuario en Supabase Auth';
      const errExtra = createErr as { code?: string; status?: number } | null;
      const details = (createErr as { details?: string } | null)?.details;
      this.logger.warn(
        [
          'Supabase admin.createUser falló',
          `message=${msg}`,
          errExtra?.code != null ? `code=${errExtra.code}` : '',
          errExtra?.status != null ? `http=${errExtra.status}` : '',
          details ? `details=${details}` : '',
        ]
          .filter(Boolean)
          .join(' | '),
      );
      this.logger.warn(`Supabase admin.createUser error JSON=${this.serializeGoTrueError(createErr)}`);
      if (/already been registered|already exists/i.test(msg)) {
        throw new ConflictException('Ese correo ya está registrado en Supabase Auth.');
      }
      let clientMsg = msg;
      if (/database error creating new user/i.test(msg)) {
        clientMsg =
          `${msg}. Falló la creación en Auth (Postgres interno). Revise Logs → Postgres y Logs → Auth en Supabase; verifique URL y service_role del mismo proyecto. Si «Add user» en Authentication también falla, es del lado Supabase/Auth, no del insert posterior en tablas públicas.`;
      }
      throw new BadRequestException(clientMsg);
    }

    const authUserId = created.user.id;
    this.logger.log(`register Supabase Auth usuario creado auth_user_id=${authUserId}`);
    const now = new Date();

    let idUsuario = 0;
    try {
      await this.dataSource.transaction(async (manager) => {
        const usuario = manager.getRepository(UsuarioOrmEntity).create({
          authUserId,
          nombres: dto.nombres.trim().slice(0, 120),
          apellidos: dto.apellidos.trim().slice(0, 120),
          tipoDocumento: { idTipoDocumento: tipoDoc.idTipoDocumento },
          documento: dto.documento.trim().slice(0, 32),
          correo: correoNorm.slice(0, 254),
          telefono: dto.telefono.trim().slice(0, 32),
          creadoEn: now,
        });
        await manager.getRepository(UsuarioOrmEntity).save(usuario);
        idUsuario = usuario.idUsuario;

        const ur = manager.getRepository(UsuarioRolOrmEntity).create({
          idUsuario: usuario.idUsuario,
          idRol: rol.idRol,
        });
        await manager.getRepository(UsuarioRolOrmEntity).save(ur);
      });
      this.logger.log(
        `register Postgres usuarios+usuario_rol guardados id_usuario=${idUsuario} auth_user_id=${authUserId}`,
      );
    } catch (dbErr) {
      const dbMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      const dbStack = dbErr instanceof Error ? dbErr.stack : undefined;
      this.logger.error(
        `register falló transacción Postgres tras crear Auth idUsuario=${authUserId}: ${dbMsg}`,
        dbStack,
      );
      try {
        await admin.auth.admin.deleteUser(authUserId);
        this.logger.warn(`Rollback Auth tras fallo DB: usuario ${authUserId} eliminado`);
      } catch (delErr) {
        this.logger.error(`No se pudo eliminar usuario Auth tras fallo DB: ${delErr}`);
      }
      throw dbErr;
    }

    this.logger.log(`register signInWithPassword post-registro correo=${correoNorm}`);
    const { data: sessionData, error: signErr } = await anon.auth.signInWithPassword({
      email: correoNorm,
      password: dto.password,
    });

    if (signErr || !sessionData.session) {
      this.logger.error(
        `register signIn tras crear cuenta falló correo=${correoNorm}: ${signErr?.message ?? 'sin sesión'}`,
      );
      throw new BadRequestException(
        signErr?.message ??
          'Cuenta creada pero no se pudo obtener sesión; use POST /auth/login.',
      );
    }

    const profile = await this.cargarPerfilPorAuthSub(authUserId);
    this.logger.log(
      `register completado id_usuario=${profile.idUsuario} correo=${correoNorm} roles=${profile.roles.join(',')}`,
    );
    return this.mapSessionUser(sessionData.session, profile);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const url = this.supabaseUrl();
    const anon = createSupabaseAnonClient(url, this.anonKey());
    const correoNorm = dto.correo.trim().toLowerCase();
    this.logger.log(`login inicio correo=${correoNorm}`);

    const { data, error } = await anon.auth.signInWithPassword({
      email: correoNorm,
      password: dto.password,
    });

    if (error || !data.session?.user?.id) {
      this.logger.warn(
        `login fallido correo=${correoNorm}: ${error?.message ?? 'sin sesión o usuario sin id'}`,
      );
      throw new UnauthorizedException(error?.message ?? 'Credenciales inválidas');
    }

    const profile = await this.cargarPerfilPorAuthSub(data.session.user.id);
    this.logger.log(
      `login ok id_usuario=${profile.idUsuario} correo=${correoNorm} roles=${profile.roles.join(',')}`,
    );
    return this.mapSessionUser(data.session, profile);
  }

  async me(authUserId: string): Promise<AuthProfileDto> {
    this.logger.log(`me cargando perfil auth_user_id=${authUserId}`);
    const profile = await this.cargarPerfilPorAuthSub(authUserId);
    this.logger.log(
      `me ok id_usuario=${profile.idUsuario} correo=${profile.correo} roles=${profile.roles.join(',')}`,
    );
    return profile;
  }
}
