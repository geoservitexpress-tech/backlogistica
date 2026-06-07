import { ApiProperty } from '@nestjs/swagger';

class FinanzasPeriodoResumenSchema {
  @ApiProperty({ example: '2026-05-01' })
  fechaDesde!: string;

  @ApiProperty({ example: '2026-05-23' })
  fechaHasta!: string;

  @ApiProperty({ example: 23 })
  dias!: number;
}

export class IngresosTotalesKpiSchema extends FinanzasPeriodoResumenSchema {
  @ApiProperty({ example: 125_400_000, description: 'COP — total cobrado en facturas cerradas' })
  valor!: number;

  @ApiProperty({ example: 'COP', enum: ['COP'] })
  moneda!: 'COP';

  @ApiProperty({ example: 12, description: 'Variación vs periodo anterior de igual duración (%)' })
  variacionPorcentaje!: number;

  @ApiProperty({ example: 112_000_000 })
  valorPeriodoAnterior!: number;
}

export class PagoPersonalKpiSchema extends FinanzasPeriodoResumenSchema {
  @ApiProperty({ example: 45_600_000 })
  valor!: number;

  @ApiProperty({ example: 'COP', enum: ['COP'] })
  moneda!: 'COP';

  @ApiProperty({ example: 3800, description: 'Pedidos entregados con repartidor asignado' })
  entregasCompletadas!: number;

  @ApiProperty({ example: 12_000, description: 'Tarifa por entrega (variable FINANZAS_TARIFA_PAGO_REPARTIDOR_ENTREGA)' })
  tarifaPorEntrega!: number;

  @ApiProperty({ example: 0, description: 'Prorrateo mensual fijo (variable FINANZAS_PAGO_PERSONAL_FIJO_MENSUAL)' })
  pagoFijoProrrateado!: number;
}

export class UtilidadBrutaKpiSchema extends FinanzasPeriodoResumenSchema {
  @ApiProperty({ example: 79_800_000 })
  valor!: number;

  @ApiProperty({ example: 'COP', enum: ['COP'] })
  moneda!: 'COP';

  @ApiProperty({ example: 63, description: 'utilidad / ingresos × 100' })
  margenPorcentaje!: number;

  @ApiProperty({ example: 125_400_000 })
  ingresosTotales!: number;

  @ApiProperty({ example: 45_600_000 })
  pagoPersonal!: number;
}

export class TransaccionRecienteSchema {
  @ApiProperty({ example: 'FAC-20260523-594CE1', description: 'Número de factura' })
  numeroFactura!: string;

  @ApiProperty({ example: 'BL-20260523-A1B2C3', description: 'Guía del pedido (`pedidos.num_guia`)' })
  numGuia!: string;

  @ApiProperty({ example: 'Almacenes Éxito', description: 'Nombre del cliente solicitante' })
  cliente!: string;

  @ApiProperty({ example: 150_000, description: 'Monto facturado (COP)' })
  valor!: number;

  @ApiProperty({ example: 'COP', enum: ['COP'] })
  moneda!: 'COP';

  @ApiProperty({ example: 'Creada' })
  estadoFactura!: string;

  @ApiProperty({ example: '2026-05-23T20:46:08.816Z' })
  creadoEn!: string;
}

export class TransaccionRecientePaginadoSchema {
  @ApiProperty({ example: 120 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 6 })
  totalPaginas!: number;

  @ApiProperty({ type: TransaccionRecienteSchema, isArray: true })
  items!: TransaccionRecienteSchema[];
}
