import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdministradorRoleGuard } from '../../../auth/guards/administrador-role.guard';
import { SupabaseJwtGuard } from '../../../auth/guards/supabase-jwt.guard';
import {
  GenerarDispersionRepartidorIndividualUseCase,
  GenerarDispersionRepartidorUseCase,
  GetPagosRepartidorKpisUseCase,
  ListRepartidoresPagoUseCase,
  PreviewDispersionRepartidorUseCase,
} from '../../application/pagos-repartidor.use-cases';
import {
  DispersionRepartidorIndividualResultadoSchema,
  DispersionRepartidorPreviewSchema,
  DispersionRepartidorResultadoSchema,
  PagosRepartidorKpisSchema,
  RepartidorPagoListadoPaginadoSchema,
} from '../../../../swagger/schemas/pagos-repartidor.schema';
import { DispersionPreviewQueryDto } from './dto/dispersion-preview.query.dto';
import { ListRepartidoresPagoQueryDto } from './dto/list-repartidores-pago.query.dto';
import {
  EJEMPLO_DISPERSION_PREVIEW,
  EJEMPLO_DISPERSION_PREVIEW_UN_REPARTIDOR,
  EJEMPLO_DISPERSION_REPARTIDOR_INDIVIDUAL,
  EJEMPLO_DISPERSION_TOTAL,
  EJEMPLO_FECHA_DISPERSION,
  EJEMPLO_QUERY_DISPERSION_PREVIEW,
  EJEMPLO_QUERY_DISPERSION_PREVIEW_REPARTIDOR,
  SWAGGER_EJEMPLO_ID_REPARTIDOR,
} from '../../../../swagger/ejemplos/pagos-repartidor.ejemplos';

@ApiTags('Admin — Pago a Repartidores')
@ApiExtraModels(DispersionPreviewQueryDto)
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'JWT inválido o ausente' })
@ApiForbiddenResponse({ description: 'Solo rol ADMINISTRADOR' })
@UseGuards(SupabaseJwtGuard, AdministradorRoleGuard)
@Controller('admin/pagos-repartidores')
export class AdminPagosRepartidoresController {
  constructor(
    private readonly kpis: GetPagosRepartidorKpisUseCase,
    private readonly listRepartidores: ListRepartidoresPagoUseCase,
    private readonly previewDispersion: PreviewDispersionRepartidorUseCase,
    private readonly generarDispersion: GenerarDispersionRepartidorUseCase,
    private readonly generarDispersionRepartidor: GenerarDispersionRepartidorIndividualUseCase,
  ) {}

  @Get('kpis')
  @ApiOperation({
    summary: 'KPIs del dashboard Pago a Repartidores',
    description:
      'Total pendiente (entregas no dispersadas × tarifa), repartidores registrados, entregas hoy y % meta diaria.',
  })
  @ApiOkResponse({ type: PagosRepartidorKpisSchema })
  getKpis() {
    return this.kpis.execute();
  }

  @Get('repartidores')
  @ApiOperation({
    summary: 'Listado de repartidores para tabla',
    description:
      'Solo lectura: `codigo` (RP-xxxx), `nombre`, `vehiculo`, `zona`, `entregasTotales`, `estado`. ' +
      'Búsqueda por nombre, documento o RP-8842. Paginación `page` + `limit` (default 20); respuesta con `totalPaginas`.',
  })
  @ApiOkResponse({ type: RepartidorPagoListadoPaginadoSchema })
  list(@Query() query: ListRepartidoresPagoQueryDto) {
    return this.listRepartidores.execute(query);
  }

  @Get('dispersion/preview')
  @ApiOperation({
    summary: 'Vista previa del pago a repartidores',
    description:
      'Sin registrar pago: muestra por repartidor cuántas entregas pendientes hay, la tarifa unitaria, ' +
      'el monto sugerido y la lista de pedidos (`idPedido`, `numGuia`). ' +
      'Opcional `idUsuario` para un solo mensajero.\n\n' +
      `**Ejemplo:** \`?fecha=${EJEMPLO_QUERY_DISPERSION_PREVIEW.fecha}\` o ` +
      `\`?fecha=${EJEMPLO_QUERY_DISPERSION_PREVIEW_REPARTIDOR.fecha}&idUsuario=${EJEMPLO_QUERY_DISPERSION_PREVIEW_REPARTIDOR.idUsuario}\``,
  })
  @ApiOkResponse({
    type: DispersionRepartidorPreviewSchema,
    schema: { example: EJEMPLO_DISPERSION_PREVIEW },
    examples: {
      todosRepartidores: {
        summary: 'Todos los repartidores del día',
        value: EJEMPLO_DISPERSION_PREVIEW,
      },
      unRepartidor: {
        summary: 'Solo un repartidor (`idUsuario`)',
        value: EJEMPLO_DISPERSION_PREVIEW_UN_REPARTIDOR,
      },
    },
  })
  preview(@Query() query: DispersionPreviewQueryDto) {
    return this.previewDispersion.execute(query);
  }

  @Post('repartidores/:idUsuario/dispersion/generar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pagar a un repartidor específico',
    description:
      'Registra dispersión solo para las entregas **Entregado** del día que aún no se han pagado. ' +
      'Devuelve entregas, monto y pedidos incluidos.\n\n' +
      `**Try it out:** \`idUsuario=${SWAGGER_EJEMPLO_ID_REPARTIDOR}\`, \`fecha=${EJEMPLO_FECHA_DISPERSION}\``,
  })
  @ApiParam({
    name: 'idUsuario',
    type: 'integer',
    example: SWAGGER_EJEMPLO_ID_REPARTIDOR,
    description: '`usuarios.id_usuario` del repartidor',
  })
  @ApiQuery({
    name: 'fecha',
    required: false,
    example: EJEMPLO_FECHA_DISPERSION,
    description: 'Día de entrega a liquidar (default: hoy Bogotá)',
  })
  @ApiCreatedResponse({
    type: DispersionRepartidorIndividualResultadoSchema,
    schema: { example: EJEMPLO_DISPERSION_REPARTIDOR_INDIVIDUAL },
  })
  @ApiBadRequestResponse({ description: 'Sin entregas pendientes ese día' })
  @ApiNotFoundResponse({ description: 'No es repartidor' })
  pagarRepartidor(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @Query('fecha') fecha?: string,
  ) {
    return this.generarDispersionRepartidor.execute(idUsuario, fecha);
  }

  @Post('dispersion/generar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generar dispersión diaria a mensajeros',
    description:
      'Paga tarifa fija por cada entrega **Entregado** del día (`fecha`, default hoy Bogotá) a **todos** los repartidores. ' +
      'Requiere `database/18-dispersion-repartidor.sql` en Supabase.',
  })
  @ApiQuery({
    name: 'fecha',
    required: false,
    example: EJEMPLO_FECHA_DISPERSION,
    description: 'Día de entrega a liquidar (default: hoy Bogotá)',
  })
  @ApiCreatedResponse({
    type: DispersionRepartidorResultadoSchema,
    schema: { example: EJEMPLO_DISPERSION_TOTAL },
  })
  @ApiBadRequestResponse({ description: 'Sin entregas pendientes o tablas de dispersión faltantes' })
  generar(@Query('fecha') fecha?: string) {
    return this.generarDispersion.execute(fecha);
  }
}
