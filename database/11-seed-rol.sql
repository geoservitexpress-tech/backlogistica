-- Roles de usuario (`usuario_rol` → `rol`).
-- Ejecutar después de 01-schema-numeric-ids.sql
-- La tabla `rol` no tiene columna `codigo`; los códigos lógicos de la API son:
--   CLIENTE, REPARTIDOR, ADMINISTRADOR, SUPERVISOR (ver `logistica-rol.constants.ts`).
--
-- `usuario_rol.id_usuario` referencia `usuarios.id_usuario` (entero), no el UUID de Auth.
-- Tras POST /auth/register el primer usuario suele ser id_usuario = 1 (Cliente).
-- Asigne rol Repartidor (id_rol = 2) con: INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (2, 2);

INSERT INTO public.rol (nombre) VALUES
  ('Cliente'),
  ('Repartidor'),
  ('Administrador'),
  ('Supervisor');

-- Total: 4 roles
-- IDs si tabla vacía: 1=Cliente (CLIENTE), 2=Repartidor (REPARTIDOR), 3=Administrador (ADMINISTRADOR), 4=Supervisor (SUPERVISOR)
-- Verificar: SELECT id_rol, nombre FROM public.rol ORDER BY id_rol;
