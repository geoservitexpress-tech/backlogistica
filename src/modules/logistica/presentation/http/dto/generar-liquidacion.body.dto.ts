import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class GenerarLiquidacionBodyDto {
  @ApiProperty({
    type: 'integer',
    description: 'Cliente/proveedor (`usuarios.id_usuario` solicitante del pedido).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idUsuarioCliente!: number;

  @ApiPropertyOptional({
    type: 'integer',
    nullable: true,
    description: 'Medio de devolución; si omites, usa la config del cliente.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  idMetodoDevolucion?: number | null;

  @ApiPropertyOptional({
    description: 'Referencia del pago/transferencia al proveedor.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  referenciaPago?: string;
}
