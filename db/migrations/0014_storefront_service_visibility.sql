-- =============================================================================
-- 0014: Storefront visibility per service
--
-- Until now a service was on the public page the moment the workspace enabled it:
-- "this business offers catering" and "show catering on the website" were the same
-- boolean. The storefront spec treats them as different decisions — the workspace
-- decides what it sells, the owner decides what a visitor is shown.
--
-- Same row, second flag: no new table, because this is a property of the service
-- relationship the tenant already owns. `enabled` stays the entitlement check and
-- is still what the public read path intersects against, so a service the
-- workspace stops offering disappears even if the flag here is left on.
--
-- Idempotent. RLS on `business_services` is already owned by 0001/`db/policies.sql`.
-- =============================================================================

alter table public.business_services
  add column if not exists storefront_visible boolean not null default true;

comment on column public.business_services.storefront_visible is
  'Show this service on the public storefront (only meaningful while enabled is true).';
