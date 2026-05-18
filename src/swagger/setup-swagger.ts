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
        '**Repartidor**: `GET /repartidor/pedidos` → `POST …/recibir` (2→3) → `POST …/aceptar` (3→4) → `POST …/confirmar-entrega`. ' +
        '**Supervisor**: `GET /supervisor/pedidos/en-reparto` (hoy, estados 2–4) · `PATCH /supervisor/pedidos/{id}` (sin manifiesto/fotos). ' +
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
      'App repartidor: mis pedidos · recibir (2→3) · aceptar (3→4) · confirmar-entrega',
    )
    .addTag(
      'Supervisor',
      'Tablero del día: pedidos en reparto · editar pedido (sin observaciones ni imágenes)',
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
