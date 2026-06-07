import { ApiPropertyOptional } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { IsOptional } from 'class-validator';
import { PaginacionQueryDto } from './paginacion.query.dto';

export class ListTransaccionesRecientesQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por día de creación de la factura (inicio, Colombia).',
    example: '2026-05-01',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaDesde debe ser YYYY-MM-DD' })
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Filtra por día de creación de la factura (fin inclusive, Colombia).',
    example: '2026-05-23',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaHasta debe ser YYYY-MM-DD' })
  fechaHasta?: string;
}
