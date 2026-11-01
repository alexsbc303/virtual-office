-- Incremental portal handoff table. Safe to re-run.
-- Anon may SELECT only. Do not grant anon insert/update/delete.
-- The virtual office does not write this table. A webhook receiver
-- (or any server job) inserts with SUPABASE_SERVICE_ROLE_KEY.
--
-- Row shape matches the browser POST body (see README, Portal handoff):
--   id          uuid     payload.id
--   bot_id      uuid     payload.bot.id
--   lead_id     uuid     payload.lead.id
--   message     text     payload.message (1–500 chars)
--   source      text     payload.source ('virtual-office')
--   created_at  timestamptz

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
