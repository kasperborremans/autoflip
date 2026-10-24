-- Autoflip database. Plak dit in Supabase → SQL Editor → Run.

-- Wie mag de app gebruiken. Voeg hier jullie e-mailadressen toe (zie onderaan).
create table if not exists public.leden (
  email text primary key
);
alter table public.leden enable row level security;

create or replace function public.is_lid() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.leden where lower(email) = lower(auth.jwt() ->> 'email'))
$$;

create table if not exists public.autos (
  id uuid primary key,
  merk text not null,
  model text not null,
  bouwjaar int,
  kilometerstand int,
  kenteken text,
  status text not null check (status in ('gekocht', 'in-reparatie', 'te-koop', 'verkocht')),
  aankoopprijs numeric not null default 0,
  aankoopdatum date not null,
  kosten jsonb not null default '[]',
  vraagprijs numeric,
  verkoopprijs numeric,
  verkoopdatum date,
  notities text not null default '',
  fotos text[] not null default '{}',
  bijgewerkt_op timestamptz not null default now()
);
alter table public.autos enable row level security;

-- Nieuwe Supabase-projecten geven ingelogde gebruikers niet meer automatisch toegang tot
-- nieuwe tabellen; welke rijen ze zien bepaalt de policy hieronder.
grant select, insert, update, delete on public.autos to authenticated;
grant execute on function public.is_lid() to authenticated;

drop policy if exists "leden beheren autos" on public.autos;
create policy "leden beheren autos" on public.autos
  for all to authenticated using (public.is_lid()) with check (public.is_lid());

-- Live bijwerken wanneer de ander iets wijzigt.
do $$ begin
  alter publication supabase_realtime add table public.autos;
exception when duplicate_object then null;
end $$;

-- Privé opslag voor foto's.
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

drop policy if exists "leden beheren fotos" on storage.objects;
create policy "leden beheren fotos" on storage.objects
  for all to authenticated
  using (bucket_id = 'fotos' and public.is_lid())
  with check (bucket_id = 'fotos' and public.is_lid());

-- Vervang door jullie eigen e-mailadressen:
-- insert into public.leden (email) values ('jij@voorbeeld.nl'), ('lenno@voorbeeld.nl');

-- ---------------------------------------------------------------------------
-- Update 2: winstverdeling en auto's "op het oog". Veilig om opnieuw uit te voeren.
alter table public.autos drop constraint if exists autos_status_check;
alter table public.autos add constraint autos_status_check
  check (status in ('interessant', 'gekocht', 'in-reparatie', 'te-koop', 'verkocht'));
alter table public.autos
  add column if not exists betaald_door text check (betaald_door in ('kasper', 'lenno', 'samen')),
  add column if not exists ontvangen_door text check (ontvangen_door in ('kasper', 'lenno', 'samen')),
  add column if not exists verrekend boolean not null default false,
  add column if not exists link text;
