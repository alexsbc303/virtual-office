# AS Virtual Office

2D anime-style virtual office for the AS bot team.

Stack: **Vite + Canvas2D** static front-end with procedural anime avatar sprites.
Live presence via **Supabase Realtime** (`bot_status`, `usage_snapshot`).

## Quick start

```bash
cp .env.example .env
# Fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_OFFICE_PASSWORD_HASH
npm install
npm run dev
```

Open the printed local URL (`base: /virtual-office/`). Without Supabase credentials the office still loads; all bots remain idle until Realtime data arrives.

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

Polished 2D anime office scene (illustrated background + sprite avatars) matching the
attached anime reference: bright open office, floor-to-ceiling windows + city, glass
meeting room, kitchenette, hanging plants, wood desks. Team colours accent hair/clothes.
