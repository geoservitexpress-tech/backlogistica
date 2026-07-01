import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';
import { SWAGGER_EJEMPLO_ID_REPARTIDOR } from '../../../../../swagger/ejemplos/pagos-repartidor.ejemplos';

export class DispersionPreviewQueryDto {
  @ApiPropertyOptional({
    description: 'Día de entrega a liquidar (default: hoy Bogotá)',
    example: '2026-06-02',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha?: string;

  @ApiPropertyOptional({
    type: 'integer',
    example: SWAGGER_EJEMPLO_ID_REPARTIDOR,
    description: 'Filtrar preview a un repartidor (`usuarios.id_usuario`)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUsuario?: number;
}
