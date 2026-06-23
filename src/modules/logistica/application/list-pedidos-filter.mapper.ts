import { BadRequestException } from '@nestjs/common';
import type { ListPedidosFilter } from '../domain/ports/pedido-read.port';

export interface ListPedidosFiltrosQuery {
  fecha?: string;
  fechaEntrega?: string;
  idProveedor?: number;
  idUsuario?: number;
  idMensajero?: number;
  idPedido?: number;
  direccion?: string;
}

function assertFechaYmd(fecha: string, campo: string): void {
  const d = new Date(`${fecha}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== fecha) {
    throw new BadRequestException(`${campo} inválida: ${fecha}`);
  }
}

export function buildListPedidosFilter(
  query: ListPedidosFiltrosQuery | undefined,
  paginacion: { page: number; limit: number },
  extra?: Partial<ListPedidosFilter>,
): ListPedidosFilter {
  if (query?.fecha) assertFechaYmd(query.fecha, 'fecha');
  if (query?.fechaEntrega) assertFechaYmd(query.fechaEntrega, 'fechaEntrega');

  const idProveedor = query?.idProveedor ?? query?.idUsuario;

  return {
    page: paginacion.page,
    limit: paginacion.limit,
    ...(query?.fecha && { fecha: query.fecha }),
    ...(query?.fechaEntrega && { fechaEntrega: query.fechaEntrega }),
    ...(idProveedor != null && { idUsuario: idProveedor }),
    ...(query?.idMensajero != null && { idRepartidor: query.idMensajero }),
    ...(query?.idPedido != null && { idPedido: query.idPedido }),
    ...(query?.direccion?.trim() && { direccion: query.direccion.trim() }),
    ...extra,
  };
}
