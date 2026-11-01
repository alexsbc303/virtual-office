-- Bot live status (one row per bot)
create table if not exists public.bot_status (
  bot_id uuid primary key,
  state text not null check (state in ('idle', 'working', 'handoff')),
  status_line text,
  updated_at timestamptz not null default now()
);

alter table public.bot_status enable row level security;

-- Read for anon (office front-end)
create policy "bot_status_select_anon"
  on public.bot_status for select
  to anon
  using (true);

-- Writes: service role or a restricted insert/update policy for bot runners
-- Example (tighten to your auth model):
-- create policy "bot_status_upsert_authenticated"
--   on public.bot_status for all
--   to authenticated
--   using (true) with check (true);

-- Weekly usage board
create table if not exists public.usage_snapshot (
  id bigint generated always as identity primary key,
  used_pct numeric not null check (used_pct >= 0 and used_pct <= 100),
  reset_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.usage_snapshot enable row level security;

create policy "usage_snapshot_select_anon"
  on public.usage_snapshot for select
  to anon
  using (true);

-- Realtime
alter publication supabase_realtime add table public.bot_status;
alter publication supabase_realtime add table public.usage_snapshot;
