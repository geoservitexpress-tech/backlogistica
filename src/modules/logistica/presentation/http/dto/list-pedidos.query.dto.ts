import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { ListPedidosFiltrosQueryDto } from './list-pedidos-filtros.query.dto';

export class ListPedidosQueryDto extends ListPedidosFiltrosQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    example: 2,
    description: 'Mensajero / repartidor asignado (`pedidos.fk_usuario_repartidor`).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMensajero?: number;
}
