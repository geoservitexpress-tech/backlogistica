import { BadRequestException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { DescripcionSeguimientoOrmEntity } from './descripcion-seguimiento.orm-entity';
import { EstadoPedidoOrmEntity } from './estado-pedido.orm-entity';
import { PedidoOrmEntity } from './pedido.orm-entity';
import { SeguimientoOrmEntity } from './seguimiento.orm-entity';

export const SEGUIMIENTO_DESCRIPCION_MANIFIESTO = 'Manifiesto de carga';
export const SEGUIMIENTO_DESCRIPCION_FOTO_PAQUETE = 'Foto del paquete';
export const SEGUIMIENTO_DESCRIPCION_RECIBIDO_REPARTIDOR = 'Recibido por el repartidor';
export const SEGUIMIENTO_DESCRIPCION_EN_CURSO = 'En curso';

export async function assertTablasSeguimientoPedido(manager: EntityManager): Promise<void> {
  const rows = (await manager.query(
    `select table_name from information_schema.tables
     where table_schema = 'public'
       and table_name in ('seguimiento', 'descripcion_seguimiento')`,
  )) as { table_name: string }[];
  const ok = new Set(rows.map((r) => r.table_name));
  if (!ok.has('seguimiento') || !ok.has('descripcion_seguimiento')) {
    throw new BadRequestException(
      'Faltan tablas seguimiento o descripcion_seguimiento. Ejecute database/01-schema-numeric-ids.sql en Supabase.',
    );
  }
}

/** Registro inicial al crear pedido (estado Creado u otro inicial). */
export async function registrarSeguimientoCreacionPedido(
  manager: EntityManager,
  params: {
    idPedido: number;
    idEstadoPedido: number;
    observacionesManifiesto?: string | null;
    fotosPaqueteUrls?: string[] | null;
  },
): Promise<number> {
  await assertTablasSeguimientoPedido(manager);
  const now = new Date();
  const seguimiento = manager.create(SeguimientoOrmEntity, {
    pedido: { idPedido: params.idPedido } as PedidoOrmEntity,
    estadoPedido: { idEstadoPedido: params.idEstadoPedido } as EstadoPedidoOrmEntity,
    fecha: now,
  });
  await manager.save(seguimiento);

  const manifiesto = params.observacionesManifiesto?.trim();
  if (manifiesto) {
    await manager.save(
      manager.create(DescripcionSeguimientoOrmEntity, {
        seguimiento,
        estadoPedido: { idEstadoPedido: params.idEstadoPedido } as EstadoPedidoOrmEntity,
        descripcion: SEGUIMIENTO_DESCRIPCION_MANIFIESTO,
        fotoUrl: null,
        observaciones: manifiesto,
        resultadoEntrega: null,
        creadoEn: now,
      }),
    );
  }

  const fotos = params.fotosPaqueteUrls?.filter(Boolean) ?? [];
  for (let i = 0; i < fotos.length; i++) {
    await manager.save(
      manager.create(DescripcionSeguimientoOrmEntity, {
        seguimiento,
        estadoPedido: { idEstadoPedido: params.idEstadoPedido } as EstadoPedidoOrmEntity,
        descripcion:
          fotos.length > 1
            ? `${SEGUIMIENTO_DESCRIPCION_FOTO_PAQUETE} (${i + 1}/${fotos.length})`
            : SEGUIMIENTO_DESCRIPCION_FOTO_PAQUETE,
        fotoUrl: fotos[i]!,
        observaciones: null,
        resultadoEntrega: null,
        creadoEn: now,
      }),
    );
  }

  return seguimiento.idSeguimiento;
}

/** Añade filas de fotos al seguimiento de creación (tras subir a Storage). */
export async function anexarFotosSeguimientoCreacion(
  manager: EntityManager,
  params: { idPedido: number; idEstadoPedido: number; fotosPaqueteUrls: string[] },
): Promise<void> {
  if (params.fotosPaqueteUrls.length === 0) return;
  await assertTablasSeguimientoPedido(manager);

  const rows = (await manager.query(
    `select s.id_seguimiento
     from seguimiento s
     where s.fk_pedido = $1::int
     order by s.fecha asc, s.id_seguimiento asc
     limit 1`,
    [params.idPedido],
  )) as { id_seguimiento: number }[];

  const idSeg = rows[0]?.id_seguimiento;
  if (!idSeg) {
    await registrarSeguimientoCreacionPedido(manager, {
      idPedido: params.idPedido,
      idEstadoPedido: params.idEstadoPedido,
      fotosPaqueteUrls: params.fotosPaqueteUrls,
    });
    return;
  }

  const seguimiento = { idSeguimiento: idSeg } as SeguimientoOrmEntity;
  const now = new Date();
  const fotos = params.fotosPaqueteUrls;
  for (let i = 0; i < fotos.length; i++) {
    await manager.save(
      manager.create(DescripcionSeguimientoOrmEntity, {
        seguimiento,
        estadoPedido: { idEstadoPedido: params.idEstadoPedido } as EstadoPedidoOrmEntity,
        descripcion:
          fotos.length > 1
            ? `${SEGUIMIENTO_DESCRIPCION_FOTO_PAQUETE} (${i + 1}/${fotos.length})`
            : SEGUIMIENTO_DESCRIPCION_FOTO_PAQUETE,
        fotoUrl: fotos[i]!,
        observaciones: null,
        resultadoEntrega: null,
        creadoEn: now,
      }),
    );
  }
}

/** Paso de seguimiento por cambio de estado (p. ej. repartidor recibe el pedido). */
export async function registrarSeguimientoPasoEstado(
  manager: EntityManager,
  params: {
    idPedido: number;
    idEstadoPedido: number;
    descripcion: string;
    observaciones?: string | null;
  },
): Promise<void> {
  await assertTablasSeguimientoPedido(manager);
  const now = new Date();
  const seguimiento = manager.create(SeguimientoOrmEntity, {
    pedido: { idPedido: params.idPedido } as PedidoOrmEntity,
    estadoPedido: { idEstadoPedido: params.idEstadoPedido } as EstadoPedidoOrmEntity,
    fecha: now,
  });
  await manager.save(seguimiento);
  await manager.save(
    manager.create(DescripcionSeguimientoOrmEntity, {
      seguimiento,
      estadoPedido: { idEstadoPedido: params.idEstadoPedido } as EstadoPedidoOrmEntity,
      descripcion: params.descripcion,
      fotoUrl: null,
      observaciones: params.observaciones?.trim() || null,
      resultadoEntrega: null,
      creadoEn: now,
    }),
  );
}

/** Actualización del manifiesto (PATCH): nuevo paso de seguimiento con el texto. */
export async function registrarSeguimientoManifiestoActualizado(
  manager: EntityManager,
  params: { idPedido: number; idEstadoPedido: number; observacionesManifiesto: string },
): Promise<void> {
  const texto = params.observacionesManifiesto.trim();
  if (!texto) return;
  await registrarSeguimientoCreacionPedido(manager, {
    idPedido: params.idPedido,
    idEstadoPedido: params.idEstadoPedido,
    observacionesManifiesto: texto,
  });
}

/** Lee el manifiesto más reciente guardado en descripcion_seguimiento. */
export async function leerManifiestoDesdeSeguimiento(
  manager: EntityManager,
  idPedido: number,
): Promise<string | null> {
  const rows = (await manager.query(
    `select ds.observaciones
     from descripcion_seguimiento ds
     inner join seguimiento s on s.id_seguimiento = ds.fk_seguimiento
     where s.fk_pedido = $1::int
       and ds.descripcion = $2
       and ds.observaciones is not null
       and btrim(ds.observaciones) <> ''
     order by ds.creado_en desc, ds.id_descripcion desc
     limit 1`,
    [idPedido, SEGUIMIENTO_DESCRIPCION_MANIFIESTO],
  )) as { observaciones: string }[];
  const t = rows[0]?.observaciones?.trim();
  return t || null;
}
