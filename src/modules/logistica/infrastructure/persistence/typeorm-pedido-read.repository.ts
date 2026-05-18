import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { VAR } from '../../../configuracion/variable.keys';
import { VariablesService } from '../../../configuracion/variables.service';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, FindOptionsWhere, QueryFailedError, Repository } from 'typeorm';
import type { PedidoListado } from '../../domain/read-models/pedido-listado';
import type { ListPedidosFilter } from '../../domain/ports/pedido-read.port';
import { PedidoReadPort } from '../../domain/ports/pedido-read.port';
import { pedidoOrmToListado } from './pedido-listado.mapper';
import { PEDIDO_RELATIONS } from './pedido.orm-relations';
import { PedidoOrmEntity } from './pedido.orm-entity';
import { SupabaseEvidenciasStorage } from '../storage/supabase-evidencias.storage';
import { leerManifiestoDesdeSeguimiento } from './registrar-seguimiento-pedido';

/** Inicio y fin (inclusive) del día `YYYY-MM-DD` en **UTC** (`creado_en` timestamptz). */
function rangoDiaUtc(fechaYmd: string): { desde: Date; hasta: Date } {
  const desde = new Date(`${fechaYmd}T00:00:00.000Z`);
  const hasta = new Date(`${fechaYmd}T23:59:59.999Z`);
  return { desde, hasta };
}

/**
 * Mismo `YYYY-MM-DD` como **día civil en Colombia** (UTC−5 fijo, sin horario de verano).
 * Ej.: en Bogotá la noche del 9 aún es “día 9” local mientras en UTC ya es 10 → `?fecha=2026-05-09` vs UTC.
 */
function rangoDiaAmericaBogota(fechaYmd: string): { desde: Date; hasta: Date } {
  const [ys, ms, ds] = fechaYmd.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const desde = new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0));
  const hasta = new Date(Date.UTC(y, m - 1, d + 1, 4, 59, 59, 999));
  return { desde, hasta };
}

/** Por defecto **America/Bogota**; `LIST_PEDIDOS_FECHA_TZ=UTC` en public.variable para filtro UTC. */
async function rangoParaFiltroCreadoEn(
  fechaYmd: string,
  variables: VariablesService,
): Promise<{ desde: Date; hasta: Date }> {
  const modo = (await variables.getText(VAR.LIST_PEDIDOS_FECHA_TZ, 'America/Bogota')).trim();
  if (modo.toUpperCase() === 'UTC') {
    return rangoDiaUtc(fechaYmd);
  }
  return rangoDiaAmericaBogota(fechaYmd);
}

async function enriquecerPedidoListadoDesdeStorage(
  evidencias: SupabaseEvidenciasStorage,
  dataSource: DataSource,
  row: PedidoOrmEntity,
  listado: PedidoListado,
): Promise<PedidoListado> {
  const [urls, manifiestoStorage, manifiestoDb] = await Promise.all([
    evidencias.listarUrlsFotosPedido(row.idPedido),
    evidencias.leerManifiestoPedido(row.idPedido),
    leerManifiestoDesdeSeguimiento(dataSource.manager, row.idPedido).catch(() => null),
  ]);
  return {
    ...listado,
    fotosPaqueteUrls:
      listado.fotosPaqueteUrls && listado.fotosPaqueteUrls.length > 0
        ? listado.fotosPaqueteUrls
        : urls.length > 0
          ? urls
          : null,
    observacionesManifiesto:
      manifiestoDb ?? listado.observacionesManifiesto ?? manifiestoStorage ?? null,
  };
}

@Injectable()
export class TypeOrmPedidoReadRepository implements PedidoReadPort {
  private readonly logger = new Logger(TypeOrmPedidoReadRepository.name);

  constructor(
    @InjectRepository(PedidoOrmEntity)
    private readonly repo: Repository<PedidoOrmEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly evidencias: SupabaseEvidenciasStorage,
    private readonly variables: VariablesService,
  ) {}

  private rethrowIfMissingRelation(e: unknown): void {
    if (e instanceof QueryFailedError) {
      const driver = e.driverError as { code?: string; message?: string } | undefined;
      const msg = String(driver?.message ?? e.message ?? '');
      if (driver?.code === '42P01' && /relation .* does not exist/i.test(msg)) {
        this.logger.error(`Postgres ${driver.code}: ${msg}`);
        throw new InternalServerErrorException(
          `${msg.trim()} — El esquema de esta base no coincide con el ORM (mismo proyecto que DATABASE_URL en .env). ` +
            'Revise el esquema en el SQL Editor de Supabase (tablas que el ORM espera en `public`, p. ej. `pedidos`, `usuarios`, `usuario_rol`, `rol`).',
        );
      }
    }
  }

  async listPedidos(filter?: ListPedidosFilter): Promise<PedidoListado[]> {
  const base = {
    relations: [...PEDIDO_RELATIONS],
    order: { creadoEn: 'DESC' as const },
  };

  const t0 = Date.now();
  const tzModo =
    (await this.variables.getText(VAR.LIST_PEDIDOS_FECHA_TZ, 'America/Bogota')).trim().toUpperCase() === 'UTC'
      ? 'UTC'
      : 'America/Bogota';
  const filtroDesc = filter?.fecha ? `fecha=${filter.fecha} tz=${tzModo}` : 'sin filtro fecha';

  const whereBase: FindOptionsWhere<PedidoOrmEntity> = {};
  if (filter?.idUsuario) {
    whereBase.usuarioSolicitud = { idUsuario: filter.idUsuario };
  }
  if (filter?.idRepartidor) {
    whereBase.usuarioRepartidor = { idUsuario: filter.idRepartidor };
  }

  try {
    if (filter?.fecha) {
      const { desde, hasta } = await rangoParaFiltroCreadoEn(filter.fecha, this.variables);
      const rows = await this.repo.find({
        ...base,
        where: { ...whereBase, creadoEn: Between(desde, hasta) },
      });
      const out = await Promise.all(
        rows.map(async (row) =>
          enriquecerPedidoListadoDesdeStorage(this.evidencias, this.dataSource, row, pedidoOrmToListado(row)),
        ),
      );
      this.logger.log(`listPedidos ${filtroDesc} idUsuario=${filter?.idUsuario ?? 'todos'} count=${out.length} ${Date.now() - t0}ms`);
      return out;
    }

    const rows = await this.repo.find({ ...base, where: whereBase });
    const out = await Promise.all(
      rows.map(async (row) =>
        enriquecerPedidoListadoDesdeStorage(this.evidencias, this.dataSource, row, pedidoOrmToListado(row)),
      ),
    );
    this.logger.log(`listPedidos ${filtroDesc} idUsuario=${filter?.idUsuario ?? 'todos'} count=${out.length} ${Date.now() - t0}ms`);
    return out;
  } catch (e) {
    this.rethrowIfMissingRelation(e);
    throw e;
  }
}

  async findPedidoById(id: number): Promise<PedidoListado | null> {
    const t0 = Date.now();
    try {
      const row = await this.repo.findOne({
        where: { idPedido: id },
        relations: [...PEDIDO_RELATIONS],
      });
      const hit = Boolean(row);
      this.logger.log(`findPedidoById id_pedido=${id} hit=${hit} ${Date.now() - t0}ms`);
      if (!row) return null;
      return enriquecerPedidoListadoDesdeStorage(this.evidencias, this.dataSource, row, pedidoOrmToListado(row));
    } catch (e) {
      this.rethrowIfMissingRelation(e);
      throw e;
    }
  }

  async findPedidoByNumGuia(numGuia: string): Promise<PedidoListado | null> {
    const g = numGuia.trim();
    const t0 = Date.now();
    if (!g) return null;
    try {
      const row = await this.repo.findOne({
        where: { numGuia: g },
        relations: [...PEDIDO_RELATIONS],
      });
      const hit = Boolean(row);
      this.logger.log(`findPedidoByNumGuia num_guia=${g} hit=${hit} ${Date.now() - t0}ms`);
      if (!row) return null;
      return enriquecerPedidoListadoDesdeStorage(this.evidencias, this.dataSource, row, pedidoOrmToListado(row));
    } catch (e) {
      this.rethrowIfMissingRelation(e);
      throw e;
    }
  }
}
