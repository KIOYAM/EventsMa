-- A quotation can remember the customer submission it came from.
--
-- Until now the review screen handed the owner an empty composer: the customer
-- had chosen dishes, sessions and quantities, and the owner re-typed all of it.
-- The link is one nullable column, so an ordinary quote is unaffected, and
-- `on delete set null` keeps history when a submission is removed.
--
-- Deliberately NOT a status column on share_submissions: "quoted" is derived from
-- whether a quote points back at the submission. A stored flag can drift out of
-- step with reality; a join cannot.

alter table public.quotations
  add column if not exists submission_id uuid
  references public.share_submissions(id) on delete set null;

create index if not exists quotations_org_submission_idx
  on public.quotations (org_id, submission_id);
