export type Paginado<T> = {
  total: number;
  page: number;
  limit: number;
  totalPaginas: number;
  items: T[];
};

export type PaginacionParams = {
  page: number;
  limit: number;
};

export const PAGINACION_DEFAULT_PAGE = 1;
export const PAGINACION_DEFAULT_LIMIT = 20;
export const PAGINACION_MAX_LIMIT = 100;

export function resolverPaginacion(query?: {
  page?: number;
  limit?: number;
}): PaginacionParams {
  return {
    page: query?.page ?? PAGINACION_DEFAULT_PAGE,
    limit: query?.limit ?? PAGINACION_DEFAULT_LIMIT,
  };
}

export function buildPaginado<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginado<T> {
  return {
    total,
    page,
    limit,
    totalPaginas: total === 0 ? 0 : Math.ceil(total / limit),
    items,
  };
}
