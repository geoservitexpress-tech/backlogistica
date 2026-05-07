import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LOGISTICA_TYPEORM_ENTITIES } from './logistica.persistence.entities';

/**
 * Bounded context logística: registra el mapa objeto-relacional.
 * Los casos de uso y controladores se añaden cuando definamos cada puerto/adaptador.
 */
@Module({
  imports: [TypeOrmModule.forFeature([...LOGISTICA_TYPEORM_ENTITIES])],
  exports: [TypeOrmModule],
})
export class LogisticaModule {}
