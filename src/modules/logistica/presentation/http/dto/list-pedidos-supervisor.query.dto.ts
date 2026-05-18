import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';
import { hoyYmdBogota } from '../../../application/asignacion-fecha-bogota';

/** Query de `GET /supervisor/pedidos/en-reparto`. */
export class ListPedidosSupervisorQueryDto {
  @ApiPropertyOptional({
    example: hoyYmdBogota(),
    description:
      'Día de entrega programado (`pedidos.fecha_entrega`, `YYYY-MM-DD`). Por defecto: **hoy** (America/Bogota).',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe ser YYYY-MM-DD' })
  fecha?: string;

  @ApiPropertyOptional({
    type: 'integer',
    description: 'Filtra por `fk_usuario_repartidor` (`usuarios.id_usuario`).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idRepartidor?: number;
}
