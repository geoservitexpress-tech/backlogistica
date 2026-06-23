-- Dimensiones del paquete y campo reservado para políticas de seguro / responsabilidad.
-- Ejecutar en BD existente tras 01-schema (o incluido en instalaciones nuevas vía 01-schema).

ALTER TABLE public.paquete
  ADD COLUMN IF NOT EXISTS alto_cm double precision NULL,
  ADD COLUMN IF NOT EXISTS ancho_cm double precision NULL,
  ADD COLUMN IF NOT EXISTS largo_cm double precision NULL,
  ADD COLUMN IF NOT EXISTS fk_politica_responsabilidad integer NULL;

COMMENT ON COLUMN public.paquete.alto_cm IS 'Alto del paquete en centímetros.';
COMMENT ON COLUMN public.paquete.ancho_cm IS 'Ancho del paquete en centímetros.';
COMMENT ON COLUMN public.paquete.largo_cm IS 'Largo del paquete en centímetros.';
COMMENT ON COLUMN public.paquete.fk_politica_responsabilidad IS
  'Reservado: catálogo futuro de seguros o políticas de responsabilidad por pérdida o daño del paquete.';
