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

export type DispersionPedidoPendiente = {
  idPedido: number;
  numGuia: string;
  fechaEntrega: string;
};

export type DispersionRepartidorLinea = {
  idUsuario: number;
  codigo: string;
  nombre: string;
  entregas: number;
  tarifaUnitaria: number;
  monto: number;
  pedidos: DispersionPedidoPendiente[];
};

export type DispersionRepartidorPreview = {
  fecha: string;
  tarifaUnitaria: number;
  moneda: 'COP';
  entregasTotal: number;
  montoTotal: number;
  repartidoresTotal: number;
  lineas: DispersionRepartidorLinea[];
};

export type DispersionRepartidorResultado = {
  idDispersion: number;
  montoTotal: number;
  entregasTotal: number;
  repartidoresTotal: number;
  moneda: 'COP';
  generadoEn: string;
  /** Día de entrega liquidado (YYYY-MM-DD). */
  fecha: string;
  tarifaUnitaria: number;
  lineas: DispersionRepartidorLinea[];
};

/** Pago registrado para un solo repartidor. */
export type DispersionRepartidorIndividualResultado = {
  idDispersion: number;
  idUsuario: number;
  codigo: string;
  nombre: string;
  fecha: string;
  tarifaUnitaria: number;
  entregas: number;
  monto: number;
  moneda: 'COP';
  generadoEn: string;
  pedidos: DispersionPedidoPendiente[];
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
  previewDispersion(fecha?: string, idUsuarioRepartidor?: number): Promise<DispersionRepartidorPreview>;
  generarDispersionTotal(fecha?: string): Promise<DispersionRepartidorResultado>;
  generarDispersionRepartidor(
    idUsuarioRepartidor: number,
    fecha?: string,
  ): Promise<DispersionRepartidorIndividualResultado>;
}
