import { ApiProperty } from '@nestjs/swagger';
import { ROL_ID_REPARTIDOR } from '../../modules/logistica/logistica-rol.constants';

export const USUARIO_ADMIN_LISTADO_EJEMPLO = {
  idUsuario: 2,
  nombres: 'María',
  apellidos: 'López',
  nombreCompleto: 'María López',
  correo: 'maria@ejemplo.com',
  documento: '1098765432',
  tipoDocumento: 'CC',
  telefono: '3109876543',
  creadoEn: '2026-05-01T14:30:00.000Z',
  roles: [{ idRol: ROL_ID_REPARTIDOR, nombre: 'Repartidor' }],
} as const;

export const USUARIO_ADMIN_LISTADO_PAGINADO_EJEMPLO = {
  total: 42,
  page: 1,
  limit: 20,
  totalPaginas: 3,
  items: [USUARIO_ADMIN_LISTADO_EJEMPLO],
} as const;

export class UsuarioRolResumenSchema {
  @ApiProperty({ example: 2 })
  idRol!: number;

  @ApiProperty({ example: 'Repartidor' })
  nombre!: string;
}

export class UsuarioAdminListadoSchema {
  @ApiProperty({ type: 'integer', example: 1 })
  idUsuario!: number;

  @ApiProperty({ example: 'Juan' })
  nombres!: string;

  @ApiProperty({ example: 'García' })
  apellidos!: string;

  @ApiProperty({ example: 'Juan García' })
  nombreCompleto!: string;

  @ApiProperty({ example: 'juan@gmail.com' })
  correo!: string;

  @ApiProperty({ example: '1020304050' })
  documento!: string;

  @ApiProperty({ example: 'CC' })
  tipoDocumento!: string;

  @ApiProperty({ example: '3001234567' })
  telefono!: string;

  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' })
  creadoEn!: string;

  @ApiProperty({ type: UsuarioRolResumenSchema, isArray: true, example: USUARIO_ADMIN_LISTADO_EJEMPLO.roles })
  roles!: UsuarioRolResumenSchema[];
}

export class UsuarioAdminListadoPaginadoSchema {
  @ApiProperty({ example: USUARIO_ADMIN_LISTADO_PAGINADO_EJEMPLO.total })
  total!: number;

  @ApiProperty({ example: USUARIO_ADMIN_LISTADO_PAGINADO_EJEMPLO.page })
  page!: number;

  @ApiProperty({ example: USUARIO_ADMIN_LISTADO_PAGINADO_EJEMPLO.limit })
  limit!: number;

  @ApiProperty({ example: USUARIO_ADMIN_LISTADO_PAGINADO_EJEMPLO.totalPaginas })
  totalPaginas!: number;

  @ApiProperty({
    type: UsuarioAdminListadoSchema,
    isArray: true,
    example: USUARIO_ADMIN_LISTADO_PAGINADO_EJEMPLO.items,
  })
  items!: UsuarioAdminListadoSchema[];
}
