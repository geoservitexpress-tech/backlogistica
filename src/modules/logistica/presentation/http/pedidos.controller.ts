import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthService } from '../../../auth/auth.service';
import { CurrentSupabaseUser } from '../../../auth/decorators/current-supabase-user.decorator';
import { SupabaseJwtGuard } from '../../../auth/guards/supabase-jwt.guard';
import type { SupabaseJwtPayload } from '../../../auth/guards/supabase-jwt.guard';
import { CreatePedidoUseCase } from '../../application/create-pedido.use-case';
import { GetPedidoByIdUseCase } from '../../application/get-pedido-by-id.use-case';
import { GetPedidoByNumGuiaUseCase } from '../../application/get-pedido-by-num-guia.use-case';
import { ListPedidosUseCase } from '../../application/list-pedidos.use-case';
import { UpdatePedidoUseCase } from '../../application/update-pedido.use-case';
import { PedidoListadoPaginadoSchema, PedidoListadoSchema, PEDIDO_LISTADO_PAGINADO_EJEMPLO } from '../../../../swagger/schemas/pedido-listado.schema';
import {
  EJEMPLO_CREAR_PEDIDO_CON_FOTOS_PAQUETE,
  EJEMPLO_CREAR_PEDIDO_DESPACHO_BOGOTA,
  EJEMPLO_CREAR_PEDIDO_RECOGIDA,
  EJEMPLO_PATCH_PEDIDO_ESTADO,
  EJEMPLO_QUERY_LIST_PEDIDOS_FILTROS,
  EJEMPLO_QUERY_LIST_PEDIDOS_POR_FECHA,
} from '../../../../swagger/ejemplos/pedidos.ejemplos';
import { SWAGGER_EJEMPLO_ID_PEDIDO } from '../../../../swagger/swagger-ejemplos';
import { CreatePedidoBodyDto } from './dto/create-pedido.body.dto';
import { PedidoDestinoEntregaBodyDto } from './dto/pedido-destino-entrega.body.dto';
import { ListPedidosQueryDto } from './dto/list-pedidos.query.dto';
import { UpdatePedidoBodyDto } from './dto/update-pedido.body.dto';

@ApiTags('Pedidos')
@ApiExtraModels(CreatePedidoBodyDto, PedidoDestinoEntregaBodyDto, ListPedidosQueryDto)
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({
  description:
    'Falta `Authorization: Bearer <access_token>` o el JWT de Supabase es inválido/expirado. Obtenga token en POST /auth/login o POST /auth/register.',
})
@UseGuards(SupabaseJwtGuard)
@Controller('pedidos')
export class PedidosController {
  constructor(
    private readonly auth: AuthService,
    private readonly listPedidos: ListPedidosUseCase,
    private readonly createPedido: CreatePedidoUseCase,
    private readonly getPedidoById: GetPedidoByIdUseCase,
    private readonly getPedidoByNumGuia: GetPedidoByNumGuiaUseCase,
    private readonly updatePedido: UpdatePedidoUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar pedidos',
    description:
      'Devuelve pedidos con tipo, estado, método, usuarios, paquete y dirección en **texto legible** (nomenclatura urbana CO en `direccion`). ' +
      'Filtros de operaciones: **`fecha`** (creación), **`fechaEntrega`**, **`idProveedor`** (cliente solicitante), **`idMensajero`** (repartidor), **`direccion`** (texto en vía/ciudad). ' +
      'Paginación: `page` (default 1), `limit` (default 20); la respuesta incluye `total`, `totalPaginas` e `items`. ' +
      'Para consultar **un pedido por id** con respuesta 404 explícita, prefiera **GET /pedidos/{id}**.\n\n' +
      '**Ejemplos de query:**\n' +
      `- Por fecha: \`?fecha=${EJEMPLO_QUERY_LIST_PEDIDOS_POR_FECHA.fecha}&page=${EJEMPLO_QUERY_LIST_PEDIDOS_POR_FECHA.page}&limit=${EJEMPLO_QUERY_LIST_PEDIDOS_POR_FECHA.limit}\`\n` +
      `- Filtros combinados: \`?fecha=${EJEMPLO_QUERY_LIST_PEDIDOS_FILTROS.fecha}&fechaEntrega=${EJEMPLO_QUERY_LIST_PEDIDOS_FILTROS.fechaEntrega}&idProveedor=${EJEMPLO_QUERY_LIST_PEDIDOS_FILTROS.idProveedor}&idMensajero=${EJEMPLO_QUERY_LIST_PEDIDOS_FILTROS.idMensajero}&direccion=${EJEMPLO_QUERY_LIST_PEDIDOS_FILTROS.direccion}\``,
  })
  @ApiOkResponse({
    type: PedidoListadoPaginadoSchema,
    description: 'Listado paginado',
    schema: { example: PEDIDO_LISTADO_PAGINADO_EJEMPLO },
  })
  @ApiBadRequestResponse({ description: '`fecha` inválida o parámetros de query mal formados' })
  list(@Query() query: ListPedidosQueryDto) {
    return this.listPedidos.execute(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear pedido',
    description:
      'Crea un pedido con el cuerpo del formulario (destinatario, dirección, producto, manifiesto). ' +
      '**Solicitante:** JWT → `usuarios.id_usuario` (**entero**, ver **GET /auth/me**). Rol Cliente o Administrador. ' +
      '**Modalidad:** `idTipoPedido` (Normal / Express, `GET /catalogo/tipos-pedido`). **Fecha:** `fechaEntrega` (`YYYY-MM-DD` → `pedidos.fecha_entrega`). ' +
      '**Recepción:** `idMetodoRecepcion` — **2** = Entrega (un solo bloque de dirección); **1** = Recogida (raíz = punto de recogida + objeto **`destinoEntrega`** obligatorio para `fk_direccion_destino` / `fk_destinatario_destino`). Ver **GET /catalogo/metodos-recepcion**. ' +
      'El backend genera **`id_pedido`** (entero), **`num_guia`**, **`creado_en`**, asigna **`fk_estado_pedido`** según `public.variable` (`PEDIDO_ESTADO_INICIAL_ID`). ' +
      'Catálogos numéricos: `idTipoPedido`, `idMetodoRecepcion`, `idCiudad`, `idDepartamento`, `idPais` (ver **GET /catalogo/**). ' +
      '**Localidad Bogotá:** `idZonaBogota` solo si `idCiudad` = 149 (`GET /catalogo/zonas-bogota` → `direccion.fk_zona`). ' +
      'Dirección: **`nombreVia` → `direccion.zona`**, placas en `numeroPlaca` / `numeroSecundario`. ' +
      '**Manifiesto:** `observacionesManifiesto` se guarda en `descripcion_seguimiento.observaciones` (paso inicial en `seguimiento`). **Fotos:** URLs en `descripcion_seguimiento.foto_url` y bucket **`evidencias`** (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).',
  })
  @ApiBody({
    description:
      '**No incluye `idUsuario`:** el solicitante se toma del JWT (Authorize). ' +
      'Los IDs numéricos del ejemplo son catálogos (`idTipoPedido`, `idMetodoRecepcion`, `idPais`, etc.).',
    schema: {
      allOf: [{ $ref: getSchemaPath(CreatePedidoBodyDto) }],
      example: EJEMPLO_CREAR_PEDIDO_DESPACHO_BOGOTA,
    },
    examples: {
      despachoBogota: {
        summary: 'Entrega Normal en Bogotá (recomendado)',
        description:
          'idTipoPedido=1, idMetodoRecepcion=2, idPais=1, idDepartamento=3, idCiudad=149, idZonaBogota=1. Sin idUsuario en el body.',
        value: EJEMPLO_CREAR_PEDIDO_DESPACHO_BOGOTA,
      },
      conFotosPaquete: {
        summary: 'Alta con fotos del paquete (base64)',
        description:
          'Incluye `fotosPaqueteBase64` (data URL). El servidor sube a Supabase **`evidencias`** en `pedidos/{id}/`.',
        value: EJEMPLO_CREAR_PEDIDO_CON_FOTOS_PAQUETE,
      },
      recogidaConDestino: {
        summary: 'Recogida con destino de entrega',
        description:
          'idMetodoRecepcion=1. Campos raíz = punto de recogida; `destinoEntrega` = entrega final (se guarda en fk_direccion_destino / fk_destinatario_destino).',
        value: EJEMPLO_CREAR_PEDIDO_RECOGIDA,
      },
    },
  })
  @ApiCreatedResponse({
    type: PedidoListadoSchema,
    description: 'Pedido creado; `idPedido` es el entero asignado por el servidor',
  })
  @ApiBadRequestResponse({ description: 'FK inexistente u otro error de validación de datos' })
  async crear(
    @CurrentSupabaseUser() jwt: SupabaseJwtPayload,
    @Body() body: CreatePedidoBodyDto,
  ) {
    const idUsuario = await this.auth.idUsuarioFromAuthSub(jwt.sub);
    return this.createPedido.execute(body, idUsuario);
  }

  @Get('guia/:numGuia')
  @ApiOperation({
    summary: 'Buscar pedido por número de guía',
    description:
      '`num_guia` único (ej. `BL-20260509-19B426`). Si la guía contiene caracteres especiales, codifique la URL.',
  })
  @ApiParam({ name: 'numGuia', example: 'BL-20260509-19B426', description: 'Valor de `pedidos.num_guia`' })
  @ApiOkResponse({ type: PedidoListadoSchema })
  @ApiNotFoundResponse({ description: 'No existe pedido con esa guía' })
  getByGuia(@Param('numGuia') numGuia: string) {
    return this.getPedidoByNumGuia.execute(numGuia);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener pedido por id',
    description:
      'Devuelve **un** pedido por `pedidos.id_pedido` (entero). Misma forma que el listado (`PedidoListado`).',
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    example: SWAGGER_EJEMPLO_ID_PEDIDO,
    description: '`pedidos.id_pedido`',
  })
  @ApiOkResponse({ type: PedidoListadoSchema })
  @ApiBadRequestResponse({ description: 'El parámetro `id` no es un entero válido' })
  @ApiNotFoundResponse({ description: 'No existe pedido con ese `id_pedido`' })
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.getPedidoById.execute(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar pedido',
    description:
      'PATCH parcial: solo envíe campos a cambiar. Estado, método, tipo operación, montos, fecha entrega, frágil, destinatario, paquete. ' +
      'Para **cambiar dirección completa** envíe todos: `tipoViaNombre`, `nombreVia`, `numeroPlaca`, `numeroSecundario`, `idCiudad`, `idDepartamento`, `idPais`. ' +
      '`observacionesDireccion` puede ir sola. Manifiesto/fotos se sincronizan con Storage como en el alta.',
  })
  @ApiParam({ name: 'id', type: 'integer', example: SWAGGER_EJEMPLO_ID_PEDIDO, description: 'id_pedido' })
  @ApiBody({
    type: UpdatePedidoBodyDto,
    examples: {
      estadoAsignado: {
        summary: 'Pasar a Asignado + Entrega',
        value: EJEMPLO_PATCH_PEDIDO_ESTADO,
      },
    },
  })
  @ApiOkResponse({ type: PedidoListadoSchema })
  @ApiBadRequestResponse({ description: 'Body vacío o datos inválidos' })
  @ApiNotFoundResponse({ description: 'Pedido no encontrado' })
  patch(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePedidoBodyDto) {
    return this.updatePedido.execute(id, body);
  }
}
