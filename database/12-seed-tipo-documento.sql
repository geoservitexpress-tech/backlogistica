-- Tipos de documento para registro (`usuarios.fk_tipo_documento`).
-- Ejecutar después de 01-schema-numeric-ids.sql
-- En POST /auth/register use idTipoDocumento entero (ej. 1 = CC), no UUID.

INSERT INTO public.tipo_documento (nombre, abreviacion) VALUES
  ('Cédula de ciudadanía', 'CC'),
  ('NIT', 'NIT'),
  ('Pasaporte', 'PA'),
  ('Cédula de extranjería', 'CE'),
  ('Tarjeta de identidad', 'TI'),
  ('PEP', 'PEP'),
  ('PPT', 'PPT');

-- Total: 7
-- IDs si tabla vacía: 1=CC, 2=NIT, 3=PA, 4=CE, 5=TI, 6=PEP, 7=PPT
-- Verificar: SELECT id_tipo_documento, nombre, abreviacion FROM public.tipo_documento ORDER BY id_tipo_documento;
