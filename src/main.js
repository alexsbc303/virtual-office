/**
 * AS Virtual Office — Dallas-style HUD chrome + seated rilakkuma figures.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { runPasswordGate } from './auth.js';
import {
  buildOfficeScene,
  setupLighting,
  applyLightingMode,
  createRenderer,
  createCamera,
} from './office.js';
import { createBotManager } from './bots.js';
import { TEAM } from './team.js';
import {
  startStatusFeed,
  onStatusChange,
  getEffectiveStatus,
  getUsageSnapshot,
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
  if (state === 'working') return { en: 'Working', short: 'Working', cls: 'is-working' };
  if (state === 'handoff') return { en: 'Handoff', short: 'Handoff', cls: 'is-handoff' };
  return { en: 'Idle', short: 'Idle', cls: 'is-idle' };
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

function createStatusBoard(activity) {
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
    main.append(name, dept, line);

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
    let idle = 0;

    for (const member of TEAM) {
      const st = getEffectiveStatus(member.id);
      const li = rows.get(member.id);
      if (!li) continue;
      const info = stateLabel(st.state);
      li.classList.remove('is-working', 'is-handoff', 'is-idle');
      li.classList.add(info.cls);

      const stateEl = li.querySelector('.team-state');
      const ago = li.querySelector('.team-ago');
      const line = li.querySelector('.team-line');
      const dotCls = st.state === 'working' ? 'working' : st.state === 'handoff' ? 'handoff' : 'idle';
      stateEl.innerHTML = `<i class="dot ${dotCls}"></i>${info.short}`;
      ago.textContent = relativeTime(st.updatedAt);

      const lineText = st.line ? (st.simulated ? `[SIM] ${st.line}` : st.line) : '';
      if (lineText) {
        line.hidden = false;
        line.textContent = lineText;
      } else {
        line.hidden = true;
        line.textContent = '';
      }

      const key = `${st.state}|${lineText}`;
      const prev = lastKey.get(member.id);
      if (prev != null && prev !== key) {
        const verb =
          st.state === 'working'
            ? lineText || 'started working'
            : st.state === 'handoff'
              ? lineText || 'started handoff'
              : 'went idle';
        activity.push(`${member.name}: ${verb}`);
      }
      lastKey.set(member.id, key);

      if (st.state === 'working') working += 1;
      else if (st.state === 'handoff') handoff += 1;
      else idle += 1;
    }

    document.getElementById('hud-working').textContent = String(working);
    document.getElementById('hud-handoff').textContent = String(handoff);
    document.getElementById('hud-idle').textContent = String(idle);
    // Free desks ≈ idle seats (bots at desks but not busy)
    document.getElementById('hud-free').textContent = String(idle);
  }

  return { refresh };
}

async function boot() {
  await runPasswordGate();

  const canvas = document.getElementById('office-canvas');
  const hoverPanel = document.getElementById('hover-panel');
  const hoverName = document.getElementById('hover-name');
  const hoverDept = document.getElementById('hover-dept');
  const hoverStatus = document.getElementById('hover-status');
  const usageBoard = document.getElementById('usage-board');
  const feedWarning = document.getElementById('feed-warning');
  const simBtn = document.getElementById('simulate-btn');
  const simBadge = document.getElementById('sim-badge');

  const activity = createActivityFeed();
  const statusBoard = createStatusBoard(activity);

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
  controls.target.set(-0.5, 0.4, 0.2);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 10;
  controls.maxDistance = 24;
  controls.maxPolarAngle = Math.PI * 0.42;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.enablePan = false;
  controls.rotateSpeed = 0.4;
  controls.update();

  const loader = new THREE.TextureLoader();
  const { desks } = buildOfficeScene(scene, loader);
  const bots = createBotManager(scene, desks, camera);

  // Lighting toggle
  let lightMode = 'day';
  const timeBtns = [...document.querySelectorAll('.time-btn')];
  function setLightMode(mode) {
    lightMode = mode;
    timeBtns.forEach((b) => b.classList.toggle('active', b.dataset.light === mode));
    const exposure = applyLightingMode(scene, lights, mode);
    renderer.toneMappingExposure = exposure;
  }
  timeBtns.forEach((btn) => {
    btn.addEventListener('click', () => setLightMode(btn.dataset.light || 'day'));
  });
  setLightMode('day');

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
  }

  onStatusChange(() => refreshAll());
  await startStatusFeed();
  refreshAll();
  setInterval(() => statusBoard.refresh(), 15_000);

  simBtn.addEventListener('click', () => {
    toggleSimulation(setSimChrome);
    refreshAll();
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('simulate') === '1') {
    startSimulation(setSimChrome);
    refreshAll();
  }
  if (params.get('light')) {
    setLightMode(params.get('light'));
  }

  function showHover(member, clientX, clientY) {
    if (!member) {
      hoverPanel.hidden = true;
      return;
    }
    const st = getEffectiveStatus(member.id);
    hoverName.textContent = member.name;
    hoverDept.textContent = `${member.deptEn} · ${member.deptZh}`;
    const stateText =
      st.state === 'working'
        ? 'Working · 工作中'
        : st.state === 'handoff'
          ? 'Handoff · 交接中'
          : 'Idle · 閒置';
    hoverStatus.textContent = st.line ? `${stateText} — ${st.line}` : stateText;
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
  canvas.addEventListener('pointerdown', (e) => {
    const member = bots.pickBot(canvas, e.clientX, e.clientY);
    showHover(member, e.clientX, e.clientY);
  });
  canvas.addEventListener('pointerleave', () => {
    hoverPanel.hidden = true;
  });

  let userDriving = false;
  let swayT = 0;
  const basePos = camera.position.clone();

  const cam = params.get('cam');
  if (cam === 'closeup') {
    camera.position.set(2.2, 3.2, 6.5);
    controls.target.set(-3.2, 0.7, 2.8);
    basePos.copy(camera.position);
    controls.update();
  } else if (cam === 'lead') {
    camera.position.set(7.2, 4.2, 2.4);
    controls.target.set(3.2, 0.8, -2.2);
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
      camera.position.set(11.5, 9.2, 11.8);
      controls.target.set(-0.5, 0.4, 0.2);
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
