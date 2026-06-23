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
import { ListEstadosFacturaUseCase } from './application/list-estados-factura.use-case';
import { ListFacturasUseCase } from './application/list-facturas.use-case';
import { GetFacturaByIdUseCase } from './application/get-factura-by-id.use-case';
import { PagarFacturaUseCase } from './application/pagar-factura.use-case';
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
import { ListPedidosUseCase } from './application/list-pedidos.use-case';
import { PEDIDO_READ, PEDIDO_WRITE } from './pedidos.tokens';
import { TypeOrmFacturaReadRepository } from './infrastructure/persistence/typeorm-factura-read.repository';
import { TypeOrmFacturaWriteRepository } from './infrastructure/persistence/typeorm-factura-write.repository';
import { FACTURA_READ, FACTURA_WRITE } from './facturas.tokens';
import { AsignacionRepartidoresCron } from './infrastructure/scheduling/asignacion-repartidores.cron';
import { ListMetodosPagoUseCase } from './application/list-metodos-pago.use-case';
import { ListResultadosEntregaUseCase } from './application/list-resultados-entrega.use-case';
import { ListPedidosRepartidorUseCase } from './application/list-pedidos-repartidor.use-case';
import { RepartidorAceptarPedidoUseCase } from './application/repartidor-aceptar-pedido.use-case';
import { RepartidorRecibirPedidoUseCase } from './application/repartidor-recibir-pedido.use-case';
import { RepartidorConfirmarEntregaUseCase } from './application/repartidor-confirmar-entrega.use-case';
import { RepartidorConfirmarRecogidaUseCase } from './application/repartidor-confirmar-recogida.use-case';
import { FacturasController } from './presentation/http/facturas.controller';
import { CatalogoController } from './presentation/http/catalogo.controller';
import { PedidosController } from './presentation/http/pedidos.controller';
import { RepartidorPedidosController } from './presentation/http/repartidor-pedidos.controller';
import { SupervisorPedidosController } from './presentation/http/supervisor-pedidos.controller';
import { ListPedidosEnRepartoSupervisorUseCase } from './application/list-pedidos-en-reparto-supervisor.use-case';
import { SupervisorUpdatePedidoUseCase } from './application/supervisor-update-pedido.use-case';
import {
  GetIngresosTotalesUseCase,
  GetPagoPersonalUseCase,
  GetUtilidadBrutaUseCase,
  ListTransaccionesRecientesUseCase,
} from './application/finanzas-kpi.use-cases';
import { TypeOrmFinanzasKpiRepository } from './infrastructure/persistence/typeorm-finanzas-kpi.repository';
import { FINANZAS_KPI } from './finanzas.tokens';
import { AdminPagosRepartidoresController } from './presentation/http/admin-pagos-repartidores.controller';
import { AdminFinanzasController } from './presentation/http/admin-finanzas.controller';
import { AdminUsuariosController } from './presentation/http/admin-usuarios.controller';
import { AdminVariablesController } from './presentation/http/admin-variables.controller';
import { TypeOrmUsuarioAdminRepository } from './infrastructure/persistence/typeorm-usuario-admin.repository';
import { USUARIO_ADMIN } from './usuarios-admin.tokens';
import {
  ActualizarRolesUsuarioUseCase,
  ListUsuariosAdminUseCase,
} from './application/usuarios-admin.use-cases';
import {
  ActualizarVariableAdminUseCase,
  GetVariableAdminUseCase,
  ListVariablesAdminUseCase,
} from './application/variables-admin.use-cases';
import { CotizarTarifaUseCase } from './application/cotizar-tarifa.use-case';
import { TypeOrmPagosRepartidorRepository } from './infrastructure/persistence/typeorm-pagos-repartidor.repository';
import { PAGOS_REPARTIDOR } from './pagos-repartidor.tokens';
import {
  GenerarDispersionRepartidorUseCase,
  GetPagosRepartidorKpisUseCase,
  ListRepartidoresPagoUseCase,
} from './application/pagos-repartidor.use-cases';

/**
 * Bounded context logística: catálogos, lectura de pedidos y mapa ORM.
 */
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([...LOGISTICA_TYPEORM_ENTITIES])],
  controllers: [CatalogoController, PedidosController, FacturasController, AdminFinanzasController, AdminPagosRepartidoresController, AdminUsuariosController, AdminVariablesController, RepartidorPedidosController, SupervisorPedidosController],
  providers: [
    TypeOrmCatalogReadRepository,
    { provide: CATALOG_READ, useExisting: TypeOrmCatalogReadRepository },
    TypeOrmPedidoReadRepository,
    { provide: PEDIDO_READ, useExisting: TypeOrmPedidoReadRepository },
    SupabaseEvidenciasStorage,
    TypeOrmPedidoWriteRepository,
    { provide: PEDIDO_WRITE, useExisting: TypeOrmPedidoWriteRepository },
    TypeOrmFacturaReadRepository,
    { provide: FACTURA_READ, useExisting: TypeOrmFacturaReadRepository },
    TypeOrmFacturaWriteRepository,
    { provide: FACTURA_WRITE, useExisting: TypeOrmFacturaWriteRepository },
    TypeOrmFinanzasKpiRepository,
    { provide: FINANZAS_KPI, useExisting: TypeOrmFinanzasKpiRepository },
    TypeOrmPagosRepartidorRepository,
    { provide: PAGOS_REPARTIDOR, useExisting: TypeOrmPagosRepartidorRepository },
    TypeOrmUsuarioAdminRepository,
    { provide: USUARIO_ADMIN, useExisting: TypeOrmUsuarioAdminRepository },
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
    ListFacturasUseCase,
    GetFacturaByIdUseCase,
    PagarFacturaUseCase,
    ListEstadosFacturaUseCase,
    GetPedidoByIdUseCase,
    GetPedidoByNumGuiaUseCase,
    CreatePedidoUseCase,
    UpdatePedidoUseCase,
    ListResultadosEntregaUseCase,
    ListMetodosPagoUseCase,
    ListPedidosRepartidorUseCase,
    RepartidorRecibirPedidoUseCase,
    RepartidorAceptarPedidoUseCase,
    RepartidorConfirmarEntregaUseCase,
    RepartidorConfirmarRecogidaUseCase,
    ListPedidosEnRepartoSupervisorUseCase,
    SupervisorUpdatePedidoUseCase,
    GetIngresosTotalesUseCase,
    GetPagoPersonalUseCase,
    GetUtilidadBrutaUseCase,
    ListTransaccionesRecientesUseCase,
    GetPagosRepartidorKpisUseCase,
    ListRepartidoresPagoUseCase,
    GenerarDispersionRepartidorUseCase,
    ListUsuariosAdminUseCase,
    ActualizarRolesUsuarioUseCase,
    ListVariablesAdminUseCase,
    GetVariableAdminUseCase,
    ActualizarVariableAdminUseCase,
    CotizarTarifaUseCase,
    AsignacionRepartidoresService,
    AsignacionRepartidoresCron,
  ],
  exports: [TypeOrmModule],
})
export class LogisticaModule {}
