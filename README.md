# AS Virtual Office

**3D isometric virtual office** for the AS bot team (Dallas-style HUD chrome).

Stack: **Vite + Three.js** true cutaway / dollhouse (no ceiling, no exterior city
backdrop). Zones follow sidebar sections: **Reception / 總管 · Programming / 編程 ·
General · ITSS1 · Self Enhancement** (Meeting = open huddle area, seats stay; Social lounge amenity).
Tech / sci-fi materials: cool LED accents, glass, holographic panels, dark tech floor
mixed with warm wood desks; procedural foliage (not blob plants). Bots are **seated
rilakkuma-style plush** at their section homes. Dark HUD: counters, team sidebar +
activity feed, status legend, **Now** lighting (Asia/Hong_Kong). Live presence via
**Supabase Realtime** (`bot_status`, `usage_snapshot`).

## Quick start

```bash
cp .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY only.
# Never put SUPABASE_SERVICE_ROLE_KEY in a VITE_ variable or in git.
npm install
npm run dev
```

Open the printed local URL (`base: /virtual-office/`). The office opens directly — there is no password gate. Without Supabase credentials the office still loads; all bots remain idle until Realtime data arrives, and a portal send stays in the browser cache until the queue write can succeed.

Orbit / drag the view to feel depth. Soft auto-sway when idle.

### Simulate Work

Bottom button **Simulate Work / 模擬工作** runs browser-only motion. It never writes to Supabase.
`?simulate=1` auto-starts simulation. `?cam=meeting` frames the conference table.

Simulate parks a stable group of up to four bots in one huddle (`sim-huddle`) so they walk to meeting chairs and stay. Rows are marked `[SIM]` and the state chip reads **Huddle SIM**. Bots that already have a live `huddle` row are not overridden, and that live room keeps its chairs.

### Huddle heartbeat

`scripts/push-status.mjs` upserts with the service role (never the anon key, never a `VITE_` secret).

```bash
node scripts/push-status.mjs <bot_id> huddle "Design review" \
  --room-id design-review --room-label "Design review"
```

Same `--room-id` on two or more bots seats them together (sorted `bot_id` → chair). While a bot is `huddle` or `working`, re-run the upsert about every 3 minutes so `updated_at` stays fresh. Working, handoff, waiting, error, and done drop to idle after 10 minutes without a heartbeat. Huddle stays for 45 minutes so a missed beat does not clear the meeting.

### Portal handoff

Click a bot figure or a roster row, type a message or command, and send. A successful write confirms **已交總管佇列**.

This does **not** open Cursor chat. Hub owns the 總管-side bridge (read the queue, or accept the webhook, and act on it).

**Write path:** Edge Function `portal-handoff` (`supabase/functions/portal-handoff/index.ts`). The page calls it with the anon key. The function checks the body (message 1–500, `source = virtual-office`, uuid `id` / `bot.id`, lead id is Bot 總管) and inserts with the service role. That key lives only in the function environment. Apply `sql/portal_handoffs.sql` before the first send. Anon stays **select-only** — no insert, update, or delete policy.

`localStorage` (`vo.portal.handoffs.v1`) is a cache and the offline fallback when the function cannot be reached. It is not the queue Hub polls.

Optional public webhook (same JSON, after the queue write; never a service-role key):

```bash
VITE_HANDOFF_WEBHOOK_URL=https://example.com/hooks/virtual-office
```

JSON body (function payload, `payload` column, webhook body, and `vo-portal-handoff` detail):

```json
{
  "type": "portal_handoff",
  "id": "uuid",
  "created_at": "2026-11-01T13:47:00.000Z",
  "source": "virtual-office",
  "bot": { "id": "uuid", "name": "Coding Bot", "dept": "Programming" },
  "lead": { "id": "664766c4-1928-4909-8d79-90a3c38f786c", "name": "Bot 總管" },
  "message": "text"
}
```

Table `public.portal_handoffs`:

| Column | Type | Maps to |
| --- | --- | --- |
| `id` | uuid | `id` |
| `bot_id` | uuid | `bot.id` |
| `lead_id` | uuid | `lead.id` |
| `message` | text (1–500) | `message` |
| `source` | text | `source` (`virtual-office` only) |
| `payload` | jsonb | the object above |
| `created_at` | timestamptz | `created_at` |

Hub poll:

```sql
select id, created_at, bot_id, lead_id, message, source, payload
from public.portal_handoffs
order by created_at asc;
```

### Lighting

The HUD shows **Now** and the Hong Kong clock. Day (06:00–16:00), evening (16:00–20:00), and night follow `Asia/Hong_Kong` and refresh when the hour band changes. Sunny day and LED night are separate themes. `?light=day|evening|night` pins a theme for checks; those are not buttons.

### GitHub Pages

`vite.config.js` uses `base: '/virtual-office/'`.

```bash
npm run build
# Publish dist/ only — never push .env
```

## Style

Tech cutaway framed like a sci-fi ops floor: dark metal + glass partitions, cyan/magenta
LED rails, holographic wall panels, warm wood desks, open roof with pendant LEDs.
Soft cool void behind windows (no city mural). Figures are original procedural seated
plush meshes with team colours on scarves, badge rings, and desk tags. Each bot sits
on their office chair facing a computer in their sidebar section zone.
