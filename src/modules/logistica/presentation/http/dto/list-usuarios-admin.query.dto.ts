import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ROL_ID_REPARTIDOR } from '../../../logistica-rol.constants';
import { PaginacionQueryDto } from './paginacion.query.dto';

export class ListUsuariosAdminQueryDto extends PaginacionQueryDto {
  @ApiPropertyOptional({ description: 'Nombre, apellido, correo o documento', example: 'maria' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: 'integer',
    description: 'Filtra usuarios que tengan este `rol.id_rol`. Ver GET /catalogo/roles.',
    example: ROL_ID_REPARTIDOR,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idRol?: number;
}
