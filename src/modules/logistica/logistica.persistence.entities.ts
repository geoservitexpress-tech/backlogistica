import { CiudadOrmEntity } from './infrastructure/persistence/ciudad.orm-entity';
import { DepartamentoOrmEntity } from './infrastructure/persistence/departamento.orm-entity';
import { DestinatarioOrmEntity } from './infrastructure/persistence/destinatario.orm-entity';
import { DireccionOrmEntity } from './infrastructure/persistence/direccion.orm-entity';
import { EstadoPedidoOrmEntity } from './infrastructure/persistence/estado-pedido.orm-entity';
import { MetodoPagoOrmEntity } from './infrastructure/persistence/metodo-pago.orm-entity';
import { MetodoRecepcionOrmEntity } from './infrastructure/persistence/metodo-recepcion.orm-entity';
import { PaqueteOrmEntity } from './infrastructure/persistence/paquete.orm-entity';
import { PaisOrmEntity } from './infrastructure/persistence/pais.orm-entity';
import { PedidoOrmEntity } from './infrastructure/persistence/pedido.orm-entity';
import { DescripcionSeguimientoOrmEntity } from './infrastructure/persistence/descripcion-seguimiento.orm-entity';
import { ResultadoEntregaOrmEntity } from './infrastructure/persistence/resultado-entrega.orm-entity';
import { RolOrmEntity } from './infrastructure/persistence/rol.orm-entity';
import { SeguimientoOrmEntity } from './infrastructure/persistence/seguimiento.orm-entity';
import { TipoDocumentoOrmEntity } from './infrastructure/persistence/tipo-documento.orm-entity';
import { TipoPedidoOrmEntity } from './infrastructure/persistence/tipo-pedido.orm-entity';
import { TipoViaOrmEntity } from './infrastructure/persistence/tipo-via.orm-entity';
import { UsuarioOrmEntity } from './infrastructure/persistence/usuario.orm-entity';
import { UsuarioRolOrmEntity } from './infrastructure/persistence/usuario-rol.orm-entity';
import { ZonaBogotaOrmEntity } from './infrastructure/persistence/zona-bogota.orm-entity';

/** Entidades TypeORM del bounded context logística (infraestructura). */
export const LOGISTICA_TYPEORM_ENTITIES = [
  TipoDocumentoOrmEntity,
  TipoPedidoOrmEntity,
  EstadoPedidoOrmEntity,
  MetodoRecepcionOrmEntity,
  TipoViaOrmEntity,
  PaisOrmEntity,
  DepartamentoOrmEntity,
  CiudadOrmEntity,
  ZonaBogotaOrmEntity,
  PaqueteOrmEntity,
  UsuarioOrmEntity,
  UsuarioRolOrmEntity,
  DireccionOrmEntity,
  DestinatarioOrmEntity,
  PedidoOrmEntity,
  RolOrmEntity,
  SeguimientoOrmEntity,
  DescripcionSeguimientoOrmEntity,
  ResultadoEntregaOrmEntity,
  MetodoPagoOrmEntity,
] as const;
