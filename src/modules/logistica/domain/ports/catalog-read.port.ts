import { Ciudad } from '../entities/ciudad.entity';
import { Departamento } from '../entities/departamento.entity';
import { EstadoPedido } from '../entities/estado-pedido.entity';
import { MetodoRecepcion } from '../entities/metodo-recepcion.entity';
import { Pais } from '../entities/pais.entity';
import { Rol } from '../entities/rol.entity';
import { TipoDocumento } from '../entities/tipo-documento.entity';
import { TipoPedido } from '../entities/tipo-pedido.entity';
import { TipoVia } from '../entities/tipo-via.entity';
import { ZonaBogota } from '../entities/zona-bogota.entity';

/** Puerto de lectura de catálogos (adaptador secundario invertido hacia la aplicación). */
export interface CatalogReadPort {
  listPaises(): Promise<Pais[]>;
  listDepartamentos(): Promise<Departamento[]>;
  listCiudades(): Promise<Ciudad[]>;
  listEstadosPedido(): Promise<EstadoPedido[]>;
  listRoles(): Promise<Rol[]>;
  listTiposPedido(): Promise<TipoPedido[]>;
  listMetodosRecepcion(): Promise<MetodoRecepcion[]>;
  listTiposDocumento(): Promise<TipoDocumento[]>;
  listTiposVia(): Promise<TipoVia[]>;
  listZonasBogota(): Promise<ZonaBogota[]>;
}
