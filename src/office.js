import * as THREE from 'three';
import { TEAM, LEAD_ID } from './team.js';

/** Palette — formal HKSAR departmental, neutral */
const C = {
  floor: 0xc5ccd4,
  carpet: 0xb0bac4,
  wall: 0xe8ecf0,
  glass: 0xa8c4d8,
  frame: 0x6a7684,
  desk: 0x8d6e63,
  deskTop: 0xd7ccc8,
  plant: 0x2e7d32,
  pot: 0x795548,
  sky: 0x9eb8d0,
  harbour: 0x5a7a92,
  building: 0x7a8896,
  screen: 0x1a2332,
  rack: 0x37474f,
  ledOn: 0x66bb6a,
  ledOff: 0x1b5e20,
  labelBg: 0xf5f7f9,
  teaCounter: 0xa1887f,
  meetingTable: 0x6d4c41,
};

/**
 * Desk / zone positions for each bot (world XZ). Lead in corner office.
 */
export function deskLayout() {
  const desks = new Map();
  // Lead corner office (+X, +Z)
  desks.set(LEAD_ID, { x: 10.5, z: 10.2, rot: Math.PI, zone: 'lead' });

  const openPlan = [
    { id: '26fffc1c-3c69-4346-8a68-199db47277fd', x: -8, z: 4, rot: 0 },
    { id: '4f070b62-ac92-4824-9953-886cda5433d1', x: -5, z: 4, rot: 0 },
    { id: '28c84d63-5b73-4b78-aebc-3a2e02376fc2', x: -2, z: 4, rot: 0 },
    { id: '2fb3b7e8-b556-45ea-8b10-1ced7f05c0b4', x: 1, z: 4, rot: 0 },
    { id: '9f0fa493-9994-409c-b398-974b67de306e', x: 4, z: 4, rot: 0 },
    { id: 'aecd27e2-8d49-4c33-962c-cdfa1860fd26', x: -8, z: -2, rot: Math.PI },
    { id: 'b7c9b07d-4a12-49af-bbdf-7fa19bdc96b2', x: -5, z: -2, rot: Math.PI },
    { id: '5f8f09c0-fe3d-40a5-87c1-2fcc440bb9c3', x: -2, z: -2, rot: Math.PI },
    { id: 'c7f037b0-0082-4290-a543-00f203e4c150', x: 1, z: -2, rot: Math.PI },
    { id: '764c93f4-9330-4daa-9f86-481be3b19e60', x: 4, z: -2, rot: Math.PI },
    { id: '6a0dc819-57c2-4507-ae25-f3b3122c3f46', x: 7, z: 1, rot: -Math.PI / 2 },
  ];
  for (const d of openPlan) {
    desks.set(d.id, { x: d.x, z: d.z, rot: d.rot, zone: 'open' });
  }
  return desks;
}

export const LEAD_OFFICE_DOOR = { x: 8.2, z: 8.5 };

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.85,
    metalness: opts.metalness ?? 0.05,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

function box(w, h, d, color, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rTop, rBot, h, color, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 12), mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Canvas texture for bilingual EN-above-ZH labels */
function makeLabelTexture(en, zh, w = 512, h = 128) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f5f7f9';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#9aa5b0';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.fillStyle = '#1a2332';
  ctx.font = '600 36px "Segoe UI", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(en, w / 2, 52);
  ctx.fillStyle = '#5a6570';
  ctx.font = '400 28px "Noto Sans TC", "Segoe UI", sans-serif';
  ctx.fillText(zh, w / 2, 96);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wallLabel(en, zh, width = 2.4) {
  const g = new THREE.Group();
  const plate = box(width, 0.45, 0.04, C.labelBg, { roughness: 0.7 });
  const tex = makeLabelTexture(en, zh);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.92, 0.36),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  face.position.z = 0.025;
  g.add(plate, face);
  return g;
}

function plant(scale = 1) {
  const g = new THREE.Group();
  const potM = cyl(0.18 * scale, 0.22 * scale, 0.28 * scale, C.pot);
  potM.position.y = 0.14 * scale;
  const foliage = cyl(0.05 * scale, 0.35 * scale, 0.55 * scale, C.plant, { roughness: 0.95 });
  foliage.position.y = 0.5 * scale;
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.28 * scale, 10, 8),
    mat(C.plant, { roughness: 0.95 }),
  );
  top.position.y = 0.75 * scale;
  top.castShadow = true;
  g.add(potM, foliage, top);
  return g;
}

function deskUnit(colorAccent = C.desk) {
  const g = new THREE.Group();
  const top = box(1.6, 0.06, 0.8, C.deskTop);
  top.position.y = 0.72;
  const body = box(1.5, 0.55, 0.7, colorAccent);
  body.position.y = 0.4;
  const mon = box(0.55, 0.35, 0.04, C.screen, { roughness: 0.4, metalness: 0.2 });
  mon.position.set(0, 1.0, -0.2);
  const stand = box(0.08, 0.2, 0.08, 0x455a64);
  stand.position.set(0, 0.82, -0.2);
  const chair = box(0.45, 0.08, 0.45, 0x546e7a);
  chair.position.set(0, 0.42, 0.65);
  const back = box(0.45, 0.45, 0.06, 0x455a64);
  back.position.set(0, 0.65, 0.85);
  g.add(top, body, mon, stand, chair, back);
  return g;
}

function glassPartition(w, h, d = 0.06) {
  const g = new THREE.Group();
  const glass = box(w, h, d, C.glass, { transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0.1 });
  glass.position.y = h / 2;
  const frameL = box(0.06, h, d + 0.02, C.frame);
  frameL.position.set(-w / 2, h / 2, 0);
  const frameR = box(0.06, h, d + 0.02, C.frame);
  frameR.position.set(w / 2, h / 2, 0);
  const frameT = box(w + 0.06, 0.06, d + 0.02, C.frame);
  frameT.position.set(0, h, 0);
  g.add(glass, frameL, frameR, frameT);
  return g;
}

/**
 * Build static office scene. Returns { scene, desks, animatables }.
 */
export function buildOffice() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd4dde6);
  scene.fog = new THREE.Fog(0xd4dde6, 28, 55);

  // Lights — neutral, restrained
  const hemi = new THREE.HemisphereLight(0xe8eef4, 0x8a9199, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff8f0, 0.75);
  sun.position.set(12, 22, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xc5d0dc, 0.25);
  fill.position.set(-10, 10, -8);
  scene.add(fill);

  // Floor slab
  const floor = box(28, 0.12, 24, C.floor);
  floor.position.set(0, -0.06, 0);
  scene.add(floor);

  // Carpet zones
  const openCarpet = box(18, 0.02, 12, C.carpet);
  openCarpet.position.set(-1, 0.01, 1);
  scene.add(openCarpet);

  // Outer walls (low)
  const wallH = 3.2;
  const north = box(28, wallH, 0.2, C.wall);
  north.position.set(0, wallH / 2, -12);
  const south = box(28, wallH, 0.2, C.wall);
  south.position.set(0, wallH / 2, 12);
  const west = box(0.2, wallH, 24, C.wall);
  west.position.set(-14, wallH / 2, 0);
  const east = box(0.2, wallH, 24, C.wall);
  east.position.set(14, wallH / 2, 0);
  scene.add(north, south, west, east);

  // Ceiling strip lights (simple)
  for (let i = -3; i <= 3; i++) {
    const lightBar = box(3.5, 0.05, 0.25, 0xf5f5f0, {
      emissive: 0xf5f5f0,
      emissiveIntensity: 0.35,
      roughness: 0.5,
    });
    lightBar.position.set(i * 3.5 - 1, wallH - 0.1, 0);
    scene.add(lightBar);
  }

  // —— Lead glass corner office (+X +Z) ——
  const leadFloor = box(6.5, 0.025, 5.5, 0xa8b4c0);
  leadFloor.position.set(10.5, 0.02, 9.5);
  scene.add(leadFloor);

  const leadGlassW = glassPartition(5.5, 2.6);
  leadGlassW.position.set(7.5, 0, 9.5);
  leadGlassW.rotation.y = Math.PI / 2;
  scene.add(leadGlassW);
  const leadGlassS = glassPartition(6.5, 2.6);
  leadGlassS.position.set(10.5, 0, 6.8);
  scene.add(leadGlassS);

  const leadLabel = wallLabel('Directorate Office', '總管室', 2.6);
  leadLabel.position.set(7.55, 2.4, 9.5);
  leadLabel.rotation.y = Math.PI / 2;
  scene.add(leadLabel);

  // Harbour / skyline view (simple geometry beyond east windows)
  const skyPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5),
    mat(C.sky, { roughness: 1 }),
  );
  skyPlane.position.set(15.5, 2.2, 6);
  skyPlane.rotation.y = -Math.PI / 2;
  scene.add(skyPlane);

  const harbour = box(0.3, 0.4, 12, C.harbour);
  harbour.position.set(15.2, 0.3, 5);
  scene.add(harbour);

  for (let i = 0; i < 6; i++) {
    const bh = 1.2 + (i % 3) * 0.7;
    const b = box(0.8, bh, 1.1, C.building);
    b.position.set(16.2 + (i % 2) * 0.9, bh / 2, 2 + i * 1.6);
    scene.add(b);
  }

  // Lead desk
  const leadDesk = deskUnit(0x6d4c41);
  leadDesk.position.set(10.5, 0, 10.2);
  leadDesk.rotation.y = Math.PI;
  scene.add(leadDesk);

  // —— Meeting room (−X −Z corner) ——
  const meetGlassN = glassPartition(7, 2.6);
  meetGlassN.position.set(-10, 0, -5);
  scene.add(meetGlassN);
  const meetGlassE = glassPartition(6, 2.6);
  meetGlassE.position.set(-6.5, 0, -8);
  meetGlassE.rotation.y = Math.PI / 2;
  scene.add(meetGlassE);

  const meetLabel = wallLabel('Meeting Room', '會議室', 2.2);
  meetLabel.position.set(-10, 2.4, -4.9);
  scene.add(meetLabel);

  const table = box(3.2, 0.08, 1.4, C.meetingTable);
  table.position.set(-10.5, 0.75, -8.5);
  scene.add(table);
  const tableLeg = box(2.8, 0.7, 1.0, 0x5d4037);
  tableLeg.position.set(-10.5, 0.35, -8.5);
  scene.add(tableLeg);

  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const idx = i % 3;
    const ch = box(0.4, 0.08, 0.4, 0x607d8b);
    ch.position.set(-11.5 + idx * 1.0, 0.42, -8.5 + side * 1.1);
    const bk = box(0.4, 0.4, 0.05, 0x546e7a);
    bk.position.set(-11.5 + idx * 1.0, 0.62, -8.5 + side * 1.3);
    scene.add(ch, bk);
  }

  // —— Tea room / pantry (HK gov style) ——
  const teaLabel = wallLabel('Tea Room / Pantry', '茶水間', 2.4);
  teaLabel.position.set(10, 2.4, -10.5);
  teaLabel.rotation.y = -0.2;
  scene.add(teaLabel);

  const counter = box(3.5, 0.9, 0.7, C.teaCounter);
  counter.position.set(11, 0.45, -10);
  scene.add(counter);
  const sink = box(0.5, 0.08, 0.4, 0xb0bec5);
  sink.position.set(10.2, 0.92, -10);
  scene.add(sink);
  const kettle = cyl(0.12, 0.14, 0.28, 0x90a4ae);
  kettle.position.set(11.2, 1.1, -10);
  scene.add(kettle);
  const cups = box(0.35, 0.2, 0.25, 0xeceff1);
  cups.position.set(11.8, 1.0, -10);
  scene.add(cups);
  const fridge = box(0.7, 1.6, 0.65, 0xcfd8dc);
  fridge.position.set(13, 0.8, -10);
  scene.add(fridge);

  // —— Research area with animated screens ——
  const researchLabel = wallLabel('Research Area', '研究區', 2.2);
  researchLabel.position.set(-3, 2.4, -10.8);
  scene.add(researchLabel);

  const animatables = { screens: [], racks: [] };

  for (let i = 0; i < 3; i++) {
    const stand = box(1.2, 1.4, 0.08, 0x37474f);
    stand.position.set(-5 + i * 2.2, 0.9, -11.2);
    scene.add(stand);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 160;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.05, 0.7),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
    screen.position.set(-5 + i * 2.2, 1.15, -11.15);
    scene.add(screen);
    animatables.screens.push({ canvas, tex, kind: i }); // 0 chart, 1 map, 2 terminal
  }

  // —— Technical zone: server racks ——
  const techLabel = wallLabel('Technical Zone', '技術區', 2.2);
  techLabel.position.set(6.5, 2.4, -5);
  techLabel.rotation.y = -Math.PI / 2;
  scene.add(techLabel);

  for (let i = 0; i < 4; i++) {
    const rack = box(0.7, 2.0, 0.5, C.rack, { roughness: 0.6, metalness: 0.25 });
    rack.position.set(8 + (i % 2) * 1.0, 1.0, -2 - Math.floor(i / 2) * 1.2);
    scene.add(rack);
    const leds = [];
    for (let r = 0; r < 8; r++) {
      const led = box(0.08, 0.06, 0.02, C.ledOff, {
        emissive: C.ledOff,
        emissiveIntensity: 0.4,
      });
      led.position.set(8 + (i % 2) * 1.0 + 0.2, 0.3 + r * 0.2, -2 - Math.floor(i / 2) * 1.2 + 0.26);
      scene.add(led);
      leds.push(led);
    }
    animatables.racks.push(leds);
  }

  // Glass partitions for open floor zoning
  const midGlass = glassPartition(10, 2.4);
  midGlass.position.set(-1, 0, 1);
  scene.add(midGlass);

  const openLabel = wallLabel('Open Office', '開放式辦公區', 2.6);
  openLabel.position.set(-1, 2.55, 1.1);
  scene.add(openLabel);

  // Desks for team (except lead already placed)
  const desks = deskLayout();
  for (const member of TEAM) {
    if (member.isLead) continue;
    const d = desks.get(member.id);
    if (!d) continue;
    const unit = deskUnit(parseInt(member.color.slice(1), 16));
    unit.position.set(d.x, 0, d.z);
    unit.rotation.y = d.rot;
    scene.add(unit);
  }

  // Plants — plenty
  const plantSpots = [
    [-12, 10], [-12, 5], [-12, -3], [-12, -10],
    [12, 5], [5, 11], [-6, 11], [0, -6],
    [3, -11], [-8, -6], [13, -5], [7, 7],
    [-3, 7], [10, -7], [-10, 2], [2, 8],
  ];
  for (const [px, pz] of plantSpots) {
    const p = plant(0.85 + Math.random() * 0.3);
    p.position.set(px, 0, pz);
    scene.add(p);
  }

  // Carpet bilingual floor markers (small)
  const carpetMark = wallLabel('AS Virtual Office', '虛擬辦公室', 2.0);
  carpetMark.rotation.x = -Math.PI / 2;
  carpetMark.position.set(0, 0.03, 8);
  scene.add(carpetMark);

  return { scene, desks, animatables, leadDoor: LEAD_OFFICE_DOOR };
}

/** Update research screens + rack LEDs */
export function updateOfficeAnims(animatables, t) {
  for (const s of animatables.screens) {
    const ctx = s.canvas.getContext('2d');
    const w = s.canvas.width;
    const h = s.canvas.height;
    ctx.fillStyle = '#0d1520';
    ctx.fillRect(0, 0, w, h);

    if (s.kind === 0) {
      // Simple bar chart
      ctx.fillStyle = '#90a4ae';
      ctx.font = '12px monospace';
      ctx.fillText('Weekly Metrics · 週指標', 12, 18);
      const bars = [40, 65, 35, 80, 55, 70];
      bars.forEach((v, i) => {
        const bh = (v / 100) * (h - 40);
        ctx.fillStyle = i % 2 ? '#5c6bc0' : '#78909c';
        ctx.fillRect(24 + i * 36, h - 16 - bh, 24, bh);
      });
    } else if (s.kind === 1) {
      // HK map silhouette (abstract polygon)
      ctx.fillStyle = '#78909c';
      ctx.font = '12px monospace';
      ctx.fillText('Hong Kong · 香港', 12, 18);
      ctx.beginPath();
      ctx.moveTo(40, 90);
      ctx.lineTo(80, 50);
      ctx.lineTo(140, 45);
      ctx.lineTo(200, 70);
      ctx.lineTo(220, 110);
      ctx.lineTo(160, 130);
      ctx.lineTo(90, 125);
      ctx.closePath();
      ctx.fillStyle = '#455a64';
      ctx.fill();
      ctx.strokeStyle = '#90caf9';
      ctx.stroke();
      // Islands dots
      ctx.fillStyle = '#81c784';
      ctx.beginPath();
      ctx.arc(100 + Math.sin(t) * 2, 100, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // AI text terminal
      ctx.fillStyle = '#66bb6a';
      ctx.font = '11px monospace';
      const lines = [
        '> status_feed: listening',
        '> agents: 12 registered',
        '> locale: zh-Hant / en',
        `> tick: ${Math.floor(t) % 1000}`,
        '> queue: formal handoff',
        '> —',
      ];
      lines.forEach((line, i) => {
        const flicker = i === lines.length - 2 && Math.floor(t * 2) % 2 === 0 ? '_' : '';
        ctx.fillText(line + flicker, 10, 28 + i * 18);
      });
    }
    s.tex.needsUpdate = true;
  }

  for (const leds of animatables.racks) {
    leds.forEach((led, i) => {
      const on = Math.sin(t * 3 + i * 1.7) > 0.2;
      const col = on ? C.ledOn : C.ledOff;
      led.material.color.setHex(col);
      led.material.emissive.setHex(col);
      led.material.emissiveIntensity = on ? 0.8 : 0.15;
    });
  }
}
