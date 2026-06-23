import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  EJEMPLO_QUERY_LIST_PEDIDOS_FILTROS,
  EJEMPLO_QUERY_LIST_PEDIDOS_POR_FECHA,
  EJEMPLO_QUERY_LIST_PEDIDOS_REPARTIDOR_FILTROS,
} from './ejemplos/pedidos.ejemplos';
import { SWAGGER_EJEMPLO_CORREO } from './swagger-ejemplos';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Backlogistica API')
    .setDescription(
      'API REST de logística (NestJS, arquitectura hexagonal). ' +
        'Pedidos: listado con filtros (`fecha`, `fechaEntrega`, `idProveedor`, `idMensajero`, `direccion`, `idPedido`), **GET /pedidos/{id}**, **GET /pedidos/guia/{numGuia}**, alta y PATCH. ' +
        'La dirección en respuestas usa nomenclatura colombiana (`zona` = número antes del `#`; placas en principal/secundario). ' +
        'Límites de paquete configurables en `public.variable` (peso 25–30 kg, dimensiones máx.). ' +
        '**Repartidor**: `GET /repartidor/pedidos` → `POST …/recibir` (2→3) → `POST …/aceptar` (3→4) → `POST …/confirmar-entrega`. ' +
        '**Supervisor**: `GET /supervisor/pedidos/en-reparto` (hoy, estados 2–4) · `PATCH /supervisor/pedidos/{id}` (sin manifiesto/fotos). ' +
        'Cobro y estado del paquete: body de confirmar-entrega; ver ejemplos en Swagger. ' +
        'Parámetros operativos (cron, estados, cupos): **GET /catalogo/variables** (lectura) · **Admin — Variables** (edición). ' +
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
      'Listar, consultar por **id** (`GET /pedidos/{id}` o `?idPedido=`), por guía, crear y actualizar. Filtros de operaciones en **GET /pedidos**.',
    )
    .addTag(
      'Repartidor',
      'App repartidor: mis pedidos (filtros `fecha`, `fechaEntrega`, `idProveedor`, `direccion`) · recibir (2→3) · aceptar (3→4) · confirmar-entrega',
    )
    .addTag(
      'Supervisor',
      'Tablero del día: pedidos en reparto · editar pedido (sin observaciones ni imágenes)',
    )
    .addTag('Catálogo', 'Catálogos de apoyo (países, estados, etc.)')
    .addTag('Admin — Variables', 'Editar parámetros `public.variable` (solo ADMINISTRADOR)')
    .addTag('Admin — Usuarios', 'Usuarios y roles (solo ADMINISTRADOR)')
    .addTag('Ejemplos', 'CRUD de ejemplo (hexagonal)')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // Debe ser único por operación; si solo usamos methodKey, chocan p.ej. dos `list` y Swagger queda vacío.
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey.replace(/Controller$/i, '')}_${methodKey}`,
  });

  const schemas = document.components?.schemas;
  if (schemas?.ListPedidosQueryDto && typeof schemas.ListPedidosQueryDto === 'object') {
    (schemas.ListPedidosQueryDto as Record<string, unknown>).example = EJEMPLO_QUERY_LIST_PEDIDOS_FILTROS;
  }
  if (schemas?.ListPedidosFiltrosQueryDto && typeof schemas.ListPedidosFiltrosQueryDto === 'object') {
    (schemas.ListPedidosFiltrosQueryDto as Record<string, unknown>).example =
      EJEMPLO_QUERY_LIST_PEDIDOS_POR_FECHA;
  }
  if (schemas?.ListPedidosRepartidorQueryDto && typeof schemas.ListPedidosRepartidorQueryDto === 'object') {
    (schemas.ListPedidosRepartidorQueryDto as Record<string, unknown>).example =
      EJEMPLO_QUERY_LIST_PEDIDOS_REPARTIDOR_FILTROS;
  }

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    customSiteTitle: 'Backlogistica API',
  });
}
