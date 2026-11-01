# AS Virtual Office

3D virtual office for the AS bot team.

Stack: **Vite + Three.js** static front-end. Live presence via **Supabase Realtime** (`bot_status`, `usage_snapshot`).

## Quick start

```bash
cp .env.example .env
# Fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OFFICE_PASSWORD_HASH
npm install
npm run dev
```

Open the printed local URL. Without Supabase credentials the office still loads; all bots remain idle/seated until Realtime data arrives.

### Password hash

```bash
echo -n 'your-password' | sha256sum
# Put the hex digest in VITE_OFFICE_PASSWORD_HASH (no plaintext in repo)
```

If `VITE_OFFICE_PASSWORD_HASH` is empty, the gate opens for local builds.

### Simulate Work

Bottom button **Simulate Work / 模擬工作** runs browser-only motion. It never writes to Supabase.  
`?simulate=1` auto-starts simulation.

### GitHub Pages

`vite.config.js` uses `base: '/REPO_NAME/'`. Replace `REPO_NAME` with the repository name before deploy.

```bash
npm run build
# Publish dist/
```

## Schema SQL (Supabase)

```sql
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
```

### Push status from a bot

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/push-status.mjs <bot_uuid> working "Preparing briefing notes"
```

## Behaviour notes

| Rule | Detail |
|------|--------|
| Default | All bots idle / seated until Realtime data arrives |
| Stale | `updated_at` older than 10 minutes → treat as idle visually |
| Quiet feed | No feed activity for 45+ minutes → warning banner only |
| Motion | Idle: sit quietly, no bobbing. Working: measured walk to desk. Handoff: formal walk to Directorate Office |
| UI | Bilingual EN above ZH; formal tone; short status lines only when data exists |

## Team colours

Defined in `src/team.js` (exact UUIDs and hex colours). Lead: Bot 總管 (Directorate Office).

## Security

- Never commit `.env`, service role keys, or `OFFICE_SITE_PASSWORD`.
- Front-end uses anon key + password hash only.
- Simulate Work is client-side only.
