import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdministradorRoleGuard } from '../../../auth/guards/administrador-role.guard';
import { SupabaseJwtGuard } from '../../../auth/guards/supabase-jwt.guard';
import {
  GetIngresosTotalesUseCase,
  GetPagoPersonalUseCase,
  GetUtilidadBrutaUseCase,
  ListTransaccionesRecientesUseCase,
} from '../../application/finanzas-kpi.use-cases';
import {
  IngresosTotalesKpiSchema,
  PagoPersonalKpiSchema,
  TransaccionRecientePaginadoSchema,
  TransaccionRecienteSchema,
  UtilidadBrutaKpiSchema,
} from '../../../../swagger/schemas/finanzas-kpi.schema';
import { FinanzasPeriodoQueryDto } from './dto/finanzas-periodo.query.dto';
import { ListTransaccionesRecientesQueryDto } from './dto/list-transacciones-recientes.query.dto';

@ApiTags('Admin — Finanzas')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'JWT inválido o ausente' })
@ApiForbiddenResponse({ description: 'Solo rol ADMINISTRADOR' })
@UseGuards(SupabaseJwtGuard, AdministradorRoleGuard)
@Controller('admin/finanzas')
export class AdminFinanzasController {
  constructor(
    private readonly ingresosTotales: GetIngresosTotalesUseCase,
    private readonly pagoPersonal: GetPagoPersonalUseCase,
    private readonly utilidadBruta: GetUtilidadBrutaUseCase,
    private readonly transaccionesRecientes: ListTransaccionesRecientesUseCase,
  ) {}

  @Get('ingresos-totales')
  @ApiOperation({
    summary: 'KPI — Ingresos totales',
    description:
      'Suma de `factura.monto_cobrado` en facturas **cerradas** (Pagada / Saldo a favor) por `fecha_cierre`. ' +
      'Incluye `variacionPorcentaje` vs el periodo anterior de igual duración. ' +
      'Periodo default: mes actual hasta hoy (zona Colombia).',
  })
  @ApiOkResponse({ type: IngresosTotalesKpiSchema })
  getIngresosTotales(@Query() query: FinanzasPeriodoQueryDto) {
    return this.ingresosTotales.execute(query);
  }

  @Get('pago-personal')
  @ApiOperation({
    summary: 'KPI — Pago personal',
    description:
      'Estimación: entregas completadas (`pedidos` estado Entregado) × tarifa `FINANZAS_TARIFA_PAGO_REPARTIDOR_ENTREGA` ' +
      '+ prorrateo de `FINANZAS_PAGO_PERSONAL_FIJO_MENSUAL` (nómina fija). Ver **GET /catalogo/variables**.',
  })
  @ApiOkResponse({ type: PagoPersonalKpiSchema })
  getPagoPersonal(@Query() query: FinanzasPeriodoQueryDto) {
    return this.pagoPersonal.execute(query);
  }

  @Get('utilidad-bruta')
  @ApiOperation({
    summary: 'KPI — Utilidad bruta',
    description:
      '`ingresosTotales − pagoPersonal`. Incluye `margenPorcentaje` = utilidad / ingresos × 100.',
  })
  @ApiOkResponse({ type: UtilidadBrutaKpiSchema })
  getUtilidadBruta(@Query() query: FinanzasPeriodoQueryDto) {
    return this.utilidadBruta.execute(query);
  }

  @Get('transacciones-recientes')
  @ApiOperation({
    summary: 'Transacciones recientes (tabla dashboard)',
    description:
      'Facturas ordenadas por `creado_en` descendente. Paginación `page` + `limit` (default 20); respuesta con `totalPaginas`. ' +
      'Filtro opcional por periodo (`fechaDesde` / `fechaHasta`).',
  })
  @ApiOkResponse({ type: TransaccionRecientePaginadoSchema })
  getTransaccionesRecientes(@Query() query: ListTransaccionesRecientesQueryDto) {
    return this.transaccionesRecientes.execute(query);
  }
}
