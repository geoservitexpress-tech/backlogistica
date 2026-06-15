import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import {
  CIUDAD_ID_BOGOTA_DC,
  DEPARTAMENTO_ID_BOGOTA,
  PAIS_ID_COLOMBIA,
  ZONA_BOGOTA_EJEMPLO_ID,
} from '../../../logistica-geografia.constants';

/** Dirección y destinatario de entrega final en pedidos de **Recogida** (`idMetodoRecepcion` = 1). */
export class PedidoDestinoEntregaBodyDto {
  @ApiProperty({ example: 'María Pérez', description: 'Destinatario de la entrega final' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nombreDestinatario!: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @MinLength(7)
  @MaxLength(32)
  telefonoDestinatario!: string;

  @ApiProperty({ example: 'Calle', description: 'Nombre en **GET /catalogo/tipos-via**' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  tipoViaNombre!: string;

  @ApiProperty({ example: '11b', description: 'Vía antes del `#` (`direccion.zona`)' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombreVia!: string;

  @ApiProperty({ example: '15' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  numeroPlaca!: string;

  @ApiProperty({ example: '40' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  numeroSecundario!: string;

  @ApiProperty({ type: 'integer', example: CIUDAD_ID_BOGOTA_DC })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCiudad!: number;

  @ApiProperty({ type: 'integer', example: DEPARTAMENTO_ID_BOGOTA })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idDepartamento!: number;

  @ApiProperty({ type: 'integer', example: PAIS_ID_COLOMBIA })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPais!: number;

  @ApiPropertyOptional({
    type: 'integer',
    example: ZONA_BOGOTA_EJEMPLO_ID,
    description: 'Solo si `idCiudad` = 149 (Bogotá). Ver **GET /catalogo/zonas-bogota**.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idZonaBogota?: number;

  @ApiPropertyOptional({ example: 'Torre norte, apto 502' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacionesDireccion?: string;
}
