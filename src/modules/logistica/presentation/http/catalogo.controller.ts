import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCiudadesUseCase } from '../../application/list-ciudades.use-case';
import { ListDepartamentosUseCase } from '../../application/list-departamentos.use-case';
import { ListEstadosPedidoUseCase } from '../../application/list-estados-pedido.use-case';
import { ListMetodosRecepcionUseCase } from '../../application/list-metodos-recepcion.use-case';
import { ListPaisesUseCase } from '../../application/list-paises.use-case';
import { ListRolesUseCase } from '../../application/list-roles.use-case';
import { ListTiposDocumentoUseCase } from '../../application/list-tipos-documento.use-case';
import { ListTiposPedidoUseCase } from '../../application/list-tipos-pedido.use-case';
import { ListEstadosFacturaUseCase } from '../../application/list-estados-factura.use-case';
import { ListMetodosPagoUseCase } from '../../application/list-metodos-pago.use-case';
import { ListResultadosEntregaUseCase } from '../../application/list-resultados-entrega.use-case';
import { ListTiposViaUseCase } from '../../application/list-tipos-via.use-case';
import { ListZonasBogotaUseCase } from '../../application/list-zonas-bogota.use-case';
import { ListVariablesUseCase } from '../../application/list-variables.use-case';
import { CotizarTarifaUseCase } from '../../application/cotizar-tarifa.use-case';
import { CatalogoFilaSchema } from '../../../../swagger/schemas/catalogo-fila.schema';
import { ResultadoEntregaCatalogoSchema } from '../../../../swagger/schemas/resultado-entrega.schema';
import { VARIABLE_ADMIN_EJEMPLO, VariableAdminSchema } from '../../../../swagger/schemas/variable-admin.schema';
import {
  TARIFA_COTIZACION_EJEMPLO,
  TarifaEnvioCotizacionSchema,
} from '../../../../swagger/schemas/tarifa-envio.schema';
import { CotizarTarifaQueryDto } from './dto/cotizar-tarifa.query.dto';

@ApiTags('Catálogo')
@Controller('catalogo')
export class CatalogoController {
  constructor(
    private readonly listPaises: ListPaisesUseCase,
    private readonly listDepartamentos: ListDepartamentosUseCase,
    private readonly listCiudades: ListCiudadesUseCase,
    private readonly listEstadosPedido: ListEstadosPedidoUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly listTiposPedido: ListTiposPedidoUseCase,
    private readonly listMetodosRecepcion: ListMetodosRecepcionUseCase,
    private readonly listTiposDocumento: ListTiposDocumentoUseCase,
    private readonly listTiposVia: ListTiposViaUseCase,
    private readonly listZonasBogota: ListZonasBogotaUseCase,
    private readonly listResultadosEntrega: ListResultadosEntregaUseCase,
    private readonly listMetodosPago: ListMetodosPagoUseCase,
    private readonly listEstadosFactura: ListEstadosFacturaUseCase,
    private readonly listVariables: ListVariablesUseCase,
    private readonly cotizarTarifa: CotizarTarifaUseCase,
  ) {}

  @Get('tarifas/cotizar')
  @ApiOperation({
    summary: 'Cotizar tarifa de envío',
    description:
      'Calcula tarifa sugerida: Bogotá D.C. $12.000, fuera de Bogotá $15.000 (Normal); Express $15.000–$20.000; ' +
      'recargos por peso (>10 kg) y dimensiones. Parámetros en **GET /catalogo/variables** / **Admin — Variables**.',
  })
  @ApiOkResponse({
    type: TarifaEnvioCotizacionSchema,
    schema: { example: TARIFA_COTIZACION_EJEMPLO },
  })
  cotizarTarifaEnvio(@Query() query: CotizarTarifaQueryDto) {
    return this.cotizarTarifa.execute(query);
  }

  @Get('variables')
  @ApiOperation({
    summary: 'Parámetros operativos (tabla variable)',
    description:
      'Sustituyen la configuración de negocio que antes iba en `.env` (cron, estados, cupos, etc.). ' +
      'Solo lectura; para editar use **Admin — Variables** (`PATCH /admin/variables/{id}`).',
  })
  @ApiOkResponse({
    type: VariableAdminSchema,
    isArray: true,
    schema: { example: [VARIABLE_ADMIN_EJEMPLO] },
  })
  variables() {
    return this.listVariables.execute();
  }

  @Get('paises')
  @ApiOperation({ summary: 'Listar países' })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  paises() {
    return this.listPaises.execute();
  }

  @Get('departamentos')
  @ApiOperation({ summary: 'Listar departamentos' })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  departamentos() {
    return this.listDepartamentos.execute();
  }

  @Get('ciudades')
  @ApiOperation({ summary: 'Listar ciudades' })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  ciudades() {
    return this.listCiudades.execute();
  }

  @Get('estados-pedido')
  @ApiOperation({ summary: 'Listar estados de pedido' })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  estadosPedido() {
    return this.listEstadosPedido.execute();
  }

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles (tabla rol)' })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  roles() {
    return this.listRoles.execute();
  }

  @Get('tipos-pedido')
  @ApiOperation({ summary: 'Listar tipos de pedido' })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  tiposPedido() {
    return this.listTiposPedido.execute();
  }

  @Get('metodos-recepcion')
  @ApiOperation({
    summary: 'Métodos de recepción (alta de pedido)',
    description:
      'Valores para **`idMetodoRecepcion`** en **POST /pedidos** (ej. **1** = Recogida, **2** = Entrega). ' +
      'Se persiste en `pedidos.fk_metodo_recepcion`.',
  })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  metodosRecepcion() {
    return this.listMetodosRecepcion.execute();
  }

  @Get('tipos-documento')
  @ApiOperation({ summary: 'Listar tipos de documento' })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  tiposDocumento() {
    return this.listTiposDocumento.execute();
  }

  @Get('tipos-via')
  @ApiOperation({ summary: 'Listar tipos de vía' })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  tiposVia() {
    return this.listTiposVia.execute();
  }

  @Get('zonas-bogota')
  @ApiOperation({
    summary: 'Localidades de Bogotá D.C.',
    description:
      'Valores para **`idZonaBogota`** en **POST /pedidos** (y PATCH de dirección) cuando **`idCiudad` = 149** (Bogotá D.C.). ' +
      'Se persiste en `direccion.fk_zona`. Para otras ciudades **no** envíe este campo.',
  })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  zonasBogota() {
    return this.listZonasBogota.execute();
  }

  @Get('resultados-entrega')
  @ApiOperation({
    summary: 'Resultados de cierre de entrega (repartidor)',
    description:
      'Valores para `idResultadoEntrega` en **POST /repartidor/pedidos/{id}/confirmar-entrega**. ' +
      'Se persisten en `descripcion_seguimiento.fk_resultado_entrega`.',
  })
  @ApiOkResponse({ type: ResultadoEntregaCatalogoSchema, isArray: true })
  resultadosEntrega() {
    return this.listResultadosEntrega.execute();
  }

  @Get('estados-factura')
  @ApiOperation({
    summary: 'Estados de factura',
    description:
      'Valores para filtrar **GET /facturas** (`idEstadoFactura`). ' +
      '1=Creada, 2=Pagada, 3=Por cobrar, 4=Saldo a favor.',
  })
  @ApiOkResponse({ type: CatalogoFilaSchema, isArray: true })
  estadosFactura() {
    return this.listEstadosFactura.execute();
  }

  @Get('metodos-pago')
  @ApiOperation({
    summary: 'Métodos de pago',
    description:
      'Catálogo para **`idMetodoPago`** en prepago (**POST /pedidos**, **POST /facturas/{id}/pagar**) ' +
      'o cobro al entregar (**POST /repartidor/pedidos/{id}/confirmar-entrega**).',
  })
  @ApiOkResponse({ type: ResultadoEntregaCatalogoSchema, isArray: true })
  metodosPago() {
    return this.listMetodosPago.execute();
  }
}
