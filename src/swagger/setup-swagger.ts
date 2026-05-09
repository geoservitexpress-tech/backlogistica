import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Backlogistica API')
    .setDescription(
      'API REST de logística (NestJS, arquitectura hexagonal). ' +
        'Los pedidos devuelven nombres de tablas relacionadas como texto. ' +
        'La documentación interactiva está en `/docs`.',
    )
    .setVersion('1.0')
    .addTag('Raíz', 'Página de bienvenida HTML')
    .addTag('Salud', 'Estado del servicio')
    .addTag('Pedidos', 'Consulta de pedidos')
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
