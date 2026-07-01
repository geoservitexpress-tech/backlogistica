import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import type { PedidoListado } from '../../domain/read-models/pedido-listado';
import { parseFechaEntregaYyyyMmDd } from '../../domain/pedido-fecha-entrega';
import type { PedidoReadPort } from '../../domain/ports/pedido-read.port';
import type {
  CreatePedidoFormInput,
  PedidoWritePort,
  UpdatePedidoInput,
} from '../../domain/ports/pedido-write.port';
import { PEDIDO_READ } from '../../pedidos.tokens';
import { pedidoOrmToListado } from './pedido-listado.mapper';
import { PEDIDO_RELATIONS } from './pedido.orm-relations';
import { CiudadOrmEntity } from './ciudad.orm-entity';
import { DepartamentoOrmEntity } from './departamento.orm-entity';
import { PaisOrmEntity } from './pais.orm-entity';
import { DestinatarioOrmEntity } from './destinatario.orm-entity';
import { validarIdZonaBogotaParaCiudad, esCiudadBogotaDc } from '../../application/validar-zona-bogota';
import {
  cargarLimitesPaquete,
  validarLimitesPaquete,
  type PaqueteMedidasInput,
} from '../../application/validar-limites-paquete';
import { DireccionOrmEntity } from './direccion.orm-entity';
import { ZonaBogotaOrmEntity } from './zona-bogota.orm-entity';
import { EstadoPedidoOrmEntity } from './estado-pedido.orm-entity';
import { MetodoRecepcionOrmEntity } from './metodo-recepcion.orm-entity';
import { MetodoPagoOrmEntity } from './metodo-pago.orm-entity';
import { PaqueteOrmEntity } from './paquete.orm-entity';
import { PedidoOrmEntity } from './pedido.orm-entity';
import { RolOrmEntity } from './rol.orm-entity';
import { TipoPedidoOrmEntity } from './tipo-pedido.orm-entity';
import { TipoViaOrmEntity } from './tipo-via.orm-entity';
import { UsuarioOrmEntity } from './usuario.orm-entity';
import { UsuarioRolOrmEntity } from './usuario-rol.orm-entity';
import { SupabaseEvidenciasStorage } from '../storage/supabase-evidencias.storage';
import { VAR } from '../../../configuracion/variable.keys';
import { VariablesService } from '../../../configuracion/variables.service';
import {
  cargarConfigTarifaEnvio,
  calcularTarifaEnvio,
  validarPrecioExpress,
} from '../../application/calcular-tarifa-envio';
import { TIPO_PEDIDO_EXPRESS_ID } from '../../logistica-tipo-pedido.constants';
import {
  ESTADO_PEDIDO_CREADO_ID,
  ESTADO_PEDIDO_EN_CURSO_ID,
  ESTADO_PEDIDO_ENTREGADO_ID,
} from '../../logistica-pedido-estados.constants';
import { METODO_RECEPCION_ID_ENTREGA, METODO_RECEPCION_ID_RECOGIDA } from '../../logistica-metodo-recepcion.constants';
import {
  persistirDireccionYDestinatario,
  textoDireccionEntrega,
} from './persistir-direccion-destinatario';
import { ROL_ID_ADMINISTRADOR, ROL_ID_CLIENTE } from '../../logistica-rol.constants';
import {
  anexarFotosSeguimientoCreacion,
  registrarSeguimientoCreacionPedido,
  registrarSeguimientoManifiestoActualizado,
} from './registrar-seguimiento-pedido';
import {
  cerrarFacturaSiPedidoTerminal,
  crearFacturaAlCrearPedido,
  sincronizarFacturaMontoAbierta,
} from './gestionar-factura-pedido';

function generarNumGuia(): string {
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `BL-${ymd}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/** Línea corta para `direccion.zona` (tipo + vía + #); las observaciones largas van en `direccion.observaciones`. */
function armarZonaResumida(
  tipoViaNombre: string,
  nombreVia: string,
  placa: string,
  secundaria: string,
): string {
  let z =
    `${tipoViaNombre.trim()} ${nombreVia.trim()} # ${placa.trim()}-${secundaria.trim()}`.trim();
  if (z.length > 160) z = `${z.slice(0, 157)}...`;
  return z;
}

async function resolverTipoVia(manager: EntityManager, nombre: string): Promise<TipoViaOrmEntity> {
  const rows = await manager.getRepository(TipoViaOrmEntity).find();
  const key = nombre.trim().toLowerCase();
  const found = rows.find((r) => r.nombre.trim().toLowerCase() === key);
  if (!found) {
    throw new BadRequestException(`Tipo de vía no encontrado: "${nombre}"`);
  }
  return found;
}

/** `ciudad` sin FK a depto en BD: se cargan ciudad y departamento por ids para armar `direccion`. */
async function cargarGeografiaDireccion(
  manager: EntityManager,
  input: CreatePedidoFormInput,
): Promise<{ ciudad: CiudadOrmEntity; departamento: DepartamentoOrmEntity; pais: PaisOrmEntity }> {
  const ciudad = await manager.getRepository(CiudadOrmEntity).findOne({
    where: { idCiudad: input.idCiudad },
  });
  if (!ciudad) {
    throw new BadRequestException(`Ciudad no encontrada por id_ciudad=${input.idCiudad}`);
  }

  const departamento = await manager.getRepository(DepartamentoOrmEntity).findOne({
    where: { idDepartamento: input.idDepartamento },
  });
  if (!departamento) {
    throw new BadRequestException(
      `Departamento no encontrado por id_departamento=${input.idDepartamento}`,
    );
  }

  const pais = await manager.getRepository(PaisOrmEntity).findOne({
    where: { idPais: input.idPais },
  });
  if (!pais) {
    throw new BadRequestException(`País no encontrado por id_pais=${input.idPais}`);
  }
  return { ciudad, departamento, pais };
}

async function cargarGeografiaPorIds(
  manager: EntityManager,
  idCiudad: number,
  idDepartamento: number,
  idPais: number,
): Promise<{ ciudad: CiudadOrmEntity; departamento: DepartamentoOrmEntity; pais: PaisOrmEntity }> {
  const ciudad = await manager.getRepository(CiudadOrmEntity).findOne({ where: { idCiudad } });
  if (!ciudad) throw new BadRequestException(`Ciudad no encontrada por id_ciudad=${idCiudad}`);
  const departamento = await manager.getRepository(DepartamentoOrmEntity).findOne({
    where: { idDepartamento },
  });
  if (!departamento) {
    throw new BadRequestException(`Departamento no encontrado por id_departamento=${idDepartamento}`);
  }
  const pais = await manager.getRepository(PaisOrmEntity).findOne({ where: { idPais } });
  if (!pais) throw new BadRequestException(`País no encontrado por id_pais=${idPais}`);
  return { ciudad, departamento, pais };
}

const GEO_PATCH_KEYS = [
  'idCiudad',
  'idDepartamento',
  'idPais',
  'tipoViaNombre',
  'nombreVia',
  'numeroPlaca',
  'numeroSecundario',
] as const;

function assertGeoPatchCompleto(patch: UpdatePedidoInput): void {
  const any = GEO_PATCH_KEYS.some((k) => patch[k] !== undefined);
  if (!any) return;
  const missing = GEO_PATCH_KEYS.filter(
    (k) => patch[k] === undefined || String(patch[k]).trim() === '',
  );
  if (missing.length) {
    throw new BadRequestException(
      `Para actualizar la dirección debe enviar todos estos campos (sin vacíos): ${GEO_PATCH_KEYS.join(', ')}.`,
    );
  }
}

async function resolverTipoPedidoPorId(
  manager: EntityManager,
  idTipoPedido: number,
): Promise<TipoPedidoOrmEntity> {
  const tp = await manager.getRepository(TipoPedidoOrmEntity).findOne({
    where: { idTipoPedido },
  });
  if (!tp) {
    throw new BadRequestException(
      `tipo_pedido no encontrado: id_tipo_pedido=${idTipoPedido}. Use GET /catalogo/tipos-pedido.`,
    );
  }
  return tp;
}

async function resolverZonaBogotaOpcional(
  manager: EntityManager,
  idCiudad: number,
  idZonaBogota?: number | null,
): Promise<ZonaBogotaOrmEntity | null> {
  validarIdZonaBogotaParaCiudad(idCiudad, idZonaBogota ?? undefined);
  if (!esCiudadBogotaDc(idCiudad)) {
    return null;
  }
  if (idZonaBogota == null) {
    return null;
  }
  const zona = await manager.getRepository(ZonaBogotaOrmEntity).findOne({
    where: { idZona: idZonaBogota },
  });
  if (!zona) {
    throw new BadRequestException(
      `zona_bogota no encontrada: id_zona=${idZonaBogota}. Use GET /catalogo/zonas-bogota.`,
    );
  }
  return zona;
}

async function resolverMetodoRecepcionPorId(
  manager: EntityManager,
  idMetodoRecepcion: number,
): Promise<MetodoRecepcionOrmEntity> {
  const metodo = await manager.getRepository(MetodoRecepcionOrmEntity).findOne({
    where: { idMetodoRecepcion },
  });
  if (!metodo) {
    throw new BadRequestException(
      `metodo_recepcion no encontrado: id_metodo_recepcion=${idMetodoRecepcion}. Use GET /catalogo/metodos-recepcion.`,
    );
  }
  return metodo;
}

async function resolverEstadoPedidoCreacion(
  manager: EntityManager,
  variables: VariablesService,
): Promise<EstadoPedidoOrmEntity> {
  const idEstado = await variables.getInt(VAR.PEDIDO_ESTADO_INICIAL_ID, ESTADO_PEDIDO_CREADO_ID, {
    min: 1,
  });
  const estado = await manager.getRepository(EstadoPedidoOrmEntity).findOne({
    where: { idEstadoPedido: idEstado },
  });
  if (!estado) {
    throw new BadRequestException(
      `Estado inicial del pedido no encontrado en catálogo \`estado_pedido\`: id_estado_pedido=${idEstado}. ` +
        'Revise PEDIDO_ESTADO_INICIAL_ID en public.variable.',
    );
  }
  return estado;
}

/**
 * Tras `POST /pedidos`: manifiesto y fotos viven en `seguimiento` / `descripcion_seguimiento` (y Storage como respaldo).
 */
function listadoPostCreacionConCamposNoPersistidos(
  listado: PedidoListado,
  input: CreatePedidoFormInput,
  opts?: { fotosPublicas?: string[] | null },
): PedidoListado {
  const fotosFinal =
    opts?.fotosPublicas !== undefined
      ? opts.fotosPublicas && opts.fotosPublicas.length
        ? opts.fotosPublicas
        : null
      : listado.fotosPaqueteUrls ??
        (input.fotosPaqueteUrls?.length ? input.fotosPaqueteUrls : null) ??
        null;

  return {
    ...listado,
    observacionesManifiesto:
      listado.observacionesManifiesto ?? (input.observacionesManifiesto?.trim() || null),
    fotosPaqueteUrls: fotosFinal,
  };
}

/** Usuario existente con rol **Cliente** o **Administrador** en `usuario_rol` → `rol`. */
async function cargarUsuarioSolicitanteAutorizado(
  manager: EntityManager,
  idUsuario: number,
): Promise<UsuarioOrmEntity> {
  const usuario = await manager.getRepository(UsuarioOrmEntity).findOne({
    where: { idUsuario },
  });
  if (!usuario) {
    throw new BadRequestException(
      `Usuario no encontrado: ${idUsuario}. Regístrese con POST /auth/register o revise GET /auth/me con su JWT.`,
    );
  }
  let conRolPermitido = 0;
  try {
    conRolPermitido = await manager
      .getRepository(UsuarioRolOrmEntity)
      .createQueryBuilder('ur')
      .where('ur.id_usuario = :id', { id: idUsuario })
      .andWhere('ur.id_rol IN (:...ids)', {
        ids: [ROL_ID_CLIENTE, ROL_ID_ADMINISTRADOR],
      })
      .getCount();
  } catch (e) {
    if (e instanceof QueryFailedError) {
      const code = (e.driverError as { code?: string } | undefined)?.code;
      const pgMsg = String((e.driverError as { message?: string } | undefined)?.message ?? e.message);
      if (code === '42703' || code === '42P01') {
        throw new BadRequestException(
          `No se pudo validar roles en usuario_rol: ${pgMsg}. ` +
            'Compruebe que existan las tablas `usuario_rol` y `rol` y columnas `id_usuario` / `id_rol` en `usuario_rol`.',
        );
      }
    }
    throw e;
  }
  if (conRolPermitido === 0) {
    throw new BadRequestException(
      `El usuario debe tener rol Cliente o Administrador en usuario_rol (id_usuario=${idUsuario}).`,
    );
  }
  return usuario;
}

@Injectable()
export class TypeOrmPedidoWriteRepository implements PedidoWritePort {
  private readonly logger = new Logger(TypeOrmPedidoWriteRepository.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly evidencias: SupabaseEvidenciasStorage,
    private readonly variables: VariablesService,
    @Inject(PEDIDO_READ) private readonly pedidoRead: PedidoReadPort,
  ) {}

  async createPedidoFromForm(input: CreatePedidoFormInput): Promise<PedidoListado> {
    const txnLabel = randomBytes(3).toString('hex').toUpperCase();
    const t0 = Date.now();
    this.logger.log(
      `TX[${txnLabel}] begin crear pedido idUsuario=${input.idUsuario} idMetodoRecepcion=${input.idMetodoRecepcion} idCiudad=${input.idCiudad} idDepartamento=${input.idDepartamento} idPais=${input.idPais}`,
    );

    const fotosCrudas = [
      ...(input.fotosPaqueteUrls ?? []).map((s) => s.trim()).filter(Boolean),
      ...(input.fotosPaqueteBase64 ?? []).map((s) => s.trim()).filter(Boolean),
    ];
    if (fotosCrudas.length > 8) {
      throw new BadRequestException(
        'Máximo 8 fotos en total entre `fotosPaqueteUrls` y `fotosPaqueteBase64`.',
      );
    }

    const manifiestoTxt = input.observacionesManifiesto?.trim();
    let idEstadoPedidoCreacion = ESTADO_PEDIDO_CREADO_ID;

    try {
      const listado = await this.dataSource.transaction(async (manager) => {
        this.logger.log(`TX[${txnLabel}] postgres BEGIN`);

        const now = new Date();

        const usuario = await cargarUsuarioSolicitanteAutorizado(manager, input.idUsuario);

        const recogida = input.idMetodoRecepcion === METODO_RECEPCION_ID_RECOGIDA;
        if (recogida && !input.destinoEntrega) {
          throw new BadRequestException(
            'destinoEntrega es obligatorio cuando idMetodoRecepcion=1 (Recogida).',
          );
        }

        const { direccion, destinatario, ciudad, departamento } =
          await persistirDireccionYDestinatario(manager, input, now);

        const destinoPersistido = recogida
          ? await persistirDireccionYDestinatario(manager, input.destinoEntrega!, now)
          : null;

        const limitesPaquete = await cargarLimitesPaquete(this.variables);
        validarLimitesPaquete(
          {
            pesoKg: input.pesoKg,
            altoCm: input.altoCm,
            anchoCm: input.anchoCm,
            largoCm: input.largoCm,
          },
          limitesPaquete,
          { esCreacion: true },
        );

        const paqRepo = manager.getRepository(PaqueteOrmEntity);
        const paquete = paqRepo.create({
          nombre: input.tipoProductoNombre.trim().slice(0, 200),
          peso: input.pesoKg,
          precio: input.valorDeclarado,
          altoCm: input.altoCm ?? null,
          anchoCm: input.anchoCm ?? null,
          largoCm: input.largoCm ?? null,
          fkPoliticaResponsabilidad: input.idPoliticaResponsabilidad ?? null,
          creadoEn: now,
        });
        await paqRepo.save(paquete);
        this.logger.log(`TX[${txnLabel}] insert paquete id_paquete=${paquete.idPaquete}`);

        const tipoPedido = await resolverTipoPedidoPorId(manager, input.idTipoPedido);
        const metodo = await resolverMetodoRecepcionPorId(manager, input.idMetodoRecepcion);
        const estado = await resolverEstadoPedidoCreacion(manager, this.variables);
        idEstadoPedidoCreacion = estado.idEstadoPedido;

        const monto = Number(input.valorDeclarado);
        const idCiudadTarifa =
          recogida && input.destinoEntrega ? input.destinoEntrega.idCiudad : input.idCiudad;
        const configTarifa = await cargarConfigTarifaEnvio(this.variables);
        const tarifaCalc = calcularTarifaEnvio(
          {
            idCiudad: idCiudadTarifa,
            idTipoPedido: input.idTipoPedido,
            pesoKg: input.pesoKg,
            altoCm: input.altoCm,
            anchoCm: input.anchoCm,
            largoCm: input.largoCm,
          },
          configTarifa,
        );
        const precioEnvio = tarifaCalc.tarifaSugerida;
        const pagadoAlCrear = input.pagadoPorRemitente ?? false;
        if (pagadoAlCrear && input.idMetodoPago == null) {
          throw new BadRequestException(
            'Indique idMetodoPago cuando pagadoPorRemitente es true. Ver GET /catalogo/metodos-pago.',
          );
        }
        let metodoPagoCreacion: MetodoPagoOrmEntity | null = null;
        if (pagadoAlCrear && input.idMetodoPago != null) {
          metodoPagoCreacion = await manager.getRepository(MetodoPagoOrmEntity).findOne({
            where: { idMetodoPago: input.idMetodoPago },
          });
          if (!metodoPagoCreacion) {
            throw new BadRequestException(
              `metodo_pago no encontrado: ${input.idMetodoPago}. Use GET /catalogo/metodos-pago.`,
            );
          }
        }
        let fechaEntrega: Date;
        try {
          fechaEntrega = parseFechaEntregaYyyyMmDd(input.fechaEntrega);
        } catch {
          throw new BadRequestException('fechaEntrega debe ser YYYY-MM-DD');
        }

        const pedidoRepo = manager.getRepository(PedidoOrmEntity);
        const pedido = pedidoRepo.create({
          numGuia: generarNumGuia(),
          creadoEn: now,
          tipoPedido: { idTipoPedido: tipoPedido.idTipoPedido },
          usuarioSolicitud: { idUsuario: usuario.idUsuario },
          fkCliente: null,
          usuarioRecolector: null,
          usuarioRepartidor: null,
          metodoRecepcion: { idMetodoRecepcion: metodo.idMetodoRecepcion },
          paquete,
          direccion,
          estadoPedido: { idEstadoPedido: estado.idEstadoPedido },
          precio: precioEnvio,
          tarifaEnvio: precioEnvio,
          valorDeclarado: monto,
          fechaEntrega,
          fragil: input.fragil,
          pagadoPorRemitente: pagadoAlCrear,
          valorRecaudado: pagadoAlCrear ? precioEnvio : null,
          metodoPago: metodoPagoCreacion,
          destinatario,
          direccionDestino: destinoPersistido?.direccion ?? null,
          destinatarioDestino: destinoPersistido?.destinatario ?? null,
          fotosPaqueteUrls: null,
        });

        try {
          await pedidoRepo.save(pedido);
        } catch (e) {
          if (e instanceof QueryFailedError) {
            const driver = e.driverError as { code?: string; message?: string } | undefined;
            const pgMsg = String(driver?.message ?? e.message ?? '');
            if (driver?.code === '23503') {
              throw new BadRequestException(
                'No se pudo guardar el pedido: referencia inválida (revise catálogo y migraciones).',
              );
            }
            if (driver?.code === '23502') {
              throw new BadRequestException(
                `Restricción NOT NULL en la base al insertar pedido: ${pgMsg}. ` +
                  'Revise columnas obligatorias en `pedidos` y que el cuerpo / ORM las cubran (p. ej. `valor_declarado`, `precio`, `fecha_entrega`).',
              );
            }
            if (
              driver?.code === '42703' ||
              /column .* does not exist/i.test(pgMsg)
            ) {
              throw new BadRequestException(
                `Postgres (${driver?.code ?? '42703'}): ${pgMsg}. ` +
                  'Revise el nombre de la columna o tabla frente al ORM (`pedidos`, `direccion`, `destinatario`, `paquete`).',
              );
            }
            if (driver?.code === '42P01') {
              throw new BadRequestException(
                `Tabla o relación no encontrada en Postgres: ${pgMsg}. Revise nombres de tablas (p. ej. \`usuario_rol\`, columnas \`id_usuario\` / \`id_rol\`).`,
              );
            }
          }
          throw e;
        }

        const idPedido = pedido.idPedido;
        this.logger.log(
          `TX[${txnLabel}] insert pedido id_pedido=${idPedido} num_guia=${pedido.numGuia} fk_tipo_pedido=${tipoPedido.idTipoPedido}`,
        );

        await registrarSeguimientoCreacionPedido(manager, {
          idPedido,
          idEstadoPedido: estado.idEstadoPedido,
          observacionesManifiesto: manifiestoTxt ?? null,
        });
        this.logger.log(
          `TX[${txnLabel}] seguimiento creación id_pedido=${idPedido} manifiesto=${manifiestoTxt ? 'sí' : 'no'}`,
        );

        const facturaDest = destinoPersistido ?? { destinatario, direccion, ciudad, departamento };
        const direccionEntregaTexto = textoDireccionEntrega(
          facturaDest.ciudad,
          facturaDest.departamento,
          facturaDest.direccion,
        );

        await crearFacturaAlCrearPedido(manager, {
          idPedido,
          idCliente: usuario.idUsuario,
          monto: precioEnvio,
          pagadoAlCrear,
          idMetodoPago: metodoPagoCreacion?.idMetodoPago ?? null,
          destinatarioNombre: facturaDest.destinatario.nombre,
          destinatarioTelefono: facturaDest.destinatario.telefono,
          direccionEntrega: direccionEntregaTexto,
          idDestinatario: facturaDest.destinatario.idDestinatario,
          idDireccion: facturaDest.direccion.idDireccion,
        });

        const row = await pedidoRepo.findOne({
          where: { idPedido },
          relations: [...PEDIDO_RELATIONS],
        });
        if (!row) {
          throw new InternalServerErrorException('No se pudo leer el pedido recién creado');
        }
        this.logger.log(
          `TX[${txnLabel}] postgres COMMIT ok totalMs=${Date.now() - t0} id_pedido=${idPedido}`,
        );
        return listadoPostCreacionConCamposNoPersistidos(pedidoOrmToListado(row), input, {
          fotosPublicas: null,
        });
      });

      let fotosPublicas: string[] | null = null;
      if (fotosCrudas.length > 0) {
        fotosPublicas = await this.evidencias.resolverFotosPedido(listado.idPedido, fotosCrudas);
        fotosPublicas = fotosPublicas.length ? fotosPublicas : null;
        this.logger.log(
          `TX[${txnLabel}] storage bucket=evidencias prefijo=pedidos/${listado.idPedido}/ urls=${fotosPublicas?.length ?? 0}`,
        );
      }
      if (fotosPublicas?.length) {
        await this.dataSource.transaction(async (manager) => {
          await anexarFotosSeguimientoCreacion(manager, {
            idPedido: listado.idPedido,
            idEstadoPedido: idEstadoPedidoCreacion,
            fotosPaqueteUrls: fotosPublicas,
          });
        });
        this.logger.log(
          `TX[${txnLabel}] seguimiento fotos paquete id_pedido=${listado.idPedido} n=${fotosPublicas.length}`,
        );
      }
      return listadoPostCreacionConCamposNoPersistidos(listado, input, { fotosPublicas });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`TX[${txnLabel}] postgres ROLLBACK/fail totalMs=${Date.now() - t0}: ${msg}`);
      throw e;
    }
  }

  async updatePedido(idPedido: number, patch: UpdatePedidoInput): Promise<PedidoListado | null> {
    const existe = await this.pedidoRead.findPedidoById(idPedido);
    if (!existe) return null;

    assertGeoPatchCompleto(patch);

    const fotosCrudas = [
      ...(patch.fotosPaqueteUrls ?? []).map((s) => s.trim()).filter(Boolean),
      ...(patch.fotosPaqueteBase64 ?? []).map((s) => s.trim()).filter(Boolean),
    ];
    if (fotosCrudas.length > 8) {
      throw new BadRequestException(
        'Máximo 8 fotos por petición (`fotosPaqueteUrls` + `fotosPaqueteBase64`).',
      );
    }
    if (fotosCrudas.length > 0) {
      await this.evidencias.resolverFotosPedido(idPedido, fotosCrudas);
      this.logger.log(`PATCH pedido=${idPedido} evidencias subidas batch=${fotosCrudas.length}`);
    }

    const manifiestoPatch =
      patch.observacionesManifiesto !== undefined ? patch.observacionesManifiesto.trim() : undefined;

    await this.dataSource.transaction(async (manager) => {
      const pedidoRepo = manager.getRepository(PedidoOrmEntity);
      const pedido = await pedidoRepo.findOne({
        where: { idPedido },
        relations: [
          'direccion',
          'direccion.tipoVia',
          'direccion.ciudad',
          'paquete',
          'destinatario',
          'estadoPedido',
        ],
      });
      if (!pedido) {
        throw new InternalServerErrorException('Pedido no encontrado dentro de la transacción');
      }

      if (patch.idEstadoPedido !== undefined) {
        const est = await manager.getRepository(EstadoPedidoOrmEntity).findOne({
          where: { idEstadoPedido: patch.idEstadoPedido },
        });
        if (!est) throw new BadRequestException(`Estado no encontrado: ${patch.idEstadoPedido}`);
        pedido.estadoPedido = est;
      }

      if (patch.idUsuarioRecolector !== undefined) {
        if (patch.idUsuarioRecolector === null) {
          pedido.usuarioRecolector = null;
        } else {
          const u = await manager.getRepository(UsuarioOrmEntity).findOne({
            where: { idUsuario: patch.idUsuarioRecolector },
          });
          if (!u) {
            throw new BadRequestException(`Usuario recolector no encontrado: ${patch.idUsuarioRecolector}`);
          }
          pedido.usuarioRecolector = u;
        }
      }

      if (patch.idUsuarioRepartidor !== undefined) {
        if (patch.idUsuarioRepartidor === null) {
          pedido.usuarioRepartidor = null;
        } else {
          const u = await manager.getRepository(UsuarioOrmEntity).findOne({
            where: { idUsuario: patch.idUsuarioRepartidor },
          });
          if (!u) {
            throw new BadRequestException(`Usuario repartidor no encontrado: ${patch.idUsuarioRepartidor}`);
          }
          pedido.usuarioRepartidor = u;
        }
      }

      if (patch.idMetodoRecepcion !== undefined) {
        const met = await manager.getRepository(MetodoRecepcionOrmEntity).findOne({
          where: { idMetodoRecepcion: patch.idMetodoRecepcion },
        });
        if (!met) {
          throw new BadRequestException(`Método recepción no encontrado: ${patch.idMetodoRecepcion}`);
        }
        pedido.metodoRecepcion = met;
      }

      if (patch.idTipoPedido !== undefined) {
        pedido.tipoPedido = await resolverTipoPedidoPorId(manager, patch.idTipoPedido);
      }

      let paqueteDirty = false;
      if (patch.valorDeclarado !== undefined) {
        const v = Number(patch.valorDeclarado);
        pedido.valorDeclarado = v;
        if (pedido.paquete) {
          pedido.paquete.precio = v;
          paqueteDirty = true;
        }
      }
      if (patch.precio !== undefined) {
        const nuevoPrecio = Number(patch.precio);
        if (pedido.tipoPedido.idTipoPedido === TIPO_PEDIDO_EXPRESS_ID) {
          const configTarifa = await cargarConfigTarifaEnvio(this.variables);
          validarPrecioExpress(nuevoPrecio, configTarifa);
        }
        pedido.precio = nuevoPrecio;
        await sincronizarFacturaMontoAbierta(manager, idPedido, nuevoPrecio);
      }

      if (patch.fechaEntrega !== undefined) {
        try {
          pedido.fechaEntrega = parseFechaEntregaYyyyMmDd(patch.fechaEntrega);
        } catch {
          throw new BadRequestException('fechaEntrega debe ser YYYY-MM-DD');
        }
      }

      if (patch.fragil !== undefined) {
        pedido.fragil = patch.fragil;
      }

      if (pedido.destinatario) {
        let destDirty = false;
        if (patch.nombreDestinatario !== undefined) {
          pedido.destinatario.nombre = patch.nombreDestinatario.trim().slice(0, 200);
          destDirty = true;
        }
        if (patch.telefonoDestinatario !== undefined) {
          pedido.destinatario.telefono = patch.telefonoDestinatario.trim().slice(0, 32);
          destDirty = true;
        }
        if (destDirty) await manager.getRepository(DestinatarioOrmEntity).save(pedido.destinatario);
      }

      const geoAny = GEO_PATCH_KEYS.some((k) => patch[k] !== undefined);
      if (geoAny && pedido.direccion) {
        const tipoVia = await resolverTipoVia(manager, patch.tipoViaNombre!);
        const { ciudad, departamento, pais } = await cargarGeografiaPorIds(
          manager,
          patch.idCiudad!,
          patch.idDepartamento!,
          patch.idPais!,
        );
        const dir = pedido.direccion;
        dir.tipoVia = tipoVia;
        dir.ciudad = ciudad;
        dir.departamento = departamento;
        dir.pais = pais;
        const nombreViaNorm = patch.nombreVia!.trim().slice(0, 120);
        dir.zona = armarZonaResumida(
          tipoVia.nombre,
          nombreViaNorm,
          patch.numeroPlaca!,
          patch.numeroSecundario!,
        );
        dir.numeroPrincipal = patch.numeroPlaca!.trim().slice(0, 32);
        dir.numeroSecundario = patch.numeroSecundario!.trim().slice(0, 32);
        if (patch.observacionesDireccion !== undefined) {
          dir.observacionesEntrega = patch.observacionesDireccion.trim() || null;
        }
        const idCiudadPatch = patch.idCiudad!;
        if (patch.idZonaBogota !== undefined) {
          dir.zonaBogota = await resolverZonaBogotaOpcional(
            manager,
            idCiudadPatch,
            patch.idZonaBogota,
          );
        } else if (!esCiudadBogotaDc(idCiudadPatch)) {
          dir.zonaBogota = null;
        }
        await manager.getRepository(DireccionOrmEntity).save(dir);
      } else if (patch.idZonaBogota !== undefined && pedido.direccion) {
        const dir = pedido.direccion;
        const idCiudadActual = dir.ciudad?.idCiudad;
        if (idCiudadActual == null) {
          throw new BadRequestException('No se pudo resolver la ciudad de la dirección del pedido.');
        }
        dir.zonaBogota = await resolverZonaBogotaOpcional(
          manager,
          idCiudadActual,
          patch.idZonaBogota,
        );
        await manager.getRepository(DireccionOrmEntity).save(dir);
      } else if (patch.observacionesDireccion !== undefined && pedido.direccion) {
        pedido.direccion.observacionesEntrega = patch.observacionesDireccion.trim() || null;
        await manager.getRepository(DireccionOrmEntity).save(pedido.direccion);
      }

      if (pedido.paquete) {
        const paqueteTocado =
          patch.tipoProductoNombre !== undefined ||
          patch.pesoKg !== undefined ||
          patch.altoCm !== undefined ||
          patch.anchoCm !== undefined ||
          patch.largoCm !== undefined ||
          patch.idPoliticaResponsabilidad !== undefined;

        if (paqueteTocado) {
          const medidas: PaqueteMedidasInput = {
            pesoKg: patch.pesoKg ?? pedido.paquete.peso,
            altoCm: patch.altoCm !== undefined ? patch.altoCm : pedido.paquete.altoCm,
            anchoCm: patch.anchoCm !== undefined ? patch.anchoCm : pedido.paquete.anchoCm,
            largoCm: patch.largoCm !== undefined ? patch.largoCm : pedido.paquete.largoCm,
          };
          const limitesPaquete = await cargarLimitesPaquete(this.variables);
          validarLimitesPaquete(medidas, limitesPaquete);
        }

        if (patch.tipoProductoNombre !== undefined) {
          pedido.paquete.nombre = patch.tipoProductoNombre.trim().slice(0, 200);
          paqueteDirty = true;
        }
        if (patch.pesoKg !== undefined) {
          pedido.paquete.peso = patch.pesoKg;
          paqueteDirty = true;
        }
        if (patch.altoCm !== undefined) {
          pedido.paquete.altoCm = patch.altoCm;
          paqueteDirty = true;
        }
        if (patch.anchoCm !== undefined) {
          pedido.paquete.anchoCm = patch.anchoCm;
          paqueteDirty = true;
        }
        if (patch.largoCm !== undefined) {
          pedido.paquete.largoCm = patch.largoCm;
          paqueteDirty = true;
        }
        if (patch.idPoliticaResponsabilidad !== undefined) {
          pedido.paquete.fkPoliticaResponsabilidad = patch.idPoliticaResponsabilidad;
          paqueteDirty = true;
        }
        if (paqueteDirty) await manager.getRepository(PaqueteOrmEntity).save(pedido.paquete);
      }

      await pedidoRepo.save(pedido);

      if (manifiestoPatch) {
        await registrarSeguimientoManifiestoActualizado(manager, {
          idPedido,
          idEstadoPedido: pedido.estadoPedido.idEstadoPedido,
          observacionesManifiesto: manifiestoPatch,
        });
      }

      const pedidoPostSave = await pedidoRepo.findOne({
        where: { idPedido },
        relations: ['estadoPedido'],
      });
      if (pedidoPostSave) {
        await cerrarFacturaSiPedidoTerminal(manager, pedidoPostSave);
      }
    });

    return this.pedidoRead.findPedidoById(idPedido);
  }

  async confirmarRecogidaYCrearPedidoEntrega(
    idPedido: number,
    idRepartidor: number,
  ): Promise<PedidoListado> {
    const idEnCurso = await this.variables.getInt(
      VAR.REPARTIDOR_PEDIDO_ESTADO_EN_CAMINO_ID,
      ESTADO_PEDIDO_EN_CURSO_ID,
      { min: 1 },
    );
    const idEntregado = await this.variables.getInt(
      VAR.REPARTIDOR_PEDIDO_ESTADO_ENTREGADO_ID,
      ESTADO_PEDIDO_ENTREGADO_ID,
      { min: 1 },
    );

    const idPedidoEntrega = await this.dataSource.transaction(async (manager) => {
      const pedidoRepo = manager.getRepository(PedidoOrmEntity);
      const recogida = await pedidoRepo.findOne({
        where: { idPedido },
        relations: [
          'metodoRecepcion',
          'estadoPedido',
          'usuarioRepartidor',
          'usuarioSolicitud',
          'tipoPedido',
          'paquete',
          'direccionDestino',
          'direccionDestino.ciudad',
          'direccionDestino.departamento',
          'destinatarioDestino',
        ],
      });

      if (!recogida) {
        throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
      }
      if (recogida.metodoRecepcion.idMetodoRecepcion !== METODO_RECEPCION_ID_RECOGIDA) {
        throw new BadRequestException(
          'Solo pedidos de Recogida (idMetodoRecepcion=1) admiten confirmar-recogida.',
        );
      }
      if (!recogida.direccionDestino || !recogida.destinatarioDestino) {
        throw new BadRequestException(
          'El pedido de recogida no tiene destino de entrega (fk_direccion_destino / fk_destinatario_destino).',
        );
      }

      const repId = recogida.usuarioRepartidor?.idUsuario ?? null;
      if (!repId || repId !== idRepartidor) {
        throw new ForbiddenException('Este pedido no está asignado a usted como repartidor.');
      }

      const estadoActual = recogida.estadoPedido.idEstadoPedido;
      if (estadoActual === idEntregado) {
        throw new ConflictException('La recogida ya fue confirmada.');
      }
      if (estadoActual !== idEnCurso) {
        throw new ConflictException(
          `Solo se puede confirmar recogida desde En curso. Estado actual: ${recogida.estadoPedido.nombre}.`,
        );
      }

      const estadoEntrega = await resolverEstadoPedidoCreacion(manager, this.variables);
      const metodoEntrega = await resolverMetodoRecepcionPorId(manager, METODO_RECEPCION_ID_ENTREGA);
      const now = new Date();

      const pedidoEntrega = pedidoRepo.create({
        numGuia: generarNumGuia(),
        creadoEn: now,
        tipoPedido: recogida.tipoPedido,
        usuarioSolicitud: recogida.usuarioSolicitud,
        fkCliente: null,
        usuarioRecolector: null,
        usuarioRepartidor: null,
        metodoRecepcion: metodoEntrega,
        paquete: recogida.paquete,
        direccion: recogida.direccionDestino,
        estadoPedido: estadoEntrega,
        precio: recogida.precio,
        valorDeclarado: recogida.valorDeclarado,
        fechaEntrega: recogida.fechaEntrega,
        fragil: recogida.fragil,
        pagadoPorRemitente: recogida.pagadoPorRemitente,
        valorRecaudado: recogida.pagadoPorRemitente ? recogida.precio : null,
        metodoPago: recogida.metodoPago,
        destinatario: recogida.destinatarioDestino,
        direccionDestino: null,
        destinatarioDestino: null,
      });
      await pedidoRepo.save(pedidoEntrega);

      await manager.update(
        PedidoOrmEntity,
        { idPedido },
        { estadoPedido: { idEstadoPedido: idEntregado } },
      );

      await registrarSeguimientoCreacionPedido(manager, {
        idPedido: pedidoEntrega.idPedido,
        idEstadoPedido: estadoEntrega.idEstadoPedido,
        observacionesManifiesto: null,
      });

      const direccionEntregaTexto = textoDireccionEntrega(
        recogida.direccionDestino.ciudad,
        recogida.direccionDestino.departamento,
        recogida.direccionDestino,
      );

      await crearFacturaAlCrearPedido(manager, {
        idPedido: pedidoEntrega.idPedido,
        idCliente: recogida.usuarioSolicitud.idUsuario,
        monto: recogida.precio,
        pagadoAlCrear: recogida.pagadoPorRemitente ?? false,
        idMetodoPago: recogida.metodoPago?.idMetodoPago ?? null,
        destinatarioNombre: recogida.destinatarioDestino.nombre,
        destinatarioTelefono: recogida.destinatarioDestino.telefono,
        direccionEntrega: direccionEntregaTexto,
        idDestinatario: recogida.destinatarioDestino.idDestinatario,
        idDireccion: recogida.direccionDestino.idDireccion,
      });

      return pedidoEntrega.idPedido;
    });

    const listado = await this.pedidoRead.findPedidoById(idPedidoEntrega);
    if (!listado) {
      throw new InternalServerErrorException('No se pudo leer el pedido de entrega generado');
    }
    return listado;
  }
}
