import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PedidoWritePort, UpdatePedidoInput } from '../domain/ports/pedido-write.port';
import { PEDIDO_WRITE } from '../pedidos.tokens';

function patchTieneCampos(patch: UpdatePedidoInput): boolean {
  return Object.values(patch).some((v) => v !== undefined);
}

@Injectable()
export class UpdatePedidoUseCase {
  constructor(@Inject(PEDIDO_WRITE) private readonly write: PedidoWritePort) {}

  execute(idPedido: number, body: UpdatePedidoInput) {
    if (!patchTieneCampos(body)) {
      throw new BadRequestException('Envíe al menos un campo para actualizar el pedido.');
    }
    return this.write.updatePedido(idPedido, body).then((row) => {
      if (!row) {
        throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
      }
      return row;
    });
  }
}
