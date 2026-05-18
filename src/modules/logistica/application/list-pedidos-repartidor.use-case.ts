import { Inject, Injectable } from '@nestjs/common';
import type { PedidoReadPort } from '../domain/ports/pedido-read.port';
import { PEDIDO_READ } from '../pedidos.tokens';

@Injectable()
export class ListPedidosRepartidorUseCase {
  constructor(@Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort) {}

  /** Pedidos con `fk_usuario_repartidor` = repartidor autenticado (`sub` del JWT). */
  execute(idRepartidor: number) {
    return this.pedidos.listPedidos({ idRepartidor });
  }
}
