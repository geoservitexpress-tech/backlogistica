-- Destino de entrega en pedidos de RECOGIDA (fk_metodo_recepcion = 1).
-- fk_direccion / fk_destinatario = punto de recogida.
-- fk_direccion_destino / fk_destinatario_destino = entrega final (solo recogida).
-- Pedidos de entrega normal: columnas NULL; sin cambio de comportamiento.
--
-- Ejecutar en Supabase SQL Editor o: psql "$DATABASE_URL" -f database/19-pedidos-destino-recogida.sql

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS fk_direccion_destino integer,
  ADD COLUMN IF NOT EXISTS fk_destinatario_destino integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_fk_direccion_destino_fkey'
  ) THEN
    ALTER TABLE public.pedidos
      ADD CONSTRAINT pedidos_fk_direccion_destino_fkey
      FOREIGN KEY (fk_direccion_destino) REFERENCES public.direccion (id_direccion);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_fk_destinatario_destino_fkey'
  ) THEN
    ALTER TABLE public.pedidos
      ADD CONSTRAINT pedidos_fk_destinatario_destino_fkey
      FOREIGN KEY (fk_destinatario_destino) REFERENCES public.destinatario (id_destinatario);
  END IF;
END $$;

COMMENT ON COLUMN public.pedidos.fk_direccion_destino IS
  'Dirección de entrega final. Solo pedidos Recogida (fk_metodo_recepcion=1); NULL en entrega directa.';

COMMENT ON COLUMN public.pedidos.fk_destinatario_destino IS
  'Destinatario de entrega final. Solo pedidos Recogida (fk_metodo_recepcion=1); NULL en entrega directa.';

-- Verificar:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'pedidos'
--   AND column_name IN ('fk_direccion_destino', 'fk_destinatario_destino')
-- ORDER BY column_name;
