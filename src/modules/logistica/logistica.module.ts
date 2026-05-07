import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListCiudadesUseCase } from './application/list-ciudades.use-case';
import { ListDepartamentosUseCase } from './application/list-departamentos.use-case';
import { ListEstadosPedidoUseCase } from './application/list-estados-pedido.use-case';
import { ListPaisesUseCase } from './application/list-paises.use-case';
import { ListRolesUseCase } from './application/list-roles.use-case';
import { CATALOG_READ } from './catalog.tokens';
import { TypeOrmCatalogReadRepository } from './infrastructure/persistence/typeorm-catalog-read.repository';
import { LOGISTICA_TYPEORM_ENTITIES } from './logistica.persistence.entities';
import { CatalogoController } from './presentation/http/catalogo.controller';

/**
 * Bounded context logística: mapa ORM, lectura de catálogos y futuros casos de uso de pedidos.
 */
@Module({
  imports: [TypeOrmModule.forFeature([...LOGISTICA_TYPEORM_ENTITIES])],
  controllers: [CatalogoController],
  providers: [
    TypeOrmCatalogReadRepository,
    { provide: CATALOG_READ, useExisting: TypeOrmCatalogReadRepository },
    ListPaisesUseCase,
    ListDepartamentosUseCase,
    ListCiudadesUseCase,
    ListEstadosPedidoUseCase,
    ListRolesUseCase,
  ],
  exports: [TypeOrmModule],
})
export class LogisticaModule {}
