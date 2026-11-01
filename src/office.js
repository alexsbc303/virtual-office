/**
 * AS Virtual Office — cozy six-zone cutaway office (floor-plan layout).
 * True dollhouse: no ceiling, no exterior city backdrop. Warm wood + biophilic.
 */
import * as THREE from 'three';
import { LEAD_ID } from './team.js';
import { createSoftSkyTexture } from './skyline.js';

export const ROOM = { w: 18, d: 14, h: 3.4 };

/**
 * Chair / desk seating — desk surface; monitors face −Z (toward windows);
 * chair sits on +Z side. Seated figures face −Z: faceYaw = Math.PI.
 */
export const CHAIR = {
  offsetZ: 0.58,
  seatY: 0.45,
  faceYaw: Math.PI,
};

/** Reception: desk faces entrance (+Z); seated figure faces +Z. */
export const RECEPTION_CHAIR = {
  offsetZ: -0.55,
  seatY: 0.45,
  faceYaw: 0,
};

/**
 * @param {number} deskX
 * @param {number} deskZ
 * @param {string} zone
 * @param {{ offsetZ?: number, seatY?: number, faceYaw?: number }} [chair]
 */
export function seatFromDesk(deskX, deskZ, zone = 'focus', chair = CHAIR) {
  return {
    x: deskX,
    y: 0,
    z: deskZ,
    seatX: deskX,
    seatY: chair.seatY ?? CHAIR.seatY,
    seatZ: deskZ + (chair.offsetZ ?? CHAIR.offsetZ),
    faceYaw: chair.faceYaw ?? CHAIR.faceYaw,
    zone,
  };
}

/**
 * Floor-plan zones (world XZ). Windows on −Z; entrance on +Z.
 * Focus (NW) · Collaboration (N) · Social (NE)
 * Meeting (SW) · Phone (S-mid) · Reception (SE)
 */
export const ZONES = [
  {
    id: 'focus',
    labelEn: 'Focus',
    labelZh: '專注',
    color: 0x8fbf7a,
    fill: 0xb8d9a8,
    x: -5.4,
    z: -3.6,
    w: 6.8,
    d: 5.6,
  },
  {
    id: 'collaboration',
    labelEn: 'Collaboration',
    labelZh: '協作',
    color: 0x6aa8d8,
    fill: 0xa8cce8,
    x: -0.1,
    z: -3.6,
    w: 4.0,
    d: 5.6,
  },
  {
    id: 'social',
    labelEn: 'Social',
    labelZh: '社交',
    color: 0xd4a574,
    fill: 0xe8c9a0,
    x: 4.8,
    z: -3.6,
    w: 5.4,
    d: 5.6,
  },
  {
    id: 'meeting',
    labelEn: 'Meeting',
    labelZh: '會議',
    color: 0x9b8bc4,
    fill: 0xc5b8e0,
    x: -5.6,
    z: 3.4,
    w: 5.6,
    d: 5.2,
  },
  {
    id: 'phone',
    labelEn: 'Phone',
    labelZh: '電話／對外',
    color: 0xd48aa8,
    fill: 0xe8b8c8,
    x: -1.4,
    z: 3.6,
    w: 2.6,
    d: 4.4,
  },
  {
    id: 'reception',
    labelEn: 'Reception',
    labelZh: '接待',
    color: 0xa8a8a0,
    fill: 0xd8d4cc,
    x: 3.6,
    z: 3.5,
    w: 7.6,
    d: 5.0,
  },
];

/**
 * Desk / seat anchors by AS bot role × floor-plan zone (12 homes).
 * Reception 1 · Focus 6 · Collaboration 3 · Phone 2. Meeting/Social are visit targets.
 */
export function deskLayout() {
  const desks = new Map();

  // Reception 接待 — Bot 總管 at L-desk
  desks.set(LEAD_ID, seatFromDesk(2.4, 4.2, 'reception', RECEPTION_CHAIR));

  // Focus 專注 — 6 partitioned deep-work desks (2×3)
  const focusDesks = [
    { id: 'b7c9b07d-4a12-49af-bbdf-7fa19bdc96b2', x: -7.2, z: -5.0 }, // Coding
    { id: 'aecd27e2-8d49-4c33-962c-cdfa1860fd26', x: -5.6, z: -5.0 }, // Infrastructure
    { id: '5f8f09c0-fe3d-40a5-87c1-2fcc440bb9c3', x: -4.0, z: -5.0 }, // assessment-validator
    { id: 'c7f037b0-0082-4290-a543-00f203e4c150', x: -7.2, z: -2.8 }, // IT Security
    { id: '6a0dc819-57c2-4507-ae25-f3b3122c3f46', x: -5.6, z: -2.8 }, // 報價與消費
    { id: '764c93f4-9330-4daa-9f86-481be3b19e60', x: -4.0, z: -2.8 }, // Grok Bot Coach
  ];
  for (const d of focusDesks) {
    desks.set(d.id, seatFromDesk(d.x, d.z, 'focus'));
  }

  // Collaboration 協作 — shared tables (face into table)
  // North table (+Z side chairs face −Z); south table (−Z side chairs face +Z)
  desks.set(
    '26fffc1c-3c69-4346-8a68-199db47277fd', // Scheduler
    seatFromDesk(-0.9, -5.0, 'collaboration', { offsetZ: 0.95, seatY: 0.45, faceYaw: Math.PI }),
  );
  desks.set(
    '28c84d63-5b73-4b78-aebc-3a2e02376fc2', // 港式中英文寫作
    seatFromDesk(0.7, -5.0, 'collaboration', { offsetZ: 0.95, seatY: 0.45, faceYaw: Math.PI }),
  );
  desks.set(
    '2fb3b7e8-b556-45ea-8b10-1ced7f05c0b4', // 雙語會議紀錄
    seatFromDesk(-0.1, -2.6, 'collaboration', { offsetZ: -0.95, seatY: 0.45, faceYaw: 0 }),
  );

  // Phone 電話／對外 — two booths
  desks.set(
    '4f070b62-ac92-4824-9953-886cda5433d1', // Lotus Notes
    seatFromDesk(-1.95, 3.6, 'phone', { offsetZ: 0.45, seatY: 0.45, faceYaw: Math.PI }),
  );
  desks.set(
    '9f0fa493-9994-409c-b398-974b67de306e', // 日程助理
    seatFromDesk(-0.85, 3.6, 'phone', { offsetZ: 0.45, seatY: 0.45, faceYaw: Math.PI }),
  );

  return desks;
}

/** Meeting 會議 — handoff / walk target at conference table */
export const MEETING_HANDOFF = { x: -5.6, y: CHAIR.seatY, z: 3.6 };
/** @deprecated alias — handoffs go to Meeting now */
export const LEAD_HANDOFF = MEETING_HANDOFF;

/** Social 社交 lounge visit spots (no permanent home seats) */
export const SOCIAL_SPOTS = [
  { x: 6.2, z: -3.4 },
  { x: 7.2, z: -4.6 },
  { x: 5.2, z: -2.6 },
];

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.72,
    metalness: opts.metalness ?? 0.05,
    ...opts,
  });
}

function box(w, h, d, material, x, y, z, parent, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = shadow;
  parent.add(mesh);
  return mesh;
}

function cyl(rTop, rBot, h, material, x, y, z, parent, segs = 16, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = shadow;
  parent.add(mesh);
  return mesh;
}

/**
 * @param {THREE.Scene} scene
 * @param {THREE.TextureLoader} _loader
 */
export function buildOfficeScene(scene, _loader) {
  const root = new THREE.Group();
  root.name = 'office-root';
  scene.add(root);

  // Warm cozy materials — no cold industrial palette
  const wood = mat(0xd4a574, { roughness: 0.52 });
  const woodWarm = mat(0xb8895c, { roughness: 0.48 });
  const woodDark = mat(0x8b6914, { roughness: 0.48 });
  const wall = mat(0xfaf6f0, { roughness: 0.94 });
  const wallAccent = mat(0xf0e6d8, { roughness: 0.92 });
  const charcoal = mat(0x3a3a3e, { roughness: 0.7 });
  const blackMetal = mat(0x2a2e34, { roughness: 0.4, metalness: 0.55 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xd8eaf6,
    roughness: 0.08,
    metalness: 0.0,
    transmission: 0.82,
    thickness: 0.18,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
  });
  const frost = new THREE.MeshPhysicalMaterial({
    color: 0xf2e8dc,
    roughness: 0.7,
    metalness: 0,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });
  const plant = mat(0x4a9a5c, { roughness: 0.8 });
  const plantDark = mat(0x2f6e3e, { roughness: 0.84 });
  const pot = mat(0xd2b48c, { roughness: 0.7 });
  const screenGlow = mat(0x9ad0ef, {
    roughness: 0.25,
    metalness: 0.12,
    emissive: 0x4a88aa,
    emissiveIntensity: 0.55,
  });
  const sofaMat = mat(0xc8c2b8, { roughness: 0.9 });
  const loungeBlue = mat(0x5b7c9e, { roughness: 0.88 });
  const partitionMat = mat(0x9aa0a8, { roughness: 0.75 });

  // Base warm wood floor
  const woodFloorMat = makeWoodFloorMaterial();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), woodFloorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Zone floor tints (biophilic pastel rugs matching plan)
  for (const z of ZONES) {
    const tint = new THREE.Mesh(
      new THREE.PlaneGeometry(z.w, z.d),
      new THREE.MeshStandardMaterial({
        color: z.fill,
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.55,
      }),
    );
    tint.rotation.x = -Math.PI / 2;
    tint.position.set(z.x, 0.008, z.z);
    tint.receiveShadow = true;
    root.add(tint);
  }

  // Soft area rugs (cozy layering)
  const rugFocus = new THREE.Mesh(
    new THREE.PlaneGeometry(6.2, 5.0),
    mat(0xd4e8c8, { roughness: 0.98 }),
  );
  rugFocus.rotation.x = -Math.PI / 2;
  rugFocus.position.set(-5.2, 0.014, -3.5);
  rugFocus.receiveShadow = true;
  root.add(rugFocus);

  const rugSocial = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.4),
    mat(0xe8d4b0, { roughness: 0.98 }),
  );
  rugSocial.rotation.x = -Math.PI / 2;
  rugSocial.position.set(5.0, 0.014, -3.4);
  rugSocial.receiveShadow = true;
  root.add(rugSocial);

  // Exterior walls (charcoal outer feel on edges) — open top, no ceiling
  // Back wall (−Z) with windows
  buildWindowWall(root, wall, charcoal, glassMat);
  // Front wall fragment (+Z) with entrance gap
  buildEntranceWall(root, wall, charcoal, glassMat);
  // Side walls
  box(0.22, ROOM.h, ROOM.d, wall, -ROOM.w / 2, ROOM.h / 2, 0, root);
  box(0.22, ROOM.h, ROOM.d, wall, ROOM.w / 2, ROOM.h / 2, 0, root);
  // Soft inner wall wash strips (warm, not industrial)
  box(ROOM.w - 0.5, 0.12, 0.04, wallAccent, 0, 0.9, -ROOM.d / 2 + 0.14, root, false);

  // True cutaway: NO ceiling mesh, NO ducts, NO hanging industrial gear.
  // Warm free-floating pendant glows only (sparse, read as open-roof lamps).
  buildOpenPendants(root);

  // ——— Focus Zone: desks with privacy partitions ———
  const focusPositions = [
    [-7.2, -5.0],
    [-5.6, -5.0],
    [-4.0, -5.0],
    [-7.2, -2.8],
    [-5.6, -2.8],
    [-4.0, -2.8],
  ];
  for (const [dx, dz] of focusPositions) {
    buildFocusDesk(root, dx, dz, wood, woodWarm, blackMetal, screenGlow, plant, pot, partitionMat);
  }

  // ——— Collaboration Zone: two shared tables ———
  buildCollabTable(root, -0.1, -5.0, wood, woodWarm, blackMetal, plant, pot);
  buildCollabTable(root, -0.1, -2.6, wood, woodWarm, blackMetal, plant, pot);

  // ——— Social Zone ———
  buildSocialZone(root, wood, woodWarm, sofaMat, loungeBlue, plant, plantDark, pot);

  // ——— Meeting Zone (enclosed) ———
  buildMeetingRoom(root, wood, woodWarm, woodDark, glassMat, frost, blackMetal, screenGlow, plant, pot);

  // ——— Phone Zone ———
  buildPhoneBooths(root, wood, woodWarm, blackMetal, partitionMat, screenGlow);

  // ——— Reception Zone ———
  buildReception(root, wood, woodWarm, blackMetal, sofaMat, plant, plantDark, pot, screenGlow);

  // Biophilic floor plants throughout
  const plantSpots = [
    [-8.4, -6.4],
    [-8.3, -0.8],
    [-2.5, -6.5],
    [1.8, -6.4],
    [8.2, -6.3],
    [8.3, -1.0],
    [-8.3, 5.8],
    [0.6, 1.2],
    [8.0, 5.8],
    [-0.1, -3.8],
  ];
  for (const [px, pz] of plantSpots) {
    buildFloorPlant(root, px, pz, plant, plantDark, pot, 0.9 + (Math.abs(px) % 5) * 0.08);
  }

  const desks = deskLayout();
  buildZoneOutlines(root);

  return { root, desks };
}

function buildWindowWall(root, wall, charcoal, glassMat) {
  const z = -ROOM.d / 2;
  const thick = 0.22;
  // Sill + header + mullions (windows along top/back wall)
  box(ROOM.w, 0.45, thick, wall, 0, 0.22, z, root);
  box(ROOM.w, 0.4, thick, wall, 0, ROOM.h - 0.2, z, root);
  for (const x of [-ROOM.w / 2 + 0.1, -4.5, -1.5, 1.5, 4.5, ROOM.w / 2 - 0.1]) {
    box(0.14, ROOM.h, thick, charcoal, x, ROOM.h / 2, z, root);
  }
  box(ROOM.w - 0.4, 0.08, thick, charcoal, 0, 1.85, z, root);

  // Soft plain sky behind glass — NOT a city mural
  const skyTex = createSoftSkyTexture(THREE);
  const view = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.w * 1.05, ROOM.h * 1.05),
    new THREE.MeshBasicMaterial({ map: skyTex }),
  );
  view.position.set(0, ROOM.h / 2 - 0.05, z - 1.6);
  root.add(view);

  const wash = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.w - 0.5, ROOM.h - 0.6),
    new THREE.MeshBasicMaterial({ color: 0xffe8c8, transparent: true, opacity: 0.07 }),
  );
  wash.position.set(0, ROOM.h / 2, z + 0.06);
  root.add(wash);

  // Glass panes
  const paneYs = [1.05, 2.65];
  const paneXs = [
    [-7.0, 4.4],
    [-3.0, 4.4],
    [0.0, 4.4],
    [3.0, 4.4],
    [7.0, 4.4],
  ];
  for (const [cx, pw] of paneXs) {
    for (const y of paneYs) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(pw, 1.35), glassMat);
      pane.position.set(cx, y, z + 0.08);
      root.add(pane);
    }
  }
}

function buildEntranceWall(root, wall, charcoal, glassMat) {
  const z = ROOM.d / 2;
  const thick = 0.22;
  // Left and right of entrance opening
  box(6.2, ROOM.h, thick, wall, -5.9, ROOM.h / 2, z, root);
  box(6.2, ROOM.h, thick, wall, 5.9, ROOM.h / 2, z, root);
  // Header over doors
  box(5.6, 0.9, thick, wall, 0, ROOM.h - 0.45, z, root);
  // Door frames
  box(0.12, 2.5, 0.1, charcoal, -1.35, 1.25, z - 0.05, root);
  box(0.12, 2.5, 0.1, charcoal, 1.35, 1.25, z - 0.05, root);
  box(2.8, 0.1, 0.1, charcoal, 0, 2.55, z - 0.05, root);
  // Glass doors
  for (const ox of [-0.65, 0.65]) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.35), glassMat);
    door.position.set(ox, 1.2, z - 0.02);
    root.add(door);
  }
  // Entrance floor arrow hint (subtle)
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.55, 3),
    new THREE.MeshBasicMaterial({ color: 0x5a5a60, transparent: true, opacity: 0.35 }),
  );
  arrow.rotation.x = Math.PI / 2;
  arrow.rotation.z = Math.PI;
  arrow.position.set(0, 0.03, z - 1.1);
  root.add(arrow);
}

/** Sparse warm pendants — open roof, no ducts/ceiling slab */
function buildOpenPendants(root) {
  const spots = [
    [-5.2, -3.6],
    [-0.1, -3.6],
    [4.8, -3.6],
    [-5.5, 3.2],
    [3.2, 3.4],
    [-1.4, 3.4],
  ];
  for (const [x, z] of spots) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xffe2b5,
        emissive: 0xffc878,
        emissiveIntensity: 1.5,
        roughness: 0.4,
      }),
    );
    glow.position.set(x, ROOM.h - 0.55, z);
    root.add(glow);
    // Tiny shade disc (not a ceiling)
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.06, 16),
      mat(0xf5ebe0, { roughness: 0.7 }),
    );
    shade.position.set(x, ROOM.h - 0.48, z);
    root.add(shade);
  }
}

function buildFocusDesk(root, x, z, wood, woodWarm, blackMetal, screenGlow, plant, pot, partitionMat) {
  const h = 0.74;
  box(1.35, 0.05, 0.72, wood, x, h, z, root);
  box(1.25, 0.04, 0.62, woodWarm, x, h - 0.05, z, root, false);
  for (const [lx, lz] of [
    [-0.58, -0.28],
    [0.58, -0.28],
    [-0.58, 0.28],
    [0.58, 0.28],
  ]) {
    box(0.04, h, 0.04, blackMetal, x + lx, h / 2, z + lz, root);
  }
  // Privacy partition behind monitors
  box(1.3, 0.48, 0.04, partitionMat, x, h + 0.28, z - 0.34, root);
  // Single warm monitor
  box(0.55, 0.36, 0.03, blackMetal, x, h + 0.36, z - 0.22, root);
  box(0.5, 0.3, 0.012, screenGlow, x, h + 0.36, z - 0.2, root, false);
  box(0.08, 0.14, 0.06, blackMetal, x, h + 0.1, z - 0.22, root, false);
  box(0.22, 0.02, 0.14, blackMetal, x, h + 0.02, z - 0.18, root, false);
  // Keyboard
  box(0.36, 0.015, 0.18, blackMetal, x, h + 0.03, z + 0.12, root, false);
  // Chair
  const seat = mat(0x2c3038, { roughness: 0.72 });
  const chairZ = z + 0.58;
  box(0.5, 0.08, 0.5, seat, x, 0.435, chairZ, root);
  box(0.5, 0.52, 0.07, seat, x, 0.72, chairZ + 0.2, root);
  cyl(0.055, 0.055, 0.34, blackMetal, x, 0.22, chairZ, root, 10, false);
  cyl(0.18, 0.18, 0.04, blackMetal, x, 0.08, chairZ, root, 12, false);
  // Desk plant + mug
  cyl(0.05, 0.06, 0.06, pot, x + 0.5, h + 0.045, z + 0.2, root, 10, false);
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 8), plant);
  leaf.position.set(x + 0.5, h + 0.18, z + 0.2);
  root.add(leaf);
  cyl(0.032, 0.028, 0.065, mat(0xf8f4ec), x - 0.48, h + 0.05, z + 0.18, root, 10, false);
}

function buildCollabTable(root, x, z, wood, woodWarm, blackMetal, plant, pot) {
  box(3.2, 0.06, 1.35, wood, x, 0.74, z, root);
  for (const [lx, lz] of [
    [-1.35, -0.5],
    [1.35, -0.5],
    [-1.35, 0.5],
    [1.35, 0.5],
  ]) {
    box(0.08, 0.72, 0.08, woodWarm, x + lx, 0.36, z + lz, root);
  }
  // Center plant
  cyl(0.08, 0.1, 0.1, pot, x, 0.82, z, root, 10, false);
  const bush = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), plant);
  bush.position.set(x, 1.02, z);
  root.add(bush);
  // Chairs (3 each long side) + laptop slabs
  const seat = mat(0x2c3038, { roughness: 0.72 });
  for (const side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      const cx = x + i * 0.95;
      const cz = z + side * 0.95;
      box(0.42, 0.07, 0.42, seat, cx, 0.42, cz, root);
      box(0.42, 0.4, 0.06, seat, cx, 0.65, cz + side * 0.18, root);
      cyl(0.05, 0.05, 0.3, blackMetal, cx, 0.2, cz, root, 8, false);
    }
  }
  for (const ox of [-0.9, 0, 0.9]) {
    box(0.32, 0.015, 0.22, blackMetal, x + ox, 0.78, z + 0.25, root, false);
    box(0.32, 0.015, 0.22, blackMetal, x + ox, 0.78, z - 0.25, root, false);
  }
}

function buildSocialZone(root, wood, woodWarm, sofaMat, loungeBlue, plant, plantDark, pot) {
  // Planter divider vs collaboration
  box(0.55, 0.55, 4.8, woodWarm, 2.35, 0.28, -3.6, root);
  box(0.48, 0.08, 4.6, mat(0x5a4030, { roughness: 0.85 }), 2.35, 0.58, -3.6, root, false);
  for (let i = 0; i < 7; i++) {
    const pz = -5.6 + i * 0.7;
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.28 + (i % 3) * 0.04, 10, 10),
      i % 2 ? plant : plantDark,
    );
    bush.position.set(2.35, 0.95, pz);
    bush.castShadow = true;
    root.add(bush);
  }

  // Long sofa along +X wall
  box(0.85, 0.42, 3.6, sofaMat, 7.6, 0.32, -3.8, root);
  box(0.18, 0.4, 3.6, sofaMat, 7.95, 0.68, -3.8, root);
  // Blue lounge chair
  box(0.7, 0.38, 0.7, loungeBlue, 5.4, 0.3, -5.8, root);
  box(0.7, 0.45, 0.12, loungeBlue, 5.4, 0.7, -6.1, root);
  // Coffee tables + ottoman
  cyl(0.32, 0.32, 0.08, wood, 6.2, 0.28, -3.6, root, 20);
  cyl(0.06, 0.06, 0.26, woodWarm, 6.2, 0.13, -3.6, root, 10, false);
  cyl(0.28, 0.28, 0.08, wood, 6.8, 0.28, -2.4, root, 20);
  cyl(0.06, 0.06, 0.26, woodWarm, 6.8, 0.13, -2.4, root, 10, false);
  box(0.55, 0.28, 0.55, mat(0xf5f0e8, { roughness: 0.92 }), 5.0, 0.2, -2.8, root);
  // Corner plant
  buildFloorPlant(root, 8.0, -5.9, plant, plantDark, pot, 1.25);
  buildFloorPlant(root, 8.1, -1.2, plant, plantDark, pot, 1.05);
}

function buildMeetingRoom(root, wood, woodWarm, woodDark, glassMat, frost, blackMetal, screenGlow, plant, pot) {
  const cx = -5.6;
  const cz = 3.4;
  const gw = 5.0;
  const gd = 4.6;
  const gh = 2.55;

  // Solid-ish warm walls with glass fronts
  box(gw, gh, 0.08, frost, cx, gh / 2, cz - gd / 2, root);
  box(0.08, gh, gd, frost, cx - gw / 2, gh / 2, cz, root);
  box(0.08, gh, gd, frost, cx + gw / 2, gh / 2, cz, root);
  // Door gap on +Z side
  box(gw * 0.35, gh, 0.08, frost, cx - gw * 0.3, gh / 2, cz + gd / 2, root);
  box(gw * 0.35, gh, 0.08, frost, cx + gw * 0.3, gh / 2, cz + gd / 2, root);
  for (const [fx, fz] of [
    [cx - gw / 2, cz - gd / 2],
    [cx + gw / 2, cz - gd / 2],
    [cx - gw / 2, cz + gd / 2],
    [cx + gw / 2, cz + gd / 2],
  ]) {
    box(0.1, gh, 0.1, blackMetal, fx, gh / 2, fz, root);
  }
  // Glass upper strips
  for (const side of [
    { w: gw - 0.2, d: 0.04, x: cx, z: cz - gd / 2 + 0.02 },
    { w: 0.04, d: gd - 0.2, x: cx - gw / 2 + 0.02, z: cz },
    { w: 0.04, d: gd - 0.2, x: cx + gw / 2 - 0.02, z: cz },
  ]) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(side.w, 1.1, side.d), glassMat);
    g.position.set(side.x, 1.85, side.z);
    root.add(g);
  }

  // Conference table + 8 chairs
  box(2.8, 0.06, 1.3, wood, cx, 0.74, cz, root);
  for (const [lx, lz] of [
    [-1.1, -0.45],
    [1.1, -0.45],
    [-1.1, 0.45],
    [1.1, 0.45],
  ]) {
    box(0.08, 0.72, 0.08, woodWarm, cx + lx, 0.36, cz + lz, root);
  }
  const seat = mat(0x2c3038, { roughness: 0.72 });
  const chairSpots = [
    [-0.9, -0.95],
    [0, -0.95],
    [0.9, -0.95],
    [-0.9, 0.95],
    [0, 0.95],
    [0.9, 0.95],
    [-1.55, 0],
    [1.55, 0],
  ];
  for (const [ox, oz] of chairSpots) {
    box(0.42, 0.07, 0.42, seat, cx + ox, 0.42, cz + oz, root);
    box(0.42, 0.4, 0.06, seat, cx + ox, 0.65, cz + oz + (oz === 0 ? (ox > 0 ? 0.18 : -0.18) : Math.sign(oz) * 0.18), root);
  }

  // Wall display on −X inner wall
  box(0.06, 1.1, 1.8, blackMetal, cx - gw / 2 + 0.12, 1.55, cz, root);
  box(0.04, 1.0, 1.65, screenGlow, cx - gw / 2 + 0.16, 1.55, cz, root, false);

  cyl(0.08, 0.1, 0.12, pot, cx - 1.8, 0.1, cz + 1.8, root, 10, false);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), plant);
  leaf.position.set(cx - 1.8, 0.45, cz + 1.8);
  root.add(leaf);
}

function buildPhoneBooths(root, wood, woodWarm, blackMetal, partitionMat, screenGlow) {
  const baseX = -1.4;
  const baseZ = 3.6;
  // Outer shell
  box(2.4, 2.3, 0.08, partitionMat, baseX, 1.15, baseZ - 1.9, root);
  box(2.4, 2.3, 0.08, partitionMat, baseX, 1.15, baseZ + 1.9, root);
  box(0.08, 2.3, 3.8, partitionMat, baseX - 1.2, 1.15, baseZ, root);
  // Center divider → two booths
  box(0.08, 2.1, 3.5, partitionMat, baseX, 1.05, baseZ, root);
  box(0.08, 2.3, 3.8, frostLite(), baseX + 1.2, 1.15, baseZ, root);

  for (const side of [-1, 1]) {
    const bx = baseX + side * 0.55;
    const bz = baseZ;
    box(0.9, 0.05, 0.55, wood, bx, 0.74, bz, root);
    box(0.42, 0.32, 0.03, blackMetal, bx, 1.05, bz - 0.18, root);
    box(0.38, 0.26, 0.012, screenGlow, bx, 1.05, bz - 0.16, root, false);
    const seat = mat(0x2c3038, { roughness: 0.72 });
    box(0.4, 0.07, 0.4, seat, bx, 0.42, bz + 0.45, root);
    box(0.4, 0.4, 0.06, seat, bx, 0.65, bz + 0.62, root);
  }

  function frostLite() {
    return new THREE.MeshPhysicalMaterial({
      color: 0xf5ebe0,
      roughness: 0.65,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
  }
}

function buildReception(root, wood, woodWarm, blackMetal, sofaMat, plant, plantDark, pot, screenGlow) {
  // L-shaped reception desk
  // Main span (facing entrance, along X)
  box(3.2, 0.95, 0.7, wood, 2.4, 0.48, 4.55, root);
  box(3.2, 0.05, 0.75, woodWarm, 2.4, 0.98, 4.55, root);
  // Return leg toward −Z
  box(0.7, 0.95, 2.0, wood, 3.65, 0.48, 3.4, root);
  box(0.75, 0.05, 2.0, woodWarm, 3.65, 0.98, 3.4, root);
  // Monitor on desk
  box(0.5, 0.34, 0.03, blackMetal, 2.4, 1.25, 4.35, root);
  box(0.46, 0.28, 0.012, screenGlow, 2.4, 1.25, 4.33, root, false);
  // Reception chair (behind desk, toward −Z)
  const seat = mat(0x2c3038, { roughness: 0.72 });
  const chairZ = 4.2 - 0.55;
  box(0.5, 0.08, 0.5, seat, 2.4, 0.435, chairZ, root);
  box(0.5, 0.52, 0.07, seat, 2.4, 0.72, chairZ - 0.2, root);
  cyl(0.055, 0.055, 0.34, blackMetal, 2.4, 0.22, chairZ, root, 10, false);

  // Tall green wall / planter separating waiting area
  box(0.5, 2.2, 3.2, woodWarm, 5.4, 1.1, 3.6, root);
  box(0.42, 0.12, 3.0, mat(0x4a3520, { roughness: 0.85 }), 5.4, 2.25, 3.6, root, false);
  for (let i = 0; i < 8; i++) {
    const pz = 2.2 + i * 0.35;
    const bush = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 10),
      i % 2 ? plant : plantDark,
    );
    bush.position.set(5.4, 1.6 + (i % 3) * 0.15, pz);
    bush.castShadow = true;
    root.add(bush);
  }

  // Waiting chairs + side table
  box(0.7, 0.4, 0.7, sofaMat, 7.0, 0.32, 4.6, root);
  box(0.7, 0.45, 0.12, sofaMat, 7.0, 0.7, 4.9, root);
  box(0.7, 0.4, 0.7, sofaMat, 7.0, 0.32, 3.2, root);
  box(0.7, 0.45, 0.12, sofaMat, 7.0, 0.7, 2.9, root);
  cyl(0.28, 0.28, 0.08, wood, 7.9, 0.28, 3.9, root, 18);
  cyl(0.05, 0.05, 0.26, woodWarm, 7.9, 0.13, 3.9, root, 10, false);

  buildFloorPlant(root, 8.2, 5.5, plant, plantDark, pot, 1.15);
}

function buildFloorPlant(root, x, z, plant, plantDark, pot, scale = 1) {
  cyl(0.16 * scale, 0.13 * scale, 0.28 * scale, pot, x, 0.14 * scale, z, root, 12);
  const bush = new THREE.Mesh(new THREE.SphereGeometry(0.35 * scale, 12, 12), plant);
  bush.position.set(x, 0.42 * scale, z);
  bush.castShadow = true;
  root.add(bush);
  const bush2 = new THREE.Mesh(new THREE.SphereGeometry(0.22 * scale, 10, 10), plantDark);
  bush2.position.set(x + 0.12 * scale, 0.5 * scale, z + 0.08 * scale);
  root.add(bush2);
}

function makeWoodFloorMaterial() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#d8b892';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {
    const y = i * 32;
    g.fillStyle = i % 2 === 0 ? '#c9a07a' : '#d8b892';
    g.fillRect(0, y, 512, 32);
    g.strokeStyle = 'rgba(130, 90, 50, 0.16)';
    g.beginPath();
    g.moveTo(0, y + 31);
    g.lineTo(512, y + 31);
    g.stroke();
    for (let x = (i % 2) * 64; x < 512; x += 128) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 32);
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0.02 });
}

function buildZoneOutlines(root) {
  for (const z of ZONES) {
    const color = new THREE.Color(z.color);
    const edgeMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.75,
    });
    const y = 0.022;
    const t = 0.04;
    const hw = z.w / 2;
    const hd = z.d / 2;
    const mk = (bw, bd, x, zz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.012, bd), edgeMat.clone());
      m.position.set(x, y, zz);
      root.add(m);
    };
    mk(z.w, t, z.x, z.z - hd);
    mk(z.w, t, z.x, z.z + hd);
    mk(t, z.d, z.x - hw, z.z);
    mk(t, z.d, z.x + hw, z.z);

    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(z.w - 0.1, z.d - 0.1),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.05, depthWrite: false }),
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(z.x, 0.018, z.z);
    root.add(fill);

    // Bilingual zone label
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 320, 80);
    ctx.font = '700 26px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillText(`${z.labelEn} · ${z.labelZh}`, 161, 42);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${z.labelEn} · ${z.labelZh}`, 160, 40);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const spr = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
    );
    spr.scale.set(2.4, 0.6, 1);
    spr.position.set(z.x, 0.12, z.z + hd - 0.35);
    root.add(spr);
  }
}

/**
 * @returns {{ hemi: THREE.HemisphereLight, sun: THREE.DirectionalLight, fill: THREE.DirectionalLight, ambient: THREE.AmbientLight, points: THREE.PointLight[] }}
 */
export function setupLighting(scene) {
  // Soft warm void — no outdoor panorama
  scene.background = new THREE.Color(0xe8e0d4);
  scene.fog = new THREE.Fog(0xe8e0d4, 28, 65);

  const hemi = new THREE.HemisphereLight(0xfff2e0, 0xb8a890, 1.0);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe2b8, 2.2);
  sun.position.set(-6, 14, -10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 50;
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xd4c4b0, 0.5);
  fill.position.set(10, 8, 6);
  scene.add(fill);

  const ambient = new THREE.AmbientLight(0xfff5ea, 0.48);
  scene.add(ambient);

  const points = [];
  for (const [x, z, i] of [
    [-5.2, -3.6, 0.65],
    [-0.1, -3.6, 0.55],
    [4.8, -3.6, 0.55],
    [-5.5, 3.2, 0.5],
    [3.2, 3.4, 0.5],
    [-1.4, 3.4, 0.4],
  ]) {
    const p = new THREE.PointLight(0xffd6a0, i, 10, 2);
    p.position.set(x, 2.9, z);
    scene.add(p);
    points.push(p);
  }

  return { hemi, sun, fill, ambient, points };
}

/** @param {'now'|'day'|'evening'|'night'} mode */
export function applyLightingMode(scene, lights, mode) {
  let resolved = mode;
  if (mode === 'now') {
    const h = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Hong_Kong',
      hour: 'numeric',
      hour12: false,
    });
    const hour = Number(h);
    if (hour >= 6 && hour < 16) resolved = 'day';
    else if (hour >= 16 && hour < 20) resolved = 'evening';
    else resolved = 'night';
  }

  const presets = {
    day: {
      bg: 0xe8e0d4,
      fog: 0xe8e0d4,
      hemiSky: 0xfff2e0,
      hemiGround: 0xb8a890,
      hemiI: 1.0,
      sunC: 0xffe2b8,
      sunI: 2.2,
      fillC: 0xd4c4b0,
      fillI: 0.5,
      ambC: 0xfff5ea,
      ambI: 0.48,
      pointC: 0xffd6a0,
      pointMul: 1,
      exposure: 1.1,
    },
    evening: {
      bg: 0xd4b896,
      fog: 0xd4b896,
      hemiSky: 0xffc9a0,
      hemiGround: 0x8a7060,
      hemiI: 0.8,
      sunC: 0xff8a4a,
      sunI: 1.6,
      fillC: 0xc4a080,
      fillI: 0.4,
      ambC: 0xffd8b8,
      ambI: 0.38,
      pointC: 0xffb070,
      pointMul: 1.2,
      exposure: 1.02,
    },
    night: {
      bg: 0x1a1820,
      fog: 0x1a1820,
      hemiSky: 0x3a3a50,
      hemiGround: 0x1a1820,
      hemiI: 0.32,
      sunC: 0x6a7a9a,
      sunI: 0.3,
      fillC: 0x405060,
      fillI: 0.22,
      ambC: 0x1e2030,
      ambI: 0.28,
      pointC: 0xffc890,
      pointMul: 1.7,
      exposure: 0.95,
    },
  };
  const p = presets[resolved] || presets.day;
  scene.background = new THREE.Color(p.bg);
  if (scene.fog) {
    scene.fog.color.setHex(p.fog);
  }
  lights.hemi.color.setHex(p.hemiSky);
  lights.hemi.groundColor.setHex(p.hemiGround);
  lights.hemi.intensity = p.hemiI;
  lights.sun.color.setHex(p.sunC);
  lights.sun.intensity = p.sunI;
  lights.fill.color.setHex(p.fillC);
  lights.fill.intensity = p.fillI;
  lights.ambient.color.setHex(p.ambC);
  lights.ambient.intensity = p.ambI;
  const base = [0.65, 0.55, 0.55, 0.5, 0.5, 0.4];
  lights.points.forEach((pt, i) => {
    pt.color.setHex(p.pointC);
    pt.intensity = (base[i] ?? 0.5) * p.pointMul;
  });
  return p.exposure;
}

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  return renderer;
}

/** Elevated isometric / dollhouse cutaway framing. */
export function createCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 90);
  camera.position.set(12.5, 11.5, 13.5);
  camera.lookAt(0.2, 0.3, 0.2);
  return camera;
}
