-- Ejecutar en Supabase: SQL Editor → New query
create table if not exists public.examples (
  id uuid primary key,
  name varchar(200) not null,
  created_at timestamptz not null default now()
);

comment on table public.examples is 'Ejemplo hexagonal; sustituir por tablas de dominio reales.';
