import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Allow,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { SWAGGER_EJEMPLO_CORREO, SWAGGER_EJEMPLO_PASSWORD } from '../../../swagger/swagger-ejemplos';

@ValidatorConstraint({ name: 'correoOEmail', async: false })
class CorreoOEmailConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const o = args.object as LoginDto;
    const raw = o.correo ?? o.email;
    return typeof raw === 'string' && raw.trim().length > 0;
  }

  defaultMessage() {
    return 'Debe enviar correo o email.';
  }
}

export class LoginDto {
  @ApiProperty({
    example: SWAGGER_EJEMPLO_CORREO,
    description: 'Correo registrado en Supabase Auth. También acepta el alias `email`.',
  })
  @Allow()
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  correo?: string;

  @ApiPropertyOptional({
    example: SWAGGER_EJEMPLO_CORREO,
    description: 'Alias de `correo` (mismo valor).',
  })
  @Allow()
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @Validate(CorreoOEmailConstraint)
  private readonly _correoOEmail = true;

  @ApiProperty({ example: SWAGGER_EJEMPLO_PASSWORD, minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  /** Correo normalizado para Supabase Auth (`correo` o `email`). */
  resolvedCorreo(): string {
    return (this.correo ?? this.email)!.trim().toLowerCase();
  }
}
