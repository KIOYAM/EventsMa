-- Business content in more than one language.
--
-- The source row keeps the owner's original wording. A translation is a separate
-- row pointing at the same id, so a dish stays one dish with one price, one stock
-- count and one set of quote lines; only its name and description are per language.
--
-- Reads fall back field by field: a Tamil name with no Tamil description still
-- renders the English description rather than an empty line.
--
-- `locale` deliberately excludes 'en': English IS the source column, and allowing
-- an English translation row would create two places to edit the same text.

create table if not exists public.service_item_translations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  item_id uuid not null references public.service_items(id) on delete cascade,
  locale text not null check (locale in ('ta', 'te', 'kn', 'ml')),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_item_translations_item_locale_key unique (item_id, locale)
);

create index if not exists service_item_translations_org_locale_idx
  on public.service_item_translations (org_id, locale);

create table if not exists public.menu_category_translations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  locale text not null check (locale in ('ta', 'te', 'kn', 'ml')),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_category_translations_category_locale_key unique (category_id, locale)
);

create index if not exists menu_category_translations_org_locale_idx
  on public.menu_category_translations (org_id, locale);
