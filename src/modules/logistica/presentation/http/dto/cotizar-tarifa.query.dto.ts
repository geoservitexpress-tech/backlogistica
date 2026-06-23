import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import {
  CIUDAD_ID_BOGOTA_DC,
  CIUDAD_ID_SOACHA,
} from '../../../logistica-geografia.constants';
import {
  TIPO_PEDIDO_EXPRESS_ID,
  TIPO_PEDIDO_NORMAL_ID,
} from '../../../logistica-tipo-pedido.constants';

export class CotizarTarifaQueryDto {
  @ApiProperty({
    type: 'integer',
    example: CIUDAD_ID_BOGOTA_DC,
    description: 'Ciudad de entrega (`149` Bogotá, `543` Soacha).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCiudad!: number;

  @ApiProperty({
    type: 'integer',
    example: TIPO_PEDIDO_NORMAL_ID,
    description: '1=Normal, 2=Express.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idTipoPedido!: number;

  @ApiProperty({ example: 8, description: 'Peso en kg.' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  pesoKg!: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  altoCm?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  anchoCm?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  largoCm?: number;
}
