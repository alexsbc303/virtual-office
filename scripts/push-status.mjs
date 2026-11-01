#!/usr/bin/env node
/**
 * Push a bot_status row from a bot process (service role). Never used by the
 * front-end Simulate button. Never commit secrets. Never put SERVICE_ROLE in
 * VITE_ vars or the front-end bundle.
 *
 * Requires SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
 * The anon key is not accepted: RLS is select-only for anon; writes bypass RLS
 * via the service role.
 *
 * States (live CHECK): idle | working | waiting | error | handoff | done | huddle
 * `huddle` is first-class: the office walks that bot to a meeting chair and
 * keeps them there (no handoff auto-return).
 *
 * Optional flags (anywhere on the command line; quote labels with spaces):
 *   --room-id <id>         huddle room key. Bots with the same id share seats.
 *   --room-label <label>   short title shown in the HUD (status title).
 *   --room-id= / --room-label= forms also work.
 * Pass an empty value (--room-id '') to clear that column.
 * Omit the flags to leave an existing room_id / room_label unchanged on update.
 *
 * Heartbeat: while state is `huddle` or `working`, re-run this upsert about
 * every 3 minutes so updated_at stays fresh. The office drops working / handoff
 * / waiting / error / done to idle after 10 minutes without a heartbeat, and
 * keeps a huddle visible for 45 minutes (src/supabase.js HUDDLE_STALE_MS).
 * Repeat --room-id on each huddle heartbeat if you want the grouping to be
 * obvious in the payload; omitting it does not clear the saved room on update.
 *
 *   while true; do
 *     node scripts/push-status.mjs "$BOT_ID" huddle "Design review" \
 *       --room-id design-review --room-label "Design review"
 *     sleep 180
 *   done
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/push-status.mjs <bot_id> <state> [status line words...] \
 *     [--room-id <id>] [--room-label <label>]
 *
 * Two bots, same room (they sit and stay):
 *   node scripts/push-status.mjs <bot-a> huddle "Design review" \
 *     --room-id design-review --room-label "Design review"
 *   node scripts/push-status.mjs <bot-b> huddle "Design review" \
 *     --room-id design-review --room-label "Design review"
 */
import { createClient } from '@supabase/supabase-js';

const ALLOWED = new Set(['idle', 'working', 'waiting', 'error', 'handoff', 'done', 'huddle']);

function parseArgs(argv) {
  const positional = [];
  let roomId;
  let roomLabel;
  let roomIdSet = false;
  let roomLabelSet = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') return { help: true };
    if (a === '--room-id' || a === '--room_id') {
      roomIdSet = true;
      roomId = argv[++i] ?? '';
      continue;
    }
    if (a.startsWith('--room-id=') || a.startsWith('--room_id=')) {
      roomIdSet = true;
      roomId = a.slice(a.indexOf('=') + 1);
      continue;
    }
    if (a === '--room-label' || a === '--room_label') {
      roomLabelSet = true;
      roomLabel = argv[++i] ?? '';
      continue;
    }
    if (a.startsWith('--room-label=') || a.startsWith('--room_label=')) {
      roomLabelSet = true;
      roomLabel = a.slice(a.indexOf('=') + 1);
      continue;
    }
    positional.push(a);
  }

  const [botId, state, ...rest] = positional;
  const clean = (value, max) => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return null;
    return trimmed.slice(0, max);
  };

  return {
    help: false,
    botId,
    state,
    statusLine: rest.join(' ').trim().slice(0, 80) || null,
    roomIdSet,
    roomLabelSet,
    roomId: roomIdSet ? clean(roomId, 64) : undefined,
    roomLabel: roomLabelSet ? clean(roomLabel, 80) : undefined,
  };
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`Usage: node scripts/push-status.mjs <bot_id> <${[...ALLOWED].join('|')}> [status_line...] [--room-id id] [--room-label label]`);
  process.exit(0);
}

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role required; anon key is not accepted).');
  process.exit(1);
}
if (!args.botId || !args.state) {
  console.error(
    'Usage: node scripts/push-status.mjs <bot_id> <idle|working|waiting|error|handoff|done|huddle> [status_line...] [--room-id id] [--room-label label]',
  );
  process.exit(1);
}
if (!ALLOWED.has(args.state)) {
  console.error(`state must be ${[...ALLOWED].join(' | ')}`);
  process.exit(1);
}

const sb = createClient(url, key);
const row = {
  bot_id: args.botId,
  state: args.state,
  status_line: args.statusLine,
  updated_at: new Date().toISOString(),
};
if (args.roomIdSet) row.room_id = args.roomId;
if (args.roomLabelSet) row.room_label = args.roomLabel;

const { error } = await sb.from('bot_status').upsert(row, { onConflict: 'bot_id' });
if (error) {
  console.error('upsert failed:', error.message);
  process.exit(1);
}
console.log('ok', row);
