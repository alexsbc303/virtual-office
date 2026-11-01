# Screenshot checklist (parent)

Dev server: after `npm run dev`, open the printed URL (default `http://localhost:5173/REPO_NAME/` — if base path 404s, open with Vite’s suggested URL or temporarily set `base: '/'`).

Password gate opens automatically when `VITE_OFFICE_PASSWORD_HASH` is unset.

## Capture these views

1. **Overview** — orbit to show open floor, glass partitions, plants, bilingual wall labels (EN above ZH).
2. **Directorate Office** — lead glass corner office with harbour/skyline geometry and 「總管室」 label.
3. **Meeting room** — table + chairs and 「會議室」 label.
4. **Tea room / pantry** — counter, sink, kettle, fridge (not a lounge).
5. **Research area** — three animated screens (charts, HK silhouette, terminal).
6. **Technical zone** — blinking server rack LEDs.
7. **Idle bots** — seated, no bobbing; small name tags visible.
8. **Simulate Work** — click button (or `?simulate=1`); confirm 「Simulation · 模擬中」 badge and measured walking / handoff to lead office.
9. **Hover panel** — hover a bot for full name, dept EN·ZH, status line.
10. **Usage board** — top-right bilingual counter (shows em dashes until `usage_snapshot` exists).

Do not invent live Supabase data for screenshots; use Simulate Work for motion.
