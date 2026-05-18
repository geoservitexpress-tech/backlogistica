import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VAR } from '../../configuracion/variable.keys';
import { VariablesService } from '../../configuracion/variables.service';
import {
  ESTADO_PEDIDO_ASIGNADO_ID,
  ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID,
} from '../logistica-pedido-estados.constants';
import type { PedidoReadPort } from '../domain/ports/pedido-read.port';
import type { PedidoWritePort } from '../domain/ports/pedido-write.port';
import { PEDIDO_READ, PEDIDO_WRITE } from '../pedidos.tokens';
import { PedidoOrmEntity } from '../infrastructure/persistence/pedido.orm-entity';

@Injectable()
export class RepartidorAceptarPedidoUseCase {
  constructor(
    private readonly variables: VariablesService,
    @Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort,
    @Inject(PEDIDO_WRITE) private readonly pedidosWrite: PedidoWritePort,
    @InjectRepository(PedidoOrmEntity)
    private readonly pedidoRepo: Repository<PedidoOrmEntity>,
  ) {}

  async execute(idPedido: number, idRepartidor: number) {
    const idAsignado = await this.variables.getInt(
      VAR.REPARTIDOR_PEDIDO_ESTADO_ASIGNADO_ID,
      ESTADO_PEDIDO_ASIGNADO_ID,
      { min: 1 },
    );
    const idEnCamino = await this.variables.getInt(
      VAR.REPARTIDOR_PEDIDO_ESTADO_EN_CAMINO_ID,
      ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID,
      { min: 1 },
    );

    const row = await this.pedidoRepo.findOne({
      where: { idPedido },
      relations: ['estadoPedido', 'usuarioRepartidor'],
    });

    if (!row) {
      throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
    }

    const repId = row.usuarioRepartidor?.idUsuario ?? null;
    if (!repId || repId !== idRepartidor) {
      throw new ForbiddenException('Este pedido no está asignado a usted como repartidor.');
    }

    const estadoActual = row.estadoPedido.idEstadoPedido;
    if (estadoActual === idEnCamino) {
      throw new ConflictException('El pedido ya fue aceptado y está en ruta.');
    }
    if (estadoActual !== idAsignado) {
      throw new ConflictException(
        `Solo se puede aceptar desde estado asignado. Estado actual: ${row.estadoPedido.nombre}.`,
      );
    }

    const actualizado = await this.pedidosWrite.updatePedido(idPedido, {
      idEstadoPedido: idEnCamino,
    });
    if (!actualizado) {
      throw new NotFoundException(`Pedido ${idPedido} no encontrado tras actualizar`);
    }
    return actualizado;
  }
}
