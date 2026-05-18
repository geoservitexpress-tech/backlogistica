import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolOrmEntity } from '../logistica/infrastructure/persistence/rol.orm-entity';
import { TipoDocumentoOrmEntity } from '../logistica/infrastructure/persistence/tipo-documento.orm-entity';
import { UsuarioOrmEntity } from '../logistica/infrastructure/persistence/usuario.orm-entity';
import { UsuarioRolOrmEntity } from '../logistica/infrastructure/persistence/usuario-rol.orm-entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RepartidorRoleGuard } from './guards/repartidor-role.guard';
import { SupervisorRoleGuard } from './guards/supervisor-role.guard';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UsuarioOrmEntity, UsuarioRolOrmEntity, RolOrmEntity, TipoDocumentoOrmEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseJwtGuard, RepartidorRoleGuard, SupervisorRoleGuard],
  exports: [AuthService, SupabaseJwtGuard, RepartidorRoleGuard, SupervisorRoleGuard],
})
export class AuthModule {}
