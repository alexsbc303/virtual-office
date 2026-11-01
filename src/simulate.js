import { TEAM } from './team.js';
import { setSimStatus, clearSimStatuses, flushSimStatuses, getVisualStatus } from './supabase.js';

const LINES = [
  'Preparing briefing notes',
  'Reviewing correspondence',
  'Updating schedule',
  'Drafting assessment remarks',
  'Checking infrastructure notes',
  'Compiling minutes',
  'Formal handoff in progress',
];

/** Browser-only room. Prefix `sim-` so live huddle rooms keep their chairs. */
const SIM_ROOM_ID = 'sim-huddle';
const SIM_ROOM_LABEL = 'SIM huddle';

let timer = null;
let running = false;

export function isSimulating() {
  return running;
}

/**
 * Bots whose live row is still a non-stale huddle. Simulate must not override them.
 */
function liveHuddleIds() {
  const ids = new Set();
  for (const member of TEAM) {
    if (getVisualStatus(member.id).state === 'huddle') ids.add(member.id);
  }
  return ids;
}

/**
 * Browser-only simulation. Never writes to Supabase.
 * A stable group (sorted ids, up to 4) shares one huddle room and stays seated
 * for the whole run. Working / handoff still rotate on the remaining bots.
 * Live Realtime huddle rows are left untouched.
 */
export function startSimulation(onChange) {
  if (running) return;
  running = true;
  onChange?.(true);

  const tick = () => {
    // One emit at the end so a stable huddle group is not walked home between rows.
    clearSimStatuses({ silent: true });
    const protectedIds = liveHuddleIds();
    const pool = TEAM.filter((t) => !protectedIds.has(t.id)).sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );

    const huddleCount = pool.length >= 2 ? Math.min(4, pool.length) : 0;
    const huddle = pool.slice(0, huddleCount);
    for (const member of huddle) {
      setSimStatus(member.id, 'huddle', 'Group huddle', {
        room_id: SIM_ROOM_ID,
        room_label: SIM_ROOM_LABEL,
        silent: true,
      });
    }

    const rest = pool.slice(huddleCount);
    const shuffled = [...rest].sort(() => Math.random() - 0.5);
    const workers = shuffled.slice(0, Math.min(3, shuffled.length));
    for (const w of workers) {
      setSimStatus(w.id, 'working', LINES[Math.floor(Math.random() * (LINES.length - 1))], { silent: true });
    }
    const handoffPool = shuffled.slice(workers.length);
    if (handoffPool.length && Math.random() > 0.45) {
      const h = handoffPool[handoffPool.length - 1];
      setSimStatus(h.id, 'handoff', LINES[LINES.length - 1], { silent: true });
    }
    flushSimStatuses();
  };

  tick();
  timer = setInterval(tick, 9000);
}

export function stopSimulation(onChange) {
  running = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  clearSimStatuses();
  onChange?.(false);
}

export function toggleSimulation(onChange) {
  if (running) stopSimulation(onChange);
  else startSimulation(onChange);
  return running;
}
