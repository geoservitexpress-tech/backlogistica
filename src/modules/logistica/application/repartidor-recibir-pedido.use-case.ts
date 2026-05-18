import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { VAR } from '../../configuracion/variable.keys';
import { VariablesService } from '../../configuracion/variables.service';
import {
  ESTADO_PEDIDO_ASIGNADO_ID,
  ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID,
} from '../logistica-pedido-estados.constants';
import type { PedidoReadPort } from '../domain/ports/pedido-read.port';
import { PEDIDO_READ } from '../pedidos.tokens';
import { PedidoOrmEntity } from '../infrastructure/persistence/pedido.orm-entity';
import {
  registrarSeguimientoPasoEstado,
  SEGUIMIENTO_DESCRIPCION_RECIBIDO_REPARTIDOR,
} from '../infrastructure/persistence/registrar-seguimiento-pedido';

@Injectable()
export class RepartidorRecibirPedidoUseCase {
  constructor(
    private readonly variables: VariablesService,
    @Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(PedidoOrmEntity)
    private readonly pedidoRepo: Repository<PedidoOrmEntity>,
  ) {}

  async execute(idPedido: number, idRepartidor: number) {
    const idAsignado = await this.variables.getInt(
      VAR.REPARTIDOR_PEDIDO_ESTADO_ASIGNADO_ID,
      ESTADO_PEDIDO_ASIGNADO_ID,
      { min: 1 },
    );
    const idRecibido = await this.variables.getInt(
      VAR.REPARTIDOR_PEDIDO_ESTADO_RECIBIDO_ID,
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
    if (estadoActual === idRecibido) {
      throw new ConflictException('El pedido ya fue recibido.');
    }
    if (estadoActual !== idAsignado) {
      throw new ConflictException(
        `Solo se puede recibir desde Asignado. Estado actual: ${row.estadoPedido.nombre}.`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `update pedidos set fk_estado_pedido = $2::int where id_pedido = $1::int`,
        [idPedido, idRecibido],
      );
      await registrarSeguimientoPasoEstado(manager, {
        idPedido,
        idEstadoPedido: idRecibido,
        descripcion: SEGUIMIENTO_DESCRIPCION_RECIBIDO_REPARTIDOR,
      });
    });

    const actualizado = await this.pedidos.findPedidoById(idPedido);
    if (!actualizado) {
      throw new NotFoundException(`Pedido ${idPedido} no encontrado tras actualizar`);
    }
    return actualizado;
  }
}
