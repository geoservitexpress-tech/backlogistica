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
  /** `estado_pedido.id_estado_pedido` (2=Asignado, 3=Recibido repartidor, 5=Entregado). */
  idEstadoPedido: number;
  estadoPedido: string;
  /** `tipo_pedido.id_tipo_pedido` (1=Normal, 2=Express). */
  idTipoPedido: number;
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
  /** Solo recogida: texto de `fk_direccion_destino` (entrega final). */
  direccionDestino: string | null;
  destinatarioDestinoNombre: string | null;
  destinatarioDestinoTelefono: string | null;
  fragil: boolean;
  observacionesManifiesto: string | null;
  fotosPaqueteUrls: string[] | null;
  pagadoPorRemitente: boolean;
  precio: number;
}
