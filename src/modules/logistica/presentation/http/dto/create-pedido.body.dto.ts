import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
} from 'class-validator';
import {
  CIUDAD_ID_BOGOTA_DC,
  DEPARTAMENTO_ID_BOGOTA,
  PAIS_ID_COLOMBIA,
  ZONA_BOGOTA_EJEMPLO_ID,
} from '../../../logistica-geografia.constants';
import { METODO_RECEPCION_ID_ENTREGA } from '../../../logistica-metodo-recepcion.constants';
import { TIPO_PEDIDO_ID_NORMAL } from '../../../logistica-tipo-pedido.constants';
import { EJEMPLO_FOTO_PAQUETE_DATA_URL } from '../ejemplo-foto-paquete.data-url';

/** Cuerpo de `POST /pedidos` — solicitante = usuario del JWT (Cliente o Administrador). */
export class CreatePedidoBodyDto {
  @ApiProperty({
    type: 'integer',
    example: TIPO_PEDIDO_ID_NORMAL,
    description:
      '`tipo_pedido.id_tipo_pedido` (ej. 1=Normal, 2=Express). Ver **GET /catalogo/tipos-pedido**.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idTipoPedido!: number;

  @ApiProperty({
    example: '2026-05-20',
    description: 'Día programado de entrega (`pedidos.fecha_entrega`, formato `YYYY-MM-DD`).',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaEntrega debe ser YYYY-MM-DD' })
  fechaEntrega!: string;

  @ApiProperty({
    type: 'integer',
    example: METODO_RECEPCION_ID_ENTREGA,
    description:
      '`metodo_recepcion.id_metodo_recepcion` — **1** = Recogida, **2** = Entrega. Ver **GET /catalogo/metodos-recepcion**.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMetodoRecepcion!: number;

  @ApiProperty({ example: 'María Pérez' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nombreDestinatario!: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @MinLength(7)
  @MaxLength(32)
  telefonoDestinatario!: string;

  @ApiProperty({
    example: 'Calle',
    description:
      'Nombre exacto del registro en catálogo **`tipo_via`** (mismo que `GET /catalogo/tipos-via`, ej. Calle, Carrera).',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  tipoViaNombre!: string;

  @ApiProperty({
    example: '11b',
    description:
      'Número de vía **antes** del `#` en nomenclatura colombiana; se guarda en `direccion.zona` (p. ej. `2A`, `11b`).',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombreVia!: string;

  @ApiProperty({ example: '15', description: 'Placa principal **después** del `#` (`direccion.numero_principal`)' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  numeroPlaca!: string;

  @ApiProperty({ example: '40', description: 'Placa secundaria **después** del `#` (`direccion.numero_secundario`)' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  numeroSecundario!: string;

  @ApiProperty({
    type: 'integer',
    example: CIUDAD_ID_BOGOTA_DC,
    description: '`ciudad.id_ciudad` — **149** = Bogotá D.C. (`GET /catalogo/ciudades`).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCiudad!: number;

  @ApiProperty({
    type: 'integer',
    example: DEPARTAMENTO_ID_BOGOTA,
    description:
      '`departamento.id_departamento` — **3** = Bogotá (seed). Ver **GET /catalogo/departamentos**.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idDepartamento!: number;

  @ApiProperty({
    type: 'integer',
    example: PAIS_ID_COLOMBIA,
    description: '`pais.id_pais` — **1** = Colombia. Ver **GET /catalogo/paises**.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPais!: number;

  @ApiPropertyOptional({
    type: 'integer',
    example: ZONA_BOGOTA_EJEMPLO_ID,
    description:
      'Localidad de Bogotá (`zona_bogota.id_zona` → `direccion.fk_zona`). **Solo** si `idCiudad` = **149** (Bogotá D.C.). ' +
      'Ver **GET /catalogo/zonas-bogota**. No enviar para otras ciudades.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idZonaBogota?: number;

  @ApiPropertyOptional({
    example: 'Torre norte, apto 502',
    description: 'Observaciones de entrega (apto, portería, etc.)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacionesDireccion?: string;

  @ApiProperty({
    example: 'Electrónicos',
    description: 'Nombre descriptivo del contenido / tipo de producto',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  tipoProductoNombre!: string;

  @ApiProperty({ example: 2.5, description: 'Peso en kilogramos' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pesoKg!: number;

  @ApiProperty({
    example: 1500000,
    description: 'Valor declarado (se guarda en el registro de paquete)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorDeclarado!: number;

  @ApiProperty({ description: 'Indicador frágil' })
  @Type(() => Boolean)
  @IsBoolean()
  fragil!: boolean;

  @ApiPropertyOptional({
    description:
      'Observaciones del manifiesto (tablas `seguimiento` + `descripcion_seguimiento`; visible en GET list/detail).',
    example:
      'Manipular con cuidado, llamar al recibir al número indicado en la etiqueta. Mercancía frágil.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacionesManifiesto?: string;

  @ApiPropertyOptional({
    description:
      'URLs `https` de fotos ya alojadas (opcional). Combinado con `fotosPaqueteBase64`, máximo 8 ítems en total.',
    type: [String],
    maxItems: 8,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  fotosPaqueteUrls?: string[];

  @ApiPropertyOptional({
    description:
      'Fotos en base64 (`data:image/jpeg;base64,...` o similar). Se suben al bucket Supabase **`evidencias`** (`pedidos/{id}/…`). Requiere `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en el servidor.',
    type: [String],
    maxItems: 8,
    example: [EJEMPLO_FOTO_PAQUETE_DATA_URL],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(13_500_000, { each: true })
  fotosPaqueteBase64?: string[];
}
