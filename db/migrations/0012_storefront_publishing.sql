-- =============================================================================
-- 0012: Storefront publishing
--
-- Until now every edit was live the moment it was saved: there was no way to
-- finish a page, look at it, and then put it in front of clients. This adds the
-- missing half of the storefront — what is *published*, as opposed to what is
-- being edited.
--
-- The draft stays where it already lives (`storefront_sections` + the brand
-- fields inside `businesses.settings`), so the editor keeps working against the
-- rows it understands. Publishing writes one immutable snapshot row and moves a
-- single pointer; the public page reads that snapshot and nothing else. A
-- half-finished edit therefore cannot appear on a live page, and rolling back is
-- "copy snapshot N into the draft, publish it as N+1" rather than mutating
-- history.
--
-- No second source of truth: the snapshot is derived from the draft at publish
-- time, and `storefronts.published_version_id` is the only thing the public read
-- path trusts.
--
-- Written by hand, not generated: `drizzle-kit generate` re-emits the 0005/0009
-- objects because their snapshots are missing from `meta/`. Idempotent: safe to
-- re-run.
-- =============================================================================

create table if not exists public.storefronts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organisations(id) on delete cascade,
  status text not null default 'draft',
  -- Set after the version tables exist, so the two do not have to be created in
  -- a circular order.
  published_version_id uuid,
  published_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint storefronts_status_check check (status in ('draft', 'published', 'suspended'))
);

create table if not exists public.storefront_versions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  storefront_id uuid not null references public.storefronts(id) on delete cascade,
  version integer not null,
  schema_version integer not null default 1,
  snapshot jsonb not null,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  constraint storefront_versions_unique_idx unique (storefront_id, version)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'storefronts_published_version_fk'
  ) then
    alter table public.storefronts
      add constraint storefronts_published_version_fk
      foreign key (published_version_id)
      references public.storefront_versions(id)
      on delete set null;
  end if;
end $$;

-- The public read path is `slug → organisations → storefronts → version`.
create index if not exists storefront_versions_org_created_idx
  on public.storefront_versions (org_id, created_at desc);

alter table public.storefronts enable row level security;
alter table public.storefront_versions enable row level security;

-- Members read; owners and managers write. Repeated from db/policies.sql so a
-- database built from migrations alone is correct before that script runs.
drop policy if exists storefronts_select on public.storefronts;
create policy storefronts_select on public.storefronts
  for select using (public.is_org_member(org_id));

drop policy if exists storefronts_write on public.storefronts;
create policy storefronts_write on public.storefronts
  for all
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));

drop policy if exists storefront_versions_select on public.storefront_versions;
create policy storefront_versions_select on public.storefront_versions
  for select using (public.is_org_member(org_id));

drop policy if exists storefront_versions_write on public.storefront_versions;
create policy storefront_versions_write on public.storefront_versions
  for all
  using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));
