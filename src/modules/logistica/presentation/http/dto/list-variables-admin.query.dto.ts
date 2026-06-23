import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginacionQueryDto } from './paginacion.query.dto';

export class ListVariablesAdminQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra por texto en `clave` o `descripcion` (ILIKE).',
    example: 'PAQUETE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;
}
