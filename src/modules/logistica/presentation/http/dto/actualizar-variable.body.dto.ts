import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ActualizarVariableBodyDto {
  @ApiProperty({
    description:
      'Nuevo valor según `tipo` de la variable (boolean, integer, integer_list, json o text). ' +
      'Ej.: `30` para PAQUETE_PESO_MAX_KG, `true` para CRON_ASIGNAR_REPARTIDORES_ENABLED.',
    example: '30',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  valor!: string;

  @ApiPropertyOptional({
    description: 'Descripción operativa mostrada en el panel admin (opcional).',
    example: 'Peso máximo por paquete en kg (25–30).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string | null;
}
