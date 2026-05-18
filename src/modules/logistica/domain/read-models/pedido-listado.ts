import type { PedidoTipoOperacion } from '../pedido-tipo-operacion';

/**
 * Vista de API: solo el nombre (o etiqueta breve) de cada tabla relacionada,
 * sin objetos completos ni ids de catálogos.
 */
export interface PedidoListado {
  idPedido: number;
  numGuia: string;
  creadoEn: string;
  /** Nombre del registro en `tipo_pedido` (catálogo). */
  tipoPedido: string;
  /** Inferido desde `metodoRecepcion` (Entrega / Recogida). */
  tipoOperacion: PedidoTipoOperacion | null;
  /** `pedidos.fecha_entrega` (`YYYY-MM-DD`). */
  fechaEntrega: string;
  estadoPedido: string;
  metodoRecepcion: string;
  usuarioSolicitud: string;
  usuarioRecolector: string | null;
  usuarioRepartidor: string | null;
  paquete: string;
  direccion: string;
  /** `direccion.fk_zona` (solo Bogotá D.C.). */
  idZonaBogota: number | null;
  /** Nombre en `zona_bogota` (localidad Bogotá). */
  zonaBogota: string | null;
  destinatarioNombre: string | null;
  destinatarioTelefono: string | null;
  fragil: boolean;
  observacionesManifiesto: string | null;
  fotosPaqueteUrls: string[] | null;
}
