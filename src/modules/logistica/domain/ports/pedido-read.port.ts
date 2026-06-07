import type { Paginado } from '../paginacion';
import type { PedidoListado } from '../read-models/pedido-listado';

/** Filtros opcionales para listados (solo lectura). */
export interface ListPedidosFilter {
  page: number;
  limit: number;
  /** Día de `pedidos.creado_en`, formato `YYYY-MM-DD`. */
  fecha?: string;
  /** Día de `pedidos.fecha_entrega`, formato `YYYY-MM-DD`. */
  fechaEntrega?: string;
  idUsuario?: number;
  /** Un solo pedido por `pedidos.id_pedido` (equivale a filtrar el listado a 0 o 1 fila). */
  idPedido?: number;
  /** `usuarios.id_usuario` del repartidor (`fk_usuario_repartidor`). */
  idRepartidor?: number;
  /** Filtra por `estado_pedido.id_estado_pedido` (OR). */
  idsEstadoPedido?: number[];
}

export interface PedidoReadPort {
  listPedidos(filter: ListPedidosFilter): Promise<Paginado<PedidoListado>>;
  findPedidoById(id: number): Promise<PedidoListado | null>;
  /** `num_guia` único (ej. `BL-20260509-19B426`). */
  findPedidoByNumGuia(numGuia: string): Promise<PedidoListado | null>;
}
