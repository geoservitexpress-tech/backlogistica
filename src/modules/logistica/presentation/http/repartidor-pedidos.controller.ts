import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
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
} from '@nestjs/swagger';
import {
  EJEMPLO_ENTREGA_EXITO_EFECTIVO,
  EJEMPLO_ENTREGA_NOVEDADES,
  EJEMPLO_ENTREGA_NO_ENTREGADO,
} from '../../../../swagger/ejemplos/confirmar-entrega-repartidor.ejemplos';
import { AuthService } from '../../../auth/auth.service';
import { CurrentSupabaseUser } from '../../../auth/decorators/current-supabase-user.decorator';
import { RepartidorRoleGuard } from '../../../auth/guards/repartidor-role.guard';
import { SupabaseJwtGuard } from '../../../auth/guards/supabase-jwt.guard';
import type { SupabaseJwtPayload } from '../../../auth/guards/supabase-jwt.guard';
import { ListPedidosRepartidorUseCase } from '../../application/list-pedidos-repartidor.use-case';
import { RepartidorAceptarPedidoUseCase } from '../../application/repartidor-aceptar-pedido.use-case';
import { RepartidorConfirmarEntregaUseCase } from '../../application/repartidor-confirmar-entrega.use-case';
import { PedidoListadoSchema } from '../../../../swagger/schemas/pedido-listado.schema';
import { SWAGGER_EJEMPLO_ID_PEDIDO } from '../../../../swagger/swagger-ejemplos';
import {
  ESTADO_PEDIDO_ASIGNADO_ID,
  ESTADO_PEDIDO_ENTREGADO_ID,
  ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID,
} from '../../logistica-pedido-estados.constants';
import { ConfirmarEntregaRepartidorBodyDto } from './dto/confirmar-entrega-repartidor.body.dto';

@ApiTags('Repartidor')
@ApiExtraModels(ConfirmarEntregaRepartidorBodyDto)
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
    private readonly aceptarPedido: RepartidorAceptarPedidoUseCase,
    private readonly confirmarEntrega: RepartidorConfirmarEntregaUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Mis pedidos asignados',
    description:
      'Lista pedidos donde `fk_usuario_repartidor` = `sub` del JWT.\n\n' +
      '**Flujo app repartidor:**\n' +
      `1. Cron/admin asigna rep → estado **Asignado** (id **${ESTADO_PEDIDO_ASIGNADO_ID}**)\n` +
      `2. \`POST /repartidor/pedidos/{id}/aceptar\` → **Recibido repartidor / En camino** (id **${ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID}**, variable \`REPARTIDOR_PEDIDO_ESTADO_EN_CAMINO_ID\`)\n` +
      `3. Formulario en destino → \`POST /repartidor/pedidos/{id}/confirmar-entrega\` → **Entregado** (id **${ESTADO_PEDIDO_ENTREGADO_ID}**) si EXITO/NOVEDADES`,
  })
  @ApiOkResponse({ type: PedidoListadoSchema, isArray: true })
  @ApiForbiddenResponse({ description: 'El usuario no tiene rol REPARTIDOR' })
  async listar(@CurrentSupabaseUser() jwt: SupabaseJwtPayload) {
    const idRepartidor = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.listMisPedidos.execute(idRepartidor);
  }

  @Post(':id/aceptar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aceptar pedido (En Camino)',
    description:
      'El repartidor confirma la entrega asignada: el pedido debe estar en estado **Asignado**, asignado a él, ' +
      `y pasa a **En Camino** (\`fk_estado_pedido\` = **${ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID}** por defecto; ver \`REPARTIDOR_PEDIDO_ESTADO_EN_CAMINO_ID\` en \`public.variable\`).`,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: '`pedidos.id_pedido`',
    example: SWAGGER_EJEMPLO_ID_PEDIDO,
  })
  @ApiOkResponse({
    type: PedidoListadoSchema,
    description: 'Pedido actualizado con estado En Camino',
  })
  @ApiNotFoundResponse({ description: 'Pedido no existe' })
  @ApiForbiddenResponse({ description: 'Pedido asignado a otro repartidor o sin rol REPARTIDOR' })
  @ApiConflictResponse({
    description: 'Ya está En Camino o no está en estado Asignado',
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
      `Éxito o novedades → estado pedido **Entregado** (id **${ESTADO_PEDIDO_ENTREGADO_ID}**). No entregado → nuevo paso en seguimiento, sigue **En Camino**. ` +
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
      'Use `idResultadoEntrega` del catálogo. Fotos: `fotosEntregaBase64` / `fotosEntregaUrls` (como crear pedido). ' +
      'Observaciones → `descripcion_seguimiento.observaciones`.',
    examples: {
      entregaExitoEfectivo: {
        summary: 'Entregado con éxito + cobro efectivo',
        description: 'Pasa a estado Entregado. Incluya `fotoEntregaUrl` o `fotoEntregaBase64`.',
        value: { ...EJEMPLO_ENTREGA_EXITO_EFECTIVO },
      },
      entregaConNovedades: {
        summary: 'Entregado con novedades (ya pagado remitente)',
        value: { ...EJEMPLO_ENTREGA_NOVEDADES },
      },
      noEntregado: {
        summary: 'No entregado (sigue En Camino)',
        description: 'No cambia a Entregado; guarda motivo en Storage.',
        value: { ...EJEMPLO_ENTREGA_NO_ENTREGADO },
      },
    },
  })
  @ApiOkResponse({
    type: PedidoListadoSchema,
    description:
      'Pedido actualizado. Cobro en columnas `pedidos`; detalle del paso en tablas `seguimiento` / `descripcion_seguimiento`.',
  })
  @ApiBadRequestResponse({ description: 'Validación del formulario o foto obligatoria' })
  @ApiNotFoundResponse({ description: 'Pedido no existe' })
  @ApiForbiddenResponse({ description: 'Pedido de otro repartidor' })
  @ApiConflictResponse({ description: 'No está En Camino o ya Entregado' })
  async confirmarEntregaPedido(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ConfirmarEntregaRepartidorBodyDto,
    @CurrentSupabaseUser() jwt: SupabaseJwtPayload,
  ) {
    const idRepartidor = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.confirmarEntrega.execute(id, idRepartidor, body);
  }
}
