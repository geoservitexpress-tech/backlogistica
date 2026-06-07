import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';
import {
  SWAGGER_EJEMPLO_ID_PEDIDO,
  SWAGGER_EJEMPLO_ID_USUARIO,
} from '../../../../../swagger/swagger-ejemplos';
import { ESTADO_FACTURA_CREADA_ID } from '../../../logistica-factura-estados.constants';
import { PaginacionQueryDto } from './paginacion.query.dto';

export class ListFacturasQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    description:
      'Filtra por `factura.id_factura`. La respuesta paginada tendrá como máximo un registro en `items`. ' +
      'Para un solo objeto y 404 si no existe, use **GET /facturas/{id}**.',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idFactura?: number;

  @ApiPropertyOptional({
    type: 'integer',
    description: 'Filtra por `pedidos.id_pedido` vinculado.',
    example: SWAGGER_EJEMPLO_ID_PEDIDO,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPedido?: number;

  @ApiPropertyOptional({
    type: 'integer',
    description: 'Filtra por `estado_factura.id_estado_factura`. Ver **GET /catalogo/estados-factura**.',
    example: ESTADO_FACTURA_CREADA_ID,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idEstadoFactura?: number;

  @ApiPropertyOptional({
    description: 'Filtra por día de `factura.creado_en` (formato YYYY-MM-DD).',
    example: '2026-05-23',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe ser YYYY-MM-DD' })
  fecha?: string;

  @ApiPropertyOptional({
    type: 'integer',
    description:
      'Solo **Administrador**: filtra por `usuarios.id_usuario` del cliente (`fk_cliente`). ' +
      'El **Cliente** siempre ve solo las suyas.',
    example: SWAGGER_EJEMPLO_ID_USUARIO,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idCliente?: number;
}
