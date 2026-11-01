-- AS Virtual Office schema.
-- Canonical shape of public.bot_status matches live project yecgwkntmvphocrbwlta
-- after migration bot_status_add_huddle_and_room (already applied there).
-- This file is safe to re-run: new columns and the state check are idempotent.
--
-- bot_status.state (live CHECK):
--   idle | working | waiting | error | handoff | done | huddle
-- waiting, error, and done are operational states stored in production.
-- The office animates idle | working | handoff | huddle.
-- waiting / error / done stay seated at the home desk (no invented motion).
-- huddle walks to a meeting chair and stays.
--
-- room_id     nullable text — huddle room key. Same room_id → stable shared seats.
-- room_label  nullable text — short status title shown in the HUD.
--
-- Heartbeat: while state is working or huddle, re-upsert about every 3 minutes
-- so updated_at stays fresh. The office treats working/handoff/waiting/error/done
-- as idle after 10 minutes without a heartbeat, and keeps huddle for 45 minutes
-- (see HUDDLE_STALE_MS in src/supabase.js). Repeating a huddle upsert without
-- --room-id leaves an existing room_id in place (PostgREST updates only columns
-- present in the payload).

-- Bot live status (one row per bot)
create table if not exists public.bot_status (
  bot_id uuid primary key,
  state text not null,
  status_line text,
  room_id text,
  room_label text,
  updated_at timestamptz not null default now()
);

alter table public.bot_status add column if not exists room_id text;
alter table public.bot_status add column if not exists room_label text;

comment on column public.bot_status.room_id is
  'Huddle room key. Bots sharing room_id get stable meeting seats (sorted bot_id).';
comment on column public.bot_status.room_label is
  'Short room title for the HUD. Nullable.';

-- Replace any older state CHECK (pre-huddle was idle|working|handoff in-repo,
-- and idle|working|waiting|error|handoff|done on the live project).
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'bot_status'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%state%'
  loop
    execute format('alter table public.bot_status drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.bot_status
  add constraint bot_status_state_check
  check (state in ('idle', 'working', 'waiting', 'error', 'handoff', 'done', 'huddle'));

alter table public.bot_status enable row level security;

-- Read for anon (office front-end). Re-create so this file is safe to re-run.
drop policy if exists "bot_status_select_anon" on public.bot_status;
create policy "bot_status_select_anon"
  on public.bot_status for select
  to anon
  using (true);

-- Writes must use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- Do NOT grant anon insert/update on bot_status.
-- The anon key stays read-only. Never embed the service role in the front-end
-- or in any VITE_ variable.
-- Revoke legacy anon write policies if they exist from an earlier schema.
drop policy if exists bot_status_insert_anon on public.bot_status;
drop policy if exists bot_status_update_anon on public.bot_status;

-- Weekly usage board
create table if not exists public.usage_snapshot (
  id bigint generated always as identity primary key,
  used_pct numeric not null check (used_pct >= 0 and used_pct <= 100),
  reset_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.usage_snapshot enable row level security;

drop policy if exists "usage_snapshot_select_anon" on public.usage_snapshot;
create policy "usage_snapshot_select_anon"
  on public.usage_snapshot for select
  to anon
  using (true);

-- Writes must use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- Do NOT grant anon insert/update on usage_snapshot.
drop policy if exists usage_snapshot_insert_anon on public.usage_snapshot;

-- Realtime (full row, including room_id / room_label, rides on this table).
-- Skip when the table is already in the publication (live project already is).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'bot_status'
     ) then
    alter publication supabase_realtime add table public.bot_status;
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'usage_snapshot'
     ) then
    alter publication supabase_realtime add table public.usage_snapshot;
  end if;
end $$;

-- Portal handoffs. Same statement as sql/portal_handoffs.sql.
-- The office UI does not insert. Anon is select-only. Service role writes.
create table if not exists public.portal_handoffs (
  id uuid primary key,
  bot_id uuid not null,
  lead_id uuid,
  message text not null check (char_length(message) between 1 and 500),
  source text not null default 'virtual-office',
  created_at timestamptz not null default now()
);

comment on table public.portal_handoffs is
  'Operator-written portal handoffs from the office queue. Anon may select only.';

alter table public.portal_handoffs enable row level security;

drop policy if exists "portal_handoffs_select_anon" on public.portal_handoffs;
create policy "portal_handoffs_select_anon"
  on public.portal_handoffs for select
  to anon
  using (true);

drop policy if exists portal_handoffs_insert_anon on public.portal_handoffs;
drop policy if exists portal_handoffs_update_anon on public.portal_handoffs;
drop policy if exists portal_handoffs_delete_anon on public.portal_handoffs;

revoke insert, update, delete, truncate on table public.portal_handoffs from anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'portal_handoffs'
     ) then
    alter publication supabase_realtime add table public.portal_handoffs;
  end if;
end $$;
