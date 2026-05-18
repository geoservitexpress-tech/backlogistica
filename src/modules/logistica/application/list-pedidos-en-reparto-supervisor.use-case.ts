import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { VAR } from '../../configuracion/variable.keys';
import { VariablesService } from '../../configuracion/variables.service';
import { ESTADOS_PEDIDO_EN_REPARTO } from '../logistica-pedido-estados.constants';
import type { ListPedidosFilter, PedidoReadPort } from '../domain/ports/pedido-read.port';
import { PEDIDO_READ } from '../pedidos.tokens';
import { hoyYmdBogota } from './asignacion-fecha-bogota';

function assertFechaYmd(fecha: string): void {
  const d = new Date(`${fecha}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== fecha) {
    throw new BadRequestException(`fecha inválida: ${fecha}`);
  }
}

@Injectable()
export class ListPedidosEnRepartoSupervisorUseCase {
  constructor(
    private readonly variables: VariablesService,
    @Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort,
  ) {}

  async execute(query?: { fecha?: string; idRepartidor?: number }) {
    const fecha = query?.fecha?.trim() || hoyYmdBogota();
    assertFechaYmd(fecha);

    const idsEstadoPedido = await this.variables.getIntList(
      VAR.SUPERVISOR_PEDIDOS_EN_REPARTO_ESTADOS,
      [...ESTADOS_PEDIDO_EN_REPARTO],
    );

    const filter: ListPedidosFilter = {
      fechaEntrega: fecha,
      idsEstadoPedido,
      ...(query?.idRepartidor != null && { idRepartidor: query.idRepartidor }),
    };

    return this.pedidos.listPedidos(filter);
  }
}
