import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VAR } from '../../../configuracion/variable.keys';
import { VariablesService } from '../../../configuracion/variables.service';
import type {
  ActualizarClienteLiquidacionConfigInput,
  ClienteLiquidacionConfig,
  ClienteLiquidacionPendiente,
  GenerarLiquidacionInput,
  LiquidacionClientePort,
  LiquidacionLoteResultado,
} from '../../domain/ports/liquidacion-cliente.port';
import { ESTADO_PEDIDO_ENTREGADO_ID } from '../../logistica-pedido-estados.constants';

type PedidoPendienteRow = {
  id_pedido: number;
  num_guia: string;
  valor_recaudado: string;
  tarifa_envio: string;
  pagado_por_remitente: boolean | null;
  fecha_entrega: string;
  fk_usuario_solicitud: number;
};

type ClientePendienteRow = {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  frecuencia_dias: number | null;
  pedidos_pendientes: number;
  recaudo_pendiente: string;
  tarifa_pendiente: string;
  neto_pendiente: string;
  ultima_liquidacion_en: string | null;
};

function montoNetoPedido(
  recaudo: number,
  tarifa: number,
  pagadoPorRemitente: boolean | null,
): number {
  if (pagadoPorRemitente) return recaudo;
  return Math.max(0, recaudo - tarifa);
}

@Injectable()
export class TypeOrmLiquidacionClienteRepository implements LiquidacionClientePort {
  private readonly logger = new Logger(TypeOrmLiquidacionClienteRepository.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly variables: VariablesService,
  ) {}

  private async frecuenciaDefault(): Promise<number> {
    return this.variables.getInt(VAR.FINANZAS_LIQUIDACION_FRECUENCIA_DEFAULT_DIAS, 15, {
      min: 1,
      max: 90,
    });
  }

  private async tieneTablas(): Promise<boolean> {
    const rows = (await this.dataSource.query(
      `select 1 from information_schema.tables
       where table_schema = 'public' and table_name = 'liquidacion_lote' limit 1`,
    )) as unknown[];
    return rows.length > 0;
  }

  private async pedidosPendientesCliente(idUsuario: number): Promise<PedidoPendienteRow[]> {
    return (await this.dataSource.query(
      `select p.id_pedido, p.num_guia, p.valor_recaudado,
              coalesce(p.tarifa_envio, p.precio, 0) as tarifa_envio,
              p.pagado_por_remitente, p.fecha_entrega::text, p.fk_usuario_solicitud
       from public.pedidos p
       where p.fk_usuario_solicitud = $1
         and p.fk_estado_pedido = $2
         and coalesce(p.valor_recaudado, 0) > 0
         and not exists (
           select 1 from public.liquidacion_detalle ld where ld.fk_pedido = p.id_pedido
         )
       order by p.fecha_entrega, p.id_pedido`,
      [idUsuario, ESTADO_PEDIDO_ENTREGADO_ID],
    )) as PedidoPendienteRow[];
  }

  async getConfig(idUsuario: number): Promise<ClienteLiquidacionConfig | null> {
    const usuario = (await this.dataSource.query(
      `select id_usuario, nombres, apellidos from public.usuarios where id_usuario = $1`,
      [idUsuario],
    )) as { id_usuario: number; nombres: string; apellidos: string }[];
    if (usuario.length === 0) return null;

    const freqDefault = await this.frecuenciaDefault();
    const cfg = (await this.dataSource.query(
      `select c.frecuencia_dias, c.fk_metodo_devolucion, c.referencia_devolucion,
              mp.nombre as metodo_devolucion,
              (
                select max(ll.creado_en)::text
                from public.liquidacion_lote ll
                where ll.fk_usuario_cliente = c.fk_usuario
              ) as ultima_liquidacion_en
       from public.cliente_liquidacion_config c
       left join public.metodo_pago mp on mp.id_metodo_pago = c.fk_metodo_devolucion
       where c.fk_usuario = $1`,
      [idUsuario],
    )) as {
      frecuencia_dias: number;
      fk_metodo_devolucion: number | null;
      referencia_devolucion: string | null;
      metodo_devolucion: string | null;
      ultima_liquidacion_en: string | null;
    }[];

    const u = usuario[0]!;
    if (cfg.length === 0) {
      const ultima = (await this.dataSource.query(
        `select max(creado_en)::text as ultima from public.liquidacion_lote where fk_usuario_cliente = $1`,
        [idUsuario],
      )) as { ultima: string | null }[];
      return {
        idUsuario,
        nombreCliente: `${u.nombres} ${u.apellidos}`.trim(),
        frecuenciaDias: freqDefault,
        idMetodoDevolucion: null,
        metodoDevolucion: null,
        referenciaDevolucion: null,
        ultimaLiquidacionEn: ultima[0]?.ultima ?? null,
      };
    }

    const c = cfg[0]!;
    return {
      idUsuario,
      nombreCliente: `${u.nombres} ${u.apellidos}`.trim(),
      frecuenciaDias: c.frecuencia_dias,
      idMetodoDevolucion: c.fk_metodo_devolucion,
      metodoDevolucion: c.metodo_devolucion,
      referenciaDevolucion: c.referencia_devolucion,
      ultimaLiquidacionEn: c.ultima_liquidacion_en,
    };
  }

  async upsertConfig(
    idUsuario: number,
    input: ActualizarClienteLiquidacionConfigInput,
  ): Promise<ClienteLiquidacionConfig> {
    if (!(await this.tieneTablas())) {
      throw new BadRequestException(
        'Faltan tablas de liquidación. Ejecute database/24-liquidacion-cliente.sql en Supabase.',
      );
    }

    const usuario = (await this.dataSource.query(
      `select 1 from public.usuarios where id_usuario = $1`,
      [idUsuario],
    )) as unknown[];
    if (usuario.length === 0) {
      throw new NotFoundException(`Usuario ${idUsuario} no encontrado`);
    }

    const freqDefault = await this.frecuenciaDefault();
    const actual = await this.getConfig(idUsuario);
    const frecuencia = input.frecuenciaDias ?? actual?.frecuenciaDias ?? freqDefault;
    if (frecuencia < 1 || frecuencia > 90) {
      throw new BadRequestException('frecuenciaDias debe estar entre 1 y 90.');
    }

    const idMetodo =
      input.idMetodoDevolucion !== undefined
        ? input.idMetodoDevolucion
        : (actual?.idMetodoDevolucion ?? null);
    const referencia =
      input.referenciaDevolucion !== undefined
        ? input.referenciaDevolucion?.trim() || null
        : (actual?.referenciaDevolucion ?? null);

    if (input.idMetodoDevolucion != null) {
      const mp = (await this.dataSource.query(
        `select 1 from public.metodo_pago where id_metodo_pago = $1`,
        [input.idMetodoDevolucion],
      )) as unknown[];
      if (mp.length === 0) {
        throw new BadRequestException(
          `metodo_pago no encontrado: ${input.idMetodoDevolucion}. Ver GET /catalogo/metodos-pago.`,
        );
      }
    }

    await this.dataSource.query(
      `insert into public.cliente_liquidacion_config
         (fk_usuario, frecuencia_dias, fk_metodo_devolucion, referencia_devolucion)
       values ($1, $2, $3, $4)
       on conflict (fk_usuario) do update set
         frecuencia_dias = excluded.frecuencia_dias,
         fk_metodo_devolucion = excluded.fk_metodo_devolucion,
         referencia_devolucion = excluded.referencia_devolucion,
         actualizado_en = now()`,
      [idUsuario, frecuencia, idMetodo, referencia],
    );

    const updated = await this.getConfig(idUsuario);
    if (!updated) {
      throw new NotFoundException(`Usuario ${idUsuario} no encontrado`);
    }
    return updated;
  }

  async listPendientes(): Promise<ClienteLiquidacionPendiente[]> {
    if (!(await this.tieneTablas())) {
      throw new BadRequestException(
        'Faltan tablas de liquidación. Ejecute database/24-liquidacion-cliente.sql en Supabase.',
      );
    }

    const freqDefault = await this.frecuenciaDefault();
    const rows = (await this.dataSource.query(
      `with pendientes as (
         select p.fk_usuario_solicitud as id_usuario,
           count(*)::int as pedidos_pendientes,
           sum(coalesce(p.valor_recaudado, 0)) as recaudo_pendiente,
           sum(
             case when coalesce(p.pagado_por_remitente, false)
               then 0
               else coalesce(p.tarifa_envio, p.precio, 0)
             end
           ) as tarifa_pendiente,
           sum(
             case when coalesce(p.pagado_por_remitente, false)
               then coalesce(p.valor_recaudado, 0)
               else greatest(coalesce(p.valor_recaudado, 0) - coalesce(p.tarifa_envio, p.precio, 0), 0)
             end
           ) as neto_pendiente
         from public.pedidos p
         where p.fk_estado_pedido = $1
           and coalesce(p.valor_recaudado, 0) > 0
           and not exists (
             select 1 from public.liquidacion_detalle ld where ld.fk_pedido = p.id_pedido
           )
         group by p.fk_usuario_solicitud
       )
       select u.id_usuario, u.nombres, u.apellidos,
         coalesce(c.frecuencia_dias, $2) as frecuencia_dias,
         pend.pedidos_pendientes, pend.recaudo_pendiente, pend.tarifa_pendiente, pend.neto_pendiente,
         (
           select max(ll.creado_en)::text from public.liquidacion_lote ll
           where ll.fk_usuario_cliente = u.id_usuario
         ) as ultima_liquidacion_en
       from pendientes pend
       inner join public.usuarios u on u.id_usuario = pend.id_usuario
       left join public.cliente_liquidacion_config c on c.fk_usuario = u.id_usuario
       order by u.nombres, u.apellidos`,
      [ESTADO_PEDIDO_ENTREGADO_ID, freqDefault],
    )) as ClientePendienteRow[];

    const now = Date.now();
    return rows.map((r) => {
      const frecuencia = Number(r.frecuencia_dias ?? freqDefault);
      const ultima = r.ultima_liquidacion_en ? new Date(r.ultima_liquidacion_en).getTime() : null;
      const diasDesdeUltima =
        ultima == null ? frecuencia : Math.floor((now - ultima) / (24 * 60 * 60 * 1000));
      return {
        idUsuario: r.id_usuario,
        nombreCliente: `${r.nombres} ${r.apellidos}`.trim(),
        frecuenciaDias: frecuencia,
        pedidosPendientes: Number(r.pedidos_pendientes),
        recaudoPendiente: Number(r.recaudo_pendiente),
        tarifaPendiente: Number(r.tarifa_pendiente),
        netoPendiente: Number(r.neto_pendiente),
        listoParaLiquidar: diasDesdeUltima >= frecuencia,
      };
    });
  }

  async generarLiquidacion(input: GenerarLiquidacionInput): Promise<LiquidacionLoteResultado> {
    if (!(await this.tieneTablas())) {
      throw new BadRequestException(
        'Faltan tablas de liquidación. Ejecute database/24-liquidacion-cliente.sql en Supabase.',
      );
    }

    const config = await this.getConfig(input.idUsuarioCliente);
    if (!config) {
      throw new NotFoundException(`Cliente ${input.idUsuarioCliente} no encontrado`);
    }

    const pendientes = await this.pedidosPendientesCliente(input.idUsuarioCliente);
    if (pendientes.length === 0) {
      throw new BadRequestException(
        `No hay recaudos pendientes de liquidar para el cliente ${input.idUsuarioCliente}.`,
      );
    }

    const idMetodo =
      input.idMetodoDevolucion ?? config.idMetodoDevolucion ?? null;
    if (idMetodo != null) {
      const mp = (await this.dataSource.query(
        `select nombre from public.metodo_pago where id_metodo_pago = $1`,
        [idMetodo],
      )) as { nombre: string }[];
      if (mp.length === 0) {
        throw new BadRequestException(`metodo_pago no encontrado: ${idMetodo}`);
      }
    }

    const lineas = pendientes.map((p) => {
      const recaudo = Number(p.valor_recaudado);
      const tarifa = Number(p.tarifa_envio);
      const neto = montoNetoPedido(recaudo, tarifa, p.pagado_por_remitente);
      return {
        idPedido: p.id_pedido,
        numGuia: p.num_guia,
        valorRecaudado: recaudo,
        tarifaEnvio: tarifa,
        montoNeto: neto,
      };
    });

    const recaudoTotal = lineas.reduce((s, l) => s + l.valorRecaudado, 0);
    const tarifaDescontada = lineas.reduce(
      (s, l) => s + (l.valorRecaudado - l.montoNeto),
      0,
    );
    const montoNeto = lineas.reduce((s, l) => s + l.montoNeto, 0);
    const fechaDesde = pendientes[0]!.fecha_entrega;
    const fechaHasta = pendientes[pendientes.length - 1]!.fecha_entrega;

    return this.dataSource.transaction(async (manager) => {
      const loteRows = (await manager.query(
        `insert into public.liquidacion_lote (
           fk_usuario_cliente, recaudo_total, tarifa_descontada, monto_neto, pedidos_total,
           fk_metodo_devolucion, referencia_pago, fecha_desde, fecha_hasta
         ) values ($1, $2, $3, $4, $5, $6, $7, $8::date, $9::date)
         returning id_liquidacion, creado_en`,
        [
          input.idUsuarioCliente,
          recaudoTotal,
          tarifaDescontada,
          montoNeto,
          lineas.length,
          idMetodo,
          input.referenciaPago?.trim() || null,
          fechaDesde,
          fechaHasta,
        ],
      )) as { id_liquidacion: number; creado_en: Date }[];

      const idLiquidacion = loteRows[0]!.id_liquidacion;
      const generadoEn = loteRows[0]!.creado_en;

      for (const l of lineas) {
        await manager.query(
          `insert into public.liquidacion_detalle
             (id_liquidacion, fk_pedido, valor_recaudado, tarifa_envio, monto_neto)
           values ($1, $2, $3, $4, $5)`,
          [idLiquidacion, l.idPedido, l.valorRecaudado, l.tarifaEnvio, l.montoNeto],
        );
      }

      let metodoNombre: string | null = config.metodoDevolucion;
      if (idMetodo != null) {
        const mp = (await manager.query(
          `select nombre from public.metodo_pago where id_metodo_pago = $1`,
          [idMetodo],
        )) as { nombre: string }[];
        metodoNombre = mp[0]?.nombre ?? null;
      }

      this.logger.log(
        `Liquidación ${idLiquidacion} cliente=${input.idUsuarioCliente} neto=${montoNeto} pedidos=${lineas.length}`,
      );

      return {
        idLiquidacion,
        idUsuarioCliente: input.idUsuarioCliente,
        nombreCliente: config.nombreCliente,
        recaudoTotal,
        tarifaDescontada,
        montoNeto,
        pedidosTotal: lineas.length,
        idMetodoDevolucion: idMetodo,
        metodoDevolucion: metodoNombre,
        referenciaPago: input.referenciaPago?.trim() || null,
        fechaDesde,
        fechaHasta,
        generadoEn: generadoEn.toISOString(),
        moneda: 'COP' as const,
        lineas,
      };
    });
  }
}
