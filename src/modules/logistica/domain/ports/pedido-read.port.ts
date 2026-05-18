import type { PedidoListado } from '../read-models/pedido-listado';

/** Filtros opcionales para listados (solo lectura). */
export interface ListPedidosFilter {
  /** Día calendario en UTC, formato `YYYY-MM-DD`. */
  fecha?: string;
  idUsuario?: number;
  /** Un solo pedido por `pedidos.id_pedido` (equivale a filtrar el listado a 0 o 1 fila). */
  idPedido?: number;
  /** `usuarios.id_usuario` del repartidor (`fk_usuario_repartidor`). */
  idRepartidor?: number;
}

export interface PedidoReadPort {
  listPedidos(filter?: ListPedidosFilter): Promise<PedidoListado[]>;
  findPedidoById(id: number): Promise<PedidoListado | null>;
  /** `num_guia` único (ej. `BL-20260509-19B426`). */
  findPedidoByNumGuia(numGuia: string): Promise<PedidoListado | null>;
}
