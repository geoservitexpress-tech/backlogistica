import type {
  ListTransaccionesRecientesFilter,
  TransaccionReciente,
  TransaccionesRecientesPaginado,
} from '../read-models/transaccion-reciente';

export type FinanzasPeriodoResumen = {
  fechaDesde: string;
  fechaHasta: string;
  dias: number;
};

export type IngresosTotalesKpi = FinanzasPeriodoResumen & {
  valor: number;
  moneda: 'COP';
  variacionPorcentaje: number;
  valorPeriodoAnterior: number;
};

export type PagoPersonalKpi = FinanzasPeriodoResumen & {
  valor: number;
  moneda: 'COP';
  entregasCompletadas: number;
  tarifaPorEntrega: number;
  pagoFijoProrrateado: number;
};

export type UtilidadBrutaKpi = FinanzasPeriodoResumen & {
  valor: number;
  moneda: 'COP';
  margenPorcentaje: number;
  ingresosTotales: number;
  pagoPersonal: number;
};

export interface FinanzasKpiPort {
  getIngresosTotales(desdeUtc: Date, hastaExclusiveUtc: Date): Promise<number>;
  getPagoPersonal(desdeUtc: Date, hastaExclusiveUtc: Date): Promise<{
    valor: number;
    entregasCompletadas: number;
    tarifaPorEntrega: number;
    pagoFijoProrrateado: number;
  }>;
  listTransaccionesRecientes(
    filter: ListTransaccionesRecientesFilter,
  ): Promise<TransaccionesRecientesPaginado>;
}
