import { Inject, Injectable } from '@nestjs/common';
import { resolverPaginacion } from '../domain/paginacion';
import {
  margenPorcentaje,
  periodoAnterior,
  resolverFinanzasPeriodo,
  variacionPorcentaje,
} from './finanzas-periodo';
import type { ListTransaccionesRecientesFilter } from '../domain/read-models/transaccion-reciente';
import type { FinanzasKpiPort } from '../domain/ports/finanzas-kpi.port';
import { FINANZAS_KPI } from '../finanzas.tokens';
import type { FinanzasPeriodoQueryDto } from '../presentation/http/dto/finanzas-periodo.query.dto';
import type { ListTransaccionesRecientesQueryDto } from '../presentation/http/dto/list-transacciones-recientes.query.dto';

@Injectable()
export class GetIngresosTotalesUseCase {
  constructor(@Inject(FINANZAS_KPI) private readonly finanzas: FinanzasKpiPort) {}

  async execute(query: FinanzasPeriodoQueryDto) {
    const periodo = resolverFinanzasPeriodo(query.fechaDesde, query.fechaHasta);
    const anterior = periodoAnterior(periodo);

    const [valor, valorPeriodoAnterior] = await Promise.all([
      this.finanzas.getIngresosTotales(periodo.desdeUtc, periodo.hastaExclusiveUtc),
      this.finanzas.getIngresosTotales(anterior.desdeUtc, anterior.hastaExclusiveUtc),
    ]);

    return {
      valor,
      moneda: 'COP' as const,
      variacionPorcentaje: variacionPorcentaje(valor, valorPeriodoAnterior),
      valorPeriodoAnterior,
      fechaDesde: periodo.fechaDesde,
      fechaHasta: periodo.fechaHasta,
      dias: periodo.dias,
    };
  }
}

@Injectable()
export class GetPagoPersonalUseCase {
  constructor(@Inject(FINANZAS_KPI) private readonly finanzas: FinanzasKpiPort) {}

  async execute(query: FinanzasPeriodoQueryDto) {
    const periodo = resolverFinanzasPeriodo(query.fechaDesde, query.fechaHasta);
    const detalle = await this.finanzas.getPagoPersonal(periodo.desdeUtc, periodo.hastaExclusiveUtc);

    return {
      valor: detalle.valor,
      moneda: 'COP' as const,
      entregasCompletadas: detalle.entregasCompletadas,
      tarifaPorEntrega: detalle.tarifaPorEntrega,
      pagoFijoProrrateado: detalle.pagoFijoProrrateado,
      fechaDesde: periodo.fechaDesde,
      fechaHasta: periodo.fechaHasta,
      dias: periodo.dias,
    };
  }
}

@Injectable()
export class GetUtilidadBrutaUseCase {
  constructor(@Inject(FINANZAS_KPI) private readonly finanzas: FinanzasKpiPort) {}

  async execute(query: FinanzasPeriodoQueryDto) {
    const periodo = resolverFinanzasPeriodo(query.fechaDesde, query.fechaHasta);

    const [ingresosTotales, pago] = await Promise.all([
      this.finanzas.getIngresosTotales(periodo.desdeUtc, periodo.hastaExclusiveUtc),
      this.finanzas.getPagoPersonal(periodo.desdeUtc, periodo.hastaExclusiveUtc),
    ]);

    const valor = ingresosTotales - pago.valor;

    return {
      valor,
      moneda: 'COP' as const,
      margenPorcentaje: margenPorcentaje(valor, ingresosTotales),
      ingresosTotales,
      pagoPersonal: pago.valor,
      fechaDesde: periodo.fechaDesde,
      fechaHasta: periodo.fechaHasta,
      dias: periodo.dias,
    };
  }
}

@Injectable()
export class ListTransaccionesRecientesUseCase {
  constructor(@Inject(FINANZAS_KPI) private readonly finanzas: FinanzasKpiPort) {}

  execute(query: ListTransaccionesRecientesQueryDto) {
    const { page, limit } = resolverPaginacion(query);
    const filter: ListTransaccionesRecientesFilter = { page, limit };

    if (query.fechaDesde || query.fechaHasta) {
      const periodo = resolverFinanzasPeriodo(query.fechaDesde, query.fechaHasta);
      filter.desdeUtc = periodo.desdeUtc;
      filter.hastaExclusiveUtc = periodo.hastaExclusiveUtc;
    }

    return this.finanzas.listTransaccionesRecientes(filter);
  }
}
