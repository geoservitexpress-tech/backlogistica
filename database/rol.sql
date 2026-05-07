-- Si aún no tienes tabla de roles en Supabase (nombre supuesto: public.rol)
create table if not exists public.rol (
  id_rol serial primary key,
  nombre varchar(160) not null
);
