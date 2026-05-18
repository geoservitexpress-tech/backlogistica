import { Inject, Injectable } from '@nestjs/common';
import type { CatalogReadPort } from '../domain/ports/catalog-read.port';
import { CATALOG_READ } from '../catalog.tokens';

@Injectable()
export class ListCiudadesUseCase {
  constructor(@Inject(CATALOG_READ) private readonly catalog: CatalogReadPort) {}

  execute() {
    return this.catalog.listCiudades().then((rows) =>
      rows.map((r) => ({
        idCiudad: r.idCiudad,
        nombre: r.nombre,
        codigoDane: r.codigoDane,
      })),
    );
  }
}
