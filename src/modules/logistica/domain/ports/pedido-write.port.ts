import type { PedidoListado } from '../read-models/pedido-listado';
import type { PedidoDireccionDestinatarioInput } from '../pedido-direccion-destinatario.input';

/**
 * Payload público alineado con el formulario "Nuevo pedido" (app).
 * El solicitante es un **`usuarios.id_usuario`** con rol **Cliente** o **Administrador** en `usuario_rol` → `rol`.
 *
 * **Recogida** (`idMetodoRecepcion` = 1): los campos de nivel raíz son el **punto de recogida**;
 * `destinoEntrega` es obligatorio y se guarda en `fk_direccion_destino` / `fk_destinatario_destino`.
 */
export type CreatePedidoFormInput = PedidoDireccionDestinatarioInput & {
  idUsuario: number;
  /** `tipo_pedido.id_tipo_pedido` (ej. 1=Normal, 2=Express). */
  idTipoPedido: number;
  /** Día de entrega programado (`pedidos.fecha_entrega`, `YYYY-MM-DD`). */
  fechaEntrega: string;
  /** `metodo_recepcion.id_metodo_recepcion` (ej. 2 = Entrega). Ver GET /catalogo/metodos-recepcion. */
  idMetodoRecepcion: number;
  /** Obligatorio si `idMetodoRecepcion` = 1 (Recogida): dirección y destinatario de entrega final. */
  destinoEntrega?: PedidoDireccionDestinatarioInput;
  /** Texto libre para `paquete.nombre` (ej. Electrónicos). */
  tipoProductoNombre: string;
  pesoKg: number;
  valorDeclarado: number;
  fragil: boolean;
  /** true = el remitente pagó al crear el despacho (prepago). */
  pagadoPorRemitente?: boolean;
  /** Requerido si `pagadoPorRemitente` = true. Catálogo `metodo_pago`. */
  idMetodoPago?: number;
  /** Tarifa del envío (`pedidos.precio` / `factura.monto`); default = `valorDeclarado`. */
  precio?: number;
  observacionesManifiesto?: string;
  /** URLs `https` ya públicas (opcional). */
  fotosPaqueteUrls?: string[];
  /**
   * Imágenes en base64: `data:image/png;base64,...` o JPEG en base64 crudo.
   * Se suben al bucket Supabase `evidencias` bajo `pedidos/{id_pedido}/…`; requiere variables de entorno del servidor.
   */
  fotosPaqueteBase64?: string[];
};

/** PATCH parcial: solo envíe los campos a cambiar. `null` en recolector/repartidor los desasigna. */
export type UpdatePedidoInput = {
  idEstadoPedido?: number;
  idUsuarioRecolector?: number | null;
  idUsuarioRepartidor?: number | null;
  idMetodoRecepcion?: number;
  idTipoPedido?: number;
  valorDeclarado?: number;
  precio?: number;
  /** `YYYY-MM-DD` */
  fechaEntrega?: string;
  fragil?: boolean;
  nombreDestinatario?: string;
  telefonoDestinatario?: string;
  tipoViaNombre?: string;
  nombreVia?: string;
  numeroPlaca?: string;
  numeroSecundario?: string;
  idCiudad?: number;
  idDepartamento?: number;
  idPais?: number;
  /** Solo Bogotá D.C.; `null` quita la localidad. Omitir para no cambiar. */
  idZonaBogota?: number | null;
  observacionesDireccion?: string;
  tipoProductoNombre?: string;
  pesoKg?: number;
  observacionesManifiesto?: string;
  fotosPaqueteUrls?: string[];
  fotosPaqueteBase64?: string[];
};

export interface PedidoWritePort {
  createPedidoFromForm(input: CreatePedidoFormInput): Promise<PedidoListado>;
  /** Devuelve `null` si no existe `id_pedido`. */
  updatePedido(idPedido: number, patch: UpdatePedidoInput): Promise<PedidoListado | null>;
  /**
   * Cierra el pedido de recogida (Entregado) y crea el pedido de entrega usando
   * `fk_direccion_destino` / `fk_destinatario_destino` del pedido de recogida.
   */
  confirmarRecogidaYCrearPedidoEntrega(
    idPedido: number,
    idRepartidor: number,
  ): Promise<PedidoListado>;
}
