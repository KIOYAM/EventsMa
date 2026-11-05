-- 0003 — manual money integrity and search indexes
--
-- Rollback:
--   drop index if exists invoices_org_quotation_key;
--   drop index if exists clients_org_phone_key;
--   drop index if exists clients_org_name_trgm_idx;
--   drop index if exists clients_org_phone_trgm_idx;
--   drop index if exists events_org_title_trgm_idx;
--   drop index if exists enquiries_org_message_trgm_idx;
--   drop index if exists service_items_org_name_trgm_idx;
--   drop index if exists payments_org_received_idx;
--
-- The unique indexes are the database-level guard behind the application
-- checks. They are safe to apply after the pre-flight duplicate checks in
-- docs/14. Existing rows are not rewritten.

create unique index if not exists invoices_org_quotation_key
  on public.invoices (org_id, quotation_id)
  where quotation_id is not null;

create unique index if not exists clients_org_phone_key
  on public.clients (org_id, phone_normalized)
  where phone_normalized is not null;

-- Case-insensitive contains searches (`ILIKE '%term%'`) cannot use a btree.
create extension if not exists pg_trgm;

create index if not exists clients_org_name_trgm_idx
  on public.clients using gin (name gin_trgm_ops);
create index if not exists clients_org_phone_trgm_idx
  on public.clients using gin (phone gin_trgm_ops);
create index if not exists events_org_title_trgm_idx
  on public.events using gin (title gin_trgm_ops);
create index if not exists enquiries_org_message_trgm_idx
  on public.enquiries using gin (message gin_trgm_ops);
create index if not exists service_items_org_name_trgm_idx
  on public.service_items using gin (name gin_trgm_ops);

-- The finance ledger sorts by receipt date, not row creation date.
create index if not exists payments_org_received_idx
  on public.payments (org_id, received_at desc, status);
