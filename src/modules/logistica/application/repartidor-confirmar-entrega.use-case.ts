// repartidor-confirmar-entrega.use-case.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import type { PedidoReadPort } from '../domain/ports/pedido-read.port';
import { VAR } from '../../configuracion/variable.keys';
import { VariablesService } from '../../configuracion/variables.service';
import {
  ESTADO_PEDIDO_ENTREGADO_ID,
  ESTADO_PEDIDO_EN_CURSO_ID,
  ESTADO_PEDIDO_NO_ENTREGADO_ID,
} from '../logistica-pedido-estados.constants';
import { cerrarFacturaSiPedidoTerminal } from '../infrastructure/persistence/gestionar-factura-pedido';
import { PEDIDO_READ } from '../pedidos.tokens';
import { DescripcionSeguimientoOrmEntity } from '../infrastructure/persistence/descripcion-seguimiento.orm-entity';
import { PedidoOrmEntity } from '../infrastructure/persistence/pedido.orm-entity';
import { MetodoPagoOrmEntity } from '../infrastructure/persistence/metodo-pago.orm-entity';
import { ResultadoEntregaOrmEntity } from '../infrastructure/persistence/resultado-entrega.orm-entity';
import { SeguimientoOrmEntity } from '../infrastructure/persistence/seguimiento.orm-entity';
import { SupabaseEvidenciasStorage } from '../infrastructure/storage/supabase-evidencias.storage';
import {
  resultadoPasaAEntregado,
  resultadoSinEntrega,
} from '../domain/repartidor-entrega';
import type { ConfirmarEntregaRepartidorBodyDto } from '../presentation/http/dto/confirmar-entrega-repartidor.body.dto';

@Injectable()
export class RepartidorConfirmarEntregaUseCase {
  constructor(
    private readonly variables: VariablesService,
    @Inject(PEDIDO_READ) private readonly pedidos: PedidoReadPort,
    @InjectRepository(PedidoOrmEntity)
    private readonly pedidoRepo: Repository<PedidoOrmEntity>,
    @InjectRepository(ResultadoEntregaOrmEntity)
    private readonly resultadoRepo: Repository<ResultadoEntregaOrmEntity>,
    @InjectRepository(MetodoPagoOrmEntity)
    private readonly metodoPagoRepo: Repository<MetodoPagoOrmEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly evidencias: SupabaseEvidenciasStorage,
  ) {}

  private async idEstadoEnCurso(): Promise<number> {
    return this.variables.getInt(
      VAR.REPARTIDOR_PEDIDO_ESTADO_EN_CAMINO_ID,
      ESTADO_PEDIDO_EN_CURSO_ID,
      { min: 1 },
    );
  }

  private async idEstadoNoEntregado(): Promise<number> {
    return this.variables.getInt(
      VAR.REPARTIDOR_PEDIDO_ESTADO_NO_ENTREGADO_ID,
      ESTADO_PEDIDO_NO_ENTREGADO_ID,
      { min: 1 },
    );
  }

  private async idEstadoEntregado(): Promise<number> {
    return this.variables.getInt(VAR.REPARTIDOR_PEDIDO_ESTADO_ENTREGADO_ID, ESTADO_PEDIDO_ENTREGADO_ID, {
      min: 1,
    });
  }

  private async assertTablasSeguimiento(): Promise<void> {
    const tablas = (await this.dataSource.query(
      `select table_name from information_schema.tables
       where table_schema = 'public'
         and table_name in ('seguimiento', 'descripcion_seguimiento', 'resultado_entrega', 'metodo_pago')`,
    )) as { table_name: string }[];
    const ok = new Set(tablas.map((t) => t.table_name));
    if (
      !ok.has('seguimiento') ||
      !ok.has('descripcion_seguimiento') ||
      !ok.has('resultado_entrega') ||
      !ok.has('metodo_pago')
    ) {
      throw new BadRequestException(
        'Faltan tablas de seguimiento, resultado_entrega o metodo_pago. Ejecute database/seguimiento-resultado-entrega.sql en Supabase.',
      );
    }
    const colMp = (await this.dataSource.query(
      `select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'pedidos' and column_name = 'fk_metodo_pago' limit 1`,
    )) as unknown[];
    if (colMp.length === 0) {
      throw new BadRequestException(
        'Falta pedidos.fk_metodo_pago. Ejecute database/patch-metodo-pago-catalogo.sql si ya tenía el script anterior.',
      );
    }
    const col = (await this.dataSource.query(
      `select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'descripcion_seguimiento'
         and column_name = 'fk_resultado_entrega' limit 1`,
    )) as unknown[];
    if (col.length === 0) {
      throw new BadRequestException(
        'Falta columna descripcion_seguimiento.fk_resultado_entrega. Ejecute el script SQL de seguimiento.',
      );
    }
  }

  private validarCobro(body: ConfirmarEntregaRepartidorBodyDto): void {
    if (body.pagadoPorRemitente) return;
    if (body.valorRecaudado > 0 && body.idMetodoPago == null) {
      throw new BadRequestException(
        'Indique idMetodoPago (catálogo metodo_pago) cuando hay valor recaudado. Ver GET /catalogo/metodos-pago.',
      );
    }
  }

  private entradasFotosEntrega(body: ConfirmarEntregaRepartidorBodyDto): string[] {
    const urls = [
      ...(body.fotosEntregaUrls ?? []),
    ];
    const b64 = [
      ...(body.fotoEntregaBase64 ? [body.fotoEntregaBase64] : []),
      ...(body.fotosEntregaBase64 ?? []),
    ];
    return [...urls, ...b64];
  }

  private validarFotos(entradas: string[], codigo: string): void {
    if (resultadoSinEntrega(codigo)) return;
    if (entradas.length === 0) {
      throw new BadRequestException(
        'Incluya al menos una foto (`fotoEntregaBase64`, `fotosEntregaBase64` o `fotosEntregaUrls`), igual que en el alta del pedido.',
      );
    }
  }

  async execute(
    idPedido: number,
    idRepartidor: number,
    body: ConfirmarEntregaRepartidorBodyDto,
  ) {
    await this.assertTablasSeguimiento();
    this.validarCobro(body);

    let idMetodoPago: number | null = null;
    if (!body.pagadoPorRemitente && body.idMetodoPago != null) {
      const mp = await this.metodoPagoRepo.findOne({
        where: { idMetodoPago: body.idMetodoPago },
      });
      if (!mp) {
        throw new BadRequestException(
          `metodo_pago no encontrado: ${body.idMetodoPago}. Use GET /catalogo/metodos-pago.`,
        );
      }
      idMetodoPago = mp.idMetodoPago;
    }

    const resultado = await this.resultadoRepo.findOne({
      where: { idResultadoEntrega: body.idResultadoEntrega },
    });
    if (!resultado) {
      throw new BadRequestException(
        `resultado_entrega no encontrado: ${body.idResultadoEntrega}. Use GET /catalogo/resultados-entrega.`,
      );
    }

    const entradasFoto = this.entradasFotosEntrega(body);
    this.validarFotos(entradasFoto, resultado.codigo);

    const idEnCurso = await this.idEstadoEnCurso();
    const idEntregado = await this.idEstadoEntregado();
    const idNoEntregado = await this.idEstadoNoEntregado();

    const row = await this.pedidoRepo.findOne({
      where: { idPedido },
      relations: ['estadoPedido', 'usuarioRepartidor'],
    });

    if (!row) {
      throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
    }

    const repId = row.usuarioRepartidor?.idUsuario ?? null;
    if (!repId || repId !== idRepartidor) {
      throw new ForbiddenException('Este pedido no está asignado a usted como repartidor.');
    }

    const estadoActual = row.estadoPedido.idEstadoPedido;
    if (estadoActual === idEntregado) {
      throw new ConflictException('El pedido ya está marcado como Entregado.');
    }
    if (estadoActual !== idEnCurso) {
      throw new ConflictException(
        `Solo se puede confirmar entrega desde En curso. Estado actual: ${row.estadoPedido.nombre}.`,
      );
    }

    const fotosUrls =
      entradasFoto.length > 0
        ? await this.evidencias.resolverFotosPedido(idPedido, entradasFoto)
        : [];

    const pasaAEntregado = resultadoPasaAEntregado(resultado.codigo);
    const sinEntrega = resultadoSinEntrega(resultado.codigo);
    const idEstadoPaso = pasaAEntregado
      ? idEntregado
      : sinEntrega
        ? idNoEntregado
        : idEnCurso;
    const observaciones = body.observaciones.trim();

    await this.dataSource.transaction(async (manager) => {
      const seguimiento = manager.create(SeguimientoOrmEntity, {
        pedido: { idPedido } as PedidoOrmEntity,
        estadoPedido: { idEstadoPedido: idEstadoPaso },
        fecha: new Date(),
      });
      await manager.save(seguimiento);

      if (fotosUrls.length === 0) {
        const detalle = manager.create(DescripcionSeguimientoOrmEntity, {
          seguimiento,
          estadoPedido: { idEstadoPedido: idEstadoPaso },
          descripcion: resultado.nombre,
          fotoUrl: null,
          observaciones,
          resultadoEntrega: resultado,
          creadoEn: new Date(),
        });
        await manager.save(detalle);
      } else {
        for (let i = 0; i < fotosUrls.length; i++) {
          const detalle = manager.create(DescripcionSeguimientoOrmEntity, {
            seguimiento,
            estadoPedido: { idEstadoPedido: idEstadoPaso },
            descripcion: i === 0 ? resultado.nombre : `${resultado.nombre} (evidencia ${i + 1})`,
            fotoUrl: fotosUrls[i]!,
            observaciones: i === 0 ? observaciones : null,
            resultadoEntrega: resultado,
            creadoEn: new Date(),
          });
          await manager.save(detalle);
        }
      }

      const patchPedido: {
        pagadoPorRemitente: boolean;
        fkMetodoPago: number | null;
        valorRecaudado: number;
        precio?: number;
      } = {
        pagadoPorRemitente: body.pagadoPorRemitente,
        fkMetodoPago: idMetodoPago,
        valorRecaudado: body.valorRecaudado,
      };
      if (!body.pagadoPorRemitente && body.valorRecaudado > 0) {
        patchPedido.precio = body.valorRecaudado;
      }

      await manager.query(
        `update pedidos set
           fk_estado_pedido = $2::int,
           pagado_por_remitente = $3,
           fk_metodo_pago = $4::int,
           valor_recaudado = $5,
           precio = coalesce($6::numeric, precio)
         where id_pedido = $1::int`,
        [
          idPedido,
          idEstadoPaso,
          body.pagadoPorRemitente,
          patchPedido.fkMetodoPago,
          patchPedido.valorRecaudado,
          patchPedido.precio ?? null,
        ],
      );

      const pedidoPost = await manager.getRepository(PedidoOrmEntity).findOne({
        where: { idPedido },
        relations: ['estadoPedido'],
      });
      if (pedidoPost) {
        pedidoPost.pagadoPorRemitente = body.pagadoPorRemitente;
        pedidoPost.valorRecaudado = body.valorRecaudado;
        await cerrarFacturaSiPedidoTerminal(manager, pedidoPost);
      }

      if (pasaAEntregado && pedidoPost) {
        const pedidoConRelaciones = await manager.getRepository(PedidoOrmEntity).findOne({
          where: { idPedido },
          relations: [
            'tipoPedido',
            'usuarioSolicitud',
            'usuarioRepartidor',
            'metodoRecepcion',
            'paquete',
            'direccion',
            'direccionDestino',
            'destinatarioDestino',
          ],
        });

        if (pedidoConRelaciones?.metodoRecepcion?.nombre === 'Recogida') {
          const fecha   = new Date();
          const ymd     = fecha.toISOString().slice(0, 10).replace(/-/g, '');
          const rand    = Math.random().toString(36).slice(2, 8).toUpperCase();
          const numGuia = `BL-${ymd}-${rand}`;

          await manager.query(
            `insert into pedidos (
              num_guia, fk_tipo_pedido, fk_usuario_solicitud, fk_usuario_repartidor,
              fk_metodo_recepcion, fk_paquete, fk_direccion, fk_destinatario, fk_estado_pedido,
              precio, valor_declarado, fecha_entrega, creado_en,
              pagado_por_remitente, valor_recaudado
            ) values (
              $1, $2, $3, $4,
              2, $5, $6, $7, 2,
              $8, $9, $10, now(),
              $11, 0
            )`,
            [
              numGuia,
              pedidoConRelaciones.tipoPedido.idTipoPedido,
              pedidoConRelaciones.usuarioSolicitud.idUsuario,
              pedidoConRelaciones.usuarioRepartidor?.idUsuario ?? null,
              pedidoConRelaciones.paquete.idPaquete,
              pedidoConRelaciones.direccionDestino?.idDireccion ?? pedidoConRelaciones.direccion.idDireccion,
              pedidoConRelaciones.destinatarioDestino?.idDestinatario ?? null,
              pedidoConRelaciones.precio,
              pedidoConRelaciones.valorDeclarado,
              pedidoConRelaciones.fechaEntrega,
              pedidoConRelaciones.pagadoPorRemitente,
            ],
          );
        }
      }
    });

    const actualizado = await this.pedidos.findPedidoById(idPedido);
    if (!actualizado) {
      throw new NotFoundException(`Pedido ${idPedido} no encontrado`);
    }
    return actualizado;
  }
}