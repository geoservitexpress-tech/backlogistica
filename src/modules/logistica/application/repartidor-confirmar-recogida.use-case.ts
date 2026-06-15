import { Inject, Injectable } from '@nestjs/common';
import type { PedidoWritePort } from '../domain/ports/pedido-write.port';
import { PEDIDO_WRITE } from '../pedidos.tokens';

@Injectable()
export class RepartidorConfirmarRecogidaUseCase {
  constructor(@Inject(PEDIDO_WRITE) private readonly pedidos: PedidoWritePort) {}

  execute(idPedido: number, idRepartidor: number) {
    return this.pedidos.confirmarRecogidaYCrearPedidoEntrega(idPedido, idRepartidor);
  }
}
