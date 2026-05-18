import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';
import { SWAGGER_EJEMPLO_ID_PEDIDO, SWAGGER_EJEMPLO_ID_USUARIO } from '../../../../../swagger/swagger-ejemplos';

export class ListPedidosQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    description:
      'Devuelve **como máximo un** pedido con ese `pedidos.id_pedido` (array de 0 o 1 elemento). ' +
      'Para un solo objeto y 404 si no existe, use **GET /pedidos/{id}**.',
    example: SWAGGER_EJEMPLO_ID_PEDIDO,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idPedido?: number;

  @ApiPropertyOptional({
    description: 'Filtra por día de `creado_en` (formato YYYY-MM-DD). No combinable con `idPedido`.',
    example: '2026-05-10',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe ser YYYY-MM-DD' })
  fecha?: string;

  @ApiPropertyOptional({
    type: 'integer',
    example: SWAGGER_EJEMPLO_ID_USUARIO,
    description:
      'Filtra por `usuarios.id_usuario` (entero). Valor en **GET /auth/me** → `idUsuario`.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUsuario?: number;
}
