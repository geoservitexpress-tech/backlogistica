import { randomBytes } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import {
  ESTADO_FACTURA_CREADA_ID,
  ESTADO_FACTURA_PAGADA_ID,
  ESTADO_FACTURA_POR_COBRAR_ID,
  ESTADO_FACTURA_SALDO_A_FAVOR_ID,
  ESTADOS_FACTURA_ABIERTA,
} from '../../logistica-factura-estados.constants';
import {
  ESTADO_PEDIDO_CANCELADO_ID,
  ESTADO_PEDIDO_ENTREGADO_ID,
  ESTADO_PEDIDO_NO_ENTREGADO_ID,
  ESTADO_PEDIDO_DEVUELTO_ID,
} from '../../logistica-pedido-estados.constants';
import { lineaNomenclaturaColombiana } from '../../application/direccion-colombiana-texto';
import type { DireccionOrmEntity } from './direccion.orm-entity';
import { FacturaOrmEntity } from './factura.orm-entity';
import { MetodoPagoOrmEntity } from './metodo-pago.orm-entity';
import { PedidoOrmEntity } from './pedido.orm-entity';

const logger = new Logger('GestionarFacturaPedido');

export function generarNumeroFactura(fecha: Date = new Date()): string {
  const ymd = fecha.toISOString().slice(0, 10).replace(/-/g, '');
  return `FAC-${ymd}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export function esEstadoPedidoTerminalFactura(idEstadoPedido: number): boolean {
  return (
    idEstadoPedido === ESTADO_PEDIDO_ENTREGADO_ID ||
    idEstadoPedido === ESTADO_PEDIDO_CANCELADO_ID ||
    idEstadoPedido === ESTADO_PEDIDO_NO_ENTREGADO_ID ||
    idEstadoPedido === ESTADO_PEDIDO_DEVUELTO_ID
  );
}

function textoDireccionFactura(d: DireccionOrmEntity): string {
  const obs = d.observacionesEntrega?.trim();
  const viaLine = lineaNomenclaturaColombiana(d);
  const partes = [d.ciudad?.nombre, d.departamento?.nombre, viaLine, obs].filter(Boolean);
  return partes.join(', ');
}

export function calcularEstadoFacturaCierre(monto: number, montoCobrado: number): number {
  const m = Number(monto);
  const c = Number(montoCobrado);
  if (c > m) return ESTADO_FACTURA_SALDO_A_FAVOR_ID;
  if (c >= m) return ESTADO_FACTURA_PAGADA_ID;
  return ESTADO_FACTURA_POR_COBRAR_ID;
}

/** Total cobrado de la tarifa de envío al cierre de factura (no incluye COD del producto). */
export function montoCobradoAlCierre(
  pedido: PedidoOrmEntity,
  factura: Pick<FacturaOrmEntity, 'pagadoAlCrear' | 'montoCobrado'>,
): number {
  const tarifa = Number(pedido.tarifaEnvio ?? pedido.precio ?? 0);
  if (factura.pagadoAlCrear) {
    return Number(factura.montoCobrado ?? tarifa);
  }
  if (pedido.pagadoPorRemitente) {
    return tarifa;
  }
  return 0;
}

export function tarifaEnvioPedido(pedido: Pick<PedidoOrmEntity, 'tarifaEnvio' | 'precio'>): number {
  return Number(pedido.tarifaEnvio ?? pedido.precio ?? 0);
}

export async function tablaFacturaDisponible(manager: EntityManager): Promise<boolean> {
  const rows = (await manager.query(
    `select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'factura' limit 1`,
  )) as unknown[];
  return rows.length > 0;
}

async function assertColumnasFacturaApi(manager: EntityManager): Promise<void> {
  const required = ['monto_cobrado', 'pagado_al_crear', 'fk_estado_factura', 'fecha_cierre'];
  const rows = (await manager.query(
    `select column_name from information_schema.columns
     where table_schema = 'public' and table_name = 'factura'
       and column_name = any($1::text[])`,
    [required],
  )) as { column_name: string }[];
  if (rows.length < required.length) {
    const ok = new Set(rows.map((r) => r.column_name));
    const missing = required.filter((c) => !ok.has(c));
    throw new Error(
      `Faltan columnas en public.factura: ${missing.join(', ')}. ` +
        'Ejecute database/patch-factura-columnas-nuevas.sql en Supabase.',
    );
  }
}

export type CrearFacturaPedidoInput = {
  idPedido: number;
  idCliente: number;
  monto: number;
  pagadoAlCrear: boolean;
  idMetodoPago?: number | null;
  destinatarioNombre: string;
  destinatarioTelefono: string;
  direccionEntrega: string;
  idDestinatario?: number | null;
  idDireccion?: number | null;
};

export async function crearFacturaAlCrearPedido(
  manager: EntityManager,
  input: CrearFacturaPedidoInput,
): Promise<void> {
  if (!(await tablaFacturaDisponible(manager))) {
    logger.warn(
      'Tabla factura no existe; omitiendo creación. Ejecute database/patch-factura-columnas-nuevas.sql',
    );
    return;
  }
  await assertColumnasFacturaApi(manager);

  const now = new Date();
  const monto = Number(input.monto);
  const pagadoAlCrear = input.pagadoAlCrear;
  // Acumulado cobrado: 0 si cobro al entregar; = monto solo si prepago explícito al crear.
  const montoCobrado = pagadoAlCrear ? monto : 0;

  const factura = manager.create(FacturaOrmEntity, {
    numero: generarNumeroFactura(now),
    cliente: { idUsuario: input.idCliente },
    pedido: { idPedido: input.idPedido },
    estadoFactura: { idEstadoFactura: ESTADO_FACTURA_CREADA_ID },
    monto,
    montoCobrado,
    pagadoAlCrear,
    fechaPago: pagadoAlCrear ? now : null,
    fechaCierre: null,
    metodoPago: input.idMetodoPago != null ? { idMetodoPago: input.idMetodoPago } : null,
    destinatarioNombre: input.destinatarioNombre,
    destinatarioTelefono: input.destinatarioTelefono,
    direccionEntrega: input.direccionEntrega,
    destinatario: input.idDestinatario != null ? { idDestinatario: input.idDestinatario } : null,
    direccion: input.idDireccion != null ? { idDireccion: input.idDireccion } : null,
    observaciones: null,
    creadoEn: now,
    actualizadoEn: now,
  });

  await manager.save(factura);
  logger.log(
    `Factura ${factura.numero} creada id_pedido=${input.idPedido} monto=${monto} pagado_al_crear=${pagadoAlCrear}`,
  );
}

export async function cerrarFacturaSiPedidoTerminal(
  manager: EntityManager,
  pedido: PedidoOrmEntity,
): Promise<void> {
  if (!(await tablaFacturaDisponible(manager))) return;
  await assertColumnasFacturaApi(manager);
  if (!esEstadoPedidoTerminalFactura(pedido.estadoPedido.idEstadoPedido)) return;

  const repo = manager.getRepository(FacturaOrmEntity);
  const factura = await repo.findOne({
    where: { pedido: { idPedido: pedido.idPedido } },
    relations: ['estadoFactura'],
  });
  if (!factura) {
    logger.warn(`Sin factura para cerrar id_pedido=${pedido.idPedido}`);
    return;
  }
  if (!ESTADOS_FACTURA_ABIERTA.includes(factura.estadoFactura.idEstadoFactura)) {
    return;
  }

  const now = new Date();
  const monto = tarifaEnvioPedido(pedido);
  const montoCobrado = montoCobradoAlCierre(pedido, factura);
  const idEstado = calcularEstadoFacturaCierre(monto, montoCobrado);

  factura.monto = monto;
  factura.montoCobrado = montoCobrado;
  factura.estadoFactura = { idEstadoFactura: idEstado } as FacturaOrmEntity['estadoFactura'];
  factura.fechaCierre = now;
  factura.actualizadoEn = now;
  if (idEstado === ESTADO_FACTURA_PAGADA_ID || idEstado === ESTADO_FACTURA_SALDO_A_FAVOR_ID) {
    factura.fechaPago = factura.fechaPago ?? now;
  }

  await repo.save(factura);
  logger.log(
    `Factura ${factura.numero} cerrada id_pedido=${pedido.idPedido} estado=${idEstado} cobrado=${montoCobrado}/${monto}`,
  );
}

/** Texto de dirección para snapshot en factura (requiere relaciones de dirección cargadas). */
export function direccionEntregaDesdePedido(pedido: PedidoOrmEntity): string {
  if (!pedido.direccion) return '';
  return textoDireccionFactura(pedido.direccion);
}

export type RegistrarPagoFacturaAbiertaInput = {
  idFactura: number;
  idMetodoPago: number;
};

/** Prepago de factura abierta (estado Creada): actualiza factura y pedido vinculado. */
export async function registrarPagoFacturaAbierta(
  manager: EntityManager,
  input: RegistrarPagoFacturaAbiertaInput,
): Promise<FacturaOrmEntity> {
  await assertColumnasFacturaApi(manager);

  const repo = manager.getRepository(FacturaOrmEntity);
  const factura = await repo.findOne({
    where: { idFactura: input.idFactura },
    relations: ['estadoFactura', 'pedido', 'pedido.estadoPedido', 'cliente'],
  });
  if (!factura) {
    throw new Error(`Factura ${input.idFactura} no encontrada`);
  }
  if (!ESTADOS_FACTURA_ABIERTA.includes(factura.estadoFactura.idEstadoFactura)) {
    throw new Error(
      `La factura ${factura.numero} no está abierta (estado ${factura.estadoFactura.nombre})`,
    );
  }
  if (esEstadoPedidoTerminalFactura(factura.pedido.estadoPedido.idEstadoPedido)) {
    throw new Error(
      `El pedido ${factura.pedido.idPedido} ya está finalizado; la factura debería cerrarse automáticamente`,
    );
  }

  const monto = Number(factura.monto);
  const cobrado = Number(factura.montoCobrado ?? 0);
  if (factura.pagadoAlCrear || cobrado >= monto) {
    throw new Error(`La factura ${factura.numero} ya está pagada o no tiene saldo pendiente`);
  }

  const metodoPago = await manager.getRepository(MetodoPagoOrmEntity).findOne({
    where: { idMetodoPago: input.idMetodoPago },
  });
  if (!metodoPago) {
    throw new Error(`metodo_pago no encontrado: ${input.idMetodoPago}`);
  }

  const now = new Date();
  factura.montoCobrado = monto;
  factura.pagadoAlCrear = true;
  factura.fechaPago = now;
  factura.metodoPago = metodoPago;
  factura.actualizadoEn = now;

  const pedidoRepo = manager.getRepository(PedidoOrmEntity);
  factura.pedido.pagadoPorRemitente = true;
  factura.pedido.valorRecaudado = monto;
  factura.pedido.metodoPago = metodoPago;
  await pedidoRepo.save(factura.pedido);

  await repo.save(factura);
  logger.log(
    `Pago registrado factura ${factura.numero} id_pedido=${factura.pedido.idPedido} monto=${monto} metodo=${metodoPago.nombre}`,
  );

  const saved = await repo.findOne({
    where: { idFactura: factura.idFactura },
    relations: ['cliente', 'pedido', 'estadoFactura', 'metodoPago'],
  });
  if (!saved) {
    throw new Error(`No se pudo leer la factura ${input.idFactura} tras el pago`);
  }
  return saved;
}

/** Actualiza `factura.monto` si la factura del pedido sigue abierta (estado Creada). */
export async function sincronizarFacturaMontoAbierta(
  manager: EntityManager,
  idPedido: number,
  nuevoMonto: number,
): Promise<void> {
  if (!(await tablaFacturaDisponible(manager))) return;
  await assertColumnasFacturaApi(manager);

  const repo = manager.getRepository(FacturaOrmEntity);
  const factura = await repo.findOne({
    where: { pedido: { idPedido } },
    relations: ['estadoFactura'],
  });
  if (!factura) return;
  if (!ESTADOS_FACTURA_ABIERTA.includes(factura.estadoFactura.idEstadoFactura)) return;
  if (factura.pagadoAlCrear) return;

  const monto = Number(nuevoMonto);
  factura.monto = monto;
  factura.actualizadoEn = new Date();
  await repo.save(factura);
  logger.log(`Factura ${factura.numero} monto actualizado id_pedido=${idPedido} monto=${monto}`);
}
