import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { getDistance } from 'geolib';
import { DataSource } from 'typeorm';
import { VAR } from '../../configuracion/variable.keys';
import { VariablesService } from '../../configuracion/variables.service';
import { ROL_ID_REPARTIDOR } from '../logistica-rol.constants';
import {
  ESTADO_PEDIDO_ASIGNADO_ID,
  ESTADO_PEDIDO_CREADO_ID,
  ESTADOS_PEDIDO_TERMINALES_REPARTIDOR,
} from '../logistica-pedido-estados.constants';
import {
  TIPO_PEDIDO_EXPRESS_ID,
  TIPO_PEDIDO_NORMAL_ID,
} from '../logistica-tipo-pedido.constants';
import { hoyYmdBogota, mananaYmdBogota } from './asignacion-fecha-bogota';
import { textoDireccionColombianaMapa } from './direccion-colombiana-texto';
import { nominatimBuscarUnaDireccion } from './nominatim-geocode';
import { PedidoOrmEntity } from '../infrastructure/persistence/pedido.orm-entity';
import { UsuarioRolOrmEntity } from '../infrastructure/persistence/usuario-rol.orm-entity';

/** @deprecated Use `ESTADO_PEDIDO_ASIGNADO_ID` */
export const ASIGNACION_DEFAULT_ESTADO_ASIGNADO_ID = ESTADO_PEDIDO_ASIGNADO_ID;

export type ModoAsignacionRepartidor = 'greedy' | 'por_zona_bogota';

export type ResultadoAsignacionRepartidores = {
  asignados: number;
  repartidores: number;
  pedidosPendientes: number;
  omitidosSinCupo: number;
  modo: ModoAsignacionRepartidor;
  etiqueta: string;
};

/** Hub de repartidor: coordenadas GPS y/o ciudad de referencia. */
export type RepartidorHubConfig = {
  idUsuario: number;
  lat?: number;
  lng?: number;
  idCiudad?: number;
};

type LatLng = { lat: number; lng: number };

function diaFechaEntrega(f: Date): string {
  const d = f instanceof Date ? f : new Date(f);
  if (Number.isNaN(d.getTime())) {
    return '1970-01-01';
  }
  return d.toISOString().slice(0, 10);
}

/** Distancia en línea recta (Haversine vía geolib), en kilómetros. */
function distanciaKm(a: LatLng, b: LatLng): number {
  return (
    getDistance(
      { latitude: a.lat, longitude: a.lng },
      { latitude: b.lat, longitude: b.lng },
    ) / 1000
  );
}

function centroid(points: LatLng[]): LatLng | null {
  if (points.length === 0) return null;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;
  return { lat, lng };
}

function parseHubsJson(raw: string | undefined): RepartidorHubConfig[] {
  if (!raw?.trim()) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    const out: RepartidorHubConfig[] = [];
    for (const x of arr) {
      if (!x || typeof x !== 'object') continue;
      const o = x as Record<string, unknown>;
      const rawId = o.idUsuario;
      let idUsuario: number | undefined;
      if (typeof rawId === 'number' && Number.isInteger(rawId) && rawId > 0) {
        idUsuario = rawId;
      } else if (typeof rawId === 'string' && /^\d+$/.test(rawId.trim())) {
        idUsuario = Number.parseInt(rawId.trim(), 10);
      }
      if (idUsuario == null) continue;
      const lat = typeof o.lat === 'number' ? o.lat : typeof o.latitud === 'number' ? o.latitud : undefined;
      const lng = typeof o.lng === 'number' ? o.lng : typeof o.longitud === 'number' ? o.longitud : undefined;
      const rawCiudad = o.idCiudad ?? o.fkCiudad;
      let idCiudad: number | undefined;
      if (typeof rawCiudad === 'number' && Number.isInteger(rawCiudad) && rawCiudad > 0) {
        idCiudad = rawCiudad;
      } else if (typeof rawCiudad === 'string' && /^\d+$/.test(rawCiudad.trim())) {
        idCiudad = Number.parseInt(rawCiudad.trim(), 10);
      }
      out.push({ idUsuario, lat, lng, idCiudad });
    }
    return out;
  } catch {
    return [];
  }
}

/** Orden de visita greedy (nearest neighbor) desde `inicio`; devuelve orden de índices y km acumulados en línea recta. */
function rutaNearestNeighborKm(inicio: LatLng, paradas: LatLng[]): { orden: number[]; kmTotal: number } {
  if (paradas.length === 0) {
    return { orden: [], kmTotal: 0 };
  }
  const restantes = paradas.map((p, i) => ({ p, i }));
  const orden: number[] = [];
  let cur = inicio;
  let kmTotal = 0;
  while (restantes.length > 0) {
    let bestJ = 0;
    let bestD = Number.POSITIVE_INFINITY;
    for (let j = 0; j < restantes.length; j++) {
      const d = distanciaKm(cur, restantes[j].p);
      if (d < bestD) {
        bestD = d;
        bestJ = j;
      }
    }
    const { p, i } = restantes.splice(bestJ, 1)[0];
    kmTotal += bestD;
    orden.push(i);
    cur = p;
  }
  return { orden, kmTotal };
}

/**
 * Asigna repartidor a pedidos **pendientes** y pasa a **asignado**.
 *
 * **Crons:** `ejecutarAsignacionNormalNocturna` (20:00, Normal mañana, por `zona_bogota`) y
 * `ejecutarAsignacionExpressYBacklog` (cada 20 min, Express + Normal hoy, repartidores libres, greedy).
 *
 * **Kilómetros / recorrido:** con `latitud`/`longitud` en `direccion` y hubs con coordenadas (o centroide por ciudad),
 * cada pedido se asigna al repartidor que minimiza la distancia **desde su última posición** (hub → 1.ª entrega → 2.ª …),
 * respetando el cupo diario. Es una heurística que encadena entregas por cercanía (no es ruta con calles ni TSP óptimo).
 * Tras cada día se registra en log un **orden NN** y km en línea recta por repartidor (informativo).
 *
 * **Dirección Colombia:** `zona` = número de vía **antes** del `#` (p. ej. `2A`); placas tras `#` en `numero_principal` / `numero_secundario`
 * (p. ej. *Calle 2A # 14B-30*). Si no hay `latitud`/`longitud` en BD, opcionalmente `ASIGNACION_GEOCODING_NOMINATIM` consulta OSM Nominatim
 * (solo en memoria en esa corrida; respeta ~1 req/s) para afinar km y orden NN. Si no, se avisa en log con `textoDireccionColombianaMapa`.
 *
 * **Estados elegibles:** `ASIGNACION_ESTADOS_PEDIDO_ELEGIBLES` en `public.variable` (por defecto **Creado**).
 */
@Injectable()
export class AsignacionRepartidoresService {
  private readonly logger = new Logger(AsignacionRepartidoresService.name);
  private coordsColumnsCache: boolean | null = null;

  constructor(
    private readonly variables: VariablesService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private async direccionTieneColumnasCoordenadas(): Promise<boolean> {
    if (this.coordsColumnsCache !== null) return this.coordsColumnsCache;
    const r = (await this.dataSource.query(
      `select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'direccion' and column_name = 'latitud' limit 1`,
    )) as unknown[];
    this.coordsColumnsCache = r.length > 0;
    return this.coordsColumnsCache;
  }

  private async cargarCoordenadasDirecciones(
    ids: number[],
  ): Promise<Map<number, LatLng>> {
    const map = new Map<number, LatLng>();
    if (ids.length === 0) return map;
    const tiene = await this.direccionTieneColumnasCoordenadas();
    if (!tiene) return map;
    const rows = (await this.dataSource.query(
      `select id_direccion as id, latitud::float8 as lat, longitud::float8 as lng
       from direccion where id_direccion = any($1::int[])`,
      [ids],
    )) as { id: number; lat: number | null; lng: number | null }[];
    for (const row of rows) {
      if (row.lat != null && row.lng != null && Number.isFinite(row.lat) && Number.isFinite(row.lng)) {
        map.set(row.id, { lat: row.lat, lng: row.lng });
      }
    }
    return map;
  }

  /**
   * Rellena `coordsPorDireccion` con Nominatim para direcciones sin coordenadas en BD (no persiste).
   * Requiere `ASIGNACION_NOMINATIM_CONTACT_EMAIL` (política OSM). Cache por texto de consulta deduplica la misma dirección.
   */
  private async rellenarCoordsNominatimOpcional(
    pedidos: PedidoOrmEntity[],
    coordsPorDireccion: Map<number, LatLng>,
  ): Promise<{ intentadas: number; aciertos: number }> {
    const geocoding = await this.variables.getBoolean(VAR.ASIGNACION_GEOCODING_NOMINATIM, false);
    if (!geocoding) {
      return { intentadas: 0, aciertos: 0 };
    }
    const email = (await this.variables.getRaw(VAR.ASIGNACION_NOMINATIM_CONTACT_EMAIL))?.trim();
    if (!email?.includes('@')) {
      this.logger.warn(
        'ASIGNACION_GEOCODING_NOMINATIM activo pero falta ASIGNACION_NOMINATIM_CONTACT_EMAIL en public.variable; no se geocodifica.',
      );
      return { intentadas: 0, aciertos: 0 };
    }
    const ua = `backlogistica-asignacion/1.0 (${email})`;
    const dirPorId = new Map(pedidos.map((p) => [p.direccion.idDireccion, p.direccion]));
    const idsSinCoords = [...dirPorId.keys()].filter((id) => !coordsPorDireccion.has(id));
    const cachePorConsulta = new Map<string, LatLng | null>();
    let aciertos = 0;
    const delayMs = 1100;

    for (const id of idsSinCoords) {
      const d = dirPorId.get(id)!;
      const q = textoDireccionColombianaMapa(d);
      let ll = cachePorConsulta.get(q);
      if (ll === undefined) {
        await new Promise((r) => setTimeout(r, delayMs));
        try {
          ll = await nominatimBuscarUnaDireccion(q, ua);
        } catch (e) {
          const qLog = q.length > 100 ? `${q.slice(0, 97)}…` : q;
          this.logger.warn(`Nominatim error q="${qLog}": ${e}`);
          ll = null;
        }
        cachePorConsulta.set(q, ll);
      }
      if (ll) {
        coordsPorDireccion.set(id, ll);
        aciertos++;
      }
    }

    if (idsSinCoords.length > 0) {
      this.logger.log(
        `Nominatim (asignación): ${aciertos}/${idsSinCoords.length} dirección(es) resueltas en memoria para esta corrida (no guardadas en BD).`,
      );
    }
    return { intentadas: idsSinCoords.length, aciertos };
  }

  private async idRolRepartidor(): Promise<number> {
    return this.variables.getInt(VAR.ASIGNACION_ROL_REPARTIDOR_ID, ROL_ID_REPARTIDOR, { min: 1 });
  }

  private async idEstadoAsignado(): Promise<number> {
    return this.variables.getInt(VAR.ASIGNACION_ESTADO_PEDIDO_ASIGNADO_ID, ESTADO_PEDIDO_ASIGNADO_ID, {
      min: 1,
    });
  }

  /** Estados desde los que el cron puede asignar repartidor y pasar a **asignado**. */
  private async idsEstadosElegiblesAsignacion(): Promise<number[]> {
    return this.variables.getIntList(VAR.ASIGNACION_ESTADOS_PEDIDO_ELEGIBLES, [ESTADO_PEDIDO_CREADO_ID]);
  }

  private async maxEntregasPorRepartidorDia(): Promise<number> {
    return this.variables.getInt(VAR.ASIGNACION_MAX_ENTREGAS_POR_REPARTIDOR_DIA, 5, {
      min: 1,
      max: 500,
    });
  }

  private async hubs(): Promise<RepartidorHubConfig[]> {
    const raw = await this.variables.getJson<unknown>(VAR.ASIGNACION_REPARTIDORES_HUBS, []);
    return parseHubsJson(typeof raw === 'string' ? raw : JSON.stringify(raw ?? []));
  }

  /** Fallback cuando falta GPS en dirección o hub: misma ciudad = 0, otra ciudad con hub = 25, sin datos = 1e6. */
  private distanciaProxySinGps(
    hub: RepartidorHubConfig | undefined,
    pedidoCiudadId: number,
    destCoords: LatLng | undefined,
    hubCoords: LatLng | undefined,
  ): number {
    if (destCoords && hubCoords) {
      return distanciaKm(hubCoords, destCoords);
    }
    if (hub?.idCiudad && hub.idCiudad === pedidoCiudadId) {
      return 0;
    }
    if (hub?.idCiudad) {
      return 25;
    }
    if (hub?.lat != null && hub?.lng != null && destCoords) {
      return distanciaKm({ lat: hub.lat, lng: hub.lng }, destCoords);
    }
    if (hub?.lat != null && hub?.lng != null) {
      return 5000;
    }
    return 1_000_000;
  }

  private posicionInicialRepartidor(
    repId: number,
    hubByRep: Map<number, RepartidorHubConfig>,
    coordsGlobalesDia: LatLng | null,
    coordsPorCiudadHub: Map<number, LatLng>,
  ): LatLng | null {
    const hub = hubByRep.get(repId);
    if (hub?.lat != null && hub?.lng != null && Number.isFinite(hub.lat) && Number.isFinite(hub.lng)) {
      return { lat: hub.lat, lng: hub.lng };
    }
    if (hub?.idCiudad) {
      const c = coordsPorCiudadHub.get(hub.idCiudad);
      if (c) return c;
    }
    return coordsGlobalesDia;
  }

  /**
   * Procesa un día de `fecha_entrega`: asignación greedy minimizando km desde la posición actual del repartidor.
   */
  private async procesarDiaAsignacion(params: {
    dia: string;
    lista: PedidoOrmEntity[];
    repIds: number[];
    hubByRep: Map<number, RepartidorHubConfig>;
    coordsPorDireccion: Map<number, LatLng>;
    cargaPorRepDia: Map<string, number>;
    maxPorDia: number;
    idsEstadosElegibles: number[];
    idAsignado: number;
  }): Promise<{ asignados: number; omitidosSinCupo: number }> {
    const {
      dia,
      lista,
      repIds,
      hubByRep,
      coordsPorDireccion,
      cargaPorRepDia,
      maxPorDia,
      idsEstadosElegibles,
      idAsignado,
    } = params;

    const todosPuntos = lista
      .map((p) => coordsPorDireccion.get(p.direccion.idDireccion))
      .filter((x): x is LatLng => x != null);
    const coordsGlobalesDia = centroid(todosPuntos);

    const coordsPorCiudadHub = new Map<number, LatLng>();
    for (const h of hubByRep.values()) {
      if (!h.idCiudad || coordsPorCiudadHub.has(h.idCiudad)) continue;
      const pts = lista
        .filter((p) => p.direccion.ciudad.idCiudad === h.idCiudad)
        .map((p) => coordsPorDireccion.get(p.direccion.idDireccion))
        .filter((x): x is LatLng => x != null);
      const c = centroid(pts);
      if (c) coordsPorCiudadHub.set(h.idCiudad, c);
    }

    const repPosicionActual = new Map<number, LatLng | null>();
    for (const r of repIds) {
      repPosicionActual.set(
        r,
        this.posicionInicialRepartidor(r, hubByRep, coordsGlobalesDia, coordsPorCiudadHub),
      );
    }

    const asignacionesPorRep = new Map<number, number>();
    for (const r of repIds) {
      asignacionesPorRep.set(r, 0);
    }

    const rutasBatch = new Map<number, { idPedido: number; coords: LatLng }[]>();

    const unassigned = [...lista].sort((a, b) => a.creadoEn.getTime() - b.creadoEn.getTime());
    let asignados = 0;
    let omitidosSinCupo = 0;

    while (unassigned.length > 0) {
      let bestP: PedidoOrmEntity | null = null;
      let bestR: number | null = null;
      let bestScore = Number.POSITIVE_INFINITY;
      let bestCarga = Number.POSITIVE_INFINITY;

      for (const pedido of unassigned) {
        const ciudadId = pedido.direccion.ciudad.idCiudad;
        const destCoords = coordsPorDireccion.get(pedido.direccion.idDireccion);
        for (const repId of repIds) {
          const cupoKey = `${repId}|${dia}`;
          const ya = cargaPorRepDia.get(cupoKey) ?? 0;
          if (ya >= maxPorDia) continue;

          const hub = hubByRep.get(repId);
          const hubCoords =
            hub?.lat != null && hub?.lng != null && Number.isFinite(hub.lat) && Number.isFinite(hub.lng)
              ? { lat: hub.lat, lng: hub.lng }
              : undefined;

          let dist: number;
          const pos = repPosicionActual.get(repId) ?? null;
          if (pos != null && destCoords) {
            dist = distanciaKm(pos, destCoords);
          } else {
            dist = this.distanciaProxySinGps(hub, ciudadId, destCoords, hubCoords);
          }

          const carga = asignacionesPorRep.get(repId) ?? 0;
          if (dist < bestScore || (dist === bestScore && carga < bestCarga)) {
            bestScore = dist;
            bestCarga = carga;
            bestR = repId;
            bestP = pedido;
          }
        }
      }

      if (!bestP || !bestR) {
        const n = unassigned.length;
        omitidosSinCupo += n;
        this.logger.warn(
          `Día ${dia}: ${n} pedido(s) sin asignar (cupo repartidor o sin estimación de distancia).`,
        );
        break;
      }

      const upd = (await this.dataSource.query(
        `update pedidos
         set fk_usuario_repartidor = $2::int,
             fk_estado_pedido = $3::int
         where id_pedido = $1::int
           and fk_estado_pedido = any($4::int[])
           and fk_usuario_repartidor is null
         returning id_pedido`,
        [bestP.idPedido, bestR, idAsignado, idsEstadosElegibles],
      )) as { id_pedido: number }[];

      if (upd.length === 0) {
        const idx = unassigned.findIndex((x) => x.idPedido === bestP.idPedido);
        if (idx >= 0) unassigned.splice(idx, 1);
        continue;
      }

      const dest = coordsPorDireccion.get(bestP.direccion.idDireccion);
      if (dest) {
        repPosicionActual.set(bestR, dest);
        if (!rutasBatch.has(bestR)) rutasBatch.set(bestR, []);
        rutasBatch.get(bestR)!.push({ idPedido: bestP.idPedido, coords: dest });
      }

      const idx = unassigned.findIndex((x) => x.idPedido === bestP.idPedido);
      if (idx >= 0) unassigned.splice(idx, 1);

      asignacionesPorRep.set(bestR, (asignacionesPorRep.get(bestR) ?? 0) + 1);
      const ck = `${bestR}|${dia}`;
      cargaPorRepDia.set(ck, (cargaPorRepDia.get(ck) ?? 0) + 1);
      asignados++;
    }

    for (const [repId, paradas] of rutasBatch) {
      if (paradas.length === 0) continue;
      const hub = hubByRep.get(repId);
      let inicio: LatLng | null =
        hub?.lat != null && hub?.lng != null && Number.isFinite(hub.lat) && Number.isFinite(hub.lng)
          ? { lat: hub.lat, lng: hub.lng }
          : this.posicionInicialRepartidor(repId, hubByRep, coordsGlobalesDia, coordsPorCiudadHub);
      if (!inicio && paradas.length > 0) {
        inicio = paradas[0].coords;
      }
      if (!inicio) continue;

      const coordsList = paradas.map((x) => x.coords);
      const { orden, kmTotal } = rutaNearestNeighborKm(inicio, coordsList);
      const ordenIds = orden.map((i) => paradas[i].idPedido);
      this.logger.log(
        `Ruta aprox. día=${dia} rep=${repId}: ${paradas.length} paradas, orden NN=${ordenIds.join('→')}, km línea recta ≈ ${kmTotal.toFixed(2)}`,
      );
    }

    return { asignados, omitidosSinCupo };
  }

  /**
   * Agrupa por `direccion.fk_zona` (zona_bogota) y asigna lotes completos de la zona al mismo repartidor
   * (hasta agotar cupo diario; si la zona excede cupo, continúa con otro rep de menor carga).
   */
  private async procesarDiaAsignacionPorZona(params: {
    dia: string;
    lista: PedidoOrmEntity[];
    repIds: number[];
    hubByRep: Map<number, RepartidorHubConfig>;
    coordsPorDireccion: Map<number, LatLng>;
    cargaPorRepDia: Map<string, number>;
    maxPorDia: number;
    idsEstadosElegibles: number[];
    idAsignado: number;
  }): Promise<{ asignados: number; omitidosSinCupo: number }> {
    const {
      dia,
      lista,
      repIds,
      hubByRep,
      coordsPorDireccion,
      cargaPorRepDia,
      maxPorDia,
      idsEstadosElegibles,
      idAsignado,
    } = params;

    const porZona = new Map<number, PedidoOrmEntity[]>();
    for (const p of lista) {
      const idZona = p.direccion.zonaBogota?.idZona ?? 0;
      if (!porZona.has(idZona)) porZona.set(idZona, []);
      porZona.get(idZona)!.push(p);
    }

    const zonasOrdenadas = [...porZona.entries()].sort((a, b) => b[1].length - a[1].length);
    let asignados = 0;
    let omitidosSinCupo = 0;

    for (const [idZona, pedidosZona] of zonasOrdenadas) {
      let restantes = [...pedidosZona].sort((a, b) => a.creadoEn.getTime() - b.creadoEn.getTime());
      const ptsZona = restantes
        .map((p) => coordsPorDireccion.get(p.direccion.idDireccion))
        .filter((x): x is LatLng => x != null);
      const centroZona = centroid(ptsZona);

      while (restantes.length > 0) {
        let bestR: number | null = null;
        let bestScore = Number.POSITIVE_INFINITY;
        let bestCupo = 0;

        for (const repId of repIds) {
          const cupoKey = `${repId}|${dia}`;
          const ya = cargaPorRepDia.get(cupoKey) ?? 0;
          const libre = maxPorDia - ya;
          if (libre <= 0) continue;

          const hub = hubByRep.get(repId);
          let score = 1_000_000;
          if (centroZona && hub?.lat != null && hub?.lng != null) {
            score = distanciaKm({ lat: hub.lat, lng: hub.lng }, centroZona);
          } else if (centroZona && hub?.idCiudad) {
            const ciudadPed = restantes[0]?.direccion.ciudad.idCiudad;
            score = hub.idCiudad === ciudadPed ? 0 : 25;
          }

          if (score < bestScore || (score === bestScore && libre > bestCupo)) {
            bestScore = score;
            bestR = repId;
            bestCupo = libre;
          }
        }

        if (bestR == null) {
          omitidosSinCupo += restantes.length;
          const etiquetaZona = idZona === 0 ? 'sin_zona' : `zona=${idZona}`;
          this.logger.warn(
            `Día ${dia} ${etiquetaZona}: ${restantes.length} pedido(s) sin cupo de repartidor.`,
          );
          break;
        }

        const lote = restantes.splice(0, Math.min(restantes.length, bestCupo));
        const rutasBatch: { idPedido: number; coords: LatLng }[] = [];

        for (const pedido of lote) {
          const upd = (await this.dataSource.query(
            `update pedidos
             set fk_usuario_repartidor = $2::int,
                 fk_estado_pedido = $3::int
             where id_pedido = $1::int
               and fk_estado_pedido = any($4::int[])
               and fk_usuario_repartidor is null
             returning id_pedido`,
            [pedido.idPedido, bestR, idAsignado, idsEstadosElegibles],
          )) as { id_pedido: number }[];

          if (upd.length === 0) continue;

          const dest = coordsPorDireccion.get(pedido.direccion.idDireccion);
          if (dest) rutasBatch.push({ idPedido: pedido.idPedido, coords: dest });

          const ck = `${bestR}|${dia}`;
          cargaPorRepDia.set(ck, (cargaPorRepDia.get(ck) ?? 0) + 1);
          asignados++;
        }

        const etiquetaZona = idZona === 0 ? 'sin_zona' : `zona=${idZona}`;
        this.logger.log(
          `Asignación por zona día=${dia} ${etiquetaZona} rep=${bestR} pedidos=${lote.length} (restantes_zona=${restantes.length})`,
        );

        if (rutasBatch.length > 0) {
          const hub = hubByRep.get(bestR);
          let inicio: LatLng | null =
            hub?.lat != null && hub?.lng != null ? { lat: hub.lat, lng: hub.lng } : centroZona;
          if (!inicio) inicio = rutasBatch[0]!.coords;
          const { orden, kmTotal } = rutaNearestNeighborKm(
            inicio,
            rutasBatch.map((x) => x.coords),
          );
          const ordenIds = orden.map((i) => rutasBatch[i]!.idPedido);
          this.logger.log(
            `Ruta aprox. ${etiquetaZona} rep=${bestR}: orden NN=${ordenIds.join('→')}, km ≈ ${kmTotal.toFixed(2)}`,
          );
        }
      }
    }

    return { asignados, omitidosSinCupo };
  }

  private async idTipoPedidoNormal(): Promise<number> {
    return this.variables.getInt(VAR.ASIGNACION_TIPO_PEDIDO_NORMAL_ID, TIPO_PEDIDO_NORMAL_ID, { min: 1 });
  }

  private async idTipoPedidoExpress(): Promise<number> {
    return this.variables.getInt(VAR.ASIGNACION_TIPO_PEDIDO_EXPRESS_ID, TIPO_PEDIDO_EXPRESS_ID, { min: 1 });
  }

  private async idsEstadosTerminalesRepartidor(): Promise<number[]> {
    return this.variables.getIntList(
      VAR.ASIGNACION_ESTADOS_TERMINALES_REPARTIDOR,
      [...ESTADOS_PEDIDO_TERMINALES_REPARTIDOR],
    );
  }

  private async listarRepartidores(): Promise<number[]> {
    const idRolRep = await this.idRolRepartidor();
    const urs = await this.dataSource.getRepository(UsuarioRolOrmEntity).find({
      where: { idRol: idRolRep },
    });
    return [...new Set(urs.map((u) => u.idUsuario))];
  }

  /** Repartidores sin pedidos activos (no terminales) con `fecha_entrega` = diaYmd. */
  private async repartidoresLibresEnFecha(repIds: number[], diaYmd: string): Promise<number[]> {
    if (repIds.length === 0) return [];
    const ocupados = await this.repartidoresOcupadosEnFecha(repIds, diaYmd);
    const busy = new Set(ocupados);
    return repIds.filter((r) => !busy.has(r));
  }

  private async repartidoresOcupadosEnFecha(repIds: number[], diaYmd: string): Promise<number[]> {
    if (repIds.length === 0) return [];
    const terminales = await this.idsEstadosTerminalesRepartidor();
    const rows = (await this.dataSource.query(
      `select distinct fk_usuario_repartidor::int as rep
       from pedidos
       where fk_usuario_repartidor = any($1::int[])
         and fecha_entrega = $2::date
         and not (fk_estado_pedido = any($3::int[]))`,
      [repIds, diaYmd, terminales],
    )) as { rep: number }[];
    return rows.map((r) => r.rep);
  }

  /** Cupo activo: solo pedidos del día que aún no están en estado terminal. */
  private async cargarCupoActivoPorRepartidorDia(
    repIds: number[],
  ): Promise<Map<string, number>> {
    if (repIds.length === 0) return new Map();
    const terminales = await this.idsEstadosTerminalesRepartidor();
    const rows = (await this.dataSource.query(
      `select fk_usuario_repartidor::int as rep,
              to_char(fecha_entrega, 'YYYY-MM-DD') as dia,
              count(*)::int as c
       from pedidos
       where fk_usuario_repartidor is not null
         and fk_usuario_repartidor = any($1::int[])
         and not (fk_estado_pedido = any($2::int[]))
       group by fk_usuario_repartidor, fecha_entrega`,
      [repIds, terminales],
    )) as { rep: number; dia: string; c: number }[];
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(`${row.rep}|${row.dia}`, row.c);
    }
    return map;
  }

  private async cargarPedidosPendientes(params: {
    idsEstadosElegibles: number[];
    idTiposPedido: number[];
    fechaEntregaYmd?: string;
    expressOHoyNormal?: { idExpress: number; idNormal: number; hoyYmd: string };
  }): Promise<PedidoOrmEntity[]> {
    const qb = this.dataSource
      .getRepository(PedidoOrmEntity)
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.tipoPedido', 'tp')
      .innerJoinAndSelect('p.direccion', 'd')
      .leftJoinAndSelect('d.tipoVia', 'tv')
      .leftJoinAndSelect('d.pais', 'pa')
      .innerJoinAndSelect('d.ciudad', 'ci')
      .innerJoinAndSelect('d.departamento', 'de')
      .leftJoinAndSelect('d.zonaBogota', 'zb')
      .where('p.fk_usuario_repartidor IS NULL')
      .andWhere('p.fk_estado_pedido IN (:...estados)', { estados: params.idsEstadosElegibles })
      .andWhere('p.fk_tipo_pedido IN (:...tipos)', { tipos: params.idTiposPedido });

    if (params.fechaEntregaYmd) {
      qb.andWhere('p.fecha_entrega = :fecha::date', { fecha: params.fechaEntregaYmd });
    }

    if (params.expressOHoyNormal) {
      const { idExpress, idNormal, hoyYmd } = params.expressOHoyNormal;
      qb.andWhere(
        '(p.fk_tipo_pedido = :idExpress OR (p.fk_tipo_pedido = :idNormal AND p.fecha_entrega <= :hoy::date))',
        { idExpress, idNormal, hoy: hoyYmd },
      );
    }

    return qb.orderBy('p.creado_en', 'ASC').getMany();
  }

  private async runAsignacion(config: {
    modo: ModoAsignacionRepartidor;
    etiqueta: string;
    pedidos: PedidoOrmEntity[];
    repIds: number[];
  }): Promise<ResultadoAsignacionRepartidores> {
    const { modo, etiqueta, pedidos, repIds } = config;

    if (repIds.length === 0) {
      this.logger.warn(`${etiqueta}: no hay repartidores (usuario_rol / ASIGNACION_ROL_REPARTIDOR_ID).`);
      return {
        asignados: 0,
        repartidores: 0,
        pedidosPendientes: pedidos.length,
        omitidosSinCupo: 0,
        modo,
        etiqueta,
      };
    }

    if (pedidos.length === 0) {
      this.logger.log(`${etiqueta}: 0 pedidos pendientes de asignar.`);
      return {
        asignados: 0,
        repartidores: repIds.length,
        pedidosPendientes: 0,
        omitidosSinCupo: 0,
        modo,
        etiqueta,
      };
    }

    const idAsignado = await this.idEstadoAsignado();
    const idsEstadosElegibles = await this.idsEstadosElegiblesAsignacion();
    const hubs = await this.hubs();
    const hubByRep = new Map(hubs.map((h) => [h.idUsuario, h]));
    const maxPorDia = await this.maxEntregasPorRepartidorDia();

    const cargaPorRepDia = await this.cargarCupoActivoPorRepartidorDia(repIds);

    const dirIds = [...new Set(pedidos.map((p) => p.direccion.idDireccion))];
    const coordsPorDireccion = await this.cargarCoordenadasDirecciones(dirIds);
    const geoNom = await this.rellenarCoordsNominatimOpcional(pedidos, coordsPorDireccion);

    const sinGpsIds = dirIds.filter((id) => !coordsPorDireccion.has(id));
    if (sinGpsIds.length > 0) {
      const dirPorId = new Map(pedidos.map((p) => [p.direccion.idDireccion, p.direccion]));
      const ejemplos = sinGpsIds
        .slice(0, 5)
        .map((id) => textoDireccionColombianaMapa(dirPorId.get(id)!));
      this.logger.warn(
        `${etiqueta}: ${sinGpsIds.length} dirección(es) sin GPS; proxy ciudad/hub. Ej.: ${ejemplos.join(' | ')}`,
      );
    }

    const byDay = new Map<string, PedidoOrmEntity[]>();
    for (const p of pedidos) {
      const d = diaFechaEntrega(p.fechaEntrega);
      if (!byDay.has(d)) byDay.set(d, []);
      byDay.get(d)!.push(p);
    }

    let asignados = 0;
    let omitidosSinCupo = 0;
    for (const dia of [...byDay.keys()].sort()) {
      const lista = byDay.get(dia)!;
      const base = {
        dia,
        lista,
        repIds,
        hubByRep,
        coordsPorDireccion,
        cargaPorRepDia,
        maxPorDia,
        idsEstadosElegibles,
        idAsignado,
      };
      const r =
        modo === 'por_zona_bogota'
          ? await this.procesarDiaAsignacionPorZona(base)
          : await this.procesarDiaAsignacion(base);
      asignados += r.asignados;
      omitidosSinCupo += r.omitidosSinCupo;
    }

    this.logger.log(
      `${etiqueta}: modo=${modo} estados=[${idsEstadosElegibles.join(',')}]→${idAsignado} pedidos=${pedidos.length} asignados=${asignados} omitidos=${omitidosSinCupo} reps=${repIds.length} nominatim=${geoNom.aciertos}/${geoNom.intentadas}`,
    );

    return {
      asignados,
      repartidores: repIds.length,
      pedidosPendientes: pedidos.length,
      omitidosSinCupo,
      modo,
      etiqueta,
    };
  }

  /**
   * Cron 20:00: pedidos **Normal** con `fecha_entrega` = mañana (Bogotá), agrupados por `zona_bogota`.
   */
  async ejecutarAsignacionNormalNocturna(): Promise<ResultadoAsignacionRepartidores> {
    const idNormal = await this.idTipoPedidoNormal();
    const fechaManana = mananaYmdBogota();
    const idsEstadosElegibles = await this.idsEstadosElegiblesAsignacion();
    const repIds = await this.listarRepartidores();
    const pedidos = await this.cargarPedidosPendientes({
      idsEstadosElegibles,
      idTiposPedido: [idNormal],
      fechaEntregaYmd: fechaManana,
    });

    this.logger.log(
      `Asignación nocturna Normal: fecha_entrega=${fechaManana} tipo=${idNormal} candidatos=${pedidos.length}`,
    );

    return this.runAsignacion({
      modo: 'por_zona_bogota',
      etiqueta: `normal-20h-${fechaManana}`,
      pedidos,
      repIds,
    });
  }

  /**
   * Cron cada 20 min: repartidores libres hoy reciben **Express** y **Normal** pendientes (hoy o atrasados).
   */
  async ejecutarAsignacionExpressYBacklog(): Promise<ResultadoAsignacionRepartidores> {
    const idNormal = await this.idTipoPedidoNormal();
    const idExpress = await this.idTipoPedidoExpress();
    const hoy = hoyYmdBogota();
    const idsEstadosElegibles = await this.idsEstadosElegiblesAsignacion();
    const todosReps = await this.listarRepartidores();
    const ocupados = await this.repartidoresOcupadosEnFecha(todosReps, hoy);
    const repIds = todosReps.filter((r) => !ocupados.includes(r));

    const pedidos = await this.cargarPedidosPendientes({
      idsEstadosElegibles,
      idTiposPedido: [idNormal, idExpress],
      expressOHoyNormal: { idExpress, idNormal, hoyYmd: hoy },
    });

    const nExpress = pedidos.filter((p) => p.tipoPedido?.idTipoPedido === idExpress).length;
    const nNormal = pedidos.length - nExpress;

    this.logger.log(
      `Asignación express: hoy=${hoy} estados_elegibles=[${idsEstadosElegibles.join(',')}] ` +
        `reps_total=${todosReps.length} reps_libres=${repIds.length} reps_ocupados=[${ocupados.join(',')}] ` +
        `candidatos=${pedidos.length} (express=${nExpress} normal_hoy_o_atrasado=${nNormal}) ` +
        `tipos express=${idExpress} normal=${idNormal}`,
    );

    if (todosReps.length === 0) {
      this.logger.warn(
        'Sin repartidores: revise usuario_rol y ASIGNACION_ROL_REPARTIDOR_ID (seed rol Repartidor = 2).',
      );
    } else if (repIds.length === 0 && pedidos.length > 0) {
      this.logger.warn(
        `Hay ${pedidos.length} pedido(s) pendiente(s) pero ningún repartidor libre hoy (todos con entregas activas).`,
      );
    } else if (pedidos.length === 0) {
      this.logger.log(
        'Sin candidatos: pedidos deben estar en estado Creado (o ASIGNACION_ESTADOS_PEDIDO_ELEGIBLES), sin repartidor, tipo Express o Normal con fecha_entrega <= hoy.',
      );
    }

    return this.runAsignacion({
      modo: 'greedy',
      etiqueta: `express-20min-${hoy}`,
      pedidos,
      repIds,
    });
  }

  /** @deprecated Use `ejecutarAsignacionNormalNocturna` o `ejecutarAsignacionExpressYBacklog`. */
  async ejecutar(): Promise<{
    asignados: number;
    repartidores: number;
    pedidosPendientes: number;
    omitidosSinCupo: number;
  }> {
    const r = await this.ejecutarAsignacionExpressYBacklog();
    return {
      asignados: r.asignados,
      repartidores: r.repartidores,
      pedidosPendientes: r.pedidosPendientes,
      omitidosSinCupo: r.omitidosSinCupo,
    };
  }
}
