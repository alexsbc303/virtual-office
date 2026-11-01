#!/usr/bin/env node
/**
 * Example: push a bot_status row from a bot process.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or anon with RLS insert policy).
 * Never commit secrets. Never used by the front-end Simulate Work button.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/push-status.mjs <bot_id> <idle|working|handoff> ["short status line"]
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const [botId, state, ...rest] = process.argv.slice(2);
const statusLine = rest.join(' ').slice(0, 80);

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key).');
  process.exit(1);
}
if (!botId || !state) {
  console.error('Usage: node scripts/push-status.mjs <bot_id> <idle|working|handoff> [status_line]');
  process.exit(1);
}

const allowed = new Set(['idle', 'working', 'handoff']);
if (!allowed.has(state)) {
  console.error('state must be idle | working | handoff');
  process.exit(1);
}

const sb = createClient(url, key);
const row = {
  bot_id: botId,
  state,
  status_line: statusLine || null,
  updated_at: new Date().toISOString(),
};

const { error } = await sb.from('bot_status').upsert(row, { onConflict: 'bot_id' });
if (error) {
  console.error('upsert failed:', error.message);
  process.exit(1);
}
console.log('ok', row);
