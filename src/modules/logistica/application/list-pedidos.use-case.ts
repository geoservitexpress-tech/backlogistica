import { Inject, Injectable } from '@nestjs/common';
import type { PedidoReadPort } from '../domain/ports/pedido-read.port';
import { resolverPaginacion } from '../domain/paginacion';
import { buildListPedidosFilter } from './list-pedidos-filter.mapper';
import { PEDIDO_READ } from '../pedidos.tokens';
import type { ListPedidosQueryDto } from '../presentation/http/dto/list-pedidos.query.dto';

@Injectable()
export class ListPedidosUseCase {
  constructor(@Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort) {}

  execute(query?: ListPedidosQueryDto) {
    const { page, limit } = resolverPaginacion(query);
    return this.pedidos.listPedidos(buildListPedidosFilter(query, { page, limit }));
  }
}
