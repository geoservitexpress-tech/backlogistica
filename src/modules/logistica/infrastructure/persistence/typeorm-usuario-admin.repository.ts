import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type {
  ListUsuariosAdminFilter,
  UsuarioAdminListado,
  UsuarioAdminListadoPaginado,
  UsuarioAdminPort,
  UsuarioRolResumen,
} from '../../domain/read-models/usuario-admin-listado';
import { buildPaginado } from '../../domain/paginacion';
import { RolOrmEntity } from './rol.orm-entity';
import { TipoDocumentoOrmEntity } from './tipo-documento.orm-entity';
import { UsuarioOrmEntity } from './usuario.orm-entity';
import { UsuarioRolOrmEntity } from './usuario-rol.orm-entity';

type UsuarioRow = {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  documento: string;
  telefono: string;
  creado_en: Date;
  tipo_documento: string;
};

@Injectable()
export class TypeOrmUsuarioAdminRepository implements UsuarioAdminPort {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(UsuarioOrmEntity)
    private readonly usuarioRepo: Repository<UsuarioOrmEntity>,
    @InjectRepository(RolOrmEntity)
    private readonly rolRepo: Repository<RolOrmEntity>,
  ) {}

  private mapUsuario(row: UsuarioRow, roles: UsuarioRolResumen[]): UsuarioAdminListado {
    return {
      idUsuario: row.id_usuario,
      nombres: row.nombres,
      apellidos: row.apellidos,
      nombreCompleto: `${row.nombres} ${row.apellidos}`.trim(),
      correo: row.correo,
      documento: row.documento,
      tipoDocumento: row.tipo_documento,
      telefono: row.telefono,
      creadoEn: row.creado_en.toISOString(),
      roles,
    };
  }

  private async rolesPorUsuarios(ids: number[]): Promise<Map<number, UsuarioRolResumen[]>> {
    const map = new Map<number, UsuarioRolResumen[]>();
    if (ids.length === 0) return map;

    const rows = (await this.dataSource.query(
      `select ur.id_usuario, r.id_rol, r.nombre
       from public.usuario_rol ur
       inner join public.rol r on r.id_rol = ur.id_rol
       where ur.id_usuario = any($1::int[])
       order by r.id_rol`,
      [ids],
    )) as { id_usuario: number; id_rol: number; nombre: string }[];

    for (const id of ids) {
      map.set(id, []);
    }
    for (const r of rows) {
      map.get(r.id_usuario)?.push({ idRol: r.id_rol, nombre: r.nombre });
    }
    return map;
  }

  async listUsuarios(filter: ListUsuariosAdminFilter): Promise<UsuarioAdminListadoPaginado> {
    const offset = (filter.page - 1) * filter.limit;
    const params: unknown[] = [];
    const where: string[] = [];
    let idx = 1;

    if (filter.search?.trim()) {
      const term = `%${filter.search.trim()}%`;
      where.push(
        `(u.nombres ilike $${idx} or u.apellidos ilike $${idx} or u.correo ilike $${idx} or u.documento ilike $${idx})`,
      );
      params.push(term);
      idx++;
    }

    if (filter.idRol != null) {
      where.push(
        `exists (select 1 from public.usuario_rol urf where urf.id_usuario = u.id_usuario and urf.id_rol = $${idx})`,
      );
      params.push(filter.idRol);
      idx++;
    }

    const whereSql = where.length ? `where ${where.join(' and ')}` : '';

    const countRows = (await this.dataSource.query(
      `select count(*)::int as total
       from public.usuarios u
       ${whereSql}`,
      params,
    )) as { total: number }[];
    const total = Number(countRows[0]?.total ?? 0);

    const listParams = [...params, filter.limit, offset];
    const rows = (await this.dataSource.query(
      `select u.id_usuario, u.nombres, u.apellidos, u.correo, u.documento, u.telefono, u.creado_en,
              td.abreviacion as tipo_documento
       from public.usuarios u
       inner join public.tipo_documento td on td.id_tipo_documento = u.fk_tipo_documento
       ${whereSql}
       order by u.nombres, u.apellidos
       limit $${idx} offset $${idx + 1}`,
      listParams,
    )) as UsuarioRow[];

    const rolesMap = await this.rolesPorUsuarios(rows.map((r) => r.id_usuario));
    const items = rows.map((r) => this.mapUsuario(r, rolesMap.get(r.id_usuario) ?? []));

    return buildPaginado(items, total, filter.page, filter.limit);
  }

  async actualizarRolesUsuario(idUsuario: number, idsRol: number[]): Promise<UsuarioAdminListado> {
    const usuario = await this.usuarioRepo.findOne({
      where: { idUsuario },
      relations: ['tipoDocumento'],
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario ${idUsuario} no encontrado`);
    }

    const uniqueIds = [...new Set(idsRol)];
    const roles = await this.rolRepo.find({ where: { idRol: In(uniqueIds) } });
    if (roles.length !== uniqueIds.length) {
      const ok = new Set(roles.map((r) => r.idRol));
      const missing = uniqueIds.filter((id) => !ok.has(id));
      throw new BadRequestException(
        `Rol(es) no encontrado(s): ${missing.join(', ')}. Ver GET /catalogo/roles.`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(UsuarioRolOrmEntity, { idUsuario });
      for (const idRol of uniqueIds) {
        await manager.insert(UsuarioRolOrmEntity, { idUsuario, idRol });
      }
    });

    const rolesResumen: UsuarioRolResumen[] = roles
      .filter((r) => uniqueIds.includes(r.idRol))
      .sort((a, b) => a.idRol - b.idRol)
      .map((r) => ({ idRol: r.idRol, nombre: r.nombre }));

    return {
      idUsuario: usuario.idUsuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      nombreCompleto: `${usuario.nombres} ${usuario.apellidos}`.trim(),
      correo: usuario.correo,
      documento: usuario.documento,
      tipoDocumento: usuario.tipoDocumento.abreviacion,
      telefono: usuario.telefono,
      creadoEn: usuario.creadoEn.toISOString(),
      roles: rolesResumen,
    };
  }
}
