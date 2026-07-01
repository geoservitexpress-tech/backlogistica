import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdministradorRoleGuard } from '../../../auth/guards/administrador-role.guard';
import { SupabaseJwtGuard } from '../../../auth/guards/supabase-jwt.guard';
import {
  ActualizarClienteLiquidacionConfigUseCase,
  GenerarLiquidacionClienteUseCase,
  GetClienteLiquidacionConfigUseCase,
  ListLiquidacionesPendientesUseCase,
} from '../../application/liquidacion-cliente.use-cases';
import { ActualizarClienteLiquidacionBodyDto } from './dto/actualizar-cliente-liquidacion.body.dto';
import { GenerarLiquidacionBodyDto } from './dto/generar-liquidacion.body.dto';
import {
  ClienteLiquidacionConfigSchema,
  ClienteLiquidacionPendienteSchema,
  LiquidacionLoteResultadoSchema,
} from '../../../../swagger/schemas/liquidacion-cliente.schema';

@ApiTags('Admin — Liquidaciones')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'JWT inválido o ausente' })
@ApiForbiddenResponse({ description: 'Solo rol ADMINISTRADOR' })
@UseGuards(SupabaseJwtGuard, AdministradorRoleGuard)
@Controller('admin/liquidaciones')
export class AdminLiquidacionesController {
  constructor(
    private readonly listPendientes: ListLiquidacionesPendientesUseCase,
    private readonly getConfig: GetClienteLiquidacionConfigUseCase,
    private readonly actualizarConfigUseCase: ActualizarClienteLiquidacionConfigUseCase,
    private readonly generarLiquidacion: GenerarLiquidacionClienteUseCase,
  ) {}

  @Get('pendientes')
  @ApiOperation({
    summary: 'Recaudos pendientes de liquidar por cliente',
    description:
      'Agrupa pedidos **Entregado** con `valorRecaudado` > 0 aún no liquidados. ' +
      '`listoParaLiquidar` según `frecuenciaDias` del acuerdo (default 15).',
  })
  @ApiOkResponse({ type: ClienteLiquidacionPendienteSchema, isArray: true })
  pendientes() {
    return this.listPendientes.execute();
  }

  @Get('clientes/:idUsuario/config')
  @ApiOperation({ summary: 'Config de liquidación del cliente/proveedor' })
  @ApiParam({ name: 'idUsuario', type: 'integer' })
  @ApiOkResponse({ type: ClienteLiquidacionConfigSchema })
  @ApiNotFoundResponse()
  config(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.getConfig.execute(idUsuario);
  }

  @Patch('clientes/:idUsuario/config')
  @ApiOperation({
    summary: 'Actualizar acuerdo de liquidación',
    description:
      'Frecuencia de pago (ej. cada 15 días) y método de devolución del recaudo (transferencia, efectivo, etc.).',
  })
  @ApiParam({ name: 'idUsuario', type: 'integer' })
  @ApiBody({ type: ActualizarClienteLiquidacionBodyDto })
  @ApiOkResponse({ type: ClienteLiquidacionConfigSchema })
  patchConfig(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Body() body: ActualizarClienteLiquidacionBodyDto,
  ) {
    return this.actualizarConfigUseCase.execute(idUsuario, body);
  }

  @Post('generar')
  @ApiOperation({
    summary: 'Generar liquidación de recaudos a un proveedor',
    description:
      'Devuelve al cliente el neto (`valorRecaudado` − `tarifaEnvio` si la tarifa no fue prepagada). ' +
      'La tarifa de domicilio se cobra por factura aunque la entrega falle.',
  })
  @ApiBody({ type: GenerarLiquidacionBodyDto })
  @ApiCreatedResponse({ type: LiquidacionLoteResultadoSchema })
  generar(@Body() body: GenerarLiquidacionBodyDto) {
    return this.generarLiquidacion.execute(body);
  }
}
