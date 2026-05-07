import { Controller, Get } from '@nestjs/common';
import { ListCiudadesUseCase } from '../../application/list-ciudades.use-case';
import { ListDepartamentosUseCase } from '../../application/list-departamentos.use-case';
import { ListEstadosPedidoUseCase } from '../../application/list-estados-pedido.use-case';
import { ListPaisesUseCase } from '../../application/list-paises.use-case';
import { ListRolesUseCase } from '../../application/list-roles.use-case';

@Controller('catalogo')
export class CatalogoController {
  constructor(
    private readonly listPaises: ListPaisesUseCase,
    private readonly listDepartamentos: ListDepartamentosUseCase,
    private readonly listCiudades: ListCiudadesUseCase,
    private readonly listEstadosPedido: ListEstadosPedidoUseCase,
    private readonly listRoles: ListRolesUseCase,
  ) {}

  @Get('paises')
  paises() {
    return this.listPaises.execute();
  }

  @Get('departamentos')
  departamentos() {
    return this.listDepartamentos.execute();
  }

  @Get('ciudades')
  ciudades() {
    return this.listCiudades.execute();
  }

  @Get('estados-pedido')
  estadosPedido() {
    return this.listEstadosPedido.execute();
  }

  /** Roles del dominio (tabla `rol`). Si tu tabla tiene otro nombre, avisa y lo alineamos. */
  @Get('roles')
  roles() {
    return this.listRoles.execute();
  }
}
