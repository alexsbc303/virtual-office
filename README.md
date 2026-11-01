# AS Virtual Office

**3D isometric virtual office** for the AS bot team (Dallas-style HUD chrome).

Stack: **Vite + Three.js** true cutaway / dollhouse (no ceiling, no exterior city
backdrop). Zones follow sidebar sections: **Reception / 總管 · Programming / 编程 ·
General · ITSS1 · Self Enhancement** (Meeting = handoff walk; Social lounge amenity).
Tech / sci-fi materials: cool LED accents, glass, holographic panels, dark tech floor
mixed with warm wood desks; procedural foliage (not blob plants). Bots are **seated
rilakkuma-style plush** at their section homes. Dark HUD: counters, team sidebar +
activity feed, status legend, Day/Evening/Night lighting. Live presence via
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
`?simulate=1` auto-starts simulation.

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
