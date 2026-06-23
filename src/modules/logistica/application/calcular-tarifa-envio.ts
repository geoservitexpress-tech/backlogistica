import { BadRequestException } from '@nestjs/common';
import { VAR } from '../../configuracion/variable.keys';
import type { VariablesService } from '../../configuracion/variables.service';
import { CIUDAD_ID_BOGOTA_DC } from '../logistica-geografia.constants';
import {
  TIPO_PEDIDO_EXPRESS_ID,
  TIPO_PEDIDO_NORMAL_ID,
} from '../logistica-tipo-pedido.constants';

export interface TarifaEnvioInput {
  idCiudad: number;
  idTipoPedido: number;
  pesoKg: number;
  altoCm?: number | null;
  anchoCm?: number | null;
  largoCm?: number | null;
}

export interface TarifaEnvioConfig {
  tarifaBogota: number;
  tarifaFueraBogota: number;
  expressMin: number;
  expressMax: number;
  pesoBaseKg: number;
  recargoPorKg: number;
  sumaLadosBaseCm: number;
  recargoPorCmSuma: number;
}

export interface TarifaEnvioDesglose {
  tarifaBase: number;
  recargoPeso: number;
  recargoDimensiones: number;
  tarifaSugerida: number;
  idTipoPedido: number;
  idCiudad: number;
}

export type TarifaEnvioResult = TarifaEnvioDesglose;

export async function cargarConfigTarifaEnvio(variables: VariablesService): Promise<TarifaEnvioConfig> {
  const [
    tarifaBogota,
    tarifaFueraBogota,
    expressMin,
    expressMax,
    pesoBaseKg,
    recargoPorKg,
    sumaLadosBaseCm,
    recargoPorCmSuma,
  ] = await Promise.all([
    variables.getInt(VAR.TARIFA_BOGOTA_COP, 12_000, { min: 1 }),
    variables.getInt(VAR.TARIFA_FUERA_BOGOTA_COP, 15_000, { min: 1 }),
    variables.getInt(VAR.TARIFA_EXPRESS_MIN_COP, 15_000, { min: 1 }),
    variables.getInt(VAR.TARIFA_EXPRESS_MAX_COP, 20_000, { min: 1 }),
    variables.getInt(VAR.TARIFA_PESO_BASE_KG, 10, { min: 1, max: 30 }),
    variables.getInt(VAR.TARIFA_RECARGO_POR_KG_COP, 1500, { min: 0 }),
    variables.getInt(VAR.TARIFA_SUMA_LADOS_BASE_CM, 120, { min: 1 }),
    variables.getInt(VAR.TARIFA_RECARGO_POR_CM_SUMA_COP, 200, { min: 0 }),
  ]);

  return {
    tarifaBogota,
    tarifaFueraBogota,
    expressMin: Math.min(expressMin, expressMax),
    expressMax: Math.max(expressMin, expressMax),
    pesoBaseKg,
    recargoPorKg,
    sumaLadosBaseCm,
    recargoPorCmSuma,
  };
}

function tarifaBaseNormalCiudad(idCiudad: number, config: TarifaEnvioConfig): number {
  return idCiudad === CIUDAD_ID_BOGOTA_DC ? config.tarifaBogota : config.tarifaFueraBogota;
}

function recargoPorPeso(pesoKg: number, config: TarifaEnvioConfig): number {
  if (pesoKg <= config.pesoBaseKg) return 0;
  const exceso = pesoKg - config.pesoBaseKg;
  return Math.ceil(exceso) * config.recargoPorKg;
}

function recargoPorDimensiones(
  altoCm: number | null | undefined,
  anchoCm: number | null | undefined,
  largoCm: number | null | undefined,
  config: TarifaEnvioConfig,
): number {
  if (altoCm == null || anchoCm == null || largoCm == null) return 0;
  if (altoCm <= 0 || anchoCm <= 0 || largoCm <= 0) return 0;
  const suma = altoCm + anchoCm + largoCm;
  if (suma <= config.sumaLadosBaseCm) return 0;
  return Math.ceil(suma - config.sumaLadosBaseCm) * config.recargoPorCmSuma;
}

export function calcularTarifaEnvio(input: TarifaEnvioInput, config: TarifaEnvioConfig): TarifaEnvioResult {
  const recargoPeso = recargoPorPeso(input.pesoKg, config);
  const recargoDimensiones = recargoPorDimensiones(
    input.altoCm,
    input.anchoCm,
    input.largoCm,
    config,
  );

  let tarifaBase: number;
  if (input.idTipoPedido === TIPO_PEDIDO_EXPRESS_ID) {
    tarifaBase = config.expressMin;
  } else if (input.idTipoPedido === TIPO_PEDIDO_NORMAL_ID) {
    tarifaBase = tarifaBaseNormalCiudad(input.idCiudad, config);
  } else {
    tarifaBase = tarifaBaseNormalCiudad(input.idCiudad, config);
  }

  let tarifaSugerida = tarifaBase + recargoPeso + recargoDimensiones;

  if (input.idTipoPedido === TIPO_PEDIDO_EXPRESS_ID) {
    tarifaSugerida = Math.min(config.expressMax, Math.max(config.expressMin, tarifaSugerida));
  }

  return {
    idCiudad: input.idCiudad,
    idTipoPedido: input.idTipoPedido,
    tarifaBase,
    recargoPeso,
    recargoDimensiones,
    tarifaSugerida,
  };
}

export function validarPrecioExpress(precio: number, config: TarifaEnvioConfig): void {
  if (precio < config.expressMin || precio > config.expressMax) {
    throw new BadRequestException(
      `precio Express debe estar entre ${config.expressMin} y ${config.expressMax} COP. ` +
        'El supervisor puede fijar la tarifa final dentro de ese rango.',
    );
  }
}
