import { ListPedidosFiltrosQueryDto } from './list-pedidos-filtros.query.dto';

/** Filtros de **GET /repartidor/pedidos** (el mensajero queda fijado por el JWT). */
export class ListPedidosRepartidorQueryDto extends ListPedidosFiltrosQueryDto {}
