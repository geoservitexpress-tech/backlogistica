import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ActualizarClienteLiquidacionBodyDto {
  @ApiPropertyOptional({
    type: 'integer',
    example: 15,
    description: 'Cada cuántos días liquidar recaudos (1–90).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  frecuenciaDias?: number;

  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    description: 'Medio de devolución al proveedor (`metodo_pago.id_metodo_pago`).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMetodoDevolucion?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Cuenta, referencia o notas para la devolución (transferencia, etc.).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  referenciaDevolucion?: string | null;
}
