import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PedidoReadPort } from '../domain/ports/pedido-read.port';
import { PEDIDO_READ } from '../pedidos.tokens';

@Injectable()
export class GetPedidoByIdUseCase {
  constructor(@Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort) {}

  async execute(id: number) {
    const found = await this.pedidos.findPedidoById(id);
    if (!found) {
      throw new NotFoundException(`Pedido ${id} no encontrado`);
    }
    return found;
  }
}
