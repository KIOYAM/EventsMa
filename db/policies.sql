-- ---------------------------------------------------------------------------
-- EventsMa — Row Level Security.
-- Apply after `drizzle-kit generate && drizzle-kit migrate`.
--
-- The database is the authority. A route guard and a server action may both
-- check, but a policy that is missing here is a data breach, not a UI bug.
-- ---------------------------------------------------------------------------

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_org_role(target_org uuid, allowed text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role::text = any (allowed)
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid, text[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid, text[]) to authenticated;

-- organisations -------------------------------------------------------------
alter table public.organisations enable row level security;

drop policy if exists organisations_select on public.organisations;
create policy organisations_select on public.organisations
  for select using (public.is_org_member(id));

drop policy if exists organisations_update on public.organisations;
create policy organisations_update on public.organisations
  for update using (public.has_org_role(id, array['owner']))
  with check (public.has_org_role(id, array['owner']));

-- memberships ---------------------------------------------------------------
alter table public.memberships enable row level security;

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select using (public.is_org_member(org_id));

drop policy if exists memberships_write on public.memberships;
create policy memberships_write on public.memberships
  for all using (public.has_org_role(org_id, array['owner']))
  with check (public.has_org_role(org_id, array['owner']));

-- Shared policy shapes ------------------------------------------------------
-- `read_roles` is who may see commercial rows. Employees see operations
-- (events, tasks, availability) but never prices, margins or the client ledger.

do $$
declare
  target text;
  read_roles text := $r$array['owner','manager']$r$;
begin
  -- Operational tables: every active member may read.
  foreach target in array array[
    'businesses',
    'business_services',
    'events',
    'availability_blocks',
    'notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', target);
    execute format('drop policy if exists %I_select on public.%I', target, target);
    execute format(
      'create policy %I_select on public.%I for select using (public.is_org_member(org_id))',
      target, target
    );

    execute format('drop policy if exists %I_write on public.%I', target, target);
    execute format(
      'create policy %I_write on public.%I for all using (public.has_org_role(org_id, array[''owner'',''manager''])) with check (public.has_org_role(org_id, array[''owner'',''manager'']))',
      target, target
    );
  end loop;

  -- Commercial tables: owner and manager only, for every verb.
  foreach target in array array[
    'service_items',
    'service_packages',
    'clients',
    'enquiries',
    'quotations',
    'quotation_versions',
    'quotation_lines',
    'payments',
    'documents',
    'audit_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', target);
    execute format('drop policy if exists %I_select on public.%I', target, target);
    execute format(
      'create policy %I_select on public.%I for select using (public.has_org_role(org_id, %s))',
      target, target, read_roles
    );

    execute format('drop policy if exists %I_write on public.%I', target, target);
    execute format(
      'create policy %I_write on public.%I for all using (public.has_org_role(org_id, array[''owner'',''manager''])) with check (public.has_org_role(org_id, array[''owner'',''manager'']))',
      target, target
    );
  end loop;
end
$$;

-- usage_events --------------------------------------------------------------
-- Members may insert telemetry; only owners may read aggregates back.
alter table public.usage_events enable row level security;

drop policy if exists usage_events_insert on public.usage_events;
create policy usage_events_insert on public.usage_events
  for insert with check (public.is_org_member(org_id));

drop policy if exists usage_events_select on public.usage_events;
create policy usage_events_select on public.usage_events
  for select using (public.has_org_role(org_id, array['owner']));

-- ---------------------------------------------------------------------------
-- Two-tenant test (run against a dev database; must return zero rows).
-- Replace the two org ids, then assert every count is 0:
--
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<user-b-uuid>"}';
--   select count(*) from public.quotations where org_id = '<org-a-uuid>';  -- 0
--   select count(*) from public.service_items where org_id = '<org-a-uuid>'; -- 0
--   select count(*) from public.payments where org_id = '<org-a-uuid>';      -- 0
-- ---------------------------------------------------------------------------

-- menu_sections / menu_groups -------------------------------------------------
alter table public.menu_sections enable row level security;
drop policy if exists menu_sections_select on public.menu_sections;
create policy menu_sections_select on public.menu_sections
  for select using (public.is_org_member(org_id));
drop policy if exists menu_sections_write on public.menu_sections;
create policy menu_sections_write on public.menu_sections
  for all using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));

alter table public.menu_groups enable row level security;
drop policy if exists menu_groups_select on public.menu_groups;
create policy menu_groups_select on public.menu_groups
  for select using (public.is_org_member(org_id));
drop policy if exists menu_groups_write on public.menu_groups;
create policy menu_groups_write on public.menu_groups
  for all using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));

-- inventory -------------------------------------------------------------------
alter table public.inventory_items enable row level security;
drop policy if exists inventory_items_select on public.inventory_items;
create policy inventory_items_select on public.inventory_items
  for select using (public.is_org_member(org_id));
drop policy if exists inventory_items_write on public.inventory_items;
create policy inventory_items_write on public.inventory_items
  for all using (public.has_org_role(org_id, array['owner','manager']))
  with check (public.has_org_role(org_id, array['owner','manager']));

-- Movements are append-only: there is deliberately no update or delete policy.
alter table public.inventory_movements enable row level security;
drop policy if exists inventory_movements_select on public.inventory_movements;
create policy inventory_movements_select on public.inventory_movements
  for select using (public.is_org_member(org_id));
drop policy if exists inventory_movements_insert on public.inventory_movements;
create policy inventory_movements_insert on public.inventory_movements
  for insert with check (public.has_org_role(org_id, array['owner','manager']));

-- invitations are owner-only ------------------------------------------------
alter table public.invitations enable row level security;
drop policy if exists invitations_owner on public.invitations;
create policy invitations_owner on public.invitations
  for all using (public.has_org_role(org_id, array['owner']))
  with check (public.has_org_role(org_id, array['owner']));
