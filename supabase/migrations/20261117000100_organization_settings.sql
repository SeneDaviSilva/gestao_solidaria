create table if not exists public.organization_settings (
  id integer primary key check (id = 1),
  org_name text not null default '',
  cnpj text not null default '',
  city text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.organization_settings enable row level security;

grant select, insert, update on public.organization_settings to authenticated;

drop policy if exists "Authenticated users can read organization settings"
  on public.organization_settings;
create policy "Authenticated users can read organization settings"
  on public.organization_settings
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert organization settings"
  on public.organization_settings;
create policy "Authenticated users can insert organization settings"
  on public.organization_settings
  for insert
  to authenticated
  with check (id = 1);

drop policy if exists "Authenticated users can update organization settings"
  on public.organization_settings;
create policy "Authenticated users can update organization settings"
  on public.organization_settings
  for update
  to authenticated
  using (id = 1)
  with check (id = 1);
