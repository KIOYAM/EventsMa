-- =============================================================================
-- 0011: Storefront section layout
--
-- The public page is no longer a fixed template. Each tenant stores one row per
-- section it has customised: its position, whether it is shown, an optional
-- heading override, and at most one image (the hero photograph).
--
-- A key with no row falls back to the canonical order and wording in
-- `lib/domain/storefront.ts`, so switching this on cannot blank a live storefront.
--
-- Written by hand rather than generated: `drizzle-kit generate` re-emits the
-- 0005/0009 objects because their snapshots are missing from `meta/`, and every
-- one of those statements would fail against a real database.
--
-- Idempotent: safe to re-run.
-- =============================================================================

create table if not exists public.storefront_sections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  key text not null,
  position integer not null default 0,
  visible boolean not null default true,
  heading text,
  image_path text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists storefront_sections_org_key_idx
  on public.storefront_sections (org_id, key);

alter table public.storefront_sections enable row level security;

-- Members read; owners and managers write. Mirrors db/policies.sql, repeated here
-- so a database built from migrations alone is correct before that script runs.
drop policy if exists storefront_sections_select on public.storefront_sections;
create policy storefront_sections_select on public.storefront_sections
  for select using (public.is_org_member(org_id));

drop policy if exists storefront_sections_write on public.storefront_sections;
create policy storefront_sections_write on public.storefront_sections
  for all
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));
