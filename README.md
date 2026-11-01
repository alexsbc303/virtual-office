# AS Virtual Office

Polished **3D anime-style** virtual office for the AS bot team.

Stack: **Vite + Three.js** with soft Shinkai-like lighting, wood desks, glass
meeting room, pantry, hanging plants, and industrial ceiling. Avatars are
procedural anime sprite billboards (team colours) with status rings.
Live presence via **Supabase Realtime** (`bot_status`, `usage_snapshot`).

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
`?simulate=1` auto-starts simulation.

### GitHub Pages

`vite.config.js` uses `base: '/virtual-office/'`.

```bash
npm run build
# Publish dist/ only — never push .env
```

## Style

3D room framed like the anime reference: bright open-plan, floor-to-ceiling
windows with city backdrop, warm wood desks, glass directorate room, kitchenette,
hanging plants, industrial pipes and track lights. Soft warm window light +
ACES tone mapping. Team colours accent avatar hair/clothes and name tags.
