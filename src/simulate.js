import { TEAM, LEAD_ID } from './team.js';
import { setSimStatus, clearSimStatuses } from './supabase.js';

const LINES = [
  'Preparing briefing notes',
  'Reviewing correspondence',
  'Updating schedule',
  'Drafting assessment remarks',
  'Checking infrastructure notes',
  'Compiling minutes',
  'Formal handoff in progress',
];

let timer = null;
let running = false;

export function isSimulating() {
  return running;
}

/**
 * Browser-only simulation. Never writes to Supabase.
 */
export function startSimulation(onChange) {
  if (running) return;
  running = true;
  onChange?.(true);

  const tick = () => {
    clearSimStatuses();
    // Most idle; a few working; occasionally one handoff
    const pool = TEAM.filter((t) => !t.isLead);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const workers = shuffled.slice(0, 3 + Math.floor(Math.random() * 3));
    for (const w of workers) {
      setSimStatus(w.id, 'working', LINES[Math.floor(Math.random() * (LINES.length - 1))]);
    }
    if (Math.random() > 0.35) {
      const h = shuffled[shuffled.length - 1];
      setSimStatus(h.id, 'handoff', LINES[LINES.length - 1]);
      setSimStatus(LEAD_ID, 'working', 'Receiving handoff');
    } else {
      setSimStatus(LEAD_ID, 'idle', '');
    }
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
