import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const VARIABLE_ADMIN_EJEMPLO = {
  idVariable: 1,
  clave: 'PAQUETE_PESO_MAX_KG',
  valor: '30',
  tipo: 'integer',
  descripcion: 'Peso máximo por paquete en kg (rango permitido en código: 25–30). POST/PATCH /pedidos.',
} as const;

export const VARIABLE_ADMIN_LISTADO_PAGINADO_EJEMPLO = {
  total: 42,
  page: 1,
  limit: 20,
  totalPaginas: 3,
  items: [VARIABLE_ADMIN_EJEMPLO],
} as const;

export class VariableAdminSchema {
  @ApiProperty({ type: 'integer', example: 1, description: '`variable.id_variable`' })
  idVariable!: number;

  @ApiProperty({ example: 'PAQUETE_PESO_MAX_KG' })
  clave!: string;

  @ApiProperty({ example: '30' })
  valor!: string;

  @ApiProperty({
    example: 'integer',
    description: 'boolean | integer | integer_list | json | text',
  })
  tipo!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Peso máximo por paquete en kg (25–30).',
  })
  descripcion!: string | null;
}

export class VariableAdminListadoPaginadoSchema {
  @ApiProperty({ example: VARIABLE_ADMIN_LISTADO_PAGINADO_EJEMPLO.total })
  total!: number;

  @ApiProperty({ example: VARIABLE_ADMIN_LISTADO_PAGINADO_EJEMPLO.page })
  page!: number;

  @ApiProperty({ example: VARIABLE_ADMIN_LISTADO_PAGINADO_EJEMPLO.limit })
  limit!: number;

  @ApiProperty({ example: VARIABLE_ADMIN_LISTADO_PAGINADO_EJEMPLO.totalPaginas })
  totalPaginas!: number;

  @ApiProperty({
    type: VariableAdminSchema,
    isArray: true,
    example: VARIABLE_ADMIN_LISTADO_PAGINADO_EJEMPLO.items,
  })
  items!: VariableAdminSchema[];
}
