import type { Paginado } from '../paginacion';

export type RepartidorPagoListado = {
  codigo: string;
  nombre: string;
  vehiculo: string | null;
  zona: string | null;
  entregasTotales: number;
  /** `ocupado` = pedidos en ruta ese día; `libre` = sin pedidos activos. */
  estado: 'ocupado' | 'libre';
};

export type RepartidorPagoListadoPaginado = Paginado<RepartidorPagoListado>;

export type PagosRepartidorKpis = {
  totalPendientePago: number;
  moneda: 'COP';
  variacionSemanaAnteriorPorcentaje: number;
  repartidoresActivos: number;
  entregasHoy: number;
  metaDiaria: number;
  porcentajeMetaDiaria: number;
};

export type DispersionRepartidorLinea = {
  codigo: string;
  nombre: string;
  entregas: number;
  monto: number;
};

export type DispersionRepartidorResultado = {
  idDispersion: number;
  montoTotal: number;
  entregasTotal: number;
  repartidoresTotal: number;
  moneda: 'COP';
  generadoEn: string;
  lineas: DispersionRepartidorLinea[];
};

export type ListRepartidoresPagoFilter = {
  page: number;
  limit: number;
  search?: string;
  /** `ocupado` | `libre` */
  estado?: 'ocupado' | 'libre';
  /** Día para calcular estado (YYYY-MM-DD). Default: hoy Bogotá. */
  fecha?: string;
};

export interface PagosRepartidorPort {
  getKpis(): Promise<PagosRepartidorKpis>;
  listRepartidores(filter: ListRepartidoresPagoFilter): Promise<RepartidorPagoListadoPaginado>;
  generarDispersionTotal(): Promise<DispersionRepartidorResultado>;
}
