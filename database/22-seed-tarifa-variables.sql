-- Tarifas de envío (Bogotá vs fuera de Bogotá, Express, recargos por peso/dimensiones).
-- Ejecutar después de 21-seed-paquete-variables.sql.

DELETE FROM public.variable
WHERE clave IN (
  'TARIFA_SOACHA_COP',
  'TARIFA_CIUDADES_COBERTURA_IDS',
  'TARIFA_RECARGO_FUERA_COBERTURA_MISMO_DIA_COP'
);

INSERT INTO public.variable (clave, valor, tipo, descripcion) VALUES
  (
    'TARIFA_BOGOTA_COP',
    '12000',
    'integer',
    'Tarifa estándar Normal en Bogotá D.C. (`id_ciudad` 149), hasta TARIFA_PESO_BASE_KG.'
  ),
  (
    'TARIFA_FUERA_BOGOTA_COP',
    '15000',
    'integer',
    'Tarifa estándar Normal fuera de Bogotá D.C. (Soacha, Cundinamarca, etc.), hasta TARIFA_PESO_BASE_KG.'
  ),
  (
    'TARIFA_EXPRESS_MIN_COP',
    '15000',
    'integer',
    'Piso tarifa Express (tipo pedido 2).'
  ),
  (
    'TARIFA_EXPRESS_MAX_COP',
    '20000',
    'integer',
    'Tope tarifa Express (tipo pedido 2).'
  ),
  (
    'TARIFA_PESO_BASE_KG',
    '10',
    'integer',
    'Peso incluido en tarifa base (kg); recargo por kg adicional.'
  ),
  (
    'TARIFA_RECARGO_POR_KG_COP',
    '1500',
    'integer',
    'Recargo COP por cada kg (o fracción) sobre TARIFA_PESO_BASE_KG.'
  ),
  (
    'TARIFA_SUMA_LADOS_BASE_CM',
    '120',
    'integer',
    'Suma alto+ancho+largo incluida en tarifa base (cm).'
  ),
  (
    'TARIFA_RECARGO_POR_CM_SUMA_COP',
    '200',
    'integer',
    'Recargo COP por cm de suma de lados sobre TARIFA_SUMA_LADOS_BASE_CM.'
  )
ON CONFLICT (clave) DO UPDATE SET
  valor = EXCLUDED.valor,
  tipo = EXCLUDED.tipo,
  descripcion = EXCLUDED.descripcion,
  actualizado_en = now();
