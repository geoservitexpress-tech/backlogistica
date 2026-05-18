import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsInt,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { METODO_PAGO_EFECTIVO_ID } from '../../../logistica-metodo-pago.constants';
import { RESULTADO_ENTREGA_EXITO_ID } from '../../../logistica-resultado-entrega.constants';
import { EJEMPLO_FOTO_PAQUETE_DATA_URL } from '../ejemplo-foto-paquete.data-url';

/** POST `/repartidor/pedidos/:id/confirmar-entrega` — cierre de ruta en `seguimiento` + cobro en `pedidos`. */
export class ConfirmarEntregaRepartidorBodyDto {
  @ApiProperty({
    type: 'integer',
    description:
      '`resultado_entrega.id_resultado_entrega` — **1** = Exitoso. Ver **GET /catalogo/resultados-entrega**.',
    example: RESULTADO_ENTREGA_EXITO_ID,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idResultadoEntrega!: number;

  @ApiProperty({
    description: 'El envío ya fue pagado por el remitente (no se cobra en destino).',
    example: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  pagadoPorRemitente!: boolean;

  @ApiPropertyOptional({
    type: 'integer',
    description:
      '`metodo_pago.id_metodo_pago` — **1** = Efectivo. Requerido si `pagadoPorRemitente` = false y `valorRecaudado` > 0.',
    example: METODO_PAGO_EFECTIVO_ID,
  })
  @ValidateIf((o: ConfirmarEntregaRepartidorBodyDto) => !o.pagadoPorRemitente && o.valorRecaudado > 0)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMetodoPago?: number;

  @ApiProperty({
    description: 'Valor cobrado en destino; se persiste en `pedidos.valor_recaudado`.',
    example: 15000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorRecaudado!: number;

  @ApiProperty({
    description:
      'Comentarios del cierre (motivo, quién recibió, etc.). Se guardan en `descripcion_seguimiento.observaciones` del **primer** paso foto; si envía varias fotos, las demás filas llevan la misma evidencia sin repetir el texto.',
    example: 'Se dejó en recepción con el vigilante Juan Pérez',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  observaciones!: string;

  @ApiPropertyOptional({
    description:
      'Una foto de evidencia en base64 (`data:image/jpeg;base64,...` o `data:image/png;base64,...`). ' +
      'Se sube a Storage **evidencias** y la URL queda en `descripcion_seguimiento.foto_url` del paso (estado **5** si la entrega fue exitosa).',
    example: EJEMPLO_FOTO_PAQUETE_DATA_URL,
  })
  @IsOptional()
  @IsString()
  @MaxLength(13_500_000)
  fotoEntregaBase64?: string;

  @ApiPropertyOptional({
    description:
      'Varias fotos en base64 (recomendado para múltiples evidencias). Cada imagen genera una fila en `descripcion_seguimiento` del mismo `seguimiento`. Máx. 8 en total con `fotoEntregaBase64` y URLs.',
    type: [String],
    maxItems: 8,
    example: [EJEMPLO_FOTO_PAQUETE_DATA_URL],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(13_500_000, { each: true })
  fotosEntregaBase64?: string[];

  @ApiPropertyOptional({
    description: 'URLs https de fotos ya alojadas (máx. 8 en total con base64).',
    type: [String],
    maxItems: 8,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  fotosEntregaUrls?: string[];
}
