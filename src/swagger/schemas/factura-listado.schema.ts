import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ESTADO_FACTURA_CREADA_ID,
  ESTADO_FACTURA_PAGADA_ID,
} from '../../modules/logistica/logistica-factura-estados.constants';
import { METODO_PAGO_TRANSFERENCIA_ID } from '../../modules/logistica/logistica-metodo-pago.constants';
import { SWAGGER_EJEMPLO_ID_PEDIDO } from '../swagger-ejemplos';

/** Esquema OpenAPI del JSON de `GET /facturas`. */
export class FacturaListadoSchema {
  @ApiProperty({ type: 'integer', example: 1, description: '`factura.id_factura`' })
  idFactura!: number;

  @ApiProperty({ example: 'FAC-20260523-594CE1' })
  numero!: string;

  @ApiProperty({ type: 'integer', example: SWAGGER_EJEMPLO_ID_PEDIDO })
  idPedido!: number;

  @ApiProperty({ example: 'BL-20260523-A1B2C3' })
  numGuia!: string;

  @ApiProperty({ type: 'integer', example: 1, description: '`usuarios.id_usuario` del cliente' })
  idCliente!: number;

  @ApiProperty({ example: 18000, description: 'Tarifa del envío (`factura.monto`)' })
  monto!: number;

  @ApiProperty({ example: 0, description: 'Total recaudado hasta el momento' })
  montoCobrado!: number;

  @ApiProperty({ example: 18000, description: '`monto - montoCobrado` (mínimo 0)' })
  saldoPendiente!: number;

  @ApiProperty({ example: false, description: 'true si hubo prepago al crear o vía POST /facturas/{id}/pagar' })
  pagadoAlCrear!: boolean;

  @ApiProperty({ type: 'integer', example: ESTADO_FACTURA_CREADA_ID })
  idEstadoFactura!: number;

  @ApiProperty({ example: 'Creada' })
  estadoFactura!: string;

  @ApiPropertyOptional({ type: 'integer', nullable: true, example: METODO_PAGO_TRANSFERENCIA_ID })
  idMetodoPago!: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'Transferencia' })
  metodoPago!: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  fechaPago!: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  fechaCierre!: string | null;

  @ApiProperty({ example: 'María Pérez' })
  destinatarioNombre!: string;

  @ApiProperty({ example: '3001234567' })
  destinatarioTelefono!: string;

  @ApiProperty({ example: 'Bogotá, Calle 11b # 15-40, Torre norte' })
  direccionEntrega!: string;

  @ApiProperty({ example: '2026-05-23T20:46:08.816Z' })
  creadoEn!: string;

  @ApiProperty({ example: '2026-05-23T20:46:08.816Z' })
  actualizadoEn!: string;
}

/** Ejemplo tras prepago vía POST /facturas/{id}/pagar */
export const EJEMPLO_FACTURA_PAGADA_PREPAGO = {
  idFactura: 1,
  numero: 'FAC-20260523-594CE1',
  idPedido: SWAGGER_EJEMPLO_ID_PEDIDO,
  numGuia: 'BL-20260523-A1B2C3',
  idCliente: 1,
  monto: 18000,
  montoCobrado: 18000,
  saldoPendiente: 0,
  pagadoAlCrear: true,
  idEstadoFactura: ESTADO_FACTURA_CREADA_ID,
  estadoFactura: 'Creada',
  idMetodoPago: METODO_PAGO_TRANSFERENCIA_ID,
  metodoPago: 'Transferencia',
  fechaPago: '2026-05-23T21:00:00.000Z',
  fechaCierre: null,
  destinatarioNombre: 'María Pérez',
  destinatarioTelefono: '3001234567',
  direccionEntrega: 'Bogotá, Calle 11b # 15-40, Torre norte',
  creadoEn: '2026-05-23T20:46:08.816Z',
  actualizadoEn: '2026-05-23T21:00:00.000Z',
};

export const EJEMPLO_PAGAR_FACTURA_BODY = {
  idMetodoPago: METODO_PAGO_TRANSFERENCIA_ID,
};

export class FacturaListadoPaginadoSchema {
  @ApiProperty({ example: 15 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 1 })
  totalPaginas!: number;

  @ApiProperty({ type: FacturaListadoSchema, isArray: true })
  items!: FacturaListadoSchema[];
}
