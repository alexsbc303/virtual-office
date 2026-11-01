import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { runPasswordGate } from './auth.js';
import { buildOffice, updateOfficeAnims } from './office.js';
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
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

function stateLabel(state) {
  if (state === 'working') return { en: 'Working', short: 'WORK', cls: 'is-working' };
  if (state === 'handoff') return { en: 'Handoff', short: 'HAND', cls: 'is-handoff' };
  return { en: 'Idle', short: 'IDLE', cls: 'is-idle' };
}

function createStatusBoard() {
  const list = document.getElementById('status-list');
  const summary = document.getElementById('status-summary');
  const board = document.getElementById('status-board');
  const toggle = document.getElementById('status-board-toggle');
  /** @type {Map<string, HTMLElement>} */
  const rows = new Map();

  for (const member of TEAM) {
    const li = document.createElement('li');
    li.className = 'status-row is-idle';
    li.dataset.botId = member.id;

    const swatch = document.createElement('span');
    swatch.className = 'status-swatch';
    swatch.style.background = member.color;
    swatch.title = member.color;

    const main = document.createElement('div');
    main.className = 'status-main';
    const name = document.createElement('div');
    name.className = 'status-name';
    name.textContent = member.name;
    const dept = document.createElement('div');
    dept.className = 'status-dept';
    dept.textContent = `${member.deptEn} · ${member.deptZh}`;
    const line = document.createElement('div');
    line.className = 'status-line';
    line.hidden = true;
    main.append(name, dept, line);

    const meta = document.createElement('div');
    meta.className = 'status-meta';
    const stateEl = document.createElement('span');
    stateEl.className = 'status-state';
    stateEl.textContent = 'IDLE';
    const ago = document.createElement('span');
    ago.className = 'status-ago';
    ago.textContent = '—';
    meta.append(stateEl, ago);

    li.append(swatch, main, meta);
    list.appendChild(li);
    rows.set(member.id, li);
  }

  // Start expanded so all 12 bots are scannable; user may collapse on mobile.
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

      const stateEl = li.querySelector('.status-state');
      const ago = li.querySelector('.status-ago');
      const line = li.querySelector('.status-line');
      stateEl.textContent = info.short;
      ago.textContent = relativeTime(st.updatedAt);

      if (st.line) {
        line.hidden = false;
        line.textContent = st.simulated ? `[SIM] ${st.line}` : st.line;
      } else {
        line.hidden = true;
        line.textContent = '';
      }

      if (st.state === 'working') working += 1;
      else if (st.state === 'handoff') handoff += 1;
      else idle += 1;
    }

    summary.querySelector('.sum-working').textContent = `${working} working`;
    summary.querySelector('.sum-handoff').textContent = `${handoff} handoff`;
    summary.querySelector('.sum-idle').textContent = `${idle} idle`;
  }

  return { refresh };
}

function sizeRenderer(renderer, camera, composer, bloom, canvas) {
  const parent = canvas.parentElement;
  const w = Math.max(1, parent?.clientWidth || window.innerWidth);
  const h = Math.max(1, parent?.clientHeight || window.innerHeight);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.setSize(w, h);
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

  const statusBoard = createStatusBoard();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const { scene, desks, animatables, leadDoor } = buildOffice();

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
  camera.position.set(-6, 14, 16);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(1, 0.5, 1);
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minDistance = 6;
  controls.maxDistance = 36;
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.85;
  controls.panSpeed = 0.55;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
  controls.update();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.18, 0.55, 0.88);
  composer.addPass(bloom);

  sizeRenderer(renderer, camera, composer, bloom, canvas);

  const bots = createBotManager(scene, desks, leadDoor);

  function refreshUsageUI() {
    const u = getUsageSnapshot();
    const en = usageBoard.querySelector('.usage-en');
    const zh = usageBoard.querySelector('.usage-zh');
    if (u.used_pct == null) {
      en.textContent = 'Weekly usage: — · Reset: —';
      zh.textContent = '本週用量：— · 重置：—';
      return;
    }
    const left = Math.max(0, 100 - Number(u.used_pct));
    let resetLabel = '—';
    if (u.reset_at) {
      try {
        resetLabel = new Date(u.reset_at).toLocaleString('en-HK', {
          timeZone: 'Asia/Hong_Kong',
          dateStyle: 'medium',
          timeStyle: 'short',
        });
      } catch {
        resetLabel = u.reset_at;
      }
    }
    en.textContent = `Weekly usage left: ${left.toFixed(1)}% · Reset: ${resetLabel}`;
    zh.textContent = `本週剩餘用量：${left.toFixed(1)}% · 重置：${resetLabel}`;
  }

  function refreshFeedWarning() {
    feedWarning.hidden = !isFeedQuiet();
  }

  function setSimChrome(on) {
    simBadge.hidden = !on;
    simBtn.classList.toggle('active', on);
  }

  function refreshAll() {
    bots.syncFromStatus();
    statusBoard.refresh();
    refreshUsageUI();
    refreshFeedWarning();
  }

  onStatusChange(() => {
    refreshAll();
  });

  await startStatusFeed();
  refreshAll();

  // Keep relative times fresh
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

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

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
    const rect = hoverPanel.getBoundingClientRect();
    let x = clientX + pad;
    let y = clientY + pad;
    if (x + Math.min(280, rect.width || 200) > window.innerWidth) x = clientX - 200;
    if (y + 110 > window.innerHeight) y = clientY - 110;
    hoverPanel.style.left = `${Math.max(8, x)}px`;
    hoverPanel.style.top = `${Math.max(8, y)}px`;
  }

  function pointerNdc(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  canvas.addEventListener('pointermove', (e) => {
    pointerNdc(e);
    raycaster.setFromCamera(pointer, camera);
    const member = bots.pickBot(raycaster);
    showHover(member, e.clientX, e.clientY);
    canvas.style.cursor = member ? 'pointer' : 'default';
  });

  canvas.addEventListener('pointerdown', (e) => {
    pointerNdc(e);
    raycaster.setFromCamera(pointer, camera);
    const member = bots.pickBot(raycaster);
    showHover(member, e.clientX, e.clientY);
  });

  window.addEventListener('resize', () => {
    sizeRenderer(renderer, camera, composer, bloom, canvas);
  });

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    controls.update();
    updateOfficeAnims(animatables, t);
    bots.update(dt, camera);
    composer.render();
  }
  frame();
}

boot().catch((err) => {
  console.error(err);
});
