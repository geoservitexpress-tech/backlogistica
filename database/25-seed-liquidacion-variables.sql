-- Parámetros de liquidación y dispersión diaria.
-- Ejecutar después de 24-liquidacion-cliente.sql.

INSERT INTO public.variable (clave, valor, tipo, descripcion) VALUES
  (
    'FINANZAS_LIQUIDACION_FRECUENCIA_DEFAULT_DIAS',
    '15',
    'integer',
    'Días entre liquidaciones de recaudo al cliente/proveedor si no tiene config propia en cliente_liquidacion_config.'
  )
ON CONFLICT (clave) DO UPDATE SET
  valor = EXCLUDED.valor,
  tipo = EXCLUDED.tipo,
  descripcion = EXCLUDED.descripcion,
  actualizado_en = now();
