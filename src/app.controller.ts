import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  /** Evita pantalla en blanco al abrir http://localhost:3000/ en el navegador (solo API). */
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  root(): string {
    const port = process.env.PORT ?? '3000';
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Backlogistica API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { font-size: 1.25rem; }
    ul { line-height: 1.8; }
    a { color: #2563eb; }
    code { background: #f4f4f5; padding: 0.15rem 0.35rem; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Backlogistica API</h1>
  <p>Esta app es una <strong>API REST</strong>, no una web con interfaz. Usa estas rutas:</p>
  <ul>
    <li><a href="/health"><code>/health</code></a> — estado (HTML en navegador; JSON con <code>Accept: application/json</code> o <code>curl</code>)</li>
    <li><a href="/pedidos"><code>/pedidos</code></a> — listado; filtro por día UTC: <code>?fecha=YYYY-MM-DD</code></li>
    <li><a href="/catalogo/paises"><code>/catalogo/paises</code></a></li>
    <li><a href="/catalogo/departamentos"><code>/catalogo/departamentos</code></a></li>
    <li><a href="/catalogo/ciudades"><code>/catalogo/ciudades</code></a></li>
    <li><a href="/catalogo/estados-pedido"><code>/catalogo/estados-pedido</code></a></li>
    <li><a href="/catalogo/roles"><code>/catalogo/roles</code></a></li>
    <li><a href="/catalogo/tipos-pedido"><code>/catalogo/tipos-pedido</code></a></li>
    <li><a href="/catalogo/metodos-recepcion"><code>/catalogo/metodos-recepcion</code></a></li>
    <li><a href="/catalogo/zonas-bogota"><code>/catalogo/zonas-bogota</code></a></li>
    <li><a href="/catalogo/tipos-documento"><code>/catalogo/tipos-documento</code></a></li>
    <li><a href="/catalogo/tipos-via"><code>/catalogo/tipos-via</code></a></li>
  </ul>
  <p>Servidor en puerto <code>${port}</code>.</p>
  <p>Documentación OpenAPI: <a href="/docs"><code>/docs</code></a> (también redirige <a href="/doc"><code>/doc</code></a>) · <a href="/docs/json"><code>/docs/json</code></a></p>
</body>
</html>`;
  }
}
