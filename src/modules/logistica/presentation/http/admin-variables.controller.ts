import {
  Body,
  Controller,
  Get,
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
  ActualizarVariableAdminUseCase,
  GetVariableAdminUseCase,
  ListVariablesAdminUseCase,
} from '../../application/variables-admin.use-cases';
import {
  VARIABLE_ADMIN_EJEMPLO,
  VariableAdminListadoPaginadoSchema,
  VariableAdminSchema,
  VARIABLE_ADMIN_LISTADO_PAGINADO_EJEMPLO,
} from '../../../../swagger/schemas/variable-admin.schema';
import { ActualizarVariableBodyDto } from './dto/actualizar-variable.body.dto';
import { ListVariablesAdminQueryDto } from './dto/list-variables-admin.query.dto';

@ApiTags('Admin — Variables')
@ApiBearerAuth('supabase-jwt')
@ApiUnauthorizedResponse({ description: 'JWT inválido o ausente' })
@ApiForbiddenResponse({ description: 'Solo rol ADMINISTRADOR' })
@UseGuards(SupabaseJwtGuard, AdministradorRoleGuard)
@Controller('admin/variables')
export class AdminVariablesController {
  constructor(
    private readonly listVariables: ListVariablesAdminUseCase,
    private readonly getVariable: GetVariableAdminUseCase,
    private readonly actualizarVariable: ActualizarVariableAdminUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar parámetros operativos',
    description:
      'Lista paginada de `public.variable` (cron, estados, límites de paquete, finanzas, etc.). ' +
      'Paginación: `page` (default 1), `limit` (default 20); respuesta con `total`, `totalPaginas` e `items`. ' +
      'Filtro opcional `search` en clave o descripción. ' +
      'Los cambios aplican en caliente tras **PATCH** (recarga caché del servidor).',
  })
  @ApiOkResponse({
    type: VariableAdminListadoPaginadoSchema,
    description: 'Listado paginado',
    schema: { example: VARIABLE_ADMIN_LISTADO_PAGINADO_EJEMPLO },
  })
  list(@Query() query: ListVariablesAdminQueryDto) {
    return this.listVariables.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un parámetro' })
  @ApiParam({ name: 'id', type: 'integer', description: '`variable.id_variable`' })
  @ApiOkResponse({
    type: VariableAdminSchema,
    schema: { example: VARIABLE_ADMIN_EJEMPLO },
  })
  @ApiNotFoundResponse({ description: 'Variable no encontrada' })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.getVariable.execute(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar valor de un parámetro',
    description:
      'Actualiza `valor` (y opcionalmente `descripcion`). El `tipo` y la `clave` no se modifican. ' +
      'Validación según tipo: boolean, integer, integer_list, json, text. ' +
      'Reglas extra: PAQUETE_PESO_MAX_KG (25–30), cupos de asignación (1–500), dimensiones paquete.',
  })
  @ApiParam({ name: 'id', type: 'integer', example: 1 })
  @ApiBody({
    type: ActualizarVariableBodyDto,
    examples: {
      pesoMaximo: {
        summary: 'Límite de peso paquete',
        value: { valor: '28', descripcion: 'Peso máximo 28 kg' },
      },
      cronExpress: {
        summary: 'Activar cron Express',
        value: { valor: 'true' },
      },
      hubsRepartidor: {
        summary: 'Hubs JSON',
        value: {
          valor: '[{"idUsuario":2,"lat":4.651,"lng":-74.062,"idCiudad":149}]',
        },
      },
    },
  })
  @ApiOkResponse({
    type: VariableAdminSchema,
    schema: { example: VARIABLE_ADMIN_EJEMPLO },
  })
  @ApiBadRequestResponse({ description: 'valor inválido para el tipo o regla de negocio' })
  @ApiNotFoundResponse({ description: 'Variable no encontrada' })
  patch(@Param('id', ParseIntPipe) id: number, @Body() body: ActualizarVariableBodyDto) {
    return this.actualizarVariable.execute(id, body);
  }
}
