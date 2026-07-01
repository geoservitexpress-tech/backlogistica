import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { resolverPaginacion } from '../domain/paginacion';
import type { PagosRepartidorPort } from '../domain/ports/pagos-repartidor.port';
import { PAGOS_REPARTIDOR } from '../pagos-repartidor.tokens';
import type { ListRepartidoresPagoQueryDto } from '../presentation/http/dto/list-repartidores-pago.query.dto';
import type { DispersionPreviewQueryDto } from '../presentation/http/dto/dispersion-preview.query.dto';
import { hoyYmdBogota } from './asignacion-fecha-bogota';

function assertFechaYmd(fecha: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new BadRequestException('fecha debe ser YYYY-MM-DD');
  }
}

@Injectable()
export class GetPagosRepartidorKpisUseCase {
  constructor(@Inject(PAGOS_REPARTIDOR) private readonly pagos: PagosRepartidorPort) {}

  execute() {
    return this.pagos.getKpis();
  }
}

@Injectable()
export class ListRepartidoresPagoUseCase {
  constructor(@Inject(PAGOS_REPARTIDOR) private readonly pagos: PagosRepartidorPort) {}

  execute(query: ListRepartidoresPagoQueryDto) {
    if (query.fecha) assertFechaYmd(query.fecha);
    const { page, limit } = resolverPaginacion(query);
    return this.pagos.listRepartidores({
      page,
      limit,
      ...(query.search?.trim() && { search: query.search.trim() }),
      ...(query.estado && { estado: query.estado }),
      fecha: query.fecha ?? hoyYmdBogota(),
    });
  }
}

@Injectable()
export class PreviewDispersionRepartidorUseCase {
  constructor(@Inject(PAGOS_REPARTIDOR) private readonly pagos: PagosRepartidorPort) {}

  execute(query: DispersionPreviewQueryDto) {
    if (query.fecha) assertFechaYmd(query.fecha);
    return this.pagos.previewDispersion(query.fecha, query.idUsuario);
  }
}

@Injectable()
export class GenerarDispersionRepartidorUseCase {
  constructor(@Inject(PAGOS_REPARTIDOR) private readonly pagos: PagosRepartidorPort) {}

  execute(fecha?: string) {
    if (fecha != null && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('fecha debe ser YYYY-MM-DD');
    }
    return this.pagos.generarDispersionTotal(fecha);
  }
}

@Injectable()
export class GenerarDispersionRepartidorIndividualUseCase {
  constructor(@Inject(PAGOS_REPARTIDOR) private readonly pagos: PagosRepartidorPort) {}

  execute(idUsuario: number, fecha?: string) {
    if (fecha != null && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('fecha debe ser YYYY-MM-DD');
    }
    return this.pagos.generarDispersionRepartidor(idUsuario, fecha);
  }
}
