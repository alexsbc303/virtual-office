/**
 * AS Virtual Office — Dallas-style HUD chrome + seated rilakkuma figures.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  buildOfficeScene,
  setupLighting,
  applyLightingMode,
  resolveLightingBand,
  createRenderer,
  createCamera,
} from './office.js';
import { createBotManager } from './bots.js';
import { mountPortal } from './portal.js';
import { TEAM } from './team.js';
import {
  startStatusFeed,
  onStatusChange,
  getEffectiveStatus,
  getUsageSnapshot,
  getFeedConnection,
  isFeedQuiet,
} from './supabase.js';
import { toggleSimulation, startSimulation } from './simulate.js';

function relativeTime(iso) {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (sec < 15) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

function formatClock(date = new Date()) {
  try {
    return date.toLocaleTimeString('en-HK', {
      timeZone: 'Asia/Hong_Kong',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return date.toLocaleTimeString();
  }
}

function stateLabel(state) {
  if (state === 'working') return { en: 'Working', short: 'Working', cls: 'is-working', dot: 'working' };
  if (state === 'handoff') return { en: 'Handoff', short: 'Handoff', cls: 'is-handoff', dot: 'handoff' };
  if (state === 'huddle') return { en: 'Huddle', short: 'Huddle', cls: 'is-huddle', dot: 'huddle' };
  if (state === 'waiting') return { en: 'Waiting', short: 'Waiting', cls: 'is-waiting', dot: 'idle' };
  if (state === 'error') return { en: 'Error', short: 'Error', cls: 'is-error', dot: 'error' };
  if (state === 'done') return { en: 'Done', short: 'Done', cls: 'is-done', dot: 'idle' };
  return { en: 'Idle', short: 'Idle', cls: 'is-idle', dot: 'idle' };
}

function displayLine(st) {
  const parts = [];
  if (st.line) parts.push(st.line);
  if (st.state === 'huddle' && st.roomLabel && st.roomLabel !== st.line) parts.push(st.roomLabel);
  let text = parts.join(' · ');
  if (st.simulated) text = text ? `[SIM] ${text}` : '[SIM]';
  return text;
}

function createActivityFeed() {
  const list = document.getElementById('activity-list');
  /** @type {{ t: number, text: string }[]} */
  const items = [];
  const max = 24;

  function render() {
    list.innerHTML = '';
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'activity-empty';
      li.textContent = 'Waiting for status updates…';
      list.appendChild(li);
      return;
    }
    for (const it of items) {
      const li = document.createElement('li');
      li.className = 'activity-item';
      const time = document.createElement('span');
      time.className = 'activity-time';
      time.textContent = formatClock(new Date(it.t));
      li.append(time, document.createTextNode(it.text));
      list.appendChild(li);
    }
  }

  function push(text) {
    items.unshift({ t: Date.now(), text });
    if (items.length > max) items.length = max;
    render();
  }

  render();
  return { push, render };
}

function createStatusBoard(activity, hooks = {}) {
  const list = document.getElementById('status-list');
  const board = document.getElementById('status-board');
  const toggle = document.getElementById('status-board-toggle');
  const teamCount = document.getElementById('team-count');
  /** @type {Map<string, HTMLElement>} */
  const rows = new Map();
  /** @type {Map<string, string>} */
  const lastKey = new Map();

  teamCount.textContent = String(TEAM.length);

  for (const member of TEAM) {
    const li = document.createElement('li');
    li.className = 'team-row is-idle';
    li.dataset.botId = member.id;

    const swatch = document.createElement('span');
    swatch.className = 'team-dot';
    swatch.style.background = member.color;

    const main = document.createElement('div');
    main.className = 'team-main';
    const name = document.createElement('div');
    name.className = 'team-name';
    name.textContent = member.name;
    const dept = document.createElement('div');
    dept.className = 'team-dept';
    dept.textContent = `${member.deptEn} · ${member.deptZh}`;
    const line = document.createElement('div');
    line.className = 'team-line';
    line.hidden = true;
    const portalBadge = document.createElement('div');
    portalBadge.className = 'team-portal';
    portalBadge.hidden = true;
    main.append(name, dept, line, portalBadge);

    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.addEventListener('click', () => hooks.onSelect?.(member));
    li.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        hooks.onSelect?.(member);
      }
    });

    const meta = document.createElement('div');
    meta.className = 'team-meta';
    const stateEl = document.createElement('span');
    stateEl.className = 'team-state';
    stateEl.innerHTML = '<i class="dot idle"></i>Idle';
    const ago = document.createElement('span');
    ago.className = 'team-ago';
    ago.textContent = '—';
    meta.append(stateEl, ago);

    li.append(swatch, main, meta);
    list.appendChild(li);
    rows.set(member.id, li);
  }

  board.classList.remove('collapsed');
  toggle.setAttribute('aria-expanded', 'true');
  toggle.addEventListener('click', () => {
    const collapsed = board.classList.toggle('collapsed');
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  });

  function refresh() {
    let working = 0;
    let handoff = 0;
    let huddle = 0;
    let idle = 0;

    for (const member of TEAM) {
      const st = getEffectiveStatus(member.id);
      const li = rows.get(member.id);
      if (!li) continue;
      const info = stateLabel(st.state);
      li.classList.remove('is-working', 'is-handoff', 'is-huddle', 'is-idle', 'is-waiting', 'is-error', 'is-done');
      li.classList.add(info.cls);
      li.classList.toggle('is-selected', !!hooks.isSelected?.(member.id));
      li.setAttribute('aria-pressed', hooks.isSelected?.(member.id) ? 'true' : 'false');

      const queued = hooks.portalCount?.(member.id) || 0;
      const badge = li.querySelector('.team-portal');
      if (badge) {
        badge.hidden = queued < 1;
        badge.textContent = queued > 1 ? `已交總管 · ${queued}` : '已交總管';
      }

      const stateEl = li.querySelector('.team-state');
      const ago = li.querySelector('.team-ago');
      const line = li.querySelector('.team-line');
      const short = st.simulated && st.state === 'huddle' ? 'Huddle SIM' : info.short;
      stateEl.innerHTML = `<i class="dot ${info.dot}"></i>${short}`;
      ago.textContent = relativeTime(st.updatedAt);

      const lineText = displayLine(st);
      if (lineText) {
        line.hidden = false;
        line.textContent = lineText;
      } else {
        line.hidden = true;
        line.textContent = '';
      }

      const key = `${st.state}|${lineText}|${st.simulated ? 'sim' : 'live'}`;
      const prev = lastKey.get(member.id);
      if (prev != null && prev !== key) {
        const verb =
          st.state === 'working'
            ? lineText || 'started working'
            : st.state === 'handoff'
              ? lineText || 'started handoff'
              : st.state === 'huddle'
                ? lineText || 'joined huddle'
                : st.state === 'waiting'
                  ? lineText || 'waiting'
                  : st.state === 'error'
                    ? lineText || 'error'
                    : st.state === 'done'
                      ? lineText || 'done'
                      : 'went idle';
        activity.push(`${member.name}: ${verb}`);
      }
      lastKey.set(member.id, key);

      if (st.state === 'working') working += 1;
      else if (st.state === 'handoff') handoff += 1;
      else if (st.state === 'huddle') huddle += 1;
      else idle += 1;
    }

    document.getElementById('hud-working').textContent = String(working);
    document.getElementById('hud-huddle').textContent = String(huddle);
    document.getElementById('hud-handoff').textContent = String(handoff);
    document.getElementById('hud-idle').textContent = String(idle);
    // Free desks ≈ seated and not in a meeting (idle, waiting, error, done)
    document.getElementById('hud-free').textContent = String(idle);
  }

  return { refresh };
}

async function boot() {
  const canvas = document.getElementById('office-canvas');
  const hoverPanel = document.getElementById('hover-panel');
  const hoverName = document.getElementById('hover-name');
  const hoverDept = document.getElementById('hover-dept');
  const hoverStatus = document.getElementById('hover-status');
  const usageBoard = document.getElementById('usage-board');
  const feedWarning = document.getElementById('feed-warning');
  const feedConn = document.getElementById('feed-conn');
  const simBtn = document.getElementById('simulate-btn');
  const simBadge = document.getElementById('sim-badge');

  const activity = createActivityFeed();
  let selectedId = '';
  /** @type {ReturnType<typeof mountPortal> | null} */
  let portal = null;
  const statusBoard = createStatusBoard(activity, {
    onSelect: (member) => selectBot(member),
    isSelected: (id) => id === selectedId,
    portalCount: (id) => portal?.countFor(id) || 0,
  });
  portal = mountPortal({
    onChange: () => statusBoard.refresh(),
    onActivity: (text) => activity.push(text),
  });

  function selectBot(member) {
    if (!member) return;
    selectedId = member.id;
    portal.select(member);
    statusBoard.refresh();
  }

  const scene = new THREE.Scene();
  const lights = setupLighting(scene);

  const renderer = createRenderer(canvas);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const parent = canvas.parentElement;
  let w = Math.max(1, parent?.clientWidth || window.innerWidth);
  let h = Math.max(1, parent?.clientHeight || window.innerHeight);
  renderer.setSize(w, h, false);

  const camera = createCamera(w / h);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0.2, 0.3, 0.2);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 11;
  controls.maxDistance = 28;
  controls.maxPolarAngle = Math.PI * 0.42;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.enablePan = false;
  controls.rotateSpeed = 0.4;
  controls.update();

  const loader = new THREE.TextureLoader();
  const { desks } = buildOfficeScene(scene, loader);
  const bots = createBotManager(scene, desks, camera);

  const params = new URLSearchParams(window.location.search);
  const lightModes = new Set(['now', 'day', 'evening', 'night']);
  const requestedLight = params.get('light');
  let lightMode = lightModes.has(requestedLight) ? requestedLight : 'now';
  let appliedBand = '';
  const lightNow = document.getElementById('light-now');
  const hkClock = document.getElementById('hk-clock');

  function paintLighting() {
    const band = resolveLightingBand(lightMode);
    const exposure = applyLightingMode(scene, lights, lightMode);
    renderer.toneMappingExposure = exposure;
    appliedBand = band;
    if (hkClock) hkClock.textContent = formatClock();
    if (lightNow) {
      lightNow.dataset.band = band;
      lightNow.title = `Asia/Hong_Kong · ${band}`;
      lightNow.setAttribute('aria-label', `Now · Asia/Hong_Kong · ${band}`);
    }
  }

  function tickLighting() {
    if (hkClock) hkClock.textContent = formatClock();
    if (lightMode !== 'now') return;
    if (resolveLightingBand('now') !== appliedBand) paintLighting();
  }

  paintLighting();
  setInterval(tickLighting, 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') tickLighting();
  });

  function resize() {
    w = Math.max(1, parent?.clientWidth || window.innerWidth);
    h = Math.max(1, parent?.clientHeight || window.innerHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);
  resize();

  function refreshUsageUI() {
    const u = getUsageSnapshot();
    const en = usageBoard.querySelector('.usage-en');
    if (u.used_pct == null) {
      en.textContent = 'Weekly usage: —';
      return;
    }
    const left = Math.max(0, 100 - Number(u.used_pct));
    en.textContent = `Weekly usage left: ${left.toFixed(1)}%`;
  }

  function refreshFeedWarning() {
    feedWarning.hidden = !isFeedQuiet();
  }

  function refreshFeedConnection() {
    const state = getFeedConnection();
    const label = {
      connected: 'Feed · connected',
      reconnecting: 'Feed · reconnecting',
      error: 'Feed · error',
      connecting: 'Feed · connecting',
      offline: 'Feed · offline',
    };
    feedConn.dataset.state = state;
    feedConn.textContent = label[state] || label.offline;
  }

  function setSimChrome(on) {
    simBadge.hidden = !on;
    simBtn.classList.toggle('active', on);
    simBtn.childNodes[0].textContent = on ? 'Stop Simulation' : 'Simulate Work';
  }

  function refreshAll() {
    bots.syncFromStatus();
    statusBoard.refresh();
    refreshUsageUI();
    refreshFeedWarning();
    refreshFeedConnection();
  }

  onStatusChange(() => refreshAll());
  await startStatusFeed();
  refreshAll();
  // Re-check stale huddle/working even when no new Realtime row arrives.
  setInterval(() => {
    bots.syncFromStatus();
    statusBoard.refresh();
    refreshFeedWarning();
    refreshFeedConnection();
  }, 15_000);

  simBtn.addEventListener('click', () => {
    toggleSimulation(setSimChrome);
    refreshAll();
  });

  if (params.get('simulate') === '1') {
    startSimulation(setSimChrome);
    refreshAll();
  }

  function showHover(member, clientX, clientY) {
    if (!member) {
      hoverPanel.hidden = true;
      return;
    }
    const st = getEffectiveStatus(member.id);
    hoverName.textContent = member.name;
    hoverDept.textContent = `${member.deptEn} · ${member.deptZh}`;
    const stateText = {
      working: 'Working · 工作中',
      handoff: 'Handoff · 交接中',
      huddle: 'Huddle · 會議中',
      waiting: 'Waiting · 等待',
      error: 'Error · 錯誤',
      done: 'Done · 完成',
      idle: 'Idle · 閒置',
    }[st.state] || 'Idle · 閒置';
    const lineText = displayLine(st);
    hoverStatus.textContent = lineText ? `${stateText} — ${lineText}` : stateText;
    hoverPanel.hidden = false;
    const pad = 12;
    let x = clientX + pad;
    let y = clientY + pad;
    if (x + 200 > window.innerWidth) x = clientX - 200;
    if (y + 110 > window.innerHeight) y = clientY - 110;
    hoverPanel.style.left = `${Math.max(8, x)}px`;
    hoverPanel.style.top = `${Math.max(8, y)}px`;
  }

  canvas.addEventListener('pointermove', (e) => {
    const member = bots.pickBot(canvas, e.clientX, e.clientY);
    showHover(member, e.clientX, e.clientY);
    canvas.style.cursor = member ? 'pointer' : 'grab';
  });
  let press = null;
  canvas.addEventListener('pointerdown', (e) => {
    const member = bots.pickBot(canvas, e.clientX, e.clientY);
    showHover(member, e.clientX, e.clientY);
    press = member ? { id: member.id, x: e.clientX, y: e.clientY, member } : null;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!press) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    const member = press.member;
    press = null;
    if (dx * dx + dy * dy > 36) return;
    const still = bots.pickBot(canvas, e.clientX, e.clientY);
    if (still && still.id === member.id) selectBot(member);
  });
  canvas.addEventListener('pointerleave', () => {
    hoverPanel.hidden = true;
  });

  let userDriving = false;
  let swayT = 0;
  const basePos = camera.position.clone();

  const cam = params.get('cam');
  const camPresets = {
    closeup: { pos: [-1.5, 5.5, 2.5], target: [-4.5, 0.6, -3.5] },
    focus: { pos: [-1.5, 5.5, 2.5], target: [-4.5, 0.6, -3.5] },
    itss1: { pos: [-2.5, 7.2, 1.8], target: [-5.0, 0.5, -3.5] },
    programming: { pos: [4.5, 6.5, 2.0], target: [1.15, 0.5, -3.8] },
    general: { pos: [3.5, 7.0, 11.0], target: [-0.3, 0.5, 3.5] },
    self: { pos: [11.5, 6.5, 2.0], target: [5.0, 0.5, -3.8] },
    social: { pos: [11.5, 6.5, 2.0], target: [5.5, 0.5, -3.5] },
    plants: { pos: [10.5, 5.8, -1.5], target: [6.5, 0.7, -4.0] },
    // From the office floor, looking at 總管's face across the guest lip.
    lead: { pos: [3.5, 6.4, 0.2], target: [4.05, 0.9, 4.7] },
    reception: { pos: [4.2, 11.4, 0.15], target: [4.15, 0.35, 4.2] },
    overview: { pos: [12.5, 11.5, 13.5], target: [0.2, 0.3, 0.2] },
    meeting: { pos: [-5.7, 11.4, 8.4], target: [-5.6, 0.2, 3.3] },
  };
  if (cam && camPresets[cam]) {
    const p = camPresets[cam];
    camera.position.set(...p.pos);
    controls.target.set(...p.target);
    basePos.copy(camera.position);
    controls.update();
  }

  controls.addEventListener('start', () => {
    userDriving = true;
  });
  controls.addEventListener('end', () => {
    userDriving = false;
    basePos.copy(camera.position);
    swayT = 0;
  });

  window.addEventListener('vo-set-camera', (ev) => {
    const mode = ev.detail?.mode;
    if (mode === 'overview') {
      camera.position.set(12.5, 11.5, 13.5);
      controls.target.set(0.2, 0.3, 0.2);
      basePos.copy(camera.position);
      controls.update();
    }
  });

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    bots.update(dt);
    controls.update();
    if (!userDriving) {
      swayT += dt;
      camera.position.x = basePos.x + Math.sin(swayT * 0.18) * 0.2;
      camera.position.y = basePos.y + Math.sin(swayT * 0.14) * 0.06;
      camera.lookAt(controls.target);
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

boot().catch((err) => {
  console.error(err);
});
