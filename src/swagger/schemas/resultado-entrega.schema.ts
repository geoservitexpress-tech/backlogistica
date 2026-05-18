import { ApiProperty } from '@nestjs/swagger';

export class ResultadoEntregaCatalogoSchema {
  @ApiProperty({ type: 'integer', example: 1, description: '`resultado_entrega.id_resultado_entrega`' })
  id!: number;

  @ApiProperty({ example: 'Entregado con éxito' })
  nombre!: string;

  @ApiProperty({ enum: ['EXITO', 'NOVEDADES', 'NO_ENTREGADO', 'RECHAZADO'] })
  codigo!: string;
}
