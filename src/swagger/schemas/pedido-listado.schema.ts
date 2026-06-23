import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ESTADO_PEDIDO_ASIGNADO_ID } from '../../modules/logistica/logistica-pedido-estados.constants';
import { TIPO_PEDIDO_ID_NORMAL } from '../../modules/logistica/logistica-tipo-pedido.constants';
import { SWAGGER_EJEMPLO_ID_PEDIDO } from '../swagger-ejemplos';

/** Ítem típico de `GET /pedidos` y `GET /repartidor/pedidos`. */
export const PEDIDO_LISTADO_EJEMPLO = {
  idPedido: SWAGGER_EJEMPLO_ID_PEDIDO,
  numGuia: 'BL-20260510-19B426',
  creadoEn: '2026-05-10T15:30:00.000Z',
  tipoPedido: 'Normal',
  tipoOperacion: 'DESPACHO',
  fechaEntrega: '2026-05-20',
  idEstadoPedido: ESTADO_PEDIDO_ASIGNADO_ID,
  estadoPedido: 'Asignado',
  idTipoPedido: TIPO_PEDIDO_ID_NORMAL,
  metodoRecepcion: 'Entrega',
  usuarioSolicitud: 'Juan Pérez',
  usuarioRecolector: null,
  usuarioRepartidor: 'Carlos Repartidor',
  paquete: 'Electrónicos',
  direccion: 'Bogotá, Bogotá D.C., Calle 11b # 15-40, Torre norte, apto 502',
  idZonaBogota: 1,
  zonaBogota: 'Usaquén',
  destinatarioNombre: 'María Pérez',
  destinatarioTelefono: '3001234567',
  direccionDestino: null,
  destinatarioDestinoNombre: null,
  destinatarioDestinoTelefono: null,
  fragil: true,
  pagadoPorRemitente: false,
  precio: 12000,
  pesoKg: 2.5,
  altoCm: 30,
  anchoCm: 25,
  largoCm: 20,
  observacionesManifiesto: 'Manipular con cuidado, llamar al recibir.',
  fotosPaqueteUrls: ['https://example.supabase.co/storage/v1/object/public/evidencias/pedidos/1/foto-1.jpg'],
} as const;

export const PEDIDO_LISTADO_PAGINADO_EJEMPLO = {
  total: 42,
  page: 1,
  limit: 20,
  totalPaginas: 3,
  items: [PEDIDO_LISTADO_EJEMPLO],
} as const;

/** Esquema OpenAPI del JSON de `GET /pedidos` (relaciones resueltas solo como texto). */
export class PedidoListadoSchema {
  @ApiProperty({ type: 'integer', example: 1, description: '`pedidos.id_pedido`' })
  idPedido!: number;

  @ApiProperty({ example: 'GUA-001-2024' })
  numGuia!: string;

  @ApiProperty({ example: '2026-05-02T18:49:07.288Z' })
  creadoEn!: string;

  @ApiProperty({ description: 'Nombre del tipo de pedido' })
  tipoPedido!: string;

  @ApiPropertyOptional({
    enum: ['DESPACHO', 'RECOLECCION'],
    nullable: true,
    description: 'Despacho vs recolección inferido de `metodo_recepcion`',
  })
  tipoOperacion!: 'DESPACHO' | 'RECOLECCION' | null;

  @ApiProperty({ example: '2026-05-20', description: 'Día programado de entrega' })
  fechaEntrega!: string;

  @ApiProperty({
    type: 'integer',
    example: 5,
    description: '2=Asignado (Recibir); 3=Recibido repartidor (Aceptar→En curso); 4=En curso (confirmar entrega); 5=Entregado',
  })
  idEstadoPedido!: number;

  @ApiProperty({ description: 'Nombre del estado', example: 'Entregado' })
  estadoPedido!: string;

  @ApiProperty({ type: 'integer', example: 2, description: '1=Normal, 2=Express' })
  idTipoPedido!: number;

  @ApiProperty({ description: 'Nombre del método de recepción' })
  metodoRecepcion!: string;

  @ApiProperty({ description: 'Nombre completo del usuario solicitante' })
  usuarioSolicitud!: string;

  @ApiPropertyOptional({ description: 'Nombre completo del recolector', nullable: true })
  usuarioRecolector!: string | null;

  @ApiPropertyOptional({ description: 'Nombre completo del repartidor', nullable: true })
  usuarioRepartidor!: string | null;

  @ApiProperty({ description: 'Nombre del paquete' })
  paquete!: string;

  @ApiProperty({
    description:
      'Dirección legible: ciudad, departamento y nomenclatura urbana CO (`tipo` + `zona` antes del `#` + placas).',
    example: 'Bogotá, Bogotá D.C., Calle 11b # 15-40, Torre norte, apto 502',
  })
  direccion!: string;

  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    example: 1,
    description: '`direccion.fk_zona` (localidad Bogotá; null si no aplica)',
  })
  idZonaBogota!: number | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Usaquén',
    description: 'Nombre de la localidad en `zona_bogota`',
  })
  zonaBogota!: string | null;

  @ApiPropertyOptional({ nullable: true })
  destinatarioNombre!: string | null;

  @ApiPropertyOptional({ nullable: true })
  destinatarioTelefono!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Solo recogida: dirección de entrega final (`fk_direccion_destino`)',
    example: 'Bogotá, Bogotá D.C., Calle 11b # 15-40, Torre norte, apto 502',
  })
  direccionDestino!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Solo recogida: destinatario de entrega final',
    example: 'María Pérez',
  })
  destinatarioDestinoNombre!: string | null;

  @ApiPropertyOptional({ nullable: true, example: '3001234567' })
  destinatarioDestinoTelefono!: string | null;

  @ApiProperty()
  fragil!: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Texto del manifiesto (`descripcion_seguimiento.observaciones` del alta; `null` si no hay).',
    example:
      'Manipular con cuidado, llamar al recibir al número indicado en la etiqueta. Mercancía frágil.',
  })
  observacionesManifiesto!: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  fotosPaqueteUrls!: string[] | null;

  @ApiProperty({
    example: 12000,
    description:
      'Tarifa del envío (`pedidos.precio`, COP). Calculada al crear según ciudad, tipo, peso y dimensiones; ' +
      'visible en POST /pedidos y en GET /pedidos.',
  })
  precio!: number;

  @ApiProperty({ example: false, description: 'Si el remitente pagó al crear el pedido' })
  pagadoPorRemitente!: boolean;

  @ApiPropertyOptional({ type: 'number', nullable: true, example: 2.5, description: 'Peso del paquete (kg)' })
  pesoKg!: number | null;

  @ApiPropertyOptional({ type: 'number', nullable: true, example: 30 })
  altoCm!: number | null;

  @ApiPropertyOptional({ type: 'number', nullable: true, example: 25 })
  anchoCm!: number | null;

  @ApiPropertyOptional({ type: 'number', nullable: true, example: 20 })
  largoCm!: number | null;
}

export class PedidoListadoPaginadoSchema {
  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPaginas!: number;

  @ApiProperty({ type: PedidoListadoSchema, isArray: true })
  items!: PedidoListadoSchema[];
}
