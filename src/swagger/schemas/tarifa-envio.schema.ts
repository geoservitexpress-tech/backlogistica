import { ApiProperty } from '@nestjs/swagger';

export class TarifaEnvioCotizacionSchema {
  @ApiProperty({ type: 'integer', example: 149 })
  idCiudad!: number;

  @ApiProperty({ type: 'integer', example: 1 })
  idTipoPedido!: number;

  @ApiProperty({ example: 12000, description: 'Bogotá D.C. $12.000; fuera de Bogotá $15.000 (Normal).' })
  tarifaBase!: number;

  @ApiProperty({ example: 3000, description: 'Recargo por peso sobre 10 kg (ejemplo).' })
  recargoPeso!: number;

  @ApiProperty({ example: 0 })
  recargoDimensiones!: number;

  @ApiProperty({ example: 15000 })
  tarifaSugerida!: number;
}

export const TARIFA_COTIZACION_EJEMPLO = {
  idCiudad: 149,
  idTipoPedido: 1,
  tarifaBase: 12000,
  recargoPeso: 0,
  recargoDimensiones: 0,
  tarifaSugerida: 12000,
} as const;

export const TARIFA_COTIZACION_FUERA_BOGOTA_EJEMPLO = {
  idCiudad: 543,
  idTipoPedido: 1,
  tarifaBase: 15000,
  recargoPeso: 0,
  recargoDimensiones: 0,
  tarifaSugerida: 15000,
} as const;

export const TARIFA_COTIZACION_EXPRESS_EJEMPLO = {
  idCiudad: 149,
  idTipoPedido: 2,
  tarifaBase: 15000,
  recargoPeso: 3000,
  recargoDimensiones: 0,
  tarifaSugerida: 18000,
} as const;
