-- Paso 1: vaciar el esquema de negocio (ejecutar en Supabase SQL Editor).
-- ⚠️ Borra TODOS los datos de estas tablas. auth.users en Supabase NO se toca.
-- Paso 2: ejecutar 01-schema-numeric-ids.sql
-- Paso 3: semillas en orden (ver run-all-seeds.sql): 02 … 15
-- Usuarios: recrearlos con POST /auth/register (id_usuario entero, auth_user_id uuid).

-- Opción A: TRUNCATE (más rápido si las tablas ya existen con la estructura vieja)
-- TRUNCATE TABLE
--   public.descripcion_seguimiento,
--   public.seguimiento,
--   public.pedidos,
--   public.direccion,
--   public.usuario_rol,
--   public.usuarios,
--   public.destinatario,
--   public.paquete,
--   public.metodo_pago,
--   public.resultado_entrega,
--   public.estado_pedido,
--   public.tipo_pedido,
--   public.metodo_recepcion,
--   public.ciudad,
--   public.departamento,
--   public.pais,
--   public.tipo_via,
--   public.zona_bogota,
--   public.tipo_documento,
--   public.rol
-- RESTART IDENTITY CASCADE;

-- Opción B: DROP (recomendado antes de recrear con IDs numéricos)
DROP TABLE IF EXISTS public.descripcion_seguimiento CASCADE;
DROP TABLE IF EXISTS public.seguimiento CASCADE;
DROP TABLE IF EXISTS public.factura CASCADE;
DROP TABLE IF EXISTS public.pedidos CASCADE;
DROP TABLE IF EXISTS public.direccion CASCADE;
DROP TABLE IF EXISTS public.usuario_rol CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.destinatario CASCADE;
DROP TABLE IF EXISTS public.paquete CASCADE;
DROP TABLE IF EXISTS public.metodo_pago CASCADE;
DROP TABLE IF EXISTS public.resultado_entrega CASCADE;
DROP TABLE IF EXISTS public.estado_pedido CASCADE;
DROP TABLE IF EXISTS public.tipo_pedido CASCADE;
DROP TABLE IF EXISTS public.metodo_recepcion CASCADE;
DROP TABLE IF EXISTS public.ciudad CASCADE;
DROP TABLE IF EXISTS public.departamento CASCADE;
DROP TABLE IF EXISTS public.pais CASCADE;
DROP TABLE IF EXISTS public.tipo_via CASCADE;
DROP TABLE IF EXISTS public.zona_bogota CASCADE;
DROP TABLE IF EXISTS public.tipo_documento CASCADE;
DROP TABLE IF EXISTS public.variable CASCADE;
DROP TABLE IF EXISTS public.rol CASCADE;

-- Tablas auxiliares de migraciones anteriores (si existían)
DROP TABLE IF EXISTS public._migration_legacy_id CASCADE;
DROP TABLE IF EXISTS public._ciudad_backup_recreate CASCADE;
DROP TABLE IF EXISTS public._direccion_ciudad_codigo CASCADE;
