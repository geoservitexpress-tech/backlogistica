import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, QueryFailedError, Repository } from 'typeorm';
import { VAR } from '../../../configuracion/variable.keys';
import { VariablesService } from '../../../configuracion/variables.service';
import type { FacturaListado } from '../../domain/read-models/factura-listado';
import type { FacturaReadPort, ListFacturasFilter } from '../../domain/ports/factura-read.port';
import { buildPaginado, type Paginado } from '../../domain/paginacion';
import { facturaOrmToListado } from './factura-listado.mapper';
import { FacturaOrmEntity } from './factura.orm-entity';

function rangoDiaUtc(fechaYmd: string): { desde: Date; hasta: Date } {
  const desde = new Date(`${fechaYmd}T00:00:00.000Z`);
  const hasta = new Date(`${fechaYmd}T23:59:59.999Z`);
  return { desde, hasta };
}

function rangoDiaAmericaBogota(fechaYmd: string): { desde: Date; hasta: Date } {
  const [ys, ms, ds] = fechaYmd.split('-');
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const desde = new Date(Date.UTC(y, m - 1, d, 5, 0, 0, 0));
  const hasta = new Date(Date.UTC(y, m - 1, d + 1, 4, 59, 59, 999));
  return { desde, hasta };
}

async function rangoParaFiltroCreadoEn(
  fechaYmd: string,
  variables: VariablesService,
): Promise<{ desde: Date; hasta: Date }> {
  const modo = (await variables.getText(VAR.LIST_PEDIDOS_FECHA_TZ, 'America/Bogota')).trim();
  if (modo.toUpperCase() === 'UTC') {
    return rangoDiaUtc(fechaYmd);
  }
  return rangoDiaAmericaBogota(fechaYmd);
}

const FACTURA_RELATIONS = ['cliente', 'pedido', 'estadoFactura', 'metodoPago'] as const;

@Injectable()
export class TypeOrmFacturaReadRepository implements FacturaReadPort {
  private readonly logger = new Logger(TypeOrmFacturaReadRepository.name);

  constructor(
    @InjectRepository(FacturaOrmEntity)
    private readonly repo: Repository<FacturaOrmEntity>,
    private readonly variables: VariablesService,
  ) {}

  private rethrowIfMissingRelation(e: unknown): void {
    if (e instanceof QueryFailedError) {
      const driver = e.driverError as { code?: string; message?: string } | undefined;
      const msg = String(driver?.message ?? e.message ?? '');
      if (driver?.code === '42P01' && /relation .* does not exist/i.test(msg)) {
        this.logger.error(`Postgres ${driver.code}: ${msg}`);
        throw new InternalServerErrorException(
          `${msg.trim()} — Ejecute database/patch-factura-columnas-nuevas.sql si falta la tabla o columnas de factura.`,
        );
      }
    }
  }

  async listFacturas(filter: ListFacturasFilter): Promise<Paginado<FacturaListado>> {
    const where: FindOptionsWhere<FacturaOrmEntity> = {};
    const offset = (filter.page - 1) * filter.limit;
    if (filter.idFactura) {
      where.idFactura = filter.idFactura;
    }
    if (filter.idCliente) {
      where.cliente = { idUsuario: filter.idCliente };
    }
    if (filter.idPedido) {
      where.pedido = { idPedido: filter.idPedido };
    }
    if (filter.idEstadoFactura) {
      where.estadoFactura = { idEstadoFactura: filter.idEstadoFactura };
    }
    if (filter.fecha) {
      const { desde, hasta } = await rangoParaFiltroCreadoEn(filter.fecha, this.variables);
      where.creadoEn = Between(desde, hasta);
    }

    try {
      const [rows, total] = await this.repo.findAndCount({
        where,
        relations: [...FACTURA_RELATIONS],
        order: { creadoEn: 'DESC' },
        skip: offset,
        take: filter.limit,
      });
      return buildPaginado(rows.map(facturaOrmToListado), total, filter.page, filter.limit);
    } catch (e) {
      this.rethrowIfMissingRelation(e);
      throw e;
    }
  }

  async findFacturaById(idFactura: number, idCliente?: number): Promise<FacturaListado | null> {
    const where: FindOptionsWhere<FacturaOrmEntity> = { idFactura };
    if (idCliente) {
      where.cliente = { idUsuario: idCliente };
    }
    try {
      const row = await this.repo.findOne({
        where,
        relations: [...FACTURA_RELATIONS],
      });
      return row ? facturaOrmToListado(row) : null;
    } catch (e) {
      this.rethrowIfMissingRelation(e);
      throw e;
    }
  }
}
