-- Tarifa de envío fija al crear (no se mezcla con valor_recaudado / COD).
-- Ejecutar en BD existente.

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS tarifa_envio numeric(14, 4) NULL;

COMMENT ON COLUMN public.pedidos.tarifa_envio IS
  'Tarifa de domicilio al crear el pedido. Se cobra aunque la entrega no se complete.';

UPDATE public.pedidos
SET tarifa_envio = precio
WHERE tarifa_envio IS NULL;
