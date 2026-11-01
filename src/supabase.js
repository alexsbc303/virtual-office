import { createClient } from '@supabase/supabase-js';
import { TEAM } from './team.js';

const STALE_MS = 10 * 60 * 1000;
const FEED_QUIET_MS = 45 * 60 * 1000;

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

/** @type {Map<string, object>} */
const statusById = new Map();

/** @type {{ used_pct: number|null, reset_at: string|null, updated_at: string|null }} */
let usageSnapshot = { used_pct: null, reset_at: null, updated_at: null };

let lastFeedAt = 0;
/** @type {Set<(evt: object) => void>} */
const listeners = new Set();

function emit(evt) {
  for (const fn of listeners) fn(evt);
}

export function onStatusChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getClient() {
  if (!url || !anon || url.includes('YOUR_PROJECT')) return null;
  if (!client) client = createClient(url, anon);
  return client;
}

/**
 * Visual status: stale (>10 min) → idle. Never invents activity.
 */
export function getVisualStatus(botId) {
  const row = statusById.get(botId);
  if (!row) {
    return { state: 'idle', line: '', updatedAt: null, raw: null };
  }
  const updated = row.updated_at ? Date.parse(row.updated_at) : 0;
  const age = Date.now() - updated;
  if (!updated || age > STALE_MS) {
    return { state: 'idle', line: '', updatedAt: row.updated_at, raw: row };
  }
  const state = (row.state || 'idle').toLowerCase();
  const allowed = state === 'working' || state === 'handoff' ? state : 'idle';
  const line = typeof row.status_line === 'string' ? row.status_line.slice(0, 80) : '';
  return { state: allowed, line, updatedAt: row.updated_at, raw: row };
}

export function getUsageSnapshot() {
  return { ...usageSnapshot };
}

export function isFeedQuiet() {
  if (!lastFeedAt) return false;
  return Date.now() - lastFeedAt > FEED_QUIET_MS;
}

export function getLastFeedAt() {
  return lastFeedAt;
}

function applyStatusRow(row) {
  if (!row || !row.bot_id) return;
  statusById.set(row.bot_id, row);
  lastFeedAt = Date.now();
  emit({ type: 'status', botId: row.bot_id, row });
}

function applyUsageRow(row) {
  if (!row) return;
  usageSnapshot = {
    used_pct: row.used_pct ?? null,
    reset_at: row.reset_at ?? null,
    updated_at: row.updated_at ?? null,
  };
  lastFeedAt = Date.now();
  emit({ type: 'usage', row: usageSnapshot });
}

/**
 * Initial fetch + Realtime subscribe. Safe no-op without credentials.
 */
export async function startStatusFeed() {
  const sb = getClient();
  if (!sb) {
    console.info('[supabase] Credentials missing — status feed idle until configured.');
    emit({ type: 'offline' });
    return { offline: true };
  }

  const ids = TEAM.map((t) => t.id);

  const { data: statuses, error: stErr } = await sb
    .from('bot_status')
    .select('*')
    .in('bot_id', ids);
  if (stErr) console.warn('[supabase] bot_status fetch:', stErr.message);
  else if (statuses) {
    for (const row of statuses) applyStatusRow(row);
  }

  const { data: usageRows, error: uErr } = await sb
    .from('usage_snapshot')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (uErr) console.warn('[supabase] usage_snapshot fetch:', uErr.message);
  else if (usageRows?.[0]) applyUsageRow(usageRows[0]);

  const channel = sb
    .channel('office-status')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bot_status' },
      (payload) => {
        const row = payload.new || payload.old;
        if (payload.eventType === 'DELETE') {
          if (row?.bot_id) statusById.delete(row.bot_id);
          emit({ type: 'status', botId: row?.bot_id, row: null });
        } else {
          applyStatusRow(payload.new);
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'usage_snapshot' },
      (payload) => {
        if (payload.new) applyUsageRow(payload.new);
      },
    )
    .subscribe((status) => {
      emit({ type: 'realtime', status });
    });

  // Quiet-feed ticker
  setInterval(() => {
    if (isFeedQuiet()) emit({ type: 'feed-quiet' });
  }, 60_000);

  return { offline: false, channel };
}

/** Browser-only simulation overrides — never written to Supabase. */
const simOverrides = new Map();

export function setSimStatus(botId, state, line = '') {
  simOverrides.set(botId, { state, line, updated_at: new Date().toISOString() });
  emit({ type: 'sim', botId });
}

export function clearSimStatuses() {
  simOverrides.clear();
  emit({ type: 'sim-clear' });
}

export function getEffectiveStatus(botId) {
  if (simOverrides.has(botId)) {
    const s = simOverrides.get(botId);
    return { state: s.state, line: s.line, updatedAt: s.updated_at, raw: s, simulated: true };
  }
  return { ...getVisualStatus(botId), simulated: false };
}
