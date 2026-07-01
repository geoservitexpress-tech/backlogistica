import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClienteLiquidacionConfigSchema {
  @ApiProperty({ type: 'integer' })
  idUsuario!: number;

  @ApiProperty({ example: 'Juan Pérez' })
  nombreCliente!: string;

  @ApiProperty({ example: 15 })
  frecuenciaDias!: number;

  @ApiPropertyOptional({ type: 'integer', nullable: true })
  idMetodoDevolucion!: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'Transferencia' })
  metodoDevolucion!: string | null;

  @ApiPropertyOptional({ nullable: true })
  referenciaDevolucion!: string | null;

  @ApiPropertyOptional({ nullable: true })
  ultimaLiquidacionEn!: string | null;
}

export class ClienteLiquidacionPendienteSchema extends ClienteLiquidacionConfigSchema {
  @ApiProperty({ example: 8 })
  pedidosPendientes!: number;

  @ApiProperty({ example: 450000 })
  recaudoPendiente!: number;

  @ApiProperty({ example: 96000 })
  tarifaPendiente!: number;

  @ApiProperty({ example: 354000 })
  netoPendiente!: number;

  @ApiProperty({ example: true })
  listoParaLiquidar!: boolean;
}

export class LiquidacionDetalleLineaSchema {
  @ApiProperty({ type: 'integer' })
  idPedido!: number;

  @ApiProperty()
  numGuia!: string;

  @ApiProperty()
  valorRecaudado!: number;

  @ApiProperty()
  tarifaEnvio!: number;

  @ApiProperty()
  montoNeto!: number;
}

export class LiquidacionLoteResultadoSchema {
  @ApiProperty({ type: 'integer' })
  idLiquidacion!: number;

  @ApiProperty({ type: 'integer' })
  idUsuarioCliente!: number;

  @ApiProperty()
  nombreCliente!: string;

  @ApiProperty()
  recaudoTotal!: number;

  @ApiProperty()
  tarifaDescontada!: number;

  @ApiProperty()
  montoNeto!: number;

  @ApiProperty()
  pedidosTotal!: number;

  @ApiPropertyOptional({ type: 'integer', nullable: true })
  idMetodoDevolucion!: number | null;

  @ApiPropertyOptional({ nullable: true })
  metodoDevolucion!: string | null;

  @ApiPropertyOptional({ nullable: true })
  referenciaPago!: string | null;

  @ApiProperty({ example: '2026-05-01' })
  fechaDesde!: string;

  @ApiProperty({ example: '2026-05-15' })
  fechaHasta!: string;

  @ApiProperty()
  generadoEn!: string;

  @ApiProperty({ example: 'COP' })
  moneda!: 'COP';

  @ApiProperty({ type: LiquidacionDetalleLineaSchema, isArray: true })
  lineas!: LiquidacionDetalleLineaSchema[];
}
