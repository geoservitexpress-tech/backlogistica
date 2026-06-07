import { Inject, Injectable } from '@nestjs/common';
import type { PedidoReadPort } from '../domain/ports/pedido-read.port';
import { resolverPaginacion } from '../domain/paginacion';
import { PEDIDO_READ } from '../pedidos.tokens';
import type { PaginacionQueryDto } from '../presentation/http/dto/paginacion.query.dto';

@Injectable()
export class ListPedidosRepartidorUseCase {
  constructor(@Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort) {}

  /** Pedidos con `fk_usuario_repartidor` = repartidor autenticado (`sub` del JWT). */
  execute(idRepartidor: number, query?: PaginacionQueryDto) {
    const { page, limit } = resolverPaginacion(query);
    return this.pedidos.listPedidos({ page, limit, idRepartidor });
  }
}
