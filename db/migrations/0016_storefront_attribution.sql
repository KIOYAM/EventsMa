-- =============================================================================
-- 0016: Storefront attribution and a daily view rollup
--
-- Two questions the owner could not answer before: is anyone reading the public
-- page, and where do enquiries come from?
--
-- Views are a rollup, not a request log: one row per (org, day, source bucket),
-- incremented in place. No IP, cookie, user agent or full referrer is stored.
-- The bucket is only the page path, the referring host and three sanitised UTM
-- fields, so there is nothing here that leads back to a person. Seven-day sums
-- are a range scan on (org_id, day).
--
-- 0015 is left for the section-instance slice named in the gap register, so this
-- migration is 0016. Idempotent. `enquiries` already has RLS; the new table gets
-- a member read policy and deliberately no write policy because only the public
-- route's owner connection inserts into it.
-- =============================================================================

alter table public.enquiries
  add column if not exists landing_section text,
  add column if not exists referrer_host text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

comment on column public.enquiries.landing_section is
  'Storefront section the visitor acted in: hero, services, packages, enquiry, ...';
comment on column public.enquiries.referrer_host is
  'Host of the page that brought the visitor. Never the full URL.';

create table if not exists public.storefront_views (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  day date not null,
  bucket text not null,
  path text not null,
  referrer_host text not null default '',
  utm_source text not null default '',
  utm_medium text not null default '',
  utm_campaign text not null default '',
  views integer not null default 1 check (views > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.storefront_views is
  'Daily rollup of public storefront views. One counter per page and source; no visitor identifiers.';
comment on column public.storefront_views.bucket is
  'Sanitised path|referrer|utm_source|utm_medium|utm_campaign key for the unique upsert.';

create unique index if not exists storefront_views_day_bucket_key
  on public.storefront_views (org_id, day, bucket);

create index if not exists storefront_views_org_day_idx
  on public.storefront_views (org_id, day desc);

alter table public.storefront_views enable row level security;

drop policy if exists storefront_views_select on public.storefront_views;
create policy storefront_views_select on public.storefront_views
  for select using (public.is_org_member(org_id));
