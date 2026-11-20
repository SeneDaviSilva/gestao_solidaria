alter table public.beneficiaries
  add column if not exists deleted_at timestamptz;

alter table public.attendances
  add column if not exists deleted_at timestamptz;

alter table public.support_types
  add column if not exists deleted_at timestamptz;

create index if not exists beneficiaries_deleted_at_idx
  on public.beneficiaries (deleted_at);

create index if not exists attendances_deleted_at_idx
  on public.attendances (deleted_at);

create index if not exists support_types_deleted_at_idx
  on public.support_types (deleted_at);
