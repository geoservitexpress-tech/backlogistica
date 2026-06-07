import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { VAR } from '../../../configuracion/variable.keys';
import { VariablesService } from '../../../configuracion/variables.service';
import type { FinanzasKpiPort } from '../../domain/ports/finanzas-kpi.port';
import {
  ESTADO_FACTURA_PAGADA_ID,
  ESTADO_FACTURA_SALDO_A_FAVOR_ID,
} from '../../logistica-factura-estados.constants';
import { ESTADO_PEDIDO_ENTREGADO_ID } from '../../logistica-pedido-estados.constants';
import type {
  ListTransaccionesRecientesFilter,
  TransaccionesRecientesPaginado,
} from '../../domain/read-models/transaccion-reciente';
import { buildPaginado } from '../../domain/paginacion';
import { FacturaOrmEntity } from './factura.orm-entity';
import { facturaOrmToTransaccionReciente } from './transaccion-reciente.mapper';

@Injectable()
export class TypeOrmFinanzasKpiRepository implements FinanzasKpiPort {
  private readonly logger = new Logger(TypeOrmFinanzasKpiRepository.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(FacturaOrmEntity)
    private readonly facturaRepo: Repository<FacturaOrmEntity>,
    private readonly variables: VariablesService,
  ) {}

  private ymdFromUtcInstant(d: Date): string {
    return d.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  }

  async getIngresosTotales(desdeUtc: Date, hastaExclusiveUtc: Date): Promise<number> {
    try {
      const rows = (await this.dataSource.query(
        `select coalesce(sum(f.monto_cobrado), 0)::float8 as total
         from public.factura f
         where f.fecha_cierre is not null
           and f.fk_estado_factura = any($3::int[])
           and f.fecha_cierre >= $1::timestamptz
           and f.fecha_cierre < $2::timestamptz`,
        [
          desdeUtc.toISOString(),
          hastaExclusiveUtc.toISOString(),
          [ESTADO_FACTURA_PAGADA_ID, ESTADO_FACTURA_SALDO_A_FAVOR_ID],
        ],
      )) as { total: number }[];
      return Number(rows[0]?.total ?? 0);
    } catch (e) {
      if (e instanceof QueryFailedError) {
        const code = (e.driverError as { code?: string } | undefined)?.code;
        if (code === '42P01' || code === '42703') {
          this.logger.warn('Tabla/columnas factura no disponibles para ingresos; retornando 0');
          return 0;
        }
      }
      throw e;
    }
  }

  async getPagoPersonal(
    desdeUtc: Date,
    hastaExclusiveUtc: Date,
  ): Promise<{
    valor: number;
    entregasCompletadas: number;
    tarifaPorEntrega: number;
    pagoFijoProrrateado: number;
  }> {
    const tarifaPorEntrega = await this.variables.getInt(
      VAR.FINANZAS_TARIFA_PAGO_REPARTIDOR_ENTREGA,
      12_000,
      { min: 0 },
    );
    const pagoFijoMensual = await this.variables.getInt(
      VAR.FINANZAS_PAGO_PERSONAL_FIJO_MENSUAL,
      0,
      { min: 0 },
    );

    const fechaDesde = this.ymdFromUtcInstant(desdeUtc);
    const fechaHasta = this.ymdFromUtcInstant(
      new Date(hastaExclusiveUtc.getTime() - 24 * 60 * 60 * 1000),
    );

    const rows = (await this.dataSource.query(
      `select count(*)::int as entregas
       from public.pedidos p
       where p.fk_estado_pedido = $1::int
         and p.fk_usuario_repartidor is not null
         and p.fecha_entrega >= $2::date
         and p.fecha_entrega <= $3::date`,
      [ESTADO_PEDIDO_ENTREGADO_ID, fechaDesde, fechaHasta],
    )) as { entregas: number }[];

    const entregasCompletadas = Number(rows[0]?.entregas ?? 0);
    const variableEntregas = entregasCompletadas * tarifaPorEntrega;

    const [yDesde, mDesde] = fechaDesde.split('-').map(Number);
    const diasMesDesde = new Date(yDesde, mDesde, 0).getDate();
    const diasPeriodo =
      Math.round((hastaExclusiveUtc.getTime() - desdeUtc.getTime()) / (24 * 60 * 60 * 1000)) || 1;

    let pagoFijoProrrateado = 0;
    if (pagoFijoMensual > 0) {
      if (fechaDesde.slice(0, 7) === fechaHasta.slice(0, 7)) {
        pagoFijoProrrateado = Math.round((pagoFijoMensual * diasPeriodo) / diasMesDesde);
      } else {
        pagoFijoProrrateado = Math.round((pagoFijoMensual * diasPeriodo) / 30);
      }
    }

    return {
      valor: variableEntregas + pagoFijoProrrateado,
      entregasCompletadas,
      tarifaPorEntrega,
      pagoFijoProrrateado,
    };
  }

  async listTransaccionesRecientes(
    filter: ListTransaccionesRecientesFilter,
  ): Promise<TransaccionesRecientesPaginado> {
    try {
      const offset = (filter.page - 1) * filter.limit;
      const qb = this.facturaRepo
        .createQueryBuilder('f')
        .innerJoinAndSelect('f.cliente', 'c')
        .innerJoinAndSelect('f.pedido', 'p')
        .innerJoinAndSelect('f.estadoFactura', 'ef')
        .orderBy('f.creadoEn', 'DESC')
        .skip(offset)
        .take(filter.limit);

      if (filter.desdeUtc) {
        qb.andWhere('f.creado_en >= :desde', { desde: filter.desdeUtc });
      }
      if (filter.hastaExclusiveUtc) {
        qb.andWhere('f.creado_en < :hasta', { hasta: filter.hastaExclusiveUtc });
      }

      const [rows, total] = await qb.getManyAndCount();
      return buildPaginado(
        rows.map(facturaOrmToTransaccionReciente),
        total,
        filter.page,
        filter.limit,
      );
    } catch (e) {
      if (e instanceof QueryFailedError) {
        const code = (e.driverError as { code?: string } | undefined)?.code;
        if (code === '42P01' || code === '42703') {
          this.logger.warn('Tabla factura no disponible para transacciones recientes; retornando vacío');
          return buildPaginado([], 0, filter.page, filter.limit);
        }
      }
      throw e;
    }
  }
}
