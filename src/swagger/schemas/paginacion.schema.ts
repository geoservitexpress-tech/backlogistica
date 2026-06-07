import { ApiProperty } from '@nestjs/swagger';

/** Metadatos comunes de respuestas paginadas (`total`, `page`, `limit`, `totalPaginas`). */
export class PaginacionMetaSchema {
  @ApiProperty({ example: 42, description: 'Total de registros que cumplen el filtro' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Página actual (desde 1)' })
  page!: number;

  @ApiProperty({ example: 20, description: 'Tamaño de página solicitado' })
  limit!: number;

  @ApiProperty({
    example: 3,
    description: 'Páginas disponibles (`ceil(total / limit)`; 0 si `total` es 0)',
  })
  totalPaginas!: number;
}
