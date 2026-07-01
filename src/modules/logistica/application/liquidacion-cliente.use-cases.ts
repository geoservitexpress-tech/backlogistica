import { Inject, Injectable } from '@nestjs/common';
import type {
  ActualizarClienteLiquidacionConfigInput,
  LiquidacionClientePort,
} from '../domain/ports/liquidacion-cliente.port';
import { LIQUIDACION_CLIENTE } from '../liquidacion.tokens';
import type { ActualizarClienteLiquidacionBodyDto } from '../presentation/http/dto/actualizar-cliente-liquidacion.body.dto';
import type { GenerarLiquidacionBodyDto } from '../presentation/http/dto/generar-liquidacion.body.dto';

@Injectable()
export class ListLiquidacionesPendientesUseCase {
  constructor(@Inject(LIQUIDACION_CLIENTE) private readonly liquidacion: LiquidacionClientePort) {}

  execute() {
    return this.liquidacion.listPendientes();
  }
}

@Injectable()
export class GetClienteLiquidacionConfigUseCase {
  constructor(@Inject(LIQUIDACION_CLIENTE) private readonly liquidacion: LiquidacionClientePort) {}

  execute(idUsuario: number) {
    return this.liquidacion.getConfig(idUsuario);
  }
}

@Injectable()
export class ActualizarClienteLiquidacionConfigUseCase {
  constructor(@Inject(LIQUIDACION_CLIENTE) private readonly liquidacion: LiquidacionClientePort) {}

  execute(idUsuario: number, body: ActualizarClienteLiquidacionBodyDto) {
    const input: ActualizarClienteLiquidacionConfigInput = {
      ...(body.frecuenciaDias != null && { frecuenciaDias: body.frecuenciaDias }),
      ...(body.idMetodoDevolucion !== undefined && { idMetodoDevolucion: body.idMetodoDevolucion }),
      ...(body.referenciaDevolucion !== undefined && {
        referenciaDevolucion: body.referenciaDevolucion,
      }),
    };
    return this.liquidacion.upsertConfig(idUsuario, input);
  }
}

@Injectable()
export class GenerarLiquidacionClienteUseCase {
  constructor(@Inject(LIQUIDACION_CLIENTE) private readonly liquidacion: LiquidacionClientePort) {}

  execute(body: GenerarLiquidacionBodyDto) {
    return this.liquidacion.generarLiquidacion({
      idUsuarioCliente: body.idUsuarioCliente,
      ...(body.idMetodoDevolucion !== undefined && { idMetodoDevolucion: body.idMetodoDevolucion }),
      ...(body.referenciaPago != null && { referenciaPago: body.referenciaPago }),
    });
  }
}
