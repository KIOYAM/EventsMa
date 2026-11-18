-- =============================================================================
-- 0013: Storefront section content
--
-- Phase 2 adds sections whose content the owner writes in the builder rather
-- than in another record: FAQ questions with answers, and team names with roles.
--
-- Both are small, ordered, owner-authored lists that belong to one section. They
-- go in a jsonb column on the section row rather than in two new tables: this is
-- layout content, not a business record with its own lifecycle, and a table per
-- list would put the storefront's shape into the schema twice. The column is
-- validated and capped in `lib/domain/storefront.ts` on the way in and on every
-- read, then frozen into the published snapshot like any other edit.
--
-- Idempotent, like 0012. No new policy: 0011 already enables RLS on
-- `storefront_sections` and `db/policies.sql` owns the member/managers rules.
-- =============================================================================

alter table public.storefront_sections
  add column if not exists config jsonb not null default '{}'::jsonb;

comment on column public.storefront_sections.config is
  'Owner-authored section content: {"faq":[{id,question,answer}],"team":[{id,name,role}]}';
