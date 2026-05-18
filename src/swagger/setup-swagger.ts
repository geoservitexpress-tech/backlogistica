import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_EJEMPLO_CORREO } from './swagger-ejemplos';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Backlogistica API')
    .setDescription(
      'API REST de logística (NestJS, arquitectura hexagonal). ' +
        'Pedidos: listado con filtros (`idPedido`, `fecha`, `idUsuario` entero), **GET /pedidos/{id}**, **GET /pedidos/guia/{numGuia}**, alta y PATCH. ' +
        'La dirección en respuestas usa nomenclatura colombiana (`zona` = número antes del `#`; placas en principal/secundario). ' +
        '**Repartidor** (JWT + rol REPARTIDOR): `GET /repartidor/pedidos` → `POST …/aceptar` (En Camino) → `POST …/confirmar-entrega` (formulario; Entregado si EXITO/NOVEDADES). ' +
        'Cobro y estado del paquete: body de confirmar-entrega; ver ejemplos en Swagger. ' +
        'Parámetros operativos (cron, estados, cupos): tabla `public.variable` — **GET /catalogo/variables**. ' +
        `\n\n**Probar:** **POST /auth/login** con \`${SWAGGER_EJEMPLO_CORREO}\` → **Authorize** → tag Repartidor.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access token devuelto por **POST /auth/login** o **POST /auth/register** (JWT de Supabase Auth). ' +
          'Se acepta firma **HS256** (`SUPABASE_JWT_SECRET`) o **JWKS** (`RS256`/`ES256`, misma `SUPABASE_URL`).',
      },
      'supabase-jwt',
    )
    .addTag('Salud', 'Estado del servicio')
    .addTag(
      'Auth',
      `Registro, login y JWT. Usuario de ejemplo en Try it out: ${SWAGGER_EJEMPLO_CORREO}`,
    )
    .addTag(
      'Pedidos',
      'Listar, consultar por **id** (`GET /pedidos/{id}` o `?idPedido=`), por guía, crear y actualizar',
    )
    .addTag(
      'Repartidor',
      'App del repartidor: mis pedidos · **aceptar** (Asignado→En Camino) · **confirmar-entrega** (cobro, foto, estado paquete, Entregado)',
    )
    .addTag('Catálogo', 'Catálogos de apoyo (países, estados, etc.)')
    .addTag('Ejemplos', 'CRUD de ejemplo (hexagonal)')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // Debe ser único por operación; si solo usamos methodKey, chocan p.ej. dos `list` y Swagger queda vacío.
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey.replace(/Controller$/i, '')}_${methodKey}`,
  });

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    customSiteTitle: 'Backlogistica API',
  });
}
