import * as THREE from 'three';
import { TEAM, LEAD_ID } from './team.js';

/** Palette — warmer formal HKSAR departmental, less toy-like */
const C = {
  floor: 0xb8c0c4,
  carpet: 0x9aa7b0,
  carpetLead: 0x8b97a3,
  wall: 0xeee8e0,
  wallTrim: 0xd4cdc4,
  glass: 0xb7d0e0,
  frame: 0x5c6770,
  desk: 0x7a5c4e,
  deskTop: 0xd9cfc4,
  plant: 0x3d6b45,
  plantDark: 0x2f5536,
  pot: 0x6d4c41,
  sky: 0xb8cce0,
  harbour: 0x4a6d82,
  building: 0x6e7c8a,
  buildingLite: 0x8a96a2,
  screen: 0x15202b,
  rack: 0x2f3b42,
  ledOn: 0x66bb6a,
  ledOff: 0x1b5e20,
  labelBg: 0xf7f6f3,
  teaCounter: 0x958278,
  meetingTable: 0x5d4037,
};

/**
 * Desk / zone positions for each bot (world XZ). Lead in corner office.
 */
export function deskLayout() {
  const desks = new Map();
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
    roughness: opts.roughness ?? 0.82,
    metalness: opts.metalness ?? 0.04,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    depthWrite: opts.depthWrite ?? true,
  });
}

function box(w, h, d, color, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rTop, rBot, h, color, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 16), mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Refined bilingual EN-above-ZH wall plaque */
function makeLabelTexture(en, zh, w = 512, h = 128) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Soft warm plaque
  ctx.fillStyle = '#f7f6f3';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ebe7e0';
  ctx.fillRect(0, h - 8, w, 8);

  ctx.strokeStyle = '#a8b0b8';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.strokeStyle = '#d4cdc4';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = '#1c2430';
  ctx.font = '600 34px "Noto Sans TC", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(en, w / 2, 48);
  ctx.fillStyle = '#5c6773';
  ctx.font = '500 26px "Noto Sans TC", "Segoe UI", sans-serif';
  ctx.fillText(zh, w / 2, 88);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function wallLabel(en, zh, width = 2.4) {
  const g = new THREE.Group();
  const plate = box(width, 0.42, 0.035, C.labelBg, { roughness: 0.65 });
  const tex = makeLabelTexture(en, zh);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.92, 0.34),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  face.position.z = 0.022;
  g.add(plate, face);
  return g;
}

function plant(scale = 1) {
  const g = new THREE.Group();
  const potM = cyl(0.16 * scale, 0.2 * scale, 0.26 * scale, C.pot, { roughness: 0.9 });
  potM.position.y = 0.13 * scale;
  const foliage = cyl(0.04 * scale, 0.32 * scale, 0.5 * scale, C.plant, { roughness: 0.95 });
  foliage.position.y = 0.48 * scale;
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(0.26 * scale, 12, 10),
    mat(C.plantDark, { roughness: 0.95 }),
  );
  top.position.y = 0.72 * scale;
  top.castShadow = true;
  g.add(potM, foliage, top);
  return g;
}

function deskUnit(colorAccent = C.desk) {
  const g = new THREE.Group();
  const top = box(1.6, 0.05, 0.8, C.deskTop, { roughness: 0.55 });
  top.position.y = 0.72;
  const body = box(1.5, 0.55, 0.7, colorAccent, { roughness: 0.75 });
  body.position.y = 0.4;
  const mon = box(0.55, 0.34, 0.035, C.screen, { roughness: 0.35, metalness: 0.25 });
  mon.position.set(0, 1.0, -0.2);
  const bezel = box(0.58, 0.37, 0.02, 0x37474f, { roughness: 0.5, metalness: 0.2 });
  bezel.position.set(0, 1.0, -0.22);
  const stand = box(0.08, 0.2, 0.08, 0x455a64, { roughness: 0.45, metalness: 0.3 });
  stand.position.set(0, 0.82, -0.2);
  const chair = box(0.45, 0.07, 0.45, 0x4a5a66, { roughness: 0.7 });
  chair.position.set(0, 0.42, 0.65);
  const back = box(0.45, 0.42, 0.05, 0x3e4e58, { roughness: 0.7 });
  back.position.set(0, 0.64, 0.85);
  g.add(top, body, bezel, mon, stand, chair, back);
  return g;
}

function glassPartition(w, h, d = 0.045) {
  const g = new THREE.Group();
  const glass = box(w, h, d, C.glass, {
    transparent: true,
    opacity: 0.22,
    roughness: 0.08,
    metalness: 0.15,
    depthWrite: false,
  });
  glass.position.y = h / 2;
  glass.castShadow = false;
  const frameL = box(0.05, h, d + 0.02, C.frame, { roughness: 0.45, metalness: 0.35 });
  frameL.position.set(-w / 2, h / 2, 0);
  const frameR = box(0.05, h, d + 0.02, C.frame, { roughness: 0.45, metalness: 0.35 });
  frameR.position.set(w / 2, h / 2, 0);
  const frameT = box(w + 0.05, 0.05, d + 0.02, C.frame, { roughness: 0.45, metalness: 0.35 });
  frameT.position.set(0, h, 0);
  const sill = box(w + 0.05, 0.04, d + 0.04, C.wallTrim, { roughness: 0.6 });
  sill.position.set(0, 0.02, 0);
  g.add(glass, frameL, frameR, frameT, sill);
  return g;
}

/**
 * Build static office scene. Returns { scene, desks, animatables }.
 */
export function buildOffice() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd6e0e6);
  scene.fog = new THREE.Fog(0xd6e0e6, 32, 62);

  // Warmer, softer lighting
  const hemi = new THREE.HemisphereLight(0xfff4ea, 0x8a949c, 0.62);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff1e0, 0.88);
  sun.position.set(14, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3.5;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xc9d6e4, 0.28);
  fill.position.set(-12, 12, -10);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffe8d2, 0.18);
  rim.position.set(4, 6, -14);
  scene.add(rim);

  // Floor slab — cooler stone with warm undertone
  const floor = box(28, 0.12, 24, C.floor, { roughness: 0.92 });
  floor.position.set(0, -0.06, 0);
  floor.castShadow = false;
  scene.add(floor);

  // Subtle floor grid lines (thin strips)
  for (let i = -6; i <= 6; i++) {
    if (i === 0) continue;
    const line = box(28, 0.005, 0.02, 0xaab4bc, { roughness: 1 });
    line.position.set(0, 0.005, i * 1.8);
    line.castShadow = false;
    scene.add(line);
  }

  // Carpet zones
  const openCarpet = box(18, 0.018, 12, C.carpet, { roughness: 0.98 });
  openCarpet.position.set(-1, 0.01, 1);
  openCarpet.castShadow = false;
  scene.add(openCarpet);

  // Outer walls — warm off-white with baseboard
  const wallH = 3.2;
  const north = box(28, wallH, 0.18, C.wall, { roughness: 0.88 });
  north.position.set(0, wallH / 2, -12);
  const south = box(28, wallH, 0.18, C.wall, { roughness: 0.88 });
  south.position.set(0, wallH / 2, 12);
  const west = box(0.18, wallH, 24, C.wall, { roughness: 0.88 });
  west.position.set(-14, wallH / 2, 0);
  const east = box(0.18, wallH, 24, C.wall, { roughness: 0.88 });
  east.position.set(14, wallH / 2, 0);
  scene.add(north, south, west, east);

  const baseN = box(28, 0.12, 0.22, C.wallTrim, { roughness: 0.7 });
  baseN.position.set(0, 0.06, -11.95);
  const baseS = box(28, 0.12, 0.22, C.wallTrim, { roughness: 0.7 });
  baseS.position.set(0, 0.06, 11.95);
  scene.add(baseN, baseS);

  // Soft ceiling strip lights
  for (let i = -3; i <= 3; i++) {
    const lightBar = box(3.4, 0.04, 0.22, 0xfff8ee, {
      emissive: 0xfff0d8,
      emissiveIntensity: 0.45,
      roughness: 0.4,
    });
    lightBar.position.set(i * 3.5 - 1, wallH - 0.08, 0);
    lightBar.castShadow = false;
    scene.add(lightBar);

    const pt = new THREE.PointLight(0xfff2e0, 0.12, 10, 2);
    pt.position.set(i * 3.5 - 1, wallH - 0.35, 0);
    scene.add(pt);
  }

  // —— Lead glass corner office (+X +Z) ——
  const leadFloor = box(6.5, 0.022, 5.5, C.carpetLead, { roughness: 0.98 });
  leadFloor.position.set(10.5, 0.02, 9.5);
  leadFloor.castShadow = false;
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

  // Harbour / skyline view
  const skyPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5),
    mat(C.sky, { roughness: 1 }),
  );
  skyPlane.position.set(15.5, 2.2, 6);
  skyPlane.rotation.y = -Math.PI / 2;
  skyPlane.receiveShadow = false;
  scene.add(skyPlane);

  const harbour = box(0.3, 0.35, 12, C.harbour, { roughness: 0.55, metalness: 0.1 });
  harbour.position.set(15.2, 0.28, 5);
  scene.add(harbour);

  for (let i = 0; i < 6; i++) {
    const bh = 1.2 + (i % 3) * 0.7;
    const b = box(0.8, bh, 1.1, i % 2 ? C.building : C.buildingLite, { roughness: 0.85 });
    b.position.set(16.2 + (i % 2) * 0.9, bh / 2, 2 + i * 1.6);
    scene.add(b);
  }

  const leadDesk = deskUnit(0x5d4037);
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

  const table = box(3.2, 0.07, 1.4, C.meetingTable, { roughness: 0.55 });
  table.position.set(-10.5, 0.75, -8.5);
  scene.add(table);
  const tableLeg = box(2.8, 0.68, 1.0, 0x4e342e, { roughness: 0.7 });
  tableLeg.position.set(-10.5, 0.34, -8.5);
  scene.add(tableLeg);

  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const idx = i % 3;
    const ch = box(0.4, 0.07, 0.4, 0x546e7a, { roughness: 0.7 });
    ch.position.set(-11.5 + idx * 1.0, 0.42, -8.5 + side * 1.1);
    const bk = box(0.4, 0.38, 0.05, 0x455a64, { roughness: 0.7 });
    bk.position.set(-11.5 + idx * 1.0, 0.62, -8.5 + side * 1.3);
    scene.add(ch, bk);
  }

  // —— Tea room / pantry ——
  const teaLabel = wallLabel('Tea Room / Pantry', '茶水間', 2.4);
  teaLabel.position.set(10, 2.4, -10.5);
  teaLabel.rotation.y = -0.2;
  scene.add(teaLabel);

  const counter = box(3.5, 0.88, 0.7, C.teaCounter, { roughness: 0.72 });
  counter.position.set(11, 0.44, -10);
  scene.add(counter);
  const counterTop = box(3.55, 0.04, 0.74, 0xcfd6da, { roughness: 0.4, metalness: 0.15 });
  counterTop.position.set(11, 0.9, -10);
  scene.add(counterTop);
  const sink = box(0.5, 0.06, 0.4, 0xb0bec5, { roughness: 0.35, metalness: 0.25 });
  sink.position.set(10.2, 0.94, -10);
  scene.add(sink);
  const kettle = cyl(0.12, 0.14, 0.26, 0x90a4ae, { roughness: 0.35, metalness: 0.4 });
  kettle.position.set(11.2, 1.1, -10);
  scene.add(kettle);
  const cups = box(0.35, 0.18, 0.25, 0xeceff1, { roughness: 0.6 });
  cups.position.set(11.8, 1.0, -10);
  scene.add(cups);
  const fridge = box(0.7, 1.55, 0.65, 0xcfd8dc, { roughness: 0.35, metalness: 0.2 });
  fridge.position.set(13, 0.78, -10);
  scene.add(fridge);

  // —— Research area ——
  const researchLabel = wallLabel('Research Area', '研究區', 2.2);
  researchLabel.position.set(-3, 2.4, -10.8);
  scene.add(researchLabel);

  const animatables = { screens: [], racks: [] };

  for (let i = 0; i < 3; i++) {
    const stand = box(1.2, 1.35, 0.07, 0x37474f, { roughness: 0.55, metalness: 0.2 });
    stand.position.set(-5 + i * 2.2, 0.88, -11.2);
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
    animatables.screens.push({ canvas, tex, kind: i });
  }

  // —— Technical zone ——
  const techLabel = wallLabel('Technical Zone', '技術區', 2.2);
  techLabel.position.set(6.5, 2.4, -5);
  techLabel.rotation.y = -Math.PI / 2;
  scene.add(techLabel);

  for (let i = 0; i < 4; i++) {
    const rack = box(0.7, 2.0, 0.5, C.rack, { roughness: 0.55, metalness: 0.3 });
    rack.position.set(8 + (i % 2) * 1.0, 1.0, -2 - Math.floor(i / 2) * 1.2);
    scene.add(rack);
    const leds = [];
    for (let r = 0; r < 8; r++) {
      const led = box(0.08, 0.05, 0.02, C.ledOff, {
        emissive: C.ledOff,
        emissiveIntensity: 0.35,
      });
      led.position.set(
        8 + (i % 2) * 1.0 + 0.2,
        0.3 + r * 0.2,
        -2 - Math.floor(i / 2) * 1.2 + 0.26,
      );
      led.castShadow = false;
      scene.add(led);
      leds.push(led);
    }
    animatables.racks.push(leds);
  }

  const midGlass = glassPartition(10, 2.4);
  midGlass.position.set(-1, 0, 1);
  scene.add(midGlass);

  const openLabel = wallLabel('Open Office', '開放式辦公區', 2.6);
  openLabel.position.set(-1, 2.55, 1.1);
  scene.add(openLabel);

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

  const plantSpots = [
    [-12, 10], [-12, 5], [-12, -3], [-12, -10],
    [12, 5], [5, 11], [-6, 11], [0, -6],
    [3, -11], [-8, -6], [13, -5], [7, 7],
    [-3, 7], [10, -7], [-10, 2], [2, 8],
  ];
  for (const [px, pz] of plantSpots) {
    const p = plant(0.85 + ((px * 13 + pz * 7) % 10) * 0.03);
    p.position.set(px, 0, pz);
    scene.add(p);
  }

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
    ctx.fillStyle = '#0c141c';
    ctx.fillRect(0, 0, w, h);

    if (s.kind === 0) {
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
      ctx.fillStyle = '#81c784';
      ctx.beginPath();
      ctx.arc(100 + Math.sin(t) * 2, 100, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#66bb6a';
      ctx.font = '11px monospace';
      const lines = [
        '> status_feed: listening',
        '> agents: 12 registered',
        '> locale: zh-Hant / en',
        `> tick: ${Math.floor(t) % 1000}`,
        '> tone: formal handoff',
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
      led.material.emissiveIntensity = on ? 0.75 : 0.12;
    });
  }
}
