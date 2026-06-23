import { Injectable, NotFoundException } from '@nestjs/common';
import { VariablesService, type VariableListado } from '../../configuracion/variables.service';
import { buildPaginado, resolverPaginacion } from '../domain/paginacion';
import type { ActualizarVariableBodyDto } from '../presentation/http/dto/actualizar-variable.body.dto';
import type { ListVariablesAdminQueryDto } from '../presentation/http/dto/list-variables-admin.query.dto';

@Injectable()
export class ListVariablesAdminUseCase {
  constructor(private readonly variables: VariablesService) {}

  async execute(query?: ListVariablesAdminQueryDto) {
    const { page, limit } = resolverPaginacion(query);
    const { items, total } = await this.variables.listPage({
      page,
      limit,
      ...(query?.search?.trim() && { search: query.search.trim() }),
    });
    return buildPaginado(items, total, page, limit);
  }
}

@Injectable()
export class GetVariableAdminUseCase {
  constructor(private readonly variables: VariablesService) {}

  async execute(idVariable: number): Promise<VariableListado> {
    const row = await this.variables.findById(idVariable);
    if (!row) {
      throw new NotFoundException(`Variable ${idVariable} no encontrada.`);
    }
    return row;
  }
}

@Injectable()
export class ActualizarVariableAdminUseCase {
  constructor(private readonly variables: VariablesService) {}

  execute(idVariable: number, body: ActualizarVariableBodyDto): Promise<VariableListado> {
    return this.variables.updateById(idVariable, {
      valor: body.valor,
      ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
    });
  }
}
