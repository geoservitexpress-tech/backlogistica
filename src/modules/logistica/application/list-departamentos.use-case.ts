import { Inject, Injectable } from '@nestjs/common';
import type { CatalogReadPort } from '../domain/ports/catalog-read.port';
import { CATALOG_READ } from '../catalog.tokens';

@Injectable()
export class ListDepartamentosUseCase {
  constructor(@Inject(CATALOG_READ) private readonly catalog: CatalogReadPort) {}

  execute() {
    return this.catalog.listDepartamentos().then((rows) =>
      rows.map((r) => ({
        idDepartamento: r.idDepartamento,
        nombre: r.nombre,
        codigoDane: r.codigoDane,
      })),
    );
  }
}
