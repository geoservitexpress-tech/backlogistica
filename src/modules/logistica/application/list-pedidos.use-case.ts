import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ListPedidosFilter, PedidoReadPort } from '../domain/ports/pedido-read.port';
import { resolverPaginacion } from '../domain/paginacion';
import { PEDIDO_READ } from '../pedidos.tokens';

function assertFechaUtcValida(fecha: string): void {
  const d = new Date(`${fecha}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`fecha inválida: ${fecha}`);
  }
  if (d.toISOString().slice(0, 10) !== fecha) {
    throw new BadRequestException(`fecha inválida: ${fecha}`);
  }
}

@Injectable()
export class ListPedidosUseCase {
  constructor(@Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort) {}

  async execute(filter?: Omit<ListPedidosFilter, 'page' | 'limit'> & { page?: number; limit?: number }) {
    const { page, limit } = resolverPaginacion(filter);
    if (filter?.fecha) {
      assertFechaUtcValida(filter.fecha);
    }
    return this.pedidos.listPedidos({
      page,
      limit,
      ...(filter?.fecha && { fecha: filter.fecha }),
      ...(filter?.fechaEntrega && { fechaEntrega: filter.fechaEntrega }),
      ...(filter?.idUsuario && { idUsuario: filter.idUsuario }),
      ...(filter?.idRepartidor != null && { idRepartidor: filter.idRepartidor }),
      ...(filter?.idsEstadoPedido?.length && { idsEstadoPedido: filter.idsEstadoPedido }),
      ...(filter?.idPedido != null && { idPedido: filter.idPedido }),
    });
  }
}
