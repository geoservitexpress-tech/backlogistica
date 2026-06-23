import { Inject, Injectable } from '@nestjs/common';
import type { PedidoReadPort } from '../domain/ports/pedido-read.port';
import { resolverPaginacion } from '../domain/paginacion';
import { buildListPedidosFilter } from './list-pedidos-filter.mapper';
import { PEDIDO_READ } from '../pedidos.tokens';
import type { ListPedidosRepartidorQueryDto } from '../presentation/http/dto/list-pedidos-repartidor.query.dto';

@Injectable()
export class ListPedidosRepartidorUseCase {
  constructor(@Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort) {}

  /** Pedidos con `fk_usuario_repartidor` = repartidor autenticado (`sub` del JWT). */
  execute(idRepartidor: number, query?: ListPedidosRepartidorQueryDto) {
    const { page, limit } = resolverPaginacion(query);
    return this.pedidos.listPedidos(
      buildListPedidosFilter(query, { page, limit }, { idRepartidor }),
    );
  }
}
