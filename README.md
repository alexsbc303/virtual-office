# AS Virtual Office

**3D isometric virtual office** for the AS bot team (Dallas-style HUD chrome).

Stack: **Vite + Three.js** true cutaway / dollhouse (no ceiling, no exterior city
backdrop). Zones follow sidebar sections: **Reception / 總管 · Programming / 编程 ·
General · ITSS1 · Self Enhancement** (Meeting = open huddle area, seats stay; Social lounge amenity).
Tech / sci-fi materials: cool LED accents, glass, holographic panels, dark tech floor
mixed with warm wood desks; procedural foliage (not blob plants). Bots are **seated
rilakkuma-style plush** at their section homes. Dark HUD: counters, team sidebar +
activity feed, status legend, **Now** lighting (Asia/Hong_Kong). Live presence via
**Supabase Realtime** (`bot_status`, `usage_snapshot`).

## Quick start

```bash
cp .env.example .env
# Fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OFFICE_PASSWORD_HASH
npm install
npm run dev
```

Open the printed local URL (`base: /virtual-office/`). Without Supabase credentials the office still loads; all bots remain idle until Realtime data arrives.

Orbit / drag the view to feel depth. Soft auto-sway when idle.

### Password hash

```bash
echo -n 'your-password' | sha256sum
# Put the hex digest in VITE_OFFICE_PASSWORD_HASH (no plaintext in repo)
```

If `VITE_OFFICE_PASSWORD_HASH` is empty, the gate opens for local builds.

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

Click a bot figure or a roster row, type a message or command, and send. The panel confirms **已交總管** and keeps a browser queue (`localStorage`) even when nothing else is configured.

This is a handoff contract for operators. It does **not** open Cursor chat and it does not write Supabase with the anon key.

Optional public webhook (never a service-role key):

```bash
VITE_HANDOFF_WEBHOOK_URL=https://example.com/hooks/virtual-office
```

`POST` JSON:

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

The page also dispatches `vo-portal-handoff` on `window` with that object. To store a row, apply `sql/portal_handoffs.sql` from the webhook receiver using the service role. Anon stays **select-only**.

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
