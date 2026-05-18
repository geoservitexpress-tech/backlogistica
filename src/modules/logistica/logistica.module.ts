import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ListCiudadesUseCase } from './application/list-ciudades.use-case';
import { ListDepartamentosUseCase } from './application/list-departamentos.use-case';
import { ListEstadosPedidoUseCase } from './application/list-estados-pedido.use-case';
import { ListMetodosRecepcionUseCase } from './application/list-metodos-recepcion.use-case';
import { ListPaisesUseCase } from './application/list-paises.use-case';
import { GetPedidoByIdUseCase } from './application/get-pedido-by-id.use-case';
import { GetPedidoByNumGuiaUseCase } from './application/get-pedido-by-num-guia.use-case';
import { ListPedidosUseCase } from './application/list-pedidos.use-case';
import { CreatePedidoUseCase } from './application/create-pedido.use-case';
import { UpdatePedidoUseCase } from './application/update-pedido.use-case';
import { AsignacionRepartidoresService } from './application/asignacion-repartidores.service';
import { ListRolesUseCase } from './application/list-roles.use-case';
import { ListTiposDocumentoUseCase } from './application/list-tipos-documento.use-case';
import { ListTiposPedidoUseCase } from './application/list-tipos-pedido.use-case';
import { ListTiposViaUseCase } from './application/list-tipos-via.use-case';
import { ListZonasBogotaUseCase } from './application/list-zonas-bogota.use-case';
import { ListVariablesUseCase } from './application/list-variables.use-case';
import { CATALOG_READ } from './catalog.tokens';
import { TypeOrmCatalogReadRepository } from './infrastructure/persistence/typeorm-catalog-read.repository';
import { TypeOrmPedidoReadRepository } from './infrastructure/persistence/typeorm-pedido-read.repository';
import { TypeOrmPedidoWriteRepository } from './infrastructure/persistence/typeorm-pedido-write.repository';
import { SupabaseEvidenciasStorage } from './infrastructure/storage/supabase-evidencias.storage';
import { LOGISTICA_TYPEORM_ENTITIES } from './logistica.persistence.entities';
import { PEDIDO_READ, PEDIDO_WRITE } from './pedidos.tokens';
import { AsignacionRepartidoresCron } from './infrastructure/scheduling/asignacion-repartidores.cron';
import { ListMetodosPagoUseCase } from './application/list-metodos-pago.use-case';
import { ListResultadosEntregaUseCase } from './application/list-resultados-entrega.use-case';
import { ListPedidosRepartidorUseCase } from './application/list-pedidos-repartidor.use-case';
import { RepartidorAceptarPedidoUseCase } from './application/repartidor-aceptar-pedido.use-case';
import { RepartidorConfirmarEntregaUseCase } from './application/repartidor-confirmar-entrega.use-case';
import { CatalogoController } from './presentation/http/catalogo.controller';
import { PedidosController } from './presentation/http/pedidos.controller';
import { RepartidorPedidosController } from './presentation/http/repartidor-pedidos.controller';

/**
 * Bounded context logística: catálogos, lectura de pedidos y mapa ORM.
 */
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([...LOGISTICA_TYPEORM_ENTITIES])],
  controllers: [CatalogoController, PedidosController, RepartidorPedidosController],
  providers: [
    TypeOrmCatalogReadRepository,
    { provide: CATALOG_READ, useExisting: TypeOrmCatalogReadRepository },
    TypeOrmPedidoReadRepository,
    { provide: PEDIDO_READ, useExisting: TypeOrmPedidoReadRepository },
    SupabaseEvidenciasStorage,
    TypeOrmPedidoWriteRepository,
    { provide: PEDIDO_WRITE, useExisting: TypeOrmPedidoWriteRepository },
    ListPaisesUseCase,
    ListDepartamentosUseCase,
    ListCiudadesUseCase,
    ListEstadosPedidoUseCase,
    ListRolesUseCase,
    ListTiposPedidoUseCase,
    ListMetodosRecepcionUseCase,
    ListTiposDocumentoUseCase,
    ListTiposViaUseCase,
    ListZonasBogotaUseCase,
    ListVariablesUseCase,
    ListPedidosUseCase,
    GetPedidoByIdUseCase,
    GetPedidoByNumGuiaUseCase,
    CreatePedidoUseCase,
    UpdatePedidoUseCase,
    ListResultadosEntregaUseCase,
    ListMetodosPagoUseCase,
    ListPedidosRepartidorUseCase,
    RepartidorAceptarPedidoUseCase,
    RepartidorConfirmarEntregaUseCase,
    AsignacionRepartidoresService,
    AsignacionRepartidoresCron,
  ],
  exports: [TypeOrmModule],
})
export class LogisticaModule {}
