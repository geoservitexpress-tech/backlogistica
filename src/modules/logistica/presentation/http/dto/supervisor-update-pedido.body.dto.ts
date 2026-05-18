import { OmitType } from '@nestjs/swagger';
import { UpdatePedidoBodyDto } from './update-pedido.body.dto';

/**
 * PATCH `/supervisor/pedidos/:id` — mismos campos editables que `PATCH /pedidos/:id`,
 * **excepto** manifiesto y fotos del paquete (`observacionesManifiesto`, `fotosPaqueteUrls`, `fotosPaqueteBase64`).
 *
 * Incluye: estado, fecha de entrega, repartidor/recolector, destinatario, dirección completa,
 * tipo de pedido, método de recepción, paquete, precios y frágil.
 */
export class SupervisorUpdatePedidoBodyDto extends OmitType(UpdatePedidoBodyDto, [
  'observacionesManifiesto',
  'fotosPaqueteUrls',
  'fotosPaqueteBase64',
] as const) {}
