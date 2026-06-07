import type { Paginado } from '../paginacion';

export type TransaccionReciente = {
  /** Número legible de la factura (ej. `FAC-20260523-594CE1`). */
  numeroFactura: string;
  /** Guía del pedido (`pedidos.num_guia`). */
  numGuia: string;
  /** Nombre del cliente solicitante. */
  cliente: string;
  /** Monto de la factura (`factura.monto`). */
  valor: number;
  moneda: 'COP';
  estadoFactura: string;
  creadoEn: string;
};

export type ListTransaccionesRecientesFilter = {
  page: number;
  limit: number;
  desdeUtc?: Date;
  hastaExclusiveUtc?: Date;
};

export type TransaccionesRecientesPaginado = Paginado<TransaccionReciente>;
