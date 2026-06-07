import { Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdministradorRoleGuard } from '../../../auth/guards/administrador-role.guard';
import { SupabaseJwtGuard } from '../../../auth/guards/supabase-jwt.guard';
import {
  GenerarDispersionRepartidorUseCase,
  GetPagosRepartidorKpisUseCase,
  ListRepartidoresPagoUseCase,
} from '../../application/pagos-repartidor.use-cases';
import {
  DispersionRepartidorResultadoSchema,
  PagosRepartidorKpisSchema,
  RepartidorPagoListadoPaginadoSchema,
} from '../../../../swagger/schemas/pagos-repartidor.schema';
import { ListRepartidoresPagoQueryDto } from './dto/list-repartidores-pago.query.dto';

@ApiTags('Admin — Pago a Repartidores')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'JWT inválido o ausente' })
@ApiForbiddenResponse({ description: 'Solo rol ADMINISTRADOR' })
@UseGuards(SupabaseJwtGuard, AdministradorRoleGuard)
@Controller('admin/pagos-repartidores')
export class AdminPagosRepartidoresController {
  constructor(
    private readonly kpis: GetPagosRepartidorKpisUseCase,
    private readonly listRepartidores: ListRepartidoresPagoUseCase,
    private readonly generarDispersion: GenerarDispersionRepartidorUseCase,
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

  @Post('dispersion/generar')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generar dispersión total',
    description:
      'Marca todas las entregas pendientes como pagadas en `dispersion_lote` / `dispersion_detalle`. ' +
      'Requiere `database/18-dispersion-repartidor.sql` en Supabase.',
  })
  @ApiCreatedResponse({ type: DispersionRepartidorResultadoSchema })
  @ApiBadRequestResponse({ description: 'Sin entregas pendientes o tablas de dispersión faltantes' })
  generar() {
    return this.generarDispersion.execute();
  }
}
