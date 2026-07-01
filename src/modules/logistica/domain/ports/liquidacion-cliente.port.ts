import type { Paginado } from '../paginacion';

export type ClienteLiquidacionConfig = {
  idUsuario: number;
  nombreCliente: string;
  frecuenciaDias: number;
  idMetodoDevolucion: number | null;
  metodoDevolucion: string | null;
  referenciaDevolucion: string | null;
  ultimaLiquidacionEn: string | null;
};

export type ClienteLiquidacionPendiente = {
  idUsuario: number;
  nombreCliente: string;
  frecuenciaDias: number;
  pedidosPendientes: number;
  recaudoPendiente: number;
  tarifaPendiente: number;
  netoPendiente: number;
  listoParaLiquidar: boolean;
};

export type LiquidacionDetalleLinea = {
  idPedido: number;
  numGuia: string;
  valorRecaudado: number;
  tarifaEnvio: number;
  montoNeto: number;
};

export type LiquidacionLoteResultado = {
  idLiquidacion: number;
  idUsuarioCliente: number;
  nombreCliente: string;
  recaudoTotal: number;
  tarifaDescontada: number;
  montoNeto: number;
  pedidosTotal: number;
  idMetodoDevolucion: number | null;
  metodoDevolucion: string | null;
  referenciaPago: string | null;
  fechaDesde: string;
  fechaHasta: string;
  generadoEn: string;
  moneda: 'COP';
  lineas: LiquidacionDetalleLinea[];
};

export type ActualizarClienteLiquidacionConfigInput = {
  frecuenciaDias?: number;
  idMetodoDevolucion?: number | null;
  referenciaDevolucion?: string | null;
};

export type GenerarLiquidacionInput = {
  idUsuarioCliente: number;
  idMetodoDevolucion?: number | null;
  referenciaPago?: string | null;
};

export interface LiquidacionClientePort {
  getConfig(idUsuario: number): Promise<ClienteLiquidacionConfig | null>;
  upsertConfig(
    idUsuario: number,
    input: ActualizarClienteLiquidacionConfigInput,
  ): Promise<ClienteLiquidacionConfig>;
  listPendientes(): Promise<ClienteLiquidacionPendiente[]>;
  generarLiquidacion(input: GenerarLiquidacionInput): Promise<LiquidacionLoteResultado>;
}
