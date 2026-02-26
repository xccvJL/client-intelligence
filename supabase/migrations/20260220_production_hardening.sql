-- Client Intelligence production hardening baseline
-- Phase 1/3 focused: dedupe constraints, query indexes, and RLS coverage.

begin;

-- =========================
-- Dedupe + query indexes
-- =========================

create unique index if not exists intelligence_source_source_id_uidx
  on public.intelligence (source, source_id);

create unique index if not exists processing_queue_source_source_id_uidx
  on public.processing_queue (source, source_id);

create unique index if not exists account_members_client_team_uidx
  on public.account_members (client_id, team_member_id);

create unique index if not exists client_source_overrides_client_source_uidx
  on public.client_source_overrides (client_id, knowledge_source_id);

create index if not exists account_members_team_member_idx
  on public.account_members (team_member_id);

create index if not exists intelligence_client_created_idx
  on public.intelligence (client_id, created_at desc);

create index if not exists tasks_client_status_idx
  on public.tasks (client_id, status);

create index if not exists deals_client_stage_idx
  on public.deals (client_id, stage);

-- Structured sync logs for better observability and run correlation.
alter table if exists public.sync_logs
  add column if not exists run_id text;

alter table if exists public.sync_logs
  add column if not exists metadata jsonb;

-- =========================
-- RLS helper
-- =========================

create or replace function public.current_team_member_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tm.id::text
  from public.team_members tm
  where tm.auth_user_id::text = auth.uid()::text
  limit 1;
$$;

-- =========================
-- Enable RLS
-- =========================

alter table if exists public.clients enable row level security;
alter table if exists public.deals enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.client_health enable row level security;
alter table if exists public.health_alerts enable row level security;
alter table if exists public.intelligence enable row level security;
alter table if exists public.account_members enable row level security;
alter table if exists public.client_source_overrides enable row level security;

-- =========================
-- Drop existing policies (idempotent)
-- =========================

drop policy if exists clients_select on public.clients;
drop policy if exists clients_insert on public.clients;
drop policy if exists clients_update on public.clients;
drop policy if exists clients_delete on public.clients;

drop policy if exists deals_select on public.deals;
drop policy if exists deals_insert on public.deals;
drop policy if exists deals_update on public.deals;
drop policy if exists deals_delete on public.deals;

drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_update on public.tasks;
drop policy if exists tasks_delete on public.tasks;

drop policy if exists intelligence_select on public.intelligence;
drop policy if exists intelligence_insert on public.intelligence;
drop policy if exists intelligence_update on public.intelligence;
drop policy if exists intelligence_delete on public.intelligence;

drop policy if exists health_select on public.client_health;
drop policy if exists health_insert on public.client_health;
drop policy if exists health_update on public.client_health;
drop policy if exists health_delete on public.client_health;

drop policy if exists alerts_select on public.health_alerts;
drop policy if exists alerts_insert on public.health_alerts;
drop policy if exists alerts_update on public.health_alerts;
drop policy if exists alerts_delete on public.health_alerts;

drop policy if exists account_members_select on public.account_members;
drop policy if exists account_members_insert on public.account_members;
drop policy if exists account_members_update on public.account_members;
drop policy if exists account_members_delete on public.account_members;

drop policy if exists source_overrides_select on public.client_source_overrides;
drop policy if exists source_overrides_insert on public.client_source_overrides;
drop policy if exists source_overrides_update on public.client_source_overrides;
drop policy if exists source_overrides_delete on public.client_source_overrides;

-- =========================
-- Account membership policies
-- =========================

create policy account_members_select on public.account_members
for select to authenticated
using (
  team_member_id::text = public.current_team_member_id()
  or exists (
    select 1
    from public.account_members am
    where am.client_id = account_members.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy account_members_insert on public.account_members
for insert to authenticated
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = account_members.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy account_members_update on public.account_members
for update to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = account_members.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
)
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = account_members.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy account_members_delete on public.account_members
for delete to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = account_members.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

-- =========================
-- Shared account access predicate
-- =========================

-- clients
create policy clients_select on public.clients
for select to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = clients.id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy clients_insert on public.clients
for insert to authenticated
with check (true);

create policy clients_update on public.clients
for update to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = clients.id
      and am.team_member_id::text = public.current_team_member_id()
  )
)
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = clients.id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy clients_delete on public.clients
for delete to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = clients.id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

-- deals
create policy deals_select on public.deals
for select to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = deals.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy deals_insert on public.deals
for insert to authenticated
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = deals.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy deals_update on public.deals
for update to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = deals.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
)
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = deals.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy deals_delete on public.deals
for delete to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = deals.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

-- tasks
create policy tasks_select on public.tasks
for select to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = tasks.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy tasks_insert on public.tasks
for insert to authenticated
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = tasks.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy tasks_update on public.tasks
for update to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = tasks.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
)
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = tasks.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy tasks_delete on public.tasks
for delete to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = tasks.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

-- intelligence
create policy intelligence_select on public.intelligence
for select to authenticated
using (
  client_id is null
  or exists (
    select 1
    from public.account_members am
    where am.client_id = intelligence.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy intelligence_insert on public.intelligence
for insert to authenticated
with check (
  client_id is null
  or exists (
    select 1
    from public.account_members am
    where am.client_id = intelligence.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy intelligence_update on public.intelligence
for update to authenticated
using (
  client_id is null
  or exists (
    select 1
    from public.account_members am
    where am.client_id = intelligence.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
)
with check (
  client_id is null
  or exists (
    select 1
    from public.account_members am
    where am.client_id = intelligence.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy intelligence_delete on public.intelligence
for delete to authenticated
using (
  client_id is null
  or exists (
    select 1
    from public.account_members am
    where am.client_id = intelligence.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

-- health tables
create policy health_select on public.client_health
for select to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_health.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy health_insert on public.client_health
for insert to authenticated
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_health.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy health_update on public.client_health
for update to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_health.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
)
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_health.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy health_delete on public.client_health
for delete to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_health.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy alerts_select on public.health_alerts
for select to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = health_alerts.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy alerts_insert on public.health_alerts
for insert to authenticated
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = health_alerts.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy alerts_update on public.health_alerts
for update to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = health_alerts.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
)
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = health_alerts.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy alerts_delete on public.health_alerts
for delete to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = health_alerts.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

-- Source overrides
create policy source_overrides_select on public.client_source_overrides
for select to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_source_overrides.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy source_overrides_insert on public.client_source_overrides
for insert to authenticated
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_source_overrides.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy source_overrides_update on public.client_source_overrides
for update to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_source_overrides.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
)
with check (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_source_overrides.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

create policy source_overrides_delete on public.client_source_overrides
for delete to authenticated
using (
  exists (
    select 1
    from public.account_members am
    where am.client_id = client_source_overrides.client_id
      and am.team_member_id::text = public.current_team_member_id()
  )
);

commit;
