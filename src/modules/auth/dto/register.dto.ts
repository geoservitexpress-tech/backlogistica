import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsString, MaxLength, MinLength } from 'class-validator';
import { ROL_ID_CLIENTE, TIPO_DOCUMENTO_ID_REGISTRO } from '../auth.constants';
import { SWAGGER_EJEMPLO_CORREO, SWAGGER_EJEMPLO_PASSWORD } from '../../../swagger/swagger-ejemplos';

export class RegisterDto {
  @ApiProperty({
    example: SWAGGER_EJEMPLO_CORREO,
    description: 'Usuario de prueba en Swagger; si ya existe en Auth, use solo **POST /auth/login**.',
  })
  @IsEmail()
  @MaxLength(254)
  correo!: string;

  @ApiProperty({ example: SWAGGER_EJEMPLO_PASSWORD, minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombres!: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  apellidos!: string;

  @ApiProperty({
    type: 'integer',
    description:
      '`tipo_documento.id_tipo_documento` — **1** = Cédula de ciudadanía. Ver **GET /catalogo/tipos-documento**.',
    example: TIPO_DOCUMENTO_ID_REGISTRO,
  })
  @IsInt()
  fkTipoDocumento!: number;

  @ApiProperty({ example: '1020304050' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  documento!: string;

  @ApiProperty({ example: '3001234567' })
  @IsString()
  @MinLength(7)
  @MaxLength(32)
  telefono!: string;

  @ApiProperty({
    type: 'integer',
    description: '`rol.id_rol` — **1** = Cliente. Ver **GET /catalogo/roles**.',
    example: ROL_ID_CLIENTE,
  })
  @IsInt()
  idRol!: number;
}
