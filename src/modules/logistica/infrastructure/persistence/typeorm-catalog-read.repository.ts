import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogReadPort } from '../../domain/ports/catalog-read.port';
import { Ciudad } from '../../domain/entities/ciudad.entity';
import { Departamento } from '../../domain/entities/departamento.entity';
import { EstadoPedido } from '../../domain/entities/estado-pedido.entity';
import { Pais } from '../../domain/entities/pais.entity';
import { Rol } from '../../domain/entities/rol.entity';
import { CiudadOrmEntity } from './ciudad.orm-entity';
import { DepartamentoOrmEntity } from './departamento.orm-entity';
import { EstadoPedidoOrmEntity } from './estado-pedido.orm-entity';
import { PaisOrmEntity } from './pais.orm-entity';
import { RolOrmEntity } from './rol.orm-entity';

@Injectable()
export class TypeOrmCatalogReadRepository implements CatalogReadPort {
  constructor(
    @InjectRepository(PaisOrmEntity)
    private readonly paisRepo: Repository<PaisOrmEntity>,
    @InjectRepository(DepartamentoOrmEntity)
    private readonly departamentoRepo: Repository<DepartamentoOrmEntity>,
    @InjectRepository(CiudadOrmEntity)
    private readonly ciudadRepo: Repository<CiudadOrmEntity>,
    @InjectRepository(EstadoPedidoOrmEntity)
    private readonly estadoPedidoRepo: Repository<EstadoPedidoOrmEntity>,
    @InjectRepository(RolOrmEntity)
    private readonly rolRepo: Repository<RolOrmEntity>,
  ) {}

  async listPaises(): Promise<Pais[]> {
    const rows = await this.paisRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new Pais(r.idPais, r.nombre, r.codigoDane));
  }

  async listDepartamentos(): Promise<Departamento[]> {
    const rows = await this.departamentoRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new Departamento(r.idDepartamento, r.nombre, r.codigoDane));
  }

  async listCiudades(): Promise<Ciudad[]> {
    const rows = await this.ciudadRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new Ciudad(r.idCiudad, r.nombre, r.codigoDane));
  }

  async listEstadosPedido(): Promise<EstadoPedido[]> {
    const rows = await this.estadoPedidoRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new EstadoPedido(r.idEstadoPedido, r.nombre));
  }

  async listRoles(): Promise<Rol[]> {
    const rows = await this.rolRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new Rol(r.idRol, r.nombre));
  }
}
