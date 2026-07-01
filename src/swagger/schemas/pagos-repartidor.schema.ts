import { ApiProperty } from '@nestjs/swagger';

export class PagosRepartidorKpisSchema {
  @ApiProperty({ example: 45_280_000 })
  totalPendientePago!: number;

  @ApiProperty({ example: 'COP', enum: ['COP'] })
  moneda!: 'COP';

  @ApiProperty({ example: 12, description: 'Variación de accrual pendiente vs semana anterior (%)' })
  variacionSemanaAnteriorPorcentaje!: number;

  @ApiProperty({ example: 124 })
  repartidoresActivos!: number;

  @ApiProperty({ example: 1842 })
  entregasHoy!: number;

  @ApiProperty({ example: 2500 })
  metaDiaria!: number;

  @ApiProperty({ example: 74, description: 'entregasHoy / metaDiaria × 100 (máx. 100)' })
  porcentajeMetaDiaria!: number;
}

export class RepartidorPagoListadoSchema {
  @ApiProperty({ example: 'RP-8842' })
  codigo!: string;

  @ApiProperty({ example: 'Juan Rodríguez' })
  nombre!: string;

  @ApiProperty({ nullable: true, example: 'Moto' })
  vehiculo!: string | null;

  @ApiProperty({ nullable: true, example: 'Bogotá Norte' })
  zona!: string | null;

  @ApiProperty({ example: 142 })
  entregasTotales!: number;

  @ApiProperty({ enum: ['ocupado', 'libre'], example: 'ocupado' })
  estado!: 'ocupado' | 'libre';
}

export class RepartidorPagoListadoPaginadoSchema {
  @ApiProperty({ example: 124 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 4 })
  limit!: number;

  @ApiProperty({ example: 31, description: 'ceil(total / limit)' })
  totalPaginas!: number;

  @ApiProperty({ type: RepartidorPagoListadoSchema, isArray: true })
  items!: RepartidorPagoListadoSchema[];
}

export class DispersionPedidoPendienteSchema {
  @ApiProperty({ type: 'integer', example: 42 })
  idPedido!: number;

  @ApiProperty({ example: 'BL-20260510-19B426' })
  numGuia!: string;

  @ApiProperty({ example: '2026-06-02' })
  fechaEntrega!: string;
}

export class DispersionRepartidorLineaSchema {
  @ApiProperty({ type: 'integer', example: 5 })
  idUsuario!: number;

  @ApiProperty({ example: 'RP-8842' })
  codigo!: string;

  @ApiProperty({ example: 'Juan Rodríguez' })
  nombre!: string;

  @ApiProperty({ example: 5, description: 'Entregas pendientes de pago' })
  entregas!: number;

  @ApiProperty({ example: 12_000 })
  tarifaUnitaria!: number;

  @ApiProperty({ example: 60_000 })
  monto!: number;

  @ApiProperty({ type: DispersionPedidoPendienteSchema, isArray: true })
  pedidos!: DispersionPedidoPendienteSchema[];
}

export class DispersionRepartidorPreviewSchema {
  @ApiProperty({ example: '2026-06-02' })
  fecha!: string;

  @ApiProperty({ example: 12_000 })
  tarifaUnitaria!: number;

  @ApiProperty({ example: 'COP', enum: ['COP'] })
  moneda!: 'COP';

  @ApiProperty({ example: 12 })
  entregasTotal!: number;

  @ApiProperty({ example: 144_000 })
  montoTotal!: number;

  @ApiProperty({ example: 3 })
  repartidoresTotal!: number;

  @ApiProperty({ type: DispersionRepartidorLineaSchema, isArray: true })
  lineas!: DispersionRepartidorLineaSchema[];
}

export class DispersionRepartidorResultadoSchema {
  @ApiProperty({ example: 1 })
  idDispersion!: number;

  @ApiProperty({ example: 45_280_000 })
  montoTotal!: number;

  @ApiProperty({ example: 3773 })
  entregasTotal!: number;

  @ApiProperty({ example: 124 })
  repartidoresTotal!: number;

  @ApiProperty({ example: 'COP', enum: ['COP'] })
  moneda!: 'COP';

  @ApiProperty({ example: '2026-05-23T21:00:00.000Z' })
  generadoEn!: string;

  @ApiProperty({ example: '2026-05-23' })
  fecha!: string;

  @ApiProperty({ example: 12_000 })
  tarifaUnitaria!: number;

  @ApiProperty({ type: DispersionRepartidorLineaSchema, isArray: true })
  lineas!: DispersionRepartidorLineaSchema[];
}

export class DispersionRepartidorIndividualResultadoSchema {
  @ApiProperty({ example: 1 })
  idDispersion!: number;

  @ApiProperty({ type: 'integer', example: 5 })
  idUsuario!: number;

  @ApiProperty({ example: 'RP-8842' })
  codigo!: string;

  @ApiProperty({ example: 'Juan Rodríguez' })
  nombre!: string;

  @ApiProperty({ example: '2026-06-02' })
  fecha!: string;

  @ApiProperty({ example: 12_000 })
  tarifaUnitaria!: number;

  @ApiProperty({ example: 5 })
  entregas!: number;

  @ApiProperty({ example: 60_000 })
  monto!: number;

  @ApiProperty({ example: 'COP', enum: ['COP'] })
  moneda!: 'COP';

  @ApiProperty()
  generadoEn!: string;

  @ApiProperty({ type: DispersionPedidoPendienteSchema, isArray: true })
  pedidos!: DispersionPedidoPendienteSchema[];
}
