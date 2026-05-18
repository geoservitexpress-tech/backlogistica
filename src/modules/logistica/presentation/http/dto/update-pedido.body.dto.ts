import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CIUDAD_ID_BOGOTA_DC, ZONA_BOGOTA_EJEMPLO_ID } from '../../../logistica-geografia.constants';
import { ESTADO_PEDIDO_ASIGNADO_ID } from '../../../logistica-pedido-estados.constants';
import { METODO_RECEPCION_ID_ENTREGA } from '../../../logistica-metodo-recepcion.constants';

/** PATCH `/pedidos/:id` — solo los campos enviados se actualizan. */
export class UpdatePedidoBodyDto {
  @ApiPropertyOptional({
    type: 'integer',
    example: ESTADO_PEDIDO_ASIGNADO_ID,
    description: '`estado_pedido.id_estado_pedido` — **2** = Asignado.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEstadoPedido?: number;

  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    description: '`usuarios.id_usuario`; use `null` para quitar el recolector',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUsuarioRecolector?: number | null;

  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    description: '`usuarios.id_usuario`; use `null` para quitar el repartidor',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUsuarioRepartidor?: number | null;

  @ApiPropertyOptional({
    type: 'integer',
    example: METODO_RECEPCION_ID_ENTREGA,
    description: '`metodo_recepcion.id_metodo_recepcion` — **2** = Entrega.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMetodoRecepcion?: number;

  @ApiPropertyOptional({
    type: 'integer',
    description: '`tipo_pedido.id_tipo_pedido` (Normal, Express).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idTipoPedido?: number;

  @ApiPropertyOptional({ description: 'Actualiza `pedidos.valor_declarado` y `paquete.precio`' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorDeclarado?: number;

  @ApiPropertyOptional({ description: '`pedidos.precio`' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio?: number;

  @ApiPropertyOptional({ example: '2026-05-20', description: '`pedidos.fecha_entrega` (YYYY-MM-DD)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaEntrega debe ser YYYY-MM-DD' })
  fechaEntrega?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  fragil?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nombreDestinatario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(32)
  telefonoDestinatario?: string;

  @ApiPropertyOptional({
    description:
      'Si cambia dirección, envíe **todos**: tipoViaNombre, nombreVia (→ `zona`, antes del `#`), numeroPlaca, numeroSecundario, idCiudad, idDepartamento, idPais.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  tipoViaNombre?: string;

  @ApiPropertyOptional({
    example: '2A',
    description: 'Número de vía antes del `#`; se persiste en `direccion.zona`.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombreVia?: string;

  @ApiPropertyOptional({ example: '14B', description: 'Placa principal tras el `#` (`numero_principal`)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  numeroPlaca?: string;

  @ApiPropertyOptional({ example: '30', description: 'Placa secundaria tras el `#` (`numero_secundario`)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  numeroSecundario?: string;

  @ApiPropertyOptional({ type: 'integer', description: '`ciudad.id_ciudad` numérico.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCiudad?: number;

  @ApiPropertyOptional({ type: 'integer', description: '`departamento.id_departamento`' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idDepartamento?: number;

  @ApiPropertyOptional({ type: 'integer', description: '`pais.id_pais`' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPais?: number;

  @ApiPropertyOptional({
    type: 'integer',
    example: ZONA_BOGOTA_EJEMPLO_ID,
    nullable: true,
    description:
      'Localidad Bogotá (`direccion.fk_zona`). Solo si la dirección queda en `idCiudad` = **149**; `null` la quita. ' +
      'No enviar si la ciudad no es Bogotá.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idZonaBogota?: number | null;

  @ApiPropertyOptional({ description: '`direccion.observaciones`; puede ir solo (sin el bloque de dirección completa).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacionesDireccion?: string;

  @ApiPropertyOptional({ description: '`paquete.nombre`' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  tipoProductoNombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pesoKg?: number;

  @ApiPropertyOptional({ description: 'Se guarda en Storage (`manifiesto.txt`)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacionesManifiesto?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 8 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  fotosPaqueteUrls?: string[];

  @ApiPropertyOptional({ type: [String], maxItems: 8 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(13_500_000, { each: true })
  fotosPaqueteBase64?: string[];
}
