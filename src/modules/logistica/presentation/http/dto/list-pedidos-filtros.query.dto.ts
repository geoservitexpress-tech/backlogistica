import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { SWAGGER_EJEMPLO_ID_PEDIDO, SWAGGER_EJEMPLO_ID_USUARIO } from '../../../../../swagger/swagger-ejemplos';
import { PaginacionQueryDto } from './paginacion.query.dto';

/** Filtros de operaciones compartidos entre listados de pedidos. */
export class ListPedidosFiltrosQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    description:
      'Filtra por `pedidos.id_pedido`. La respuesta paginada tendrá como máximo un registro en `items`.',
    example: SWAGGER_EJEMPLO_ID_PEDIDO,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPedido?: number;

  @ApiPropertyOptional({
    description:
      'Día de creación (`pedidos.creado_en`, `YYYY-MM-DD`, zona Colombia por defecto). ' +
      'Combinable con `fechaEntrega`.',
    example: '2026-05-10',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe ser YYYY-MM-DD' })
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Día programado de entrega (`pedidos.fecha_entrega`, `YYYY-MM-DD`).',
    example: '2026-05-20',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaEntrega debe ser YYYY-MM-DD' })
  fechaEntrega?: string;

  @ApiPropertyOptional({
    type: 'integer',
    example: SWAGGER_EJEMPLO_ID_USUARIO,
    description:
      'Proveedor / cliente solicitante (`pedidos.fk_usuario_solicitud`). Alias legible de `idUsuario`.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idProveedor?: number;

  @ApiPropertyOptional({
    type: 'integer',
    example: SWAGGER_EJEMPLO_ID_USUARIO,
    description: 'Alias de `idProveedor` (`fk_usuario_solicitud`).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUsuario?: number;

  @ApiPropertyOptional({
    description:
      'Texto en dirección de entrega/recogida: vía, placas, observaciones, ciudad o localidad Bogotá.',
    example: '11b',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  direccion?: string;
}
