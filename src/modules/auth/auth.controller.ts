import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentSupabaseUser } from './decorators/current-supabase-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SupabaseJwtGuard } from './guards/supabase-jwt.guard';
import type { SupabaseJwtPayload } from './guards/supabase-jwt.guard';
import { AuthService } from './auth.service';
import { EJEMPLO_REGISTER_CLIENTE_CEDULA } from '../../swagger/ejemplos/register.ejemplos';
import { SWAGGER_EJEMPLO_CORREO } from '../../swagger/swagger-ejemplos';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registro',
    description:
      'Crea usuario en **Supabase Auth** (`auth.users`) y filas en **`usuarios`** + **`usuario_rol`**. ' +
      '`id_usuario` en Postgres coincide con el UUID de Supabase (`sub` del JWT). ' +
      '**`idRol`** y **`fkTipoDocumento`** son enteros del catálogo (`GET /catalogo/roles`, `GET /catalogo/tipos-documento`).',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      clienteCedula: {
        summary: 'Cliente con cédula de ciudadanía',
        description: 'idRol=1 (Cliente), fkTipoDocumento=1 (Cédula de ciudadanía).',
        value: EJEMPLO_REGISTER_CLIENTE_CEDULA,
      },
    },
  })
  register(@Body() body: RegisterDto) {
    this.logger.log(
      `POST /auth/register correo=${body.correo} idRol=${body.idRol} fkTipoDocumento=${body.fkTipoDocumento}`,
    );
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description:
      'Devuelve **access_token** y **refresh_token** de Supabase (JWT HS256). Use `Authorization: Bearer <access_token>` en rutas protegidas. ' +
      `Ejemplo precargado en Swagger: **${SWAGGER_EJEMPLO_CORREO}** (usuario de prueba).`,
  })
  @ApiBody({ type: LoginDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales incorrectas' })
  login(@Body() body: LoginDto) {
    this.logger.log(`POST /auth/login correo=${body.correo}`);
    return this.auth.login(body);
  }

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  @ApiBearerAuth('supabase-jwt')
  @ApiOperation({
    summary: 'Perfil del usuario autenticado',
    description: 'Lee `usuarios` + roles desde `usuario_rol` usando el `sub` del JWT.',
  })
  @ApiOkResponse({ description: 'Perfil y lista de nombres de rol' })
  @ApiUnauthorizedResponse()
  me(@CurrentSupabaseUser() jwt: SupabaseJwtPayload) {
    this.logger.log(`GET /auth/me sub=${jwt.sub}`);
    return this.auth.me(jwt.sub);
  }
}
