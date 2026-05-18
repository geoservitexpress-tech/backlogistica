/** Relaciones TypeORM necesarias para armar `PedidoListado` (solo nombres legibles). */
export const PEDIDO_RELATIONS = [
  'tipoPedido',
  'estadoPedido',
  'metodoRecepcion',
  'usuarioSolicitud',
  'usuarioRecolector',
  'usuarioRepartidor',
  'paquete',
  'direccion',
  'direccion.tipoVia',
  'direccion.pais',
  'direccion.departamento',
  'direccion.ciudad',
  'direccion.zonaBogota',
  'destinatario',
] as const;
