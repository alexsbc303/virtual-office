-- Incremental portal handoff table. Safe to re-run.
--
-- Write path (chosen): Supabase Edge Function `portal-handoff`.
-- The office page calls it with the anon key (or a user session).
-- The function validates the body, then inserts with SUPABASE_SERVICE_ROLE_KEY,
-- which Supabase injects into the function environment. That key is never a
-- VITE_ variable and is never shipped to the browser.
--
-- Anon may SELECT only. No anon insert, update, or delete.
-- Hub / 總管 owns the bridge that reads this queue (poll below) or the
-- optional webhook. This office does not deliver chat to 總管 by itself.
--
-- JSON payload (also stored in `payload`, and POSTed to VITE_HANDOFF_WEBHOOK_URL):
--   {
--     "type": "portal_handoff",
--     "id": "uuid",
--     "created_at": "ISO-8601",
--     "source": "virtual-office",
--     "bot": { "id": "uuid", "name": "…", "dept": "…" },
--     "lead": { "id": "664766c4-1928-4909-8d79-90a3c38f786c", "name": "Bot 總管" },
--     "message": "text"
--   }
--
-- Columns:
--   id          uuid         payload.id
--   bot_id      uuid         payload.bot.id          required
--   lead_id     uuid         payload.lead.id         required (Bot 總管)
--   message     text         payload.message         1–500 chars
--   source      text         payload.source          must be 'virtual-office'
--   payload     jsonb        the object above
--   created_at  timestamptz  payload.created_at
--
-- Hub poll (service role or anon select):
--   select id, created_at, bot_id, lead_id, message, source, payload
--   from public.portal_handoffs
--   order by created_at asc;

create table if not exists public.portal_handoffs (
  id uuid primary key,
  bot_id uuid not null,
  lead_id uuid,
  message text not null check (char_length(message) between 1 and 500),
  source text not null default 'virtual-office',
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.portal_handoffs add column if not exists payload jsonb;
alter table public.portal_handoffs alter column lead_id set not null;

alter table public.portal_handoffs drop constraint if exists portal_handoffs_source_check;
alter table public.portal_handoffs
  add constraint portal_handoffs_source_check
  check (source = 'virtual-office');

alter table public.portal_handoffs drop constraint if exists portal_handoffs_payload_object;
alter table public.portal_handoffs
  add constraint portal_handoffs_payload_object
  check (payload is null or jsonb_typeof(payload) = 'object');

comment on table public.portal_handoffs is
  'Handoffs for Hub/總管. Written by edge function portal-handoff (service role). Anon may select only.';

comment on column public.portal_handoffs.payload is
  'Full portal_handoff JSON. Same shape as the optional webhook body.';

create index if not exists portal_handoffs_created_at_idx
  on public.portal_handoffs (created_at);

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
grant select on table public.portal_handoffs to anon;

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
