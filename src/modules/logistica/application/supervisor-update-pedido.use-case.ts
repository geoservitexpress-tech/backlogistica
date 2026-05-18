import { BadRequestException, Injectable } from '@nestjs/common';
import type { UpdatePedidoInput } from '../domain/ports/pedido-write.port';
import type { SupervisorUpdatePedidoBodyDto } from '../presentation/http/dto/supervisor-update-pedido.body.dto';
import { UpdatePedidoUseCase } from './update-pedido.use-case';

function patchTieneCampos(patch: UpdatePedidoInput): boolean {
  return Object.values(patch).some((v) => v !== undefined);
}

@Injectable()
export class SupervisorUpdatePedidoUseCase {
  constructor(private readonly updatePedido: UpdatePedidoUseCase) {}

  execute(idPedido: number, body: SupervisorUpdatePedidoBodyDto) {
    const patch: UpdatePedidoInput = { ...body };
    if (!patchTieneCampos(patch)) {
      throw new BadRequestException('Envíe al menos un campo para actualizar el pedido.');
    }
    return this.updatePedido.execute(idPedido, patch);
  }
}
