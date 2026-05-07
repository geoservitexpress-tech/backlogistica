import { CiudadOrmEntity } from './infrastructure/persistence/ciudad.orm-entity';
import { DepartamentoOrmEntity } from './infrastructure/persistence/departamento.orm-entity';
import { DireccionOrmEntity } from './infrastructure/persistence/direccion.orm-entity';
import { EstadoPedidoOrmEntity } from './infrastructure/persistence/estado-pedido.orm-entity';
import { MetodoRecepcionOrmEntity } from './infrastructure/persistence/metodo-recepcion.orm-entity';
import { PaqueteOrmEntity } from './infrastructure/persistence/paquete.orm-entity';
import { PaisOrmEntity } from './infrastructure/persistence/pais.orm-entity';
import { PedidoOrmEntity } from './infrastructure/persistence/pedido.orm-entity';
import { TipoDocumentoOrmEntity } from './infrastructure/persistence/tipo-documento.orm-entity';
import { TipoPedidoOrmEntity } from './infrastructure/persistence/tipo-pedido.orm-entity';
import { TipoViaOrmEntity } from './infrastructure/persistence/tipo-via.orm-entity';
import { UsuarioOrmEntity } from './infrastructure/persistence/usuario.orm-entity';

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
  PaqueteOrmEntity,
  UsuarioOrmEntity,
  DireccionOrmEntity,
  PedidoOrmEntity,
] as const;
