import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VAR } from '../../../configuracion/variable.keys';
import { VariablesService } from '../../../configuracion/variables.service';
import { hoyYmdBogota, sumarDiasYmd } from '../../application/asignacion-fecha-bogota';
import {
  codigoRepartidor,
  hubsRepartidorPorId,
  idUsuarioDesdeBusquedaRepartidor,
} from '../../application/repartidor-codigo';
import { variacionPorcentaje } from '../../application/finanzas-periodo';
import { buildPaginado } from '../../domain/paginacion';
import type {
  DispersionRepartidorResultado,
  ListRepartidoresPagoFilter,
  PagosRepartidorKpis,
  PagosRepartidorPort,
  RepartidorPagoListadoPaginado,
} from '../../domain/ports/pagos-repartidor.port';
import { ESTADO_PEDIDO_ENTREGADO_ID } from '../../logistica-pedido-estados.constants';
import { ROL_ID_REPARTIDOR } from '../../logistica-rol.constants';

type RepartidorRow = {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  entregas_totales: number;
  pedidos_activos: number;
  zona_frecuente: string | null;
};

@Injectable()
export class TypeOrmPagosRepartidorRepository implements PagosRepartidorPort {
  private readonly logger = new Logger(TypeOrmPagosRepartidorRepository.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly variables: VariablesService,
  ) {}

  private async idRolRepartidor(): Promise<number> {
    return this.variables.getInt(VAR.ASIGNACION_ROL_REPARTIDOR_ID, ROL_ID_REPARTIDOR, { min: 1 });
  }

  private async tarifaEntrega(): Promise<number> {
    return this.variables.getInt(VAR.FINANZAS_TARIFA_PAGO_REPARTIDOR_ENTREGA, 12_000, { min: 0 });
  }

  private async metaDiaria(): Promise<number> {
    return this.variables.getInt(VAR.FINANZAS_META_ENTREGAS_DIARIA, 2500, { min: 1 });
  }

  private async tieneTablaDispersion(): Promise<boolean> {
    const rows = (await this.dataSource.query(
      `select 1 from information_schema.tables
       where table_schema = 'public' and table_name = 'dispersion_detalle' limit 1`,
    )) as unknown[];
    return rows.length > 0;
  }

  private filtroNoDispersado(alias: string): string {
    return `not exists (
      select 1 from public.dispersion_detalle dd where dd.fk_pedido = ${alias}.id_pedido
    )`;
  }

  private async countEntregasPendientes(): Promise<number> {
    const tieneDisp = await this.tieneTablaDispersion();
    const extra = tieneDisp ? `and ${this.filtroNoDispersado('p')}` : '';
    const rows = (await this.dataSource.query(
      `select count(*)::int as n from public.pedidos p
       where p.fk_estado_pedido = $1
         and p.fk_usuario_repartidor is not null
         ${extra}`,
      [ESTADO_PEDIDO_ENTREGADO_ID],
    )) as { n: number }[];
    return Number(rows[0]?.n ?? 0);
  }

  private async countEntregasPendientesEnRango(desde: string, hasta: string): Promise<number> {
    const tieneDisp = await this.tieneTablaDispersion();
    const extra = tieneDisp ? `and ${this.filtroNoDispersado('p')}` : '';
    const rows = (await this.dataSource.query(
      `select count(*)::int as n from public.pedidos p
       where p.fk_estado_pedido = $1
         and p.fk_usuario_repartidor is not null
         and p.fecha_entrega >= $2::date
         and p.fecha_entrega <= $3::date
         ${extra}`,
      [ESTADO_PEDIDO_ENTREGADO_ID, desde, hasta],
    )) as { n: number }[];
    return Number(rows[0]?.n ?? 0);
  }

  async getKpis(): Promise<PagosRepartidorKpis> {
    const hoy = hoyYmdBogota();
    const inicioSemana = sumarDiasYmd(hoy, -6);
    const inicioSemanaAnterior = sumarDiasYmd(hoy, -13);
    const finSemanaAnterior = sumarDiasYmd(hoy, -7);

    const [tarifa, meta, entregasPendientes, entSemana, entSemanaAnt, entregasHoy, repActivos] =
      await Promise.all([
        this.tarifaEntrega(),
        this.metaDiaria(),
        this.countEntregasPendientes(),
        this.countEntregasPendientesEnRango(inicioSemana, hoy),
        this.countEntregasPendientesEnRango(inicioSemanaAnterior, finSemanaAnterior),
        this.dataSource
          .query(
            `select count(*)::int as n from public.pedidos
             where fk_estado_pedido = $1 and fecha_entrega = $2::date`,
            [ESTADO_PEDIDO_ENTREGADO_ID, hoy],
          )
          .then((r) => Number((r as { n: number }[])[0]?.n ?? 0)),
        this.dataSource
          .query(
            `select count(distinct ur.id_usuario)::int as n
             from public.usuario_rol ur
             where ur.id_rol = $1`,
            [await this.idRolRepartidor()],
          )
          .then((r) => Number((r as { n: number }[])[0]?.n ?? 0)),
      ]);

    const totalPendientePago = entregasPendientes * tarifa;
    const montoSemana = entSemana * tarifa;
    const montoSemanaAnt = entSemanaAnt * tarifa;

    return {
      totalPendientePago,
      moneda: 'COP',
      variacionSemanaAnteriorPorcentaje: variacionPorcentaje(montoSemana, montoSemanaAnt),
      repartidoresActivos: repActivos,
      entregasHoy,
      metaDiaria: meta,
      porcentajeMetaDiaria: Math.min(100, Math.round((entregasHoy / meta) * 100)),
    };
  }

  async listRepartidores(filter: ListRepartidoresPagoFilter): Promise<RepartidorPagoListadoPaginado> {
    const fecha = filter.fecha ?? hoyYmdBogota();
    const idRol = await this.idRolRepartidor();
    const estadosTerminales = await this.variables.getIntList(
      VAR.ASIGNACION_ESTADOS_TERMINALES_REPARTIDOR,
      [5, 6, 7],
    );
    const offset = (filter.page - 1) * filter.limit;

    const baseParams: unknown[] = [idRol, ESTADO_PEDIDO_ENTREGADO_ID, fecha, estadosTerminales];
    const whereParts = ['ur.id_rol = $1'];
    let paramIdx = 5;

    const idBusqueda = filter.search ? idUsuarioDesdeBusquedaRepartidor(filter.search) : null;
    if (idBusqueda != null) {
      whereParts.push(`u.id_usuario = $${paramIdx}`);
      baseParams.push(idBusqueda);
      paramIdx++;
    } else if (filter.search?.trim()) {
      whereParts.push(
        `(u.nombres ilike $${paramIdx} or u.apellidos ilike $${paramIdx} or u.documento ilike $${paramIdx})`,
      );
      baseParams.push(`%${filter.search.trim()}%`);
      paramIdx++;
    }

    const activosExpr = `count(p_act.id_pedido) filter (
      where p_act.fecha_entrega = $3::date
        and p_act.fk_estado_pedido <> all($4::int[])
    )`;

    let havingSql = '';
    if (filter.estado === 'ocupado') {
      havingSql = `having ${activosExpr} > 0`;
    } else if (filter.estado === 'libre') {
      havingSql = `having ${activosExpr} = 0`;
    }

    const fromSql = `
      from public.usuarios u
      inner join public.usuario_rol ur on ur.id_usuario = u.id_usuario
      left join public.pedidos p_ent on p_ent.fk_usuario_repartidor = u.id_usuario
      left join public.pedidos p_act on p_act.fk_usuario_repartidor = u.id_usuario
      where ${whereParts.join(' and ')}
      group by u.id_usuario, u.nombres, u.apellidos
      ${havingSql}`;

    const countRows = (await this.dataSource.query(
      `select count(*)::int as total from (select u.id_usuario ${fromSql}) sub`,
      baseParams,
    )) as { total: number }[];
    const total = Number(countRows[0]?.total ?? 0);

    const listParams = [...baseParams, filter.limit, offset];
    const rows = (await this.dataSource.query(
      `select u.id_usuario, u.nombres, u.apellidos,
        count(p_ent.id_pedido) filter (where p_ent.fk_estado_pedido = $2)::int as entregas_totales,
        ${activosExpr}::int as pedidos_activos,
        (
          select zb.nombre
          from public.pedidos pz
          inner join public.direccion dz on dz.id_direccion = pz.fk_direccion
          left join public.zona_bogota zb on zb.id_zona = dz.fk_zona
          where pz.fk_usuario_repartidor = u.id_usuario
            and pz.fk_estado_pedido = $2
            and zb.nombre is not null
          group by zb.nombre
          order by count(*) desc
          limit 1
        ) as zona_frecuente
      ${fromSql}
      order by u.nombres, u.apellidos
      limit $${paramIdx} offset $${paramIdx + 1}`,
      listParams,
    )) as RepartidorRow[];

    const hubsRaw = await this.variables.getText(VAR.ASIGNACION_REPARTIDORES_HUBS, '[]');
    const hubs = hubsRepartidorPorId(hubsRaw);

    const items = rows.map((r) => {
      const hub = hubs.get(r.id_usuario);
      const pedidosActivos = Number(r.pedidos_activos ?? 0);
      return {
        codigo: codigoRepartidor(r.id_usuario),
        nombre: `${r.nombres} ${r.apellidos}`.trim(),
        vehiculo: hub?.vehiculo ?? null,
        zona: hub?.zona ?? r.zona_frecuente ?? null,
        entregasTotales: Number(r.entregas_totales ?? 0),
        estado: pedidosActivos > 0 ? ('ocupado' as const) : ('libre' as const),
      };
    });

    return buildPaginado(items, total, filter.page, filter.limit);
  }

  async generarDispersionTotal(): Promise<DispersionRepartidorResultado> {
    if (!(await this.tieneTablaDispersion())) {
      throw new BadRequestException(
        'Faltan tablas dispersion_lote / dispersion_detalle. Ejecute database/18-dispersion-repartidor.sql en Supabase.',
      );
    }

    const tarifa = await this.tarifaEntrega();

    return this.dataSource.transaction(async (manager) => {
      const pendientes = (await manager.query(
        `select p.id_pedido, p.fk_usuario_repartidor, u.nombres, u.apellidos
         from public.pedidos p
         inner join public.usuarios u on u.id_usuario = p.fk_usuario_repartidor
         where p.fk_estado_pedido = $1
           and p.fk_usuario_repartidor is not null
           and not exists (
             select 1 from public.dispersion_detalle dd where dd.fk_pedido = p.id_pedido
           )
         order by p.fk_usuario_repartidor, p.id_pedido`,
        [ESTADO_PEDIDO_ENTREGADO_ID],
      )) as {
        id_pedido: number;
        fk_usuario_repartidor: number;
        nombres: string;
        apellidos: string;
      }[];

      if (pendientes.length === 0) {
        throw new BadRequestException('No hay entregas pendientes de dispersión.');
      }

      const montoTotal = pendientes.length * tarifa;
      const repartidoresSet = new Set(pendientes.map((p) => p.fk_usuario_repartidor));

      const loteRows = (await manager.query(
        `insert into public.dispersion_lote (monto_total, entregas_total, repartidores_total)
         values ($1, $2, $3)
         returning id_dispersion, creado_en`,
        [montoTotal, pendientes.length, repartidoresSet.size],
      )) as { id_dispersion: number; creado_en: Date }[];

      const idDispersion = loteRows[0].id_dispersion;
      const generadoEn = loteRows[0].creado_en;

      for (const p of pendientes) {
        await manager.query(
          `insert into public.dispersion_detalle (id_dispersion, fk_pedido, fk_usuario_repartidor, monto)
           values ($1, $2, $3, $4)`,
          [idDispersion, p.id_pedido, p.fk_usuario_repartidor, tarifa],
        );
      }

      const porRepartidor = new Map<
        number,
        { nombre: string; entregas: number; monto: number }
      >();
      for (const p of pendientes) {
        const prev = porRepartidor.get(p.fk_usuario_repartidor);
        const nombre = `${p.nombres} ${p.apellidos}`.trim();
        if (prev) {
          prev.entregas += 1;
          prev.monto += tarifa;
        } else {
          porRepartidor.set(p.fk_usuario_repartidor, { nombre, entregas: 1, monto: tarifa });
        }
      }

      const lineas = [...porRepartidor.entries()].map(([id, v]) => ({
        codigo: codigoRepartidor(id),
        nombre: v.nombre,
        entregas: v.entregas,
        monto: v.monto,
      }));

      this.logger.log(
        `Dispersión ${idDispersion} generada: ${pendientes.length} entregas, ${repartidoresSet.size} repartidores, $${montoTotal}`,
      );

      return {
        idDispersion,
        montoTotal,
        entregasTotal: pendientes.length,
        repartidoresTotal: repartidoresSet.size,
        moneda: 'COP' as const,
        generadoEn: generadoEn.toISOString(),
        lineas,
      };
    });
  }
}
