import type { PedidoListado } from '../read-models/pedido-listado';

/**
 * Payload público alineado con el formulario "Nuevo pedido" (app).
 * El solicitante es un **`usuarios.id_usuario`** con rol **Cliente** o **Administrador** en `usuario_rol` → `rol`.
 */
export type CreatePedidoFormInput = {
  idUsuario: number;
  /** `tipo_pedido.id_tipo_pedido` (ej. 1=Normal, 2=Express). */
  idTipoPedido: number;
  /** Día de entrega programado (`pedidos.fecha_entrega`, `YYYY-MM-DD`). */
  fechaEntrega: string;
  /** `metodo_recepcion.id_metodo_recepcion` (ej. 2 = Entrega). Ver GET /catalogo/metodos-recepcion. */
  idMetodoRecepcion: number;
  nombreDestinatario: string;
  telefonoDestinatario: string;
  /** Nombre del registro en catálogo `tipo_via` (ej. Calle, Carrera). */
  tipoViaNombre: string;
  /** Identificador de la vía (ej. 72); va en `direccion.zona`; el tipo es `fk_tipo_via`. */
  nombreVia: string;
  /** Primer tramo del # (placa principal). */
  numeroPlaca: string;
  /** Segundo tramo del # (placa secundaria). */
  numeroSecundario: string;
  /** `ciudad.id_ciudad` del catálogo (`direccion.fk_ciudad`). */
  idCiudad: number;
  /** `departamento.id_departamento` (`direccion.fk_departamento`); la tabla `ciudad` no enlaza depto en BD. */
  idDepartamento: number;
  /** `pais.id_pais` (`direccion.fk_pais`); la tabla `departamento` no enlaza país en BD. */
  idPais: number;
  /**
   * `zona_bogota.id_zona` → `direccion.fk_zona`.
   * Solo si `idCiudad` = Bogotá D.C. (149). Ver GET /catalogo/zonas-bogota.
   */
  idZonaBogota?: number;
  observacionesDireccion?: string;
  /** Texto libre para `paquete.nombre` (ej. Electrónicos). */
  tipoProductoNombre: string;
  pesoKg: number;
  valorDeclarado: number;
  fragil: boolean;
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
}
