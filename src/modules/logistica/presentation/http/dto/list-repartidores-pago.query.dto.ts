import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { PaginacionQueryDto } from './paginacion.query.dto';

export class ListRepartidoresPagoQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ description: 'Nombre, documento o código RP-8842', example: 'Juan' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['ocupado', 'libre'], description: 'Filtra por pedidos activos en `fecha`' })
  @IsOptional()
  @IsIn(['ocupado', 'libre'])
  estado?: 'ocupado' | 'libre';

  @ApiPropertyOptional({
    description: 'Día para calcular estado ocupado/libre (default: hoy Colombia)',
    example: '2026-05-23',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha?: string;
}
