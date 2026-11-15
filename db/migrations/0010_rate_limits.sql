-- Fixed-window counters for the unauthenticated endpoints.
--
-- The public share submit and the storefront enquiry form are the only writes a
-- stranger can make. They need a limit that holds across serverless instances,
-- and the database is the one piece of shared state this project already has —
-- no new service, no new dependency.
--
-- Not tenant data: no `org_id`, and the key already carries the bucket and the
-- caller, so RLS is enabled with no policies (deny-all). The service role writes
-- these rows through `consumeRateLimit`, and nothing in the app reads them back.
--
-- Rows are disposable: a key embeds its window index, so yesterday's counters are
-- garbage. `pruneRateLimits` removes them opportunistically.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null default 0
);

create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;
