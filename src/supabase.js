import { createClient } from '@supabase/supabase-js';
import { TEAM } from './team.js';

/** working / handoff / waiting / error / done → visual idle after this. */
const STALE_MS = 10 * 60 * 1000;
/**
 * huddle stays on its meeting chair for this long after updated_at.
 * Longer than STALE_MS so a missed heartbeat does not dissolve the meeting.
 * Intended heartbeat: re-upsert huddle (and working) about every 3 minutes.
 * room_id groups seats; it does not disable this window. A huddle with or
 * without room_id uses HUDDLE_STALE_MS, never the 10-minute window.
 */
const HUDDLE_STALE_MS = 45 * 60 * 1000;
const FEED_QUIET_MS = 45 * 60 * 1000;

const VISUAL_STATES = new Set(['idle', 'working', 'handoff', 'huddle', 'waiting', 'error', 'done']);

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let client = null;

/** @type {Map<string, object>} */
const statusById = new Map();

/** @type {{ used_pct: number|null, reset_at: string|null, updated_at: string|null }} */
let usageSnapshot = { used_pct: null, reset_at: null, updated_at: null };

let lastFeedAt = 0;

/** @type {'offline'|'connecting'|'connected'|'reconnecting'|'error'} */
let feedConnection = 'offline';

/** @type {import('@supabase/supabase-js').RealtimeChannel | null} */
let activeChannel = null;
let reconnectTimer = 0;
let reconnectAttempt = 0;
let feedGeneration = 0;

/** @type {Set<(evt: object) => void>} */
const listeners = new Set();

function emit(evt) {
  for (const fn of listeners) fn(evt);
}

function setFeedConnection(state) {
  feedConnection = state;
  emit({ type: 'realtime', status: state });
}

/** Status-feed socket state for the HUD. */
export function getFeedConnection() {
  return feedConnection;
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

function emptyStatus() {
  return {
    state: 'idle',
    line: '',
    updatedAt: null,
    raw: null,
    roomId: null,
    roomLabel: '',
    stale: false,
  };
}

function roomFields(row) {
  const roomId = typeof row.room_id === 'string' && row.room_id.trim() ? row.room_id.trim() : null;
  const roomLabel = typeof row.room_label === 'string' ? row.room_label.slice(0, 80) : '';
  const line = typeof row.status_line === 'string' ? row.status_line.slice(0, 80) : '';
  return { roomId, roomLabel, line };
}

/**
 * Visual status from the live row.
 * working / handoff / waiting / error / done go idle after STALE_MS (10 min).
 * huddle stays until HUDDLE_STALE_MS (45 min) so it does not evaporate on the
 * short window. Heartbeat every ~3 minutes while huddle or working.
 * Never invents activity: a missing or stale row is idle.
 */
export function getVisualStatus(botId) {
  const row = statusById.get(botId);
  if (!row) return emptyStatus();

  const updated = row.updated_at ? Date.parse(row.updated_at) : 0;
  const age = Date.now() - updated;
  const rawState = String(row.state || 'idle').toLowerCase();
  const fields = roomFields(row);
  const limit = rawState === 'huddle' ? HUDDLE_STALE_MS : STALE_MS;
  if (!updated || age > limit) {
    return {
      state: 'idle',
      line: '',
      updatedAt: row.updated_at,
      raw: row,
      roomId: null,
      roomLabel: '',
      stale: true,
    };
  }

  const state = VISUAL_STATES.has(rawState) ? rawState : 'idle';
  return {
    state,
    line: fields.line,
    updatedAt: row.updated_at,
    raw: row,
    roomId: fields.roomId,
    roomLabel: fields.roomLabel,
    stale: false,
  };
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

async function refetchSnapshot(sb) {
  const ids = TEAM.map((t) => t.id);
  const { data: statuses, error: stErr } = await sb.from('bot_status').select('*').in('bot_id', ids);
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
}

function scheduleReconnect(sb, failureState) {
  if (reconnectTimer) return;
  const delay = Math.min(30_000, 1500 * 2 ** Math.min(reconnectAttempt, 5));
  reconnectAttempt += 1;
  // CHANNEL_ERROR surfaces as error immediately. CLOSED / TIMED_OUT read as
  // reconnecting until repeated failure, and the backoff loop keeps trying.
  const showError = failureState === 'error' || reconnectAttempt >= 4;
  setFeedConnection(showError ? 'error' : 'reconnecting');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = 0;
    void openChannel(sb);
  }, delay);
}

async function openChannel(sb) {
  const generation = ++feedGeneration;
  if (activeChannel) {
    const previous = activeChannel;
    activeChannel = null;
    try {
      await sb.removeChannel(previous);
    } catch (err) {
      console.warn('[supabase] removeChannel:', err?.message || err);
    }
  }
  if (generation !== feedGeneration) return;

  const channel = sb.channel(`office-status-${generation}`);
  activeChannel = channel;
  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_status' }, (payload) => {
      const row = payload.new || payload.old;
      if (payload.eventType === 'DELETE') {
        if (row?.bot_id) statusById.delete(row.bot_id);
        emit({ type: 'status', botId: row?.bot_id, row: null });
      } else {
        applyStatusRow(payload.new);
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'usage_snapshot' }, (payload) => {
      if (payload.new) applyUsageRow(payload.new);
    })
    .subscribe((status, err) => {
      if (channel !== activeChannel) return;
      if (status === 'SUBSCRIBED') {
        reconnectAttempt = 0;
        setFeedConnection('connected');
        void refetchSnapshot(sb);
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        const detail = err?.message || err || status;
        console.warn('[supabase] realtime', status, detail);
        scheduleReconnect(sb, status === 'CHANNEL_ERROR' ? 'error' : 'reconnecting');
      }
    });
}

/**
 * Initial fetch + Realtime subscribe. Safe no-op without credentials.
 * CHANNEL_ERROR / TIMED_OUT / CLOSED resubscribe with backoff and refetch.
 */
export async function startStatusFeed() {
  const sb = getClient();
  if (!sb) {
    console.info('[supabase] Credentials missing — status feed idle until configured.');
    setFeedConnection('offline');
    emit({ type: 'offline' });
    return { offline: true };
  }

  setFeedConnection('connecting');
  await refetchSnapshot(sb);
  await openChannel(sb);

  // Quiet-feed ticker
  setInterval(() => {
    if (isFeedQuiet()) emit({ type: 'feed-quiet' });
  }, 60_000);

  return { offline: false, channel: activeChannel };
}

/** Browser-only simulation overrides — never written to Supabase. */
const simOverrides = new Map();

/**
 * @param {string} botId
 * @param {string} state
 * @param {string} [line]
 * @param {{ room_id?: string|null, room_label?: string|null, silent?: boolean }} [extra]
 * Pass silent to batch several overrides and emit once via flushSimStatuses.
 */
export function setSimStatus(botId, state, line = '', extra = {}) {
  simOverrides.set(botId, {
    state,
    line,
    room_id: extra.room_id ?? null,
    room_label: extra.room_label ?? null,
    updated_at: new Date().toISOString(),
  });
  if (!extra.silent) emit({ type: 'sim', botId });
}

export function clearSimStatuses(options = {}) {
  simOverrides.clear();
  if (!options.silent) emit({ type: 'sim-clear' });
}

/** One notification after a silent batch of sim overrides. */
export function flushSimStatuses() {
  emit({ type: 'sim' });
}

export function getEffectiveStatus(botId) {
  const live = getVisualStatus(botId);
  // A real huddle from Realtime wins over Simulate. SIM must not pull a bot
  // out of a live meeting or rewrite that bot's room_id.
  if (live.state === 'huddle') {
    return { ...live, simulated: false };
  }
  if (simOverrides.has(botId)) {
    const s = simOverrides.get(botId);
    const roomId = typeof s.room_id === 'string' && s.room_id.trim() ? s.room_id.trim() : null;
    const roomLabel = typeof s.room_label === 'string' ? s.room_label.slice(0, 80) : '';
    return {
      state: s.state,
      line: s.line,
      updatedAt: s.updated_at,
      raw: s,
      roomId,
      roomLabel,
      stale: false,
      simulated: true,
    };
  }
  return { ...live, simulated: false };
}
