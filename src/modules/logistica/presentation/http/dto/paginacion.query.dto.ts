import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  PAGINACION_DEFAULT_LIMIT,
  PAGINACION_DEFAULT_PAGE,
  PAGINACION_MAX_LIMIT,
} from '../../../domain/paginacion';

/** Query `page` + `limit` compartido por listados paginados. */
export class PaginacionQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    default: PAGINACION_DEFAULT_PAGE,
    minimum: 1,
    description: 'Número de página (desde 1).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    type: 'integer',
    default: PAGINACION_DEFAULT_LIMIT,
    minimum: 1,
    maximum: PAGINACION_MAX_LIMIT,
    description: 'Registros por página. La respuesta incluye `totalPaginas`.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINACION_MAX_LIMIT)
  limit?: number;
}
