import type { Paginado } from '../paginacion';

export type UsuarioRolResumen = {
  idRol: number;
  nombre: string;
};

export type UsuarioAdminListado = {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  documento: string;
  tipoDocumento: string;
  telefono: string;
  creadoEn: string;
  roles: UsuarioRolResumen[];
};

export type UsuarioAdminListadoPaginado = Paginado<UsuarioAdminListado>;

export type ListUsuariosAdminFilter = {
  page: number;
  limit: number;
  search?: string;
  idRol?: number;
};

export interface UsuarioAdminPort {
  listUsuarios(filter: ListUsuariosAdminFilter): Promise<UsuarioAdminListadoPaginado>;
  actualizarRolesUsuario(idUsuario: number, idsRol: number[]): Promise<UsuarioAdminListado>;
}
