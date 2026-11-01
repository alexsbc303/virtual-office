# Screenshot checklist

Dev: `npm run dev` → open Vite URL under `/virtual-office/`.
No password gate. The office is the first screen.

Scene: tech/sci-fi six-zone cutaway (no ceiling, no exterior city). Section homes:
Reception/總管 · Programming/编程 · General · ITSS1 · Self Enhancement.
Meeting is an open area (table, chairs, posts, LEDs — no frost glass). Huddle seats stay.
Reception is an L counter: guest lip faces the office floor (−Z); the return runs toward the entrance on the east side. Bot 總管 sits in that pocket and faces into the office (−Z). Planter, sofas, and the side table stay.
Lighting HUD is **Now** only; day/evening/night follow Asia/Hong_Kong and refresh each minute.
Portal: click a bot, send a command, confirm **已交總管佇列**. Send calls Edge Function `portal-handoff` (anon key in, service role insert). `localStorage` is cache/offline only. Optional `VITE_HANDOFF_WEBHOOK_URL` posts the same JSON. Not Cursor chat. Anon stays select-only (`sql/portal_handoffs.sql`). Hub polls `portal_handoffs` `order by created_at` and owns the 總管 bridge.
Seated rilakkuma + Dallas-style HUD. Cool LED / glass windows / holo accents + procedural plants.

Capture `screenshots/tech-sections-*.png` (overview, itss1, general, plants, mobile).
