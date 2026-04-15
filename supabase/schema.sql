-- ============================================================
-- Encuesta Jobs to be Done - Schema Supabase
-- Ejecutar en SQL editor de Supabase (una sola vez)
-- ============================================================

create extension if not exists "pgcrypto";

-- Colegios encuestados
create table if not exists public.colegios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Respuestas de la encuesta
create table if not exists public.respuestas (
  id uuid primary key default gen_random_uuid(),
  colegio_id uuid not null references public.colegios(id) on delete cascade,
  nombre text,
  email text,
  job_asignado smallint check (job_asignado in (1,2,3)),
  scores jsonb not null default '{}'::jsonb, -- {job1: n, job2: n, job3: n}
  posicionamiento jsonb not null default '{}'::jsonb,
  filtro jsonb not null default '{}'::jsonb,
  job_especifico jsonb not null default '{}'::jsonb,
  precio jsonb not null default '{}'::jsonb,
  completada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists respuestas_colegio_idx on public.respuestas(colegio_id);
create index if not exists respuestas_job_idx on public.respuestas(job_asignado);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.colegios enable row level security;
alter table public.respuestas enable row level security;

-- Lectura pública de colegios activos (para resolver slug -> id en encuesta)
drop policy if exists "colegios_public_read" on public.colegios;
create policy "colegios_public_read" on public.colegios
  for select using (activo = true);

-- Admin (autenticados) pueden todo en colegios
drop policy if exists "colegios_admin_all" on public.colegios;
create policy "colegios_admin_all" on public.colegios
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Cualquiera puede insertar respuestas (la encuesta es pública)
drop policy if exists "respuestas_public_insert" on public.respuestas;
create policy "respuestas_public_insert" on public.respuestas
  for insert with check (true);

-- Cualquiera puede actualizar SU propia respuesta mientras la completa (por id)
-- Para simplificar, permitimos update público; en producción usar token firmado.
drop policy if exists "respuestas_public_update" on public.respuestas;
create policy "respuestas_public_update" on public.respuestas
  for update using (true) with check (true);

-- Solo admins autenticados pueden leer respuestas
drop policy if exists "respuestas_admin_read" on public.respuestas;
create policy "respuestas_admin_read" on public.respuestas
  for select using (auth.role() = 'authenticated');
