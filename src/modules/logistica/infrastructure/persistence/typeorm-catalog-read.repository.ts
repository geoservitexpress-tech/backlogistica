import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogReadPort } from '../../domain/ports/catalog-read.port';
import { Ciudad } from '../../domain/entities/ciudad.entity';
import { Departamento } from '../../domain/entities/departamento.entity';
import { EstadoPedido } from '../../domain/entities/estado-pedido.entity';
import { MetodoRecepcion } from '../../domain/entities/metodo-recepcion.entity';
import { Pais } from '../../domain/entities/pais.entity';
import { Rol } from '../../domain/entities/rol.entity';
import { TipoDocumento } from '../../domain/entities/tipo-documento.entity';
import { TipoPedido } from '../../domain/entities/tipo-pedido.entity';
import { TipoVia } from '../../domain/entities/tipo-via.entity';
import { ZonaBogota } from '../../domain/entities/zona-bogota.entity';
import { CiudadOrmEntity } from './ciudad.orm-entity';
import { DepartamentoOrmEntity } from './departamento.orm-entity';
import { EstadoPedidoOrmEntity } from './estado-pedido.orm-entity';
import { MetodoRecepcionOrmEntity } from './metodo-recepcion.orm-entity';
import { PaisOrmEntity } from './pais.orm-entity';
import { RolOrmEntity } from './rol.orm-entity';
import { TipoDocumentoOrmEntity } from './tipo-documento.orm-entity';
import { TipoPedidoOrmEntity } from './tipo-pedido.orm-entity';
import { TipoViaOrmEntity } from './tipo-via.orm-entity';
import { ZonaBogotaOrmEntity } from './zona-bogota.orm-entity';

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
    @InjectRepository(TipoPedidoOrmEntity)
    private readonly tipoPedidoRepo: Repository<TipoPedidoOrmEntity>,
    @InjectRepository(MetodoRecepcionOrmEntity)
    private readonly metodoRecepcionRepo: Repository<MetodoRecepcionOrmEntity>,
    @InjectRepository(TipoDocumentoOrmEntity)
    private readonly tipoDocumentoRepo: Repository<TipoDocumentoOrmEntity>,
    @InjectRepository(TipoViaOrmEntity)
    private readonly tipoViaRepo: Repository<TipoViaOrmEntity>,
    @InjectRepository(ZonaBogotaOrmEntity)
    private readonly zonaBogotaRepo: Repository<ZonaBogotaOrmEntity>,
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

  async listTiposPedido(): Promise<TipoPedido[]> {
    const rows = await this.tipoPedidoRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new TipoPedido(r.idTipoPedido, r.nombre));
  }

  async listMetodosRecepcion(): Promise<MetodoRecepcion[]> {
    const rows = await this.metodoRecepcionRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new MetodoRecepcion(r.idMetodoRecepcion, r.nombre));
  }

  async listTiposDocumento(): Promise<TipoDocumento[]> {
    const rows = await this.tipoDocumentoRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new TipoDocumento(r.idTipoDocumento, r.nombre, r.abreviacion));
  }

  async listTiposVia(): Promise<TipoVia[]> {
    const rows = await this.tipoViaRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new TipoVia(r.idTipoVia, r.nombre));
  }

  async listZonasBogota(): Promise<ZonaBogota[]> {
    const rows = await this.zonaBogotaRepo.find({ order: { nombre: 'ASC' } });
    return rows.map((r) => new ZonaBogota(r.idZona, r.nombre));
  }
}
