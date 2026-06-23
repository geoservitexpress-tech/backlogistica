import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupervisorRoleGuard } from '../../../auth/guards/supervisor-role.guard';
import { SupabaseJwtGuard } from '../../../auth/guards/supabase-jwt.guard';
import { PedidoListadoPaginadoSchema, PedidoListadoSchema } from '../../../../swagger/schemas/pedido-listado.schema';
import { SWAGGER_EJEMPLO_ID_PEDIDO } from '../../../../swagger/swagger-ejemplos';
import {
  ESTADO_PEDIDO_ASIGNADO_ID,
  ESTADO_PEDIDO_EN_CURSO_ID,
  ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID,
} from '../../logistica-pedido-estados.constants';
import { ListPedidosEnRepartoSupervisorUseCase } from '../../application/list-pedidos-en-reparto-supervisor.use-case';
import { SupervisorUpdatePedidoUseCase } from '../../application/supervisor-update-pedido.use-case';
import { ListPedidosSupervisorQueryDto } from './dto/list-pedidos-supervisor.query.dto';
import { SupervisorUpdatePedidoBodyDto } from './dto/supervisor-update-pedido.body.dto';
import {
  EJEMPLO_SUPERVISOR_PATCH_COMPLETO,
  EJEMPLO_SUPERVISOR_PATCH_DESTINATARIO_DIRECCION,
  EJEMPLO_SUPERVISOR_PATCH_ESTADO_FECHA,
} from '../../../../swagger/ejemplos/pedidos.ejemplos';
import { UpdatePedidoBodyDto } from './dto/update-pedido.body.dto';

@ApiTags('Supervisor')
@ApiExtraModels(UpdatePedidoBodyDto, SupervisorUpdatePedidoBodyDto)
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({
  description: 'JWT inválido o sin **Authorize**.',
})
@UseGuards(SupabaseJwtGuard, SupervisorRoleGuard)
@Controller('supervisor/pedidos')
export class SupervisorPedidosController {
  constructor(
    private readonly listEnReparto: ListPedidosEnRepartoSupervisorUseCase,
    private readonly updatePedido: SupervisorUpdatePedidoUseCase,
  ) {}

  @Get('en-reparto')
  @ApiOperation({
    summary: 'Pedidos en reparto del día',
    description:
      'Lista pedidos con `fecha_entrega` en el día indicado (por defecto **hoy**, America/Bogota) ' +
      `y estado en reparto (**${ESTADO_PEDIDO_ASIGNADO_ID}** Asignado, **${ESTADO_PEDIDO_RECIBIDO_REPARTIDOR_ID}** Recibido, **${ESTADO_PEDIDO_EN_CURSO_ID}** En curso). ` +
      'Configurable en `public.variable` → `SUPERVISOR_PEDIDOS_EN_REPARTO_ESTADOS`. ' +
      'Paginación: `page`, `limit`, `totalPaginas` en la respuesta.',
  })
  @ApiOkResponse({ type: PedidoListadoPaginadoSchema })
  @ApiBadRequestResponse({ description: '`fecha` inválida' })
  @ApiForbiddenResponse({ description: 'Usuario sin rol SUPERVISOR' })
  listarEnReparto(@Query() query: ListPedidosSupervisorQueryDto) {
    return this.listEnReparto.execute(query);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Editar pedido (mismos campos que PATCH /pedidos, sin manifiesto/fotos)',
    description:
      'Acepta **todos** los campos editables de `PATCH /pedidos/{id}`: `idEstadoPedido`, `fechaEntrega`, repartidor/recolector, ' +
      'destinatario, dirección (`tipoViaNombre`, placas, ciudad, `observacionesDireccion`), tipo/método de pedido, paquete (**pesoKg**, dimensiones, **`precio`** tarifa final), precios, `fragil`. ' +
      'El supervisor puede fijar peso, tamaño y **`precio`** final. ' +
      'Envíe solo los campos que quiera cambiar (PATCH parcial). ' +
      '**Excluidos:** `observacionesManifiesto`, `fotosPaqueteBase64`, `fotosPaqueteUrls`. ' +
      'Si cambia la nomenclatura de la vía, envíe el bloque completo de dirección.',
  })
  @ApiParam({ name: 'id', type: 'integer', example: SWAGGER_EJEMPLO_ID_PEDIDO })
  @ApiBody({
    type: SupervisorUpdatePedidoBodyDto,
    examples: {
      completo: {
        summary: 'Recomendado — estado, fecha, destinatario y dirección',
        description:
          'Todos los campos de entrega en un solo body (sin manifiesto ni fotos). Puede omitir los que no cambien.',
        value: EJEMPLO_SUPERVISOR_PATCH_COMPLETO,
      },
      soloEstadoYFecha: {
        summary: 'Parcial — solo estado y fecha',
        value: EJEMPLO_SUPERVISOR_PATCH_ESTADO_FECHA,
      },
      soloDestinatarioYDireccion: {
        summary: 'Parcial — solo quien recibe y dirección',
        value: EJEMPLO_SUPERVISOR_PATCH_DESTINATARIO_DIRECCION,
      },
    },
  })
  @ApiOkResponse({ type: PedidoListadoSchema })
  @ApiBadRequestResponse({ description: 'Body vacío o validación' })
  @ApiNotFoundResponse({ description: 'Pedido no existe' })
  @ApiForbiddenResponse({ description: 'Sin rol SUPERVISOR' })
  patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SupervisorUpdatePedidoBodyDto,
  ) {
    return this.updatePedido.execute(id, body);
  }
}
