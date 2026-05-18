import { Inject, Injectable } from '@nestjs/common';
import type { CatalogReadPort } from '../domain/ports/catalog-read.port';
import { CATALOG_READ } from '../catalog.tokens';

@Injectable()
export class ListZonasBogotaUseCase {
  constructor(@Inject(CATALOG_READ) private readonly catalog: CatalogReadPort) {}

  execute() {
    return this.catalog.listZonasBogota().then((rows) =>
      rows.map((r) => ({
        idZonaBogota: r.idZona,
        nombre: r.nombre,
      })),
    );
  }
}
