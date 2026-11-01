import * as THREE from 'three';
import { TEAM, LEAD_ID } from './team.js';

/** Anime / slice-of-life office palette — warm wood, soft blues/grays, lush greens */
const C = {
  floor: 0xe6e2da,
  rug: 0x5f6b76,
  rugSoft: 0x6e7a85,
  carpetLead: 0x6a7682,
  wall: 0xf4f1eb,
  wallTrim: 0xe0d9cf,
  glass: 0xc5e0f0,
  frame: 0x3d4650,
  deskWood: 0xd8c4a8,
  deskLeg: 0x2c333a,
  plant: 0x4caf67,
  plantMid: 0x3d9a55,
  plantDark: 0x2e7d44,
  plantLeaf: 0x66bb6a,
  pot: 0xb08968,
  potDark: 0x8d6e4c,
  sky: 0xc8dff0,
  skySoft: 0xe8f2fa,
  harbour: 0x7a9bb0,
  building: 0x9aabb8,
  buildingLite: 0xb4c2cc,
  buildingWarm: 0xa8b0b8,
  screen: 0x1a2330,
  rack: 0x37474f,
  ledOn: 0x81c784,
  ledOff: 0x1b5e20,
  labelBg: 0xfffdf9,
  teaWood: 0xc4a882,
  teaTop: 0xf2efe8,
  meetingTable: 0xc9b496,
  duct: 0xd5d8dc,
  track: 0x2a3038,
  chair: 0x2f3842,
  chairMesh: 0x3a4552,
  mug: 0xf5f0ea,
  sofa: 0x8a96a2,
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
    roughness: opts.roughness ?? 0.78,
    metalness: opts.metalness ?? 0.03,
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

function cyl(rTop, rBot, h, color, opts, segments = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segments), mat(color, opts));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Soft bilingual EN-above-ZH wall plaque */
function makeLabelTexture(en, zh, w = 512, h = 128) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#efe8de';
  ctx.fillRect(0, h - 8, w, 8);

  ctx.strokeStyle = '#b8c0c8';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.strokeStyle = '#e4ddd3';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = '#24303c';
  ctx.font = '600 34px "Noto Sans TC", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(en, w / 2, 48);
  ctx.fillStyle = '#667482';
  ctx.font = '500 26px "Noto Sans TC", "Segoe UI", sans-serif';
  ctx.fillText(zh, w / 2, 88);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function wallLabel(en, zh, width = 2.4) {
  const g = new THREE.Group();
  const plate = box(width, 0.42, 0.035, C.labelBg, { roughness: 0.6 });
  const tex = makeLabelTexture(en, zh);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.92, 0.34),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  face.position.z = 0.022;
  g.add(plate, face);
  return g;
}

function floorPlant(scale = 1) {
  const g = new THREE.Group();
  const pot = cyl(0.18 * scale, 0.22 * scale, 0.28 * scale, C.pot, { roughness: 0.92 });
  pot.position.y = 0.14 * scale;
  const soil = cyl(0.16 * scale, 0.16 * scale, 0.04 * scale, 0x4e342e, { roughness: 1 });
  soil.position.y = 0.28 * scale;
  const stem = cyl(0.03 * scale, 0.04 * scale, 0.35 * scale, C.plantDark, { roughness: 0.95 });
  stem.position.y = 0.45 * scale;
  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(0.32 * scale, 14, 12),
    mat(C.plant, { roughness: 0.95 }),
  );
  foliage.position.y = 0.72 * scale;
  foliage.scale.set(1, 1.15, 1);
  foliage.castShadow = true;
  const foliage2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.22 * scale, 12, 10),
    mat(C.plantMid, { roughness: 0.95 }),
  );
  foliage2.position.set(0.14 * scale, 0.62 * scale, 0.08 * scale);
  foliage2.castShadow = true;
  g.add(pot, soil, stem, foliage, foliage2);
  return g;
}

function deskPlant(scale = 0.45) {
  const g = new THREE.Group();
  const pot = cyl(0.08 * scale * 2.2, 0.1 * scale * 2.2, 0.12 * scale * 2, C.potDark, { roughness: 0.9 });
  pot.position.y = 0.06 * scale * 2;
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.11 * scale * 2, 10, 8),
    mat(C.plantLeaf, { roughness: 0.95 }),
  );
  leaf.position.y = 0.18 * scale * 2;
  leaf.scale.set(1, 1.2, 1);
  leaf.castShadow = true;
  g.add(pot, leaf);
  return g;
}

function hangingPlant(scale = 1) {
  const g = new THREE.Group();
  const basket = cyl(0.14 * scale, 0.12 * scale, 0.16 * scale, C.pot, { roughness: 0.88 });
  basket.position.y = 0;
  const vine = new THREE.Mesh(
    new THREE.SphereGeometry(0.18 * scale, 10, 8),
    mat(C.plant, { roughness: 0.95 }),
  );
  vine.position.y = -0.12 * scale;
  vine.scale.set(1, 1.4, 1);
  vine.castShadow = true;
  const drip = new THREE.Mesh(
    new THREE.SphereGeometry(0.1 * scale, 8, 6),
    mat(C.plantDark, { roughness: 0.95 }),
  );
  drip.position.set(0.06 * scale, -0.28 * scale, 0);
  drip.scale.set(0.8, 1.6, 0.8);
  g.add(basket, vine, drip);
  // thin hanger cord
  const cord = box(0.015, 0.55 * scale, 0.015, 0x8d6e63, { roughness: 0.9 });
  cord.position.y = 0.35 * scale;
  cord.castShadow = false;
  g.add(cord);
  return g;
}

function animeDesk(accentWood = C.deskWood) {
  const g = new THREE.Group();
  // Light warm wood top
  const top = box(1.7, 0.045, 0.85, accentWood, { roughness: 0.48 });
  top.position.y = 0.74;
  // Slim dark legs
  const legGeo = [
    [-0.72, 0.32],
    [0.72, 0.32],
    [-0.72, -0.32],
    [0.72, -0.32],
  ];
  for (const [lx, lz] of legGeo) {
    const leg = box(0.05, 0.72, 0.05, C.deskLeg, { roughness: 0.55, metalness: 0.15 });
    leg.position.set(lx, 0.36, lz);
    g.add(leg);
  }
  // Thin drawer rail under top
  const rail = box(1.55, 0.08, 0.7, 0xc4ae92, { roughness: 0.6 });
  rail.position.y = 0.68;
  g.add(top, rail);

  // Dual monitors vibe (generic, no logos)
  const bezel = box(0.72, 0.42, 0.03, 0x263238, { roughness: 0.45, metalness: 0.2 });
  bezel.position.set(-0.22, 1.05, -0.28);
  const mon = box(0.66, 0.36, 0.02, C.screen, { roughness: 0.3, metalness: 0.2, emissive: 0x1e3a5f, emissiveIntensity: 0.15 });
  mon.position.set(-0.22, 1.05, -0.26);
  const bezel2 = box(0.55, 0.36, 0.03, 0x263238, { roughness: 0.45, metalness: 0.2 });
  bezel2.position.set(0.38, 1.02, -0.28);
  const mon2 = box(0.5, 0.3, 0.02, C.screen, { roughness: 0.3, metalness: 0.2, emissive: 0x1a3348, emissiveIntensity: 0.12 });
  mon2.position.set(0.38, 1.02, -0.26);
  const stand = box(0.1, 0.22, 0.08, 0x455a64, { roughness: 0.4, metalness: 0.25 });
  stand.position.set(-0.22, 0.82, -0.26);
  const stand2 = box(0.08, 0.18, 0.07, 0x455a64, { roughness: 0.4, metalness: 0.25 });
  stand2.position.set(0.38, 0.82, -0.26);
  g.add(bezel, mon, bezel2, mon2, stand, stand2);

  // Mug + notebook (lived-in)
  const mug = cyl(0.05, 0.055, 0.1, C.mug, { roughness: 0.65 }, 12);
  mug.position.set(0.55, 0.82, 0.12);
  const notebook = box(0.22, 0.015, 0.28, 0x90a4ae, { roughness: 0.8 });
  notebook.position.set(0.15, 0.77, 0.15);
  notebook.rotation.y = 0.25;
  g.add(mug, notebook);

  const little = deskPlant(0.55);
  little.position.set(-0.65, 0.74, 0.2);
  g.add(little);

  // Black mesh chair
  const seat = box(0.48, 0.06, 0.48, C.chairMesh, { roughness: 0.75 });
  seat.position.set(0, 0.44, 0.72);
  const back = box(0.46, 0.52, 0.05, C.chair, { roughness: 0.7 });
  back.position.set(0, 0.72, 0.94);
  const base = cyl(0.16, 0.18, 0.04, C.deskLeg, { roughness: 0.5, metalness: 0.2 }, 10);
  base.position.set(0, 0.12, 0.72);
  const pole = cyl(0.03, 0.03, 0.3, 0x546e7a, { roughness: 0.4, metalness: 0.3 }, 8);
  pole.position.set(0, 0.28, 0.72);
  g.add(seat, back, base, pole);

  return g;
}

function glassPartition(w, h, d = 0.04) {
  const g = new THREE.Group();
  const glass = box(w, h, d, C.glass, {
    transparent: true,
    opacity: 0.18,
    roughness: 0.06,
    metalness: 0.12,
    depthWrite: false,
  });
  glass.position.y = h / 2;
  glass.castShadow = false;
  const frameL = box(0.045, h, d + 0.02, C.frame, { roughness: 0.4, metalness: 0.35 });
  frameL.position.set(-w / 2, h / 2, 0);
  const frameR = box(0.045, h, d + 0.02, C.frame, { roughness: 0.4, metalness: 0.35 });
  frameR.position.set(w / 2, h / 2, 0);
  const frameT = box(w + 0.05, 0.045, d + 0.02, C.frame, { roughness: 0.4, metalness: 0.35 });
  frameT.position.set(0, h, 0);
  const sill = box(w + 0.05, 0.035, d + 0.04, C.wallTrim, { roughness: 0.55 });
  sill.position.set(0, 0.02, 0);
  g.add(glass, frameL, frameR, frameT, sill);
  return g;
}

function addWindowWall(scene, wallH) {
  // West wall: large floor-to-ceiling window bays (anime office left wall)
  const bayW = 3.2;
  const bayH = wallH - 0.35;
  const gaps = [-9.5, -5.5, -1.5, 2.5, 6.5];
  for (const gz of gaps) {
    // Opening framed by wall remnants is implied; put glass + mullions
    const pane = box(0.06, bayH, bayW, C.glass, {
      transparent: true,
      opacity: 0.14,
      roughness: 0.05,
      metalness: 0.08,
      depthWrite: false,
    });
    pane.position.set(-13.88, bayH / 2 + 0.12, gz);
    pane.castShadow = false;
    scene.add(pane);

    const mullion = box(0.08, bayH, 0.06, C.frame, { roughness: 0.4, metalness: 0.3 });
    mullion.position.set(-13.85, bayH / 2 + 0.12, gz);
    scene.add(mullion);

    // Soft window glow strip
    const glow = box(0.04, bayH * 0.9, bayW * 0.85, 0xfff6e8, {
      emissive: 0xffe8c8,
      emissiveIntensity: 0.35,
      roughness: 0.5,
    });
    glow.position.set(-13.7, bayH / 2 + 0.12, gz);
    glow.castShadow = false;
    scene.add(glow);
  }

  // Soft city skyline beyond west windows
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 8),
    mat(C.skySoft, { roughness: 1 }),
  );
  sky.position.set(-18, 3.2, 0);
  sky.rotation.y = Math.PI / 2;
  sky.receiveShadow = false;
  sky.castShadow = false;
  scene.add(sky);

  const skyGrad = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 3.5),
    mat(C.sky, { roughness: 1 }),
  );
  skyGrad.position.set(-17.9, 1.4, 0);
  skyGrad.rotation.y = Math.PI / 2;
  scene.add(skyGrad);

  // Soft haze buildings (generic skyline, no branding)
  for (let i = 0; i < 14; i++) {
    const bh = 1.4 + (i % 5) * 0.85 + (i % 3) * 0.3;
    const bw = 0.9 + (i % 4) * 0.25;
    const col = i % 3 === 0 ? C.building : i % 3 === 1 ? C.buildingLite : C.buildingWarm;
    const b = box(0.7, bh, bw, col, { roughness: 0.88 });
    b.position.set(-16.2 - (i % 2) * 0.8, bh / 2, -11 + i * 1.7);
    b.castShadow = false;
    scene.add(b);
    // tiny window dots
    for (let wy = 0; wy < 3; wy++) {
      const win = box(0.04, 0.12, 0.12, 0xfff3d6, {
        emissive: 0xffe0a8,
        emissiveIntensity: 0.25 + (i + wy) % 2 * 0.15,
        roughness: 0.5,
      });
      win.position.set(-15.82 - (i % 2) * 0.8, 0.5 + wy * 0.55, -11 + i * 1.7);
      win.castShadow = false;
      scene.add(win);
    }
  }

  const water = box(0.4, 0.2, 24, C.harbour, { roughness: 0.45, metalness: 0.12 });
  water.position.set(-15.4, 0.12, 0);
  water.castShadow = false;
  scene.add(water);
}

function addCeilingInfra(scene, wallH) {
  // Exposed ducts (stylized low-poly anime)
  for (let i = -2; i <= 2; i++) {
    const duct = cyl(0.22, 0.22, 18, C.duct, { roughness: 0.55, metalness: 0.25 }, 12);
    duct.rotation.z = Math.PI / 2;
    duct.position.set(0, wallH - 0.28, i * 3.5);
    duct.castShadow = false;
    scene.add(duct);

    // duct joints
    const joint = cyl(0.28, 0.28, 0.35, 0xc8ccd0, { roughness: 0.5, metalness: 0.3 }, 12);
    joint.rotation.z = Math.PI / 2;
    joint.position.set(i * 4.5, wallH - 0.28, i * 3.5);
    joint.castShadow = false;
    scene.add(joint);
  }

  // Track lighting rails + warm spots
  for (let i = -3; i <= 3; i++) {
    const rail = box(0.06, 0.04, 10, C.track, { roughness: 0.4, metalness: 0.45 });
    rail.position.set(i * 3.2 - 0.5, wallH - 0.12, 1);
    rail.castShadow = false;
    scene.add(rail);

    for (let j = -2; j <= 2; j++) {
      const head = box(0.14, 0.1, 0.18, 0x1c2228, { roughness: 0.35, metalness: 0.4 });
      head.position.set(i * 3.2 - 0.5, wallH - 0.22, 1 + j * 2.1);
      head.castShadow = false;
      scene.add(head);
      const bulb = box(0.1, 0.02, 0.12, 0xfff4e0, {
        emissive: 0xffe4bc,
        emissiveIntensity: 0.7,
        roughness: 0.4,
      });
      bulb.position.set(i * 3.2 - 0.5, wallH - 0.28, 1 + j * 2.1);
      bulb.castShadow = false;
      scene.add(bulb);
    }

    const pt = new THREE.PointLight(0xfff0dc, 0.16, 9, 2);
    pt.position.set(i * 3.2 - 0.5, wallH - 0.55, 1);
    scene.add(pt);
  }
}

/**
 * Build static office scene. Returns { scene, desks, animatables }.
 */
export function buildOffice() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8f0f6);
  scene.fog = new THREE.Fog(0xe8f0f6, 38, 72);

  // Bright warm anime ambient
  const hemi = new THREE.HemisphereLight(0xfff5ea, 0xa8b4c0, 0.72);
  scene.add(hemi);

  // Soft window sun from west (left)
  const sun = new THREE.DirectionalLight(0xfff2e0, 0.98);
  sun.position.set(-18, 16, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 4.5;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xd6e6f5, 0.38);
  fill.position.set(14, 12, -8);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffe6cc, 0.32);
  rim.position.set(-6, 5, -12);
  scene.add(rim);

  const ambientBoost = new THREE.AmbientLight(0xfff8f0, 0.18);
  scene.add(ambientBoost);

  // Light polished floor
  const floor = box(28, 0.12, 24, C.floor, { roughness: 0.72 });
  floor.position.set(0, -0.06, 0);
  floor.castShadow = false;
  scene.add(floor);

  // Soft tile seams
  for (let i = -6; i <= 6; i++) {
    if (i === 0) continue;
    const line = box(28, 0.004, 0.015, 0xd4cfc6, { roughness: 1 });
    line.position.set(0, 0.004, i * 1.8);
    line.castShadow = false;
    scene.add(line);
  }

  // Dark gray area rugs (workspace zones)
  const openRug = box(16.5, 0.02, 10.5, C.rug, { roughness: 0.98 });
  openRug.position.set(-1.2, 0.012, 1.2);
  openRug.castShadow = false;
  scene.add(openRug);

  const meetRug = box(6.5, 0.02, 5.5, C.rugSoft, { roughness: 0.98 });
  meetRug.position.set(-10.2, 0.012, -8.2);
  meetRug.castShadow = false;
  scene.add(meetRug);

  // Outer walls
  const wallH = 3.35;
  const north = box(28, wallH, 0.16, C.wall, { roughness: 0.9 });
  north.position.set(0, wallH / 2, -12);
  const south = box(28, wallH, 0.16, C.wall, { roughness: 0.9 });
  south.position.set(0, wallH / 2, 12);
  // West wall mostly windows — keep thin solid strips at corners
  const westN = box(0.16, wallH, 3.2, C.wall, { roughness: 0.9 });
  westN.position.set(-14, wallH / 2, -10.4);
  const westS = box(0.16, wallH, 3.2, C.wall, { roughness: 0.9 });
  westS.position.set(-14, wallH / 2, 10.4);
  const westHeader = box(0.16, 0.35, 24, C.wall, { roughness: 0.9 });
  westHeader.position.set(-14, wallH - 0.175, 0);
  const east = box(0.16, wallH, 24, C.wall, { roughness: 0.9 });
  east.position.set(14, wallH / 2, 0);
  scene.add(north, south, westN, westS, westHeader, east);

  const baseN = box(28, 0.1, 0.2, C.wallTrim, { roughness: 0.65 });
  baseN.position.set(0, 0.05, -11.95);
  const baseS = box(28, 0.1, 0.2, C.wallTrim, { roughness: 0.65 });
  baseS.position.set(0, 0.05, 11.95);
  scene.add(baseN, baseS);

  // Soft ceiling plane (slightly open industrial feel)
  const ceiling = box(28, 0.08, 24, 0xf7f5f1, { roughness: 0.92 });
  ceiling.position.set(0, wallH + 0.04, 0);
  ceiling.castShadow = false;
  scene.add(ceiling);

  addWindowWall(scene, wallH);
  addCeilingInfra(scene, wallH);

  // —— Lead glass corner office (+X +Z) ——
  const leadFloor = box(6.5, 0.022, 5.5, C.carpetLead, { roughness: 0.98 });
  leadFloor.position.set(10.5, 0.02, 9.5);
  leadFloor.castShadow = false;
  scene.add(leadFloor);

  const leadGlassW = glassPartition(5.5, 2.7);
  leadGlassW.position.set(7.5, 0, 9.5);
  leadGlassW.rotation.y = Math.PI / 2;
  scene.add(leadGlassW);
  const leadGlassS = glassPartition(6.5, 2.7);
  leadGlassS.position.set(10.5, 0, 6.8);
  scene.add(leadGlassS);

  const leadLabel = wallLabel('Directorate Office', '總管室', 2.6);
  leadLabel.position.set(7.55, 2.45, 9.5);
  leadLabel.rotation.y = Math.PI / 2;
  scene.add(leadLabel);

  // East skyline for lead office view
  const eastSky = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 5.5),
    mat(C.skySoft, { roughness: 1 }),
  );
  eastSky.position.set(16.2, 2.4, 6);
  eastSky.rotation.y = -Math.PI / 2;
  scene.add(eastSky);

  for (let i = 0; i < 7; i++) {
    const bh = 1.3 + (i % 4) * 0.65;
    const b = box(0.75, bh, 1.0, i % 2 ? C.building : C.buildingLite, { roughness: 0.85 });
    b.position.set(16.8 + (i % 2) * 0.7, bh / 2, 1.5 + i * 1.5);
    b.castShadow = false;
    scene.add(b);
  }

  const leadDesk = animeDesk(0xc9b08e);
  leadDesk.position.set(10.5, 0, 10.2);
  leadDesk.rotation.y = Math.PI;
  scene.add(leadDesk);

  // Small sofa near windows (lounge touch from reference)
  const sofa = box(1.8, 0.42, 0.7, C.sofa, { roughness: 0.88 });
  sofa.position.set(-11.5, 0.28, 8.5);
  const sofaBack = box(1.8, 0.55, 0.18, 0x7a8792, { roughness: 0.88 });
  sofaBack.position.set(-11.5, 0.55, 8.15);
  scene.add(sofa, sofaBack);

  // —— Meeting room (−X −Z corner) ——
  const meetGlassN = glassPartition(7, 2.7);
  meetGlassN.position.set(-10, 0, -5);
  scene.add(meetGlassN);
  const meetGlassE = glassPartition(6, 2.7);
  meetGlassE.position.set(-6.5, 0, -8);
  meetGlassE.rotation.y = Math.PI / 2;
  scene.add(meetGlassE);

  const meetLabel = wallLabel('Meeting Room', '會議室', 2.2);
  meetLabel.position.set(-10, 2.45, -4.9);
  scene.add(meetLabel);

  const table = box(3.4, 0.06, 1.5, C.meetingTable, { roughness: 0.5 });
  table.position.set(-10.5, 0.76, -8.5);
  scene.add(table);
  // slim legs
  for (const [tx, tz] of [
    [-11.7, -9.0],
    [-9.3, -9.0],
    [-11.7, -8.0],
    [-9.3, -8.0],
  ]) {
    const leg = box(0.06, 0.74, 0.06, C.deskLeg, { roughness: 0.5, metalness: 0.15 });
    leg.position.set(tx, 0.37, tz);
    scene.add(leg);
  }

  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const idx = i % 3;
    const ch = box(0.42, 0.06, 0.42, C.chairMesh, { roughness: 0.72 });
    ch.position.set(-11.5 + idx * 1.0, 0.44, -8.5 + side * 1.15);
    const bk = box(0.42, 0.45, 0.05, C.chair, { roughness: 0.7 });
    bk.position.set(-11.5 + idx * 1.0, 0.68, -8.5 + side * 1.35);
    scene.add(ch, bk);
  }

  // —— Tea room / pantry / kitchenette ——
  const teaLabel = wallLabel('Tea Room / Pantry', '茶水間', 2.4);
  teaLabel.position.set(10, 2.45, -10.5);
  teaLabel.rotation.y = -0.2;
  scene.add(teaLabel);

  const counter = box(3.6, 0.9, 0.72, C.teaWood, { roughness: 0.7 });
  counter.position.set(11, 0.45, -10);
  scene.add(counter);
  const counterTop = box(3.65, 0.04, 0.76, C.teaTop, { roughness: 0.35, metalness: 0.08 });
  counterTop.position.set(11, 0.92, -10);
  scene.add(counterTop);
  // Upper cabinets
  const upCab = box(3.4, 0.7, 0.4, C.teaWood, { roughness: 0.68 });
  upCab.position.set(11, 2.35, -10.15);
  scene.add(upCab);

  const sink = box(0.48, 0.05, 0.38, 0xb0bec5, { roughness: 0.3, metalness: 0.3 });
  sink.position.set(10.1, 0.96, -10);
  scene.add(sink);

  // Coffee machine vibe
  const coffee = box(0.32, 0.42, 0.28, 0x37474f, { roughness: 0.4, metalness: 0.25 });
  coffee.position.set(11.15, 1.15, -10);
  const coffeeTop = box(0.28, 0.06, 0.24, 0x263238, { roughness: 0.35, metalness: 0.3 });
  coffeeTop.position.set(11.15, 1.38, -10);
  const coffeeLight = box(0.06, 0.03, 0.04, 0xffcc80, {
    emissive: 0xffb74d,
    emissiveIntensity: 0.6,
  });
  coffeeLight.position.set(11.15, 1.22, -9.85);
  coffeeLight.castShadow = false;
  scene.add(coffee, coffeeTop, coffeeLight);

  // Water cooler
  const cooler = box(0.35, 1.05, 0.35, 0xeceff1, { roughness: 0.4, metalness: 0.15 });
  cooler.position.set(12.2, 0.55, -10);
  const jug = cyl(0.14, 0.14, 0.32, 0x90caf9, { transparent: true, opacity: 0.45, roughness: 0.2 }, 12);
  jug.position.set(12.2, 1.25, -10);
  scene.add(cooler, jug);

  const cups = box(0.32, 0.16, 0.22, 0xfaf8f5, { roughness: 0.6 });
  cups.position.set(11.7, 1.02, -9.85);
  scene.add(cups);

  const fridge = box(0.72, 1.6, 0.68, 0xe8eef2, { roughness: 0.32, metalness: 0.22 });
  fridge.position.set(13.15, 0.8, -10);
  const fridgeHandle = box(0.03, 0.35, 0.04, 0x90a4ae, { roughness: 0.35, metalness: 0.4 });
  fridgeHandle.position.set(12.78, 0.9, -10);
  scene.add(fridge, fridgeHandle);

  // —— Research area ——
  const researchLabel = wallLabel('Research Area', '研究區', 2.2);
  researchLabel.position.set(-3, 2.45, -10.8);
  scene.add(researchLabel);

  const animatables = { screens: [], racks: [] };

  for (let i = 0; i < 3; i++) {
    const stand = box(1.2, 1.35, 0.07, 0x455a64, { roughness: 0.5, metalness: 0.2 });
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
  techLabel.position.set(6.5, 2.45, -5);
  techLabel.rotation.y = -Math.PI / 2;
  scene.add(techLabel);

  for (let i = 0; i < 4; i++) {
    const rack = box(0.7, 2.0, 0.5, C.rack, { roughness: 0.5, metalness: 0.28 });
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

  // Soft mid glass divider (open office feel)
  const midGlass = glassPartition(10, 2.5);
  midGlass.position.set(-1, 0, 1);
  scene.add(midGlass);

  const openLabel = wallLabel('Open Office', '開放式辦公區', 2.6);
  openLabel.position.set(-1, 2.6, 1.1);
  scene.add(openLabel);

  // Wall clock + soft whiteboard (slice-of-life props)
  const clock = cyl(0.28, 0.28, 0.04, 0xfffaf5, { roughness: 0.55 }, 24);
  clock.rotation.x = Math.PI / 2;
  clock.position.set(3.5, 2.4, -11.88);
  const clockHand = box(0.02, 0.18, 0.01, 0x37474f, { roughness: 0.5 });
  clockHand.position.set(3.5, 2.48, -11.85);
  scene.add(clock, clockHand);

  const board = box(1.8, 1.1, 0.04, 0xfafafa, { roughness: 0.7 });
  board.position.set(-0.5, 1.8, -11.9);
  scene.add(board);
  for (let i = 0; i < 5; i++) {
    const sticky = box(0.22, 0.22, 0.01, [0xfff59d, 0xffccbc, 0xc5e1a5, 0xb3e5fc, 0xe1bee7][i], {
      roughness: 0.85,
    });
    sticky.position.set(-1.1 + i * 0.32, 2.0 - (i % 2) * 0.28, -11.87);
    sticky.castShadow = false;
    scene.add(sticky);
  }

  const desks = deskLayout();
  for (const member of TEAM) {
    if (member.isLead) continue;
    const d = desks.get(member.id);
    if (!d) continue;
    // Warm wood desks; accent via small desk plant only — keep wood consistent anime look
    const unit = animeDesk(C.deskWood);
    unit.position.set(d.x, 0, d.z);
    unit.rotation.y = d.rot;
    scene.add(unit);
  }

  // Floor plants — lots of greenery
  const plantSpots = [
    [-12, 10], [-12, 5], [-12, -3], [-12, -10],
    [12, 5], [5, 11], [-6, 11], [0, -6],
    [3, -11], [-8, -6], [13, -5], [7, 7],
    [-3, 7], [10, -7], [-10, 2], [2, 8],
    [-11.5, 7.2], [12.5, 9], [-4, 10.5], [8.5, 11],
    [-13, 0], [5.5, -9], [-7, 8],
  ];
  for (const [px, pz] of plantSpots) {
    const p = floorPlant(0.9 + ((Math.abs(px * 13 + pz * 7) % 10) * 0.035));
    p.position.set(px, 0, pz);
    scene.add(p);
  }

  // Hanging plants from ceiling
  const hangSpots = [
    [-10, 6], [-6, 3], [-2, 5], [2, 3], [5, 6],
    [-9, -3], [-4, -4], [1, -5], [6, -3],
    [-11, 9], [4, 9], [-7, -8],
  ];
  for (const [hx, hz] of hangSpots) {
    const hp = hangingPlant(0.95);
    hp.position.set(hx, wallH - 0.85, hz);
    scene.add(hp);
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
    ctx.fillStyle = '#0e1822';
    ctx.fillRect(0, 0, w, h);

    if (s.kind === 0) {
      ctx.fillStyle = '#a8b8c4';
      ctx.font = '12px monospace';
      ctx.fillText('Weekly Metrics · 週指標', 12, 18);
      const bars = [40, 65, 35, 80, 55, 70];
      bars.forEach((v, i) => {
        const bh = (v / 100) * (h - 40);
        ctx.fillStyle = i % 2 ? '#7e8fd4' : '#8fa4b3';
        ctx.fillRect(24 + i * 36, h - 16 - bh, 24, bh);
      });
    } else if (s.kind === 1) {
      ctx.fillStyle = '#8fa4b3';
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
      ctx.fillStyle = '#5a7382';
      ctx.fill();
      ctx.strokeStyle = '#90caf9';
      ctx.stroke();
      ctx.fillStyle = '#81c784';
      ctx.beginPath();
      ctx.arc(100 + Math.sin(t) * 2, 100, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#81c784';
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
