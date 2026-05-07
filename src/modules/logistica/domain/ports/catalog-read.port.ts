import { Ciudad } from '../entities/ciudad.entity';
import { Departamento } from '../entities/departamento.entity';
import { EstadoPedido } from '../entities/estado-pedido.entity';
import { Pais } from '../entities/pais.entity';
import { Rol } from '../entities/rol.entity';

/** Puerto de lectura de catálogos (adaptador secundario invertido hacia la aplicación). */
export interface CatalogReadPort {
  listPaises(): Promise<Pais[]>;
  listDepartamentos(): Promise<Departamento[]>;
  listCiudades(): Promise<Ciudad[]>;
  listEstadosPedido(): Promise<EstadoPedido[]>;
  listRoles(): Promise<Rol[]>;
}
