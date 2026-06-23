-- Límites de paquete (peso y dimensiones). Ajustables en public.variable / GET /catalogo/variables.
-- Ejecutar después de 15-seed-variables.sql.

INSERT INTO public.variable (clave, valor, tipo, descripcion) VALUES
  (
    'PAQUETE_PESO_MAX_KG',
    '30',
    'integer',
    'Peso máximo por paquete en kg (rango permitido en código: 25–30). POST/PATCH /pedidos.'
  ),
  (
    'PAQUETE_ALTO_MAX_CM',
    '60',
    'integer',
    'Alto máximo del paquete en centímetros.'
  ),
  (
    'PAQUETE_ANCHO_MAX_CM',
    '60',
    'integer',
    'Ancho máximo del paquete en centímetros.'
  ),
  (
    'PAQUETE_LARGO_MAX_CM',
    '100',
    'integer',
    'Largo máximo del paquete en centímetros.'
  ),
  (
    'PAQUETE_SUMA_LADOS_MAX_CM',
    '200',
    'integer',
    'Suma máxima alto+ancho+largo en cm. Use 0 para desactivar esta validación.'
  ),
  (
    'PAQUETE_DIMENSIONES_OBLIGATORIAS',
    'false',
    'boolean',
    'Si true, POST /pedidos exige altoCm, anchoCm y largoCm.'
  )
ON CONFLICT (clave) DO UPDATE SET
  valor = EXCLUDED.valor,
  tipo = EXCLUDED.tipo,
  descripcion = EXCLUDED.descripcion,
  actualizado_en = now();
