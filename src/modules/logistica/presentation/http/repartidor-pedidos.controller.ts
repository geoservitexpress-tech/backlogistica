import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  EJEMPLO_ENTREGA_EXITO_EFECTIVO,
  EJEMPLO_ENTREGA_NOVEDADES,
  EJEMPLO_ENTREGA_NO_ENTREGADO,
  EJEMPLO_RESPUESTA_PEDIDO_ENTREGADO,
} from '../../../../swagger/ejemplos/confirmar-entrega-repartidor.ejemplos';
import { AuthService } from '../../../auth/auth.service';
import { CurrentSupabaseUser } from '../../../auth/decorators/current-supabase-user.decorator';
import { RepartidorRoleGuard } from '../../../auth/guards/repartidor-role.guard';
import { SupabaseJwtGuard } from '../../../auth/guards/supabase-jwt.guard';
import type { SupabaseJwtPayload } from '../../../auth/guards/supabase-jwt.guard';
import { ListPedidosRepartidorUseCase } from '../../application/list-pedidos-repartidor.use-case';
import { RepartidorAceptarPedidoUseCase } from '../../application/repartidor-aceptar-pedido.use-case';
import { RepartidorRecibirPedidoUseCase } from '../../application/repartidor-recibir-pedido.use-case';
import { RepartidorConfirmarEntregaUseCase } from '../../application/repartidor-confirmar-entrega.use-case';
import { PedidoListadoPaginadoSchema, PedidoListadoSchema } from '../../../../swagger/schemas/pedido-listado.schema';
import { SWAGGER_EJEMPLO_ID_PEDIDO } from '../../../../swagger/swagger-ejemplos';
import {
  ESTADO_PEDIDO_ASIGNADO_ID,
  ESTADO_PEDIDO_EN_CURSO_ID,
  ESTADO_PEDIDO_ENTREGADO_ID,
  ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID,
} from '../../logistica-pedido-estados.constants';
import { ConfirmarEntregaRepartidorBodyDto } from './dto/confirmar-entrega-repartidor.body.dto';
import { PaginacionQueryDto } from './dto/paginacion.query.dto';

@ApiTags('Repartidor')
@ApiExtraModels(ConfirmarEntregaRepartidorBodyDto, PedidoListadoPaginadoSchema)
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({
  description:
    'Falta **Authorize** con `access_token` de **POST /auth/login** (usuario con rol REPARTIDOR en `usuario_rol`).',
})
@UseGuards(SupabaseJwtGuard, RepartidorRoleGuard)
@Controller('repartidor/pedidos')
export class RepartidorPedidosController {
  constructor(
    private readonly auth: AuthService,
    private readonly listMisPedidos: ListPedidosRepartidorUseCase,
    private readonly recibirPedido: RepartidorRecibirPedidoUseCase,
    private readonly aceptarPedido: RepartidorAceptarPedidoUseCase,
    private readonly confirmarEntrega: RepartidorConfirmarEntregaUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Mis pedidos asignados',
    description:
      'Lista pedidos donde `fk_usuario_repartidor` = el repartidor del JWT.\n\n' +
      '**Front:** botón **Recibir** si `idEstadoPedido === 2`; botón **En curso** si `idEstadoPedido === 3`.\n\n' +
      '**Flujo:**\n' +
      `1. Cron → **Asignado** (**${ESTADO_PEDIDO_ASIGNADO_ID}**)\n` +
      `2. \`POST …/recibir\` → **Recibido repartidor** (**${ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID}**)\n` +
      `3. \`POST …/aceptar\` → **En curso** (**${ESTADO_PEDIDO_EN_CURSO_ID}**)\n` +
      `4. \`POST …/confirmar-entrega\` → **Entregado** (**${ESTADO_PEDIDO_ENTREGADO_ID}**)\n\n` +
      'Paginación: `page`, `limit`, `totalPaginas` en la respuesta.',
  })
  @ApiOkResponse({ type: PedidoListadoPaginadoSchema })
  @ApiForbiddenResponse({ description: 'El usuario no tiene rol REPARTIDOR' })
  async listar(
    @CurrentSupabaseUser() jwt: SupabaseJwtPayload,
    @Query() query: PaginacionQueryDto,
  ) {
    const idRepartidor = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.listMisPedidos.execute(idRepartidor, query);
  }

  @Post(':id/recibir')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recibir pedido (botón front)',
    description:
      'Cambia **Asignado** → **Recibido por el repartidor** (`fk_estado_pedido` 2 → 3). ' +
      'Registra paso en `seguimiento` / `descripcion_seguimiento`. Sin body.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: '`pedidos.id_pedido`',
    example: SWAGGER_EJEMPLO_ID_PEDIDO,
  })
  @ApiOkResponse({
    type: PedidoListadoSchema,
    description: 'Pedido con `idEstadoPedido` = 3',
  })
  @ApiNotFoundResponse({ description: 'Pedido no existe' })
  @ApiForbiddenResponse({ description: 'Pedido asignado a otro repartidor o sin rol REPARTIDOR' })
  @ApiConflictResponse({
    description: 'Ya fue recibido o no está en estado Asignado (2)',
  })
  async recibir(
    @Param('id', ParseIntPipe) id: number,
    @CurrentSupabaseUser() jwt: SupabaseJwtPayload,
  ) {
    const idRepartidor = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.recibirPedido.execute(id, idRepartidor);
  }

  @Post(':id/aceptar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Poner pedido en curso',
    description:
      '**Recibido por el repartidor** → **En curso** (`fk_estado_pedido` 3 → 4). ' +
      'Segundo paso tras `/recibir`. Sin body.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: '`pedidos.id_pedido`',
    example: SWAGGER_EJEMPLO_ID_PEDIDO,
  })
  @ApiOkResponse({
    type: PedidoListadoSchema,
    description: 'Pedido con `idEstadoPedido` = 4',
  })
  @ApiNotFoundResponse({ description: 'Pedido no existe' })
  @ApiForbiddenResponse({ description: 'Pedido de otro repartidor' })
  @ApiConflictResponse({
    description: 'Ya está en curso (4) o no está en Recibido (3)',
  })
  async aceptar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentSupabaseUser() jwt: SupabaseJwtPayload,
  ) {
    const idRepartidor = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.aceptarPedido.execute(id, idRepartidor);
  }

  @Post(':id/confirmar-entrega')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar entrega (formulario repartidor)',
    description:
      'Formulario de cierre: `idResultadoEntrega` (catálogo), cobro en `pedidos`, observaciones y fotos en **seguimiento** / **descripcion_seguimiento** (mismo bucket **evidencias** que el alta). ' +
      `Requiere **En curso** (id **${ESTADO_PEDIDO_EN_CURSO_ID}**). Éxito/novedades → **Entregado** (**${ESTADO_PEDIDO_ENTREGADO_ID}**). ` +
      'Antes: **GET /catalogo/resultados-entrega**.',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: '`pedidos.id_pedido`',
    example: SWAGGER_EJEMPLO_ID_PEDIDO,
  })
  @ApiBody({
    type: ConfirmarEntregaRepartidorBodyDto,
    description:
      'Use `idResultadoEntrega` del catálogo. **Fotos:** `fotosEntregaBase64` (varias data URL), `fotoEntregaBase64` (una) o `fotosEntregaUrls`. ' +
      'Cada foto → fila en `descripcion_seguimiento`; **observaciones** en la primera fila del paso.',
    examples: {
      entregaExitoEfectivo: {
        summary: 'Entregado con éxito + cobro efectivo',
        description:
          `Pasa a **Entregado** (**${ESTADO_PEDIDO_ENTREGADO_ID}**). Ejemplo con **2 fotos** en \`fotosEntregaBase64\` + \`observaciones\`.`,
        value: { ...EJEMPLO_ENTREGA_EXITO_EFECTIVO },
      },
      entregaConNovedades: {
        summary: 'Entregado con novedades (ya pagado remitente)',
        description: 'También con foto en base64 (`fotosEntregaBase64`).',
        value: { ...EJEMPLO_ENTREGA_NOVEDADES },
      },
      noEntregado: {
        summary: 'No entregado (sigue En curso)',
        description: 'No cambia a Entregado; solo observaciones (foto opcional).',
        value: { ...EJEMPLO_ENTREGA_NO_ENTREGADO },
      },
    },
  })
  @ApiOkResponse({
    description:
      'Pedido actualizado. Tras éxito/novedades: `idEstadoPedido` = **5** (Entregado). Cobro en `pedidos`; foto y observaciones en `seguimiento` / `descripcion_seguimiento`.',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(PedidoListadoSchema) },
        examples: {
          entregado: {
            summary: 'Tras confirmar entrega exitosa',
            description: '`idEstadoPedido` = 5 (Entregado)',
            value: EJEMPLO_RESPUESTA_PEDIDO_ENTREGADO,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validación del formulario o foto obligatoria' })
  @ApiNotFoundResponse({ description: 'Pedido no existe' })
  @ApiForbiddenResponse({ description: 'Pedido de otro repartidor' })
  @ApiConflictResponse({ description: 'No está En curso (4) o ya Entregado' })
  async confirmarEntregaPedido(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ConfirmarEntregaRepartidorBodyDto,
    @CurrentSupabaseUser() jwt: SupabaseJwtPayload,
  ) {
    const idRepartidor = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.confirmarEntrega.execute(id, idRepartidor, body);
  }
}
