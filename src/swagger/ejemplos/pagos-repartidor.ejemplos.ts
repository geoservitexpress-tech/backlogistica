import { SWAGGER_EJEMPLO_ID_PEDIDO, SWAGGER_EJEMPLO_ID_USUARIO } from '../swagger-ejemplos';

/** `usuarios.id_usuario` del repartidor de ejemplo (rol REPARTIDOR en seed). */
export const SWAGGER_EJEMPLO_ID_REPARTIDOR = 2;

export const EJEMPLO_FECHA_DISPERSION = '2026-06-02';

export const EJEMPLO_TARIFA_PAGO_REPARTIDOR = 12_000;

const pedidoJuan1 = {
  idPedido: SWAGGER_EJEMPLO_ID_PEDIDO,
  numGuia: 'BL-20260602-A1B2C3',
  fechaEntrega: EJEMPLO_FECHA_DISPERSION,
} as const;

const pedidoJuan2 = {
  idPedido: SWAGGER_EJEMPLO_ID_PEDIDO + 1,
  numGuia: 'BL-20260602-D4E5F6',
  fechaEntrega: EJEMPLO_FECHA_DISPERSION,
} as const;

const pedidoCarlos1 = {
  idPedido: SWAGGER_EJEMPLO_ID_PEDIDO + 2,
  numGuia: 'BL-20260602-G7H8I9',
  fechaEntrega: EJEMPLO_FECHA_DISPERSION,
} as const;

export const EJEMPLO_QUERY_DISPERSION_PREVIEW = {
  fecha: EJEMPLO_FECHA_DISPERSION,
} as const;

export const EJEMPLO_QUERY_DISPERSION_PREVIEW_REPARTIDOR = {
  fecha: EJEMPLO_FECHA_DISPERSION,
  idUsuario: SWAGGER_EJEMPLO_ID_REPARTIDOR,
} as const;

/** GET /admin/pagos-repartidores/dispersion/preview — todos los repartidores del día. */
export const EJEMPLO_DISPERSION_PREVIEW = {
  fecha: EJEMPLO_FECHA_DISPERSION,
  tarifaUnitaria: EJEMPLO_TARIFA_PAGO_REPARTIDOR,
  moneda: 'COP',
  entregasTotal: 3,
  montoTotal: 36_000,
  repartidoresTotal: 2,
  lineas: [
    {
      idUsuario: SWAGGER_EJEMPLO_ID_REPARTIDOR,
      codigo: 'RP-0002',
      nombre: 'Carlos Repartidor',
      entregas: 2,
      tarifaUnitaria: EJEMPLO_TARIFA_PAGO_REPARTIDOR,
      monto: 24_000,
      pedidos: [pedidoJuan1, pedidoJuan2],
    },
    {
      idUsuario: SWAGGER_EJEMPLO_ID_USUARIO,
      codigo: 'RP-0001',
      nombre: 'Juan Pérez',
      entregas: 1,
      tarifaUnitaria: EJEMPLO_TARIFA_PAGO_REPARTIDOR,
      monto: 12_000,
      pedidos: [pedidoCarlos1],
    },
  ],
} as const;

/** GET /admin/pagos-repartidores/dispersion/preview?idUsuario=2 */
export const EJEMPLO_DISPERSION_PREVIEW_UN_REPARTIDOR = {
  fecha: EJEMPLO_FECHA_DISPERSION,
  tarifaUnitaria: EJEMPLO_TARIFA_PAGO_REPARTIDOR,
  moneda: 'COP',
  entregasTotal: 2,
  montoTotal: 24_000,
  repartidoresTotal: 1,
  lineas: [EJEMPLO_DISPERSION_PREVIEW.lineas[0]],
} as const;

/** POST /admin/pagos-repartidores/repartidores/{idUsuario}/dispersion/generar */
export const EJEMPLO_DISPERSION_REPARTIDOR_INDIVIDUAL = {
  idDispersion: 12,
  idUsuario: SWAGGER_EJEMPLO_ID_REPARTIDOR,
  codigo: 'RP-0002',
  nombre: 'Carlos Repartidor',
  fecha: EJEMPLO_FECHA_DISPERSION,
  tarifaUnitaria: EJEMPLO_TARIFA_PAGO_REPARTIDOR,
  entregas: 2,
  monto: 24_000,
  moneda: 'COP',
  generadoEn: '2026-06-02T23:00:00.000Z',
  pedidos: [pedidoJuan1, pedidoJuan2],
} as const;

/** POST /admin/pagos-repartidores/dispersion/generar — todos los repartidores del día. */
export const EJEMPLO_DISPERSION_TOTAL = {
  idDispersion: 13,
  montoTotal: 36_000,
  entregasTotal: 3,
  repartidoresTotal: 2,
  moneda: 'COP',
  generadoEn: '2026-06-02T23:05:00.000Z',
  fecha: EJEMPLO_FECHA_DISPERSION,
  tarifaUnitaria: EJEMPLO_TARIFA_PAGO_REPARTIDOR,
  lineas: EJEMPLO_DISPERSION_PREVIEW.lineas,
} as const;
