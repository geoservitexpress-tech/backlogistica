import { Injectable } from '@nestjs/common';
import { VariablesService } from '../../configuracion/variables.service';
import {
  calcularTarifaEnvio,
  cargarConfigTarifaEnvio,
  type TarifaEnvioResult,
} from './calcular-tarifa-envio';
import type { CotizarTarifaQueryDto } from '../presentation/http/dto/cotizar-tarifa.query.dto';

@Injectable()
export class CotizarTarifaUseCase {
  constructor(private readonly variables: VariablesService) {}

  async execute(query: CotizarTarifaQueryDto): Promise<TarifaEnvioResult> {
    const config = await cargarConfigTarifaEnvio(this.variables);
    return calcularTarifaEnvio(
      {
        idCiudad: query.idCiudad,
        idTipoPedido: query.idTipoPedido,
        pesoKg: query.pesoKg,
        altoCm: query.altoCm,
        anchoCm: query.anchoCm,
        largoCm: query.largoCm,
      },
      config,
    );
  }
}
