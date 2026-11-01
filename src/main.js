import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { runPasswordGate } from './auth.js';
import { buildOffice, updateOfficeAnims } from './office.js';
import { createBotManager } from './bots.js';
import {
  startStatusFeed,
  onStatusChange,
  getEffectiveStatus,
  getUsageSnapshot,
  isFeedQuiet,
} from './supabase.js';
import { toggleSimulation, startSimulation, isSimulating } from './simulate.js';

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

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const { scene, desks, animatables, leadDoor } = buildOffice();

  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.set(-6, 14, 16);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(1, 0.5, 1);
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minDistance = 6;
  controls.maxDistance = 36;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.update();

  // Restrained bloom (light bars / LEDs only feel)
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.18,
    0.55,
    0.88,
  );
  composer.addPass(bloom);

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

  onStatusChange(() => {
    bots.syncFromStatus();
    refreshUsageUI();
    refreshFeedWarning();
  });

  await startStatusFeed();
  bots.syncFromStatus();
  refreshUsageUI();
  refreshFeedWarning();

  simBtn.addEventListener('click', () => {
    const on = toggleSimulation(setSimChrome);
    bots.syncFromStatus();
    void on;
  });

  // ?simulate=1 auto-starts
  const params = new URLSearchParams(window.location.search);
  if (params.get('simulate') === '1') {
    startSimulation(setSimChrome);
    bots.syncFromStatus();
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
    const stateLabel =
      st.state === 'working'
        ? 'Working · 工作中'
        : st.state === 'handoff'
          ? 'Handoff · 交接中'
          : 'Idle · 閒置';
    hoverStatus.textContent = st.line
      ? `${stateLabel} — ${st.line}`
      : stateLabel;
    hoverPanel.hidden = false;
    const pad = 12;
    let x = clientX + pad;
    let y = clientY + pad;
    if (x + 280 > window.innerWidth) x = clientX - 280;
    if (y + 100 > window.innerHeight) y = clientY - 100;
    hoverPanel.style.left = `${x}px`;
    hoverPanel.style.top = `${y}px`;
  }

  canvas.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const member = bots.pickBot(raycaster);
    showHover(member, e.clientX, e.clientY);
    canvas.style.cursor = member ? 'pointer' : 'default';
  });

  canvas.addEventListener('pointerdown', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const member = bots.pickBot(raycaster);
    showHover(member, e.clientX, e.clientY);
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloom.setSize(window.innerWidth, window.innerHeight);
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
