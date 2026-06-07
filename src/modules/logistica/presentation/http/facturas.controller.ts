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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '../../../auth/auth.service';
import { CurrentSupabaseUser } from '../../../auth/decorators/current-supabase-user.decorator';
import { SupabaseJwtGuard } from '../../../auth/guards/supabase-jwt.guard';
import type { SupabaseJwtPayload } from '../../../auth/guards/supabase-jwt.guard';
import { GetFacturaByIdUseCase } from '../../application/get-factura-by-id.use-case';
import { ListFacturasUseCase } from '../../application/list-facturas.use-case';
import { PagarFacturaUseCase } from '../../application/pagar-factura.use-case';
import {
  EJEMPLO_PAGAR_FACTURA_BODY,
  FacturaListadoPaginadoSchema,
  FacturaListadoSchema,
} from '../../../../swagger/schemas/factura-listado.schema';
import { ListFacturasQueryDto } from './dto/list-facturas.query.dto';
import { PagarFacturaBodyDto } from './dto/pagar-factura.body.dto';

@ApiTags('Facturas')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({
  description:
    'Falta `Authorization: Bearer <access_token>` o el JWT de Supabase es inválido/expirado.',
})
@UseGuards(SupabaseJwtGuard)
@Controller('facturas')
export class FacturasController {
  constructor(
    private readonly auth: AuthService,
    private readonly listFacturas: ListFacturasUseCase,
    private readonly getFacturaById: GetFacturaByIdUseCase,
    private readonly pagarFactura: PagarFacturaUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar facturas',
    description:
      'Facturas del cliente autenticado (**Cliente**) o todas con filtros (**Administrador**). ' +
      'Cada pedido genera una factura al crearse. Filtros: `idFactura`, `idPedido`, `idEstadoFactura`, `fecha`. ' +
      'Paginación: `page`, `limit`, `totalPaginas` en la respuesta. ' +
      'Estados: **GET /catalogo/estados-factura**.',
  })
  @ApiOkResponse({ type: FacturaListadoPaginadoSchema })
  @ApiBadRequestResponse({ description: 'Parámetros de query inválidos' })
  @ApiForbiddenResponse({ description: 'Cliente intentando filtrar facturas de otro usuario' })
  async list(@CurrentSupabaseUser() jwt: SupabaseJwtPayload, @Query() query: ListFacturasQueryDto) {
    const idUsuario = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.listFacturas.execute(idUsuario, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener factura por id',
    description:
      'Devuelve una factura por `factura.id_factura`. El **Cliente** solo puede ver las suyas (`fk_cliente`).',
  })
  @ApiParam({ name: 'id', type: 'integer', example: 1, description: '`factura.id_factura`' })
  @ApiOkResponse({ type: FacturaListadoSchema })
  @ApiNotFoundResponse({ description: 'Factura no encontrada' })
  @ApiForbiddenResponse({ description: 'Factura de otro cliente' })
  async getOne(@CurrentSupabaseUser() jwt: SupabaseJwtPayload, @Param('id', ParseIntPipe) id: number) {
    const idUsuario = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.getFacturaById.execute(id, idUsuario);
  }

  @Post(':id/pagar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar prepago de factura',
    description:
      'Registra el **pago total** de una factura en estado **Creada** (pedido aún no finalizado). ' +
      'Actualiza `monto_cobrado`, `pagado_al_crear`, `fecha_pago` y el pedido vinculado (`pagado_por_remitente`, `valor_recaudado`). ' +
      'La factura pasa a estado final (**Pagada** / **Por cobrar**) cuando el pedido se cierra (entregado, cancelado, no entregado). ' +
      'El cobro contra entrega sigue siendo por **POST /repartidor/pedidos/{id}/confirmar-entrega**.',
  })
  @ApiParam({ name: 'id', type: 'integer', example: 1, description: '`factura.id_factura`' })
  @ApiBody({ type: PagarFacturaBodyDto, examples: { transferencia: { value: EJEMPLO_PAGAR_FACTURA_BODY } } })
  @ApiOkResponse({ type: FacturaListadoSchema, description: 'Factura con pago registrado (sigue en estado Creada hasta cierre del pedido)' })
  @ApiBadRequestResponse({ description: 'Factura cerrada, ya pagada o pedido finalizado' })
  @ApiNotFoundResponse({ description: 'Factura no encontrada' })
  @ApiForbiddenResponse({ description: 'Factura de otro cliente' })
  async pagar(
    @CurrentSupabaseUser() jwt: SupabaseJwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PagarFacturaBodyDto,
  ) {
    const idUsuario = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.pagarFactura.execute(id, idUsuario, body);
  }
}
