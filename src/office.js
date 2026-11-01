/**
 * AS Virtual Office — tech / sci-fi cutaway office.
 * Zones follow AS sidebar sections. Cool LED + glass + holographics,
 * warm wood desks. No ceiling; soft void sky only.
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
export function seatFromDesk(deskX, deskZ, zone = 'itss1', chair = CHAIR) {
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
 * Section zones (world XZ). Windows on −Z; entrance on +Z.
 * Primary homes match AS sidebar categories.
 * Meeting kept as handoff amenity (no permanent homes).
 */
export const ZONES = [
  {
    id: 'itss1',
    labelEn: 'ITSS1',
    labelZh: 'ITSS1',
    color: 0x00e5ff,
    fill: 0x0a3040,
    x: -5.0,
    z: -3.5,
    w: 7.2,
    d: 5.8,
  },
  {
    id: 'programming',
    labelEn: 'Programming',
    labelZh: '编程',
    color: 0xff4d9a,
    fill: 0x301028,
    x: 1.15,
    z: -3.6,
    w: 3.5,
    d: 5.6,
  },
  {
    id: 'self',
    labelEn: 'Self Enhancement',
    labelZh: 'Self Enhancement',
    color: 0xb388ff,
    fill: 0x1a1430,
    x: 5.5,
    z: -3.5,
    w: 4.8,
    d: 5.8,
  },
  {
    id: 'meeting',
    labelEn: 'Meeting',
    labelZh: '會議',
    color: 0x7c4dff,
    fill: 0x1a1630,
    x: -5.6,
    z: 3.4,
    w: 5.6,
    d: 5.2,
  },
  {
    id: 'general',
    labelEn: 'General',
    labelZh: 'General',
    color: 0x40c4ff,
    fill: 0x0c2438,
    x: -0.3,
    z: 3.5,
    w: 4.6,
    d: 5.0,
  },
  {
    id: 'reception',
    labelEn: 'Reception',
    labelZh: '總管',
    color: 0xff80ab,
    fill: 0x2a1520,
    x: 4.6,
    z: 3.5,
    w: 5.6,
    d: 5.0,
  },
];

/**
 * Desk / seat anchors by sidebar section.
 * Reception 1 · Programming 1 · General 4 · ITSS1 5 · Self Enhancement 1.
 * Meeting = handoff walk only; Social lounge sits inside Self Enhancement.
 */
export function deskLayout() {
  const desks = new Map();

  // Reception / 總管 — Bot 總管 at L-desk
  desks.set(LEAD_ID, seatFromDesk(4.0, 4.2, 'reception', RECEPTION_CHAIR));

  // ITSS1 — 5 partitioned deep-work desks (3 + 2)
  const itss1 = [
    { id: '4f070b62-ac92-4824-9953-886cda5433d1', x: -7.2, z: -5.0 }, // Lotus Notes
    { id: 'c7f037b0-0082-4290-a543-00f203e4c150', x: -5.5, z: -5.0 }, // HK Gov IT Security
    { id: '5f8f09c0-fe3d-40a5-87c1-2fcc440bb9c3', x: -3.8, z: -5.0 }, // assessment-validator
    { id: 'aecd27e2-8d49-4c33-962c-cdfa1860fd26', x: -6.6, z: -2.7 }, // Infrastructure
    { id: '26fffc1c-3c69-4346-8a68-199db47277fd', x: -4.6, z: -2.7 }, // Scheduler
  ];
  for (const d of itss1) {
    desks.set(d.id, seatFromDesk(d.x, d.z, 'itss1'));
  }

  // Programming / 编程 — Coding Bot dual-monitor bay
  desks.set(
    'b7c9b07d-4a12-49af-bbdf-7fa19bdc96b2',
    seatFromDesk(1.15, -4.2, 'programming'),
  );

  // Self Enhancement — Grok Bot Coach
  desks.set(
    '764c93f4-9330-4daa-9f86-481be3b19e60',
    seatFromDesk(5.6, -4.6, 'self'),
  );

  // General — 4 seats on OUTER sides of two tables (avoid mid-aisle stack)
  desks.set(
    '9f0fa493-9994-409c-b398-974b67de306e', // 日程助理 — north table, −Z side
    seatFromDesk(-1.4, 2.7, 'general', { offsetZ: -0.95, seatY: 0.45, faceYaw: 0 }),
  );
  desks.set(
    '6a0dc819-57c2-4507-ae25-f3b3122c3f46', // 報價與消費 — north table, −Z side
    seatFromDesk(0.6, 2.7, 'general', { offsetZ: -0.95, seatY: 0.45, faceYaw: 0 }),
  );
  desks.set(
    '2fb3b7e8-b556-45ea-8b10-1ced7f05c0b4', // 雙語會議紀錄 — south table, +Z side
    seatFromDesk(-1.4, 4.4, 'general', { offsetZ: 0.95, seatY: 0.45, faceYaw: Math.PI }),
  );
  desks.set(
    '28c84d63-5b73-4b78-aebc-3a2e02376fc2', // 港式中英文寫作 — south table, +Z side
    seatFromDesk(0.6, 4.4, 'general', { offsetZ: 0.95, seatY: 0.45, faceYaw: Math.PI }),
  );

  return desks;
}

/** Meeting 會議 — handoff / walk target at conference table */
export const MEETING_HANDOFF = { x: -5.6, y: CHAIR.seatY, z: 3.6 };
/** @deprecated alias — handoffs go to Meeting now */
export const LEAD_HANDOFF = MEETING_HANDOFF;

/** Social lounge visit spots (inside Self Enhancement) */
export const SOCIAL_SPOTS = [
  { x: 6.6, z: -2.4 },
  { x: 7.4, z: -3.6 },
  { x: 5.8, z: -2.0 },
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

function ledStrip(parent, w, d, x, y, z, color = 0x00e5ff, intensity = 0.9) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.02, d),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.3,
      metalness: 0.4,
    }),
  );
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function holoPanel(parent, w, h, x, y, z, rotY = 0, color = 0x40c4ff) {
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      roughness: 0.2,
      metalness: 0.1,
      depthWrite: false,
    }),
  );
  panel.position.set(x, y, z);
  panel.rotation.y = rotY;
  parent.add(panel);
  // Frame glow
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.06, h + 0.06, 0.02),
    new THREE.MeshStandardMaterial({
      color: 0x1a2330,
      emissive: color,
      emissiveIntensity: 0.35,
      metalness: 0.7,
      roughness: 0.3,
    }),
  );
  frame.position.set(x, y, z - 0.01);
  frame.rotation.y = rotY;
  parent.add(frame);
  return panel;
}

/**
 * @param {THREE.Scene} scene
 * @param {THREE.TextureLoader} _loader
 */
export function buildOfficeScene(scene, _loader) {
  const root = new THREE.Group();
  root.name = 'office-root';
  scene.add(root);

  // Tech materials — cool dark metals + glass + warm wood desks
  const wood = mat(0xc49a6c, { roughness: 0.48, metalness: 0.08 });
  const woodWarm = mat(0xa67c52, { roughness: 0.45, metalness: 0.06 });
  const woodDark = mat(0x6b4f32, { roughness: 0.5, metalness: 0.1 });
  const wall = mat(0x1a2230, { roughness: 0.88, metalness: 0.12 });
  const wallAccent = mat(0x243044, { roughness: 0.75, metalness: 0.25 });
  const charcoal = mat(0x0e141c, { roughness: 0.55, metalness: 0.45 });
  const blackMetal = mat(0x1c242e, { roughness: 0.28, metalness: 0.72 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88c8e8,
    roughness: 0.05,
    metalness: 0.05,
    transmission: 0.88,
    thickness: 0.14,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
  });
  const frost = new THREE.MeshPhysicalMaterial({
    color: 0xa8c4d8,
    roughness: 0.45,
    metalness: 0.15,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  const plantLeaf = mat(0x3d9a62, { roughness: 0.55, metalness: 0.05 });
  const plantLeafDark = mat(0x246b42, { roughness: 0.6 });
  const plantLeafLite = mat(0x6bc48a, { roughness: 0.5 });
  const pot = mat(0x2a3038, { roughness: 0.55, metalness: 0.35 });
  const potWarm = mat(0x8b6914, { roughness: 0.65, metalness: 0.1 });
  const screenGlow = mat(0x5ad4ff, {
    roughness: 0.18,
    metalness: 0.2,
    emissive: 0x1a88cc,
    emissiveIntensity: 0.85,
  });
  const sofaMat = mat(0x2a3340, { roughness: 0.82, metalness: 0.15 });
  const loungeAccent = mat(0x3d5afe, { roughness: 0.7, metalness: 0.2 });
  const partitionMat = mat(0x263040, { roughness: 0.45, metalness: 0.4 });

  // Dark tech floor
  const floorMat = makeTechFloorMaterial();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Zone floor tints
  for (const z of ZONES) {
    const tint = new THREE.Mesh(
      new THREE.PlaneGeometry(z.w, z.d),
      new THREE.MeshStandardMaterial({
        color: z.fill,
        roughness: 0.9,
        metalness: 0.15,
        transparent: true,
        opacity: 0.72,
        emissive: z.color,
        emissiveIntensity: 0.04,
      }),
    );
    tint.rotation.x = -Math.PI / 2;
    tint.position.set(z.x, 0.008, z.z);
    tint.receiveShadow = true;
    root.add(tint);
  }

  // LED floor rails along zone edges (subtle)
  for (const z of ZONES) {
    const hw = z.w / 2;
    const hd = z.d / 2;
    ledStrip(root, z.w, 0.035, z.x, 0.015, z.z - hd, z.color, 0.55);
    ledStrip(root, z.w, 0.035, z.x, 0.015, z.z + hd, z.color, 0.55);
    ledStrip(root, 0.035, z.d, z.x - hw, 0.015, z.z, z.color, 0.55);
    ledStrip(root, 0.035, z.d, z.x + hw, 0.015, z.z, z.color, 0.55);
  }

  buildWindowWall(root, wall, charcoal, glassMat);
  buildEntranceWall(root, wall, charcoal, glassMat);
  box(0.22, ROOM.h, ROOM.d, wall, -ROOM.w / 2, ROOM.h / 2, 0, root);
  box(0.22, ROOM.h, ROOM.d, wall, ROOM.w / 2, ROOM.h / 2, 0, root);
  // Cool LED wash strip on back wall
  ledStrip(root, ROOM.w - 0.6, 0.04, 0, 0.95, -ROOM.d / 2 + 0.14, 0x00e5ff, 0.8);
  ledStrip(root, ROOM.w - 0.6, 0.03, 0, 2.4, -ROOM.d / 2 + 0.14, 0xff4d9a, 0.45);

  buildOpenPendants(root);

  // ——— ITSS1: 5 tech desks ———
  const itssPositions = [
    [-7.2, -5.0],
    [-5.5, -5.0],
    [-3.8, -5.0],
    [-6.6, -2.7],
    [-4.6, -2.7],
  ];
  for (const [dx, dz] of itssPositions) {
    buildFocusDesk(root, dx, dz, wood, woodWarm, blackMetal, screenGlow, plantLeaf, pot, partitionMat);
  }

  // ——— Programming: dual-monitor coding bay ———
  buildCodingBay(root, 1.15, -4.2, wood, woodWarm, blackMetal, screenGlow, plantLeaf, pot, partitionMat);

  // ——— Self Enhancement desk + social lounge ———
  buildFocusDesk(root, 5.6, -4.6, wood, woodWarm, blackMetal, screenGlow, plantLeaf, pot, partitionMat);
  buildSocialLounge(root, wood, woodWarm, sofaMat, loungeAccent, plantLeaf, plantLeafDark, pot, potWarm);

  // ——— Meeting (handoff) ———
  buildMeetingRoom(root, wood, woodWarm, woodDark, glassMat, frost, blackMetal, screenGlow, plantLeaf, pot);

  // ——— General: two shared tables ———
  buildCollabTable(root, -0.4, 2.7, wood, woodWarm, blackMetal, plantLeaf, pot);
  buildCollabTable(root, -0.4, 4.4, wood, woodWarm, blackMetal, plantLeaf, pot);

  // ——— Reception / 總管 ———
  buildReception(root, wood, woodWarm, blackMetal, sofaMat, plantLeaf, plantLeafDark, pot, potWarm, screenGlow);

  // Phone-booth amenity (unused homes — quiet call pods near General/Meeting)
  buildPhoneBooths(root, wood, woodWarm, blackMetal, partitionMat, screenGlow, frost);

  // Holo accent panels
  holoPanel(root, 1.4, 0.9, -8.55, 1.7, -3.5, Math.PI / 2, 0x00e5ff);
  holoPanel(root, 1.2, 0.8, 8.55, 1.6, -3.2, -Math.PI / 2, 0xb388ff);
  holoPanel(root, 1.1, 0.7, 8.55, 1.5, 3.5, -Math.PI / 2, 0xff80ab);

  // Procedural plants
  const plantSpots = [
    { x: -8.4, z: -6.4, type: 'tall', s: 1.15 },
    { x: -8.3, z: -0.9, type: 'fern', s: 1.0 },
    { x: -2.4, z: -6.5, type: 'bush', s: 0.95 },
    { x: 2.6, z: -6.4, type: 'tall', s: 1.05 },
    { x: 8.2, z: -6.3, type: 'monstera', s: 1.2 },
    { x: 8.3, z: -1.0, type: 'fern', s: 0.9 },
    { x: -8.3, z: 5.8, type: 'bush', s: 1.05 },
    { x: 0.8, z: 1.15, type: 'fern', s: 0.85 },
    { x: 8.0, z: 5.8, type: 'tall', s: 1.1 },
    { x: -2.8, z: 1.0, type: 'monstera', s: 0.95 },
    { x: 3.2, z: -1.5, type: 'bush', s: 0.8 },
  ];
  for (const p of plantSpots) {
    buildProceduralPlant(root, p.x, p.z, plantLeaf, plantLeafDark, plantLeafLite, pot, potWarm, p.type, p.s);
  }

  const desks = deskLayout();
  buildZoneOutlines(root);

  return { root, desks };
}

function buildWindowWall(root, wall, charcoal, glassMat) {
  const z = -ROOM.d / 2;
  const thick = 0.22;
  box(ROOM.w, 0.45, thick, wall, 0, 0.22, z, root);
  box(ROOM.w, 0.4, thick, wall, 0, ROOM.h - 0.2, z, root);
  for (const x of [-ROOM.w / 2 + 0.1, -4.5, -1.5, 1.5, 4.5, ROOM.w / 2 - 0.1]) {
    box(0.14, ROOM.h, thick, charcoal, x, ROOM.h / 2, z, root);
  }
  box(ROOM.w - 0.4, 0.08, thick, charcoal, 0, 1.85, z, root);

  const skyTex = createSoftSkyTexture(THREE);
  const view = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.w * 1.05, ROOM.h * 1.05),
    new THREE.MeshBasicMaterial({ map: skyTex }),
  );
  view.position.set(0, ROOM.h / 2 - 0.05, z - 1.6);
  root.add(view);

  const wash = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.w - 0.5, ROOM.h - 0.6),
    new THREE.MeshBasicMaterial({ color: 0x4ad0ff, transparent: true, opacity: 0.06 }),
  );
  wash.position.set(0, ROOM.h / 2, z + 0.06);
  root.add(wash);

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
  box(6.2, ROOM.h, thick, wall, -5.9, ROOM.h / 2, z, root);
  box(6.2, ROOM.h, thick, wall, 5.9, ROOM.h / 2, z, root);
  box(5.6, 0.9, thick, wall, 0, ROOM.h - 0.45, z, root);
  box(0.12, 2.5, 0.1, charcoal, -1.35, 1.25, z - 0.05, root);
  box(0.12, 2.5, 0.1, charcoal, 1.35, 1.25, z - 0.05, root);
  box(2.8, 0.1, 0.1, charcoal, 0, 2.55, z - 0.05, root);
  for (const ox of [-0.65, 0.65]) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.35), glassMat);
    door.position.set(ox, 1.2, z - 0.02);
    root.add(door);
  }
  ledStrip(root, 2.6, 0.03, 0, 2.6, z - 0.08, 0x00e5ff, 0.9);
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.55, 3),
    new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.55,
    }),
  );
  arrow.rotation.x = Math.PI / 2;
  arrow.rotation.z = Math.PI;
  arrow.position.set(0, 0.03, z - 1.1);
  root.add(arrow);
}

/** Sparse cool pendant LEDs — open roof */
function buildOpenPendants(root) {
  const spots = [
    [-5.0, -3.5, 0x00e5ff],
    [1.15, -3.6, 0xff4d9a],
    [5.5, -3.5, 0xb388ff],
    [-5.5, 3.2, 0x7c4dff],
    [-0.3, 3.5, 0x40c4ff],
    [4.6, 3.4, 0xff80ab],
  ];
  for (const [x, z, col] of spots) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 1.8,
        roughness: 0.25,
      }),
    );
    glow.position.set(x, ROOM.h - 0.55, z);
    root.add(glow);
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.2, 0.05, 16),
      mat(0x1a2230, { roughness: 0.4, metalness: 0.6 }),
    );
    shade.position.set(x, ROOM.h - 0.48, z);
    root.add(shade);
    ledStrip(root, 0.35, 0.35, x, ROOM.h - 0.52, z, col, 0.35);
  }
}

function buildFocusDesk(root, x, z, wood, woodWarm, blackMetal, screenGlow, plant, pot, partitionMat) {
  const h = 0.74;
  box(1.35, 0.05, 0.72, wood, x, h, z, root);
  box(1.25, 0.04, 0.62, woodWarm, x, h - 0.05, z, root, false);
  ledStrip(root, 1.3, 0.02, x, h + 0.01, z - 0.34, 0x00e5ff, 0.5);
  for (const [lx, lz] of [
    [-0.58, -0.28],
    [0.58, -0.28],
    [-0.58, 0.28],
    [0.58, 0.28],
  ]) {
    box(0.04, h, 0.04, blackMetal, x + lx, h / 2, z + lz, root);
  }
  box(1.3, 0.48, 0.04, partitionMat, x, h + 0.28, z - 0.34, root);
  ledStrip(root, 1.2, 0.015, x, h + 0.52, z - 0.34, 0x40c4ff, 0.7);
  box(0.55, 0.36, 0.03, blackMetal, x, h + 0.36, z - 0.22, root);
  box(0.5, 0.3, 0.012, screenGlow, x, h + 0.36, z - 0.2, root, false);
  box(0.08, 0.14, 0.06, blackMetal, x, h + 0.1, z - 0.22, root, false);
  box(0.22, 0.02, 0.14, blackMetal, x, h + 0.02, z - 0.18, root, false);
  box(0.36, 0.015, 0.18, blackMetal, x, h + 0.03, z + 0.12, root, false);
  const seat = mat(0x1a222c, { roughness: 0.55, metalness: 0.25 });
  const chairZ = z + 0.58;
  box(0.5, 0.08, 0.5, seat, x, 0.435, chairZ, root);
  box(0.5, 0.52, 0.07, seat, x, 0.72, chairZ + 0.2, root);
  cyl(0.055, 0.055, 0.34, blackMetal, x, 0.22, chairZ, root, 10, false);
  cyl(0.18, 0.18, 0.04, blackMetal, x, 0.08, chairZ, root, 12, false);
  // Tiny desk succulent (not a cone blob)
  buildDeskSucculent(root, x + 0.5, h, z + 0.2, plant, pot);
  cyl(0.032, 0.028, 0.065, mat(0x3a4555, { metalness: 0.4 }), x - 0.48, h + 0.05, z + 0.18, root, 10, false);
}

function buildCodingBay(root, x, z, wood, woodWarm, blackMetal, screenGlow, plant, pot, partitionMat) {
  const h = 0.74;
  box(1.7, 0.05, 0.85, wood, x, h, z, root);
  box(1.6, 0.04, 0.75, woodWarm, x, h - 0.05, z, root, false);
  ledStrip(root, 1.65, 0.025, x, h + 0.012, z - 0.4, 0xff4d9a, 0.75);
  for (const [lx, lz] of [
    [-0.72, -0.32],
    [0.72, -0.32],
    [-0.72, 0.32],
    [0.72, 0.32],
  ]) {
    box(0.045, h, 0.045, blackMetal, x + lx, h / 2, z + lz, root);
  }
  box(1.65, 0.55, 0.04, partitionMat, x, h + 0.32, z - 0.4, root);
  // Dual monitors
  for (const ox of [-0.38, 0.38]) {
    box(0.58, 0.4, 0.03, blackMetal, x + ox, h + 0.4, z - 0.26, root);
    box(0.52, 0.34, 0.012, screenGlow, x + ox, h + 0.4, z - 0.24, root, false);
  }
  box(0.1, 0.16, 0.08, blackMetal, x, h + 0.1, z - 0.24, root, false);
  box(0.5, 0.02, 0.2, blackMetal, x, h + 0.03, z + 0.1, root, false);
  box(0.42, 0.015, 0.2, blackMetal, x, h + 0.035, z + 0.18, root, false);
  const seat = mat(0x1a222c, { roughness: 0.55, metalness: 0.25 });
  const chairZ = z + 0.58;
  box(0.52, 0.08, 0.52, seat, x, 0.435, chairZ, root);
  box(0.52, 0.55, 0.07, seat, x, 0.74, chairZ + 0.2, root);
  cyl(0.055, 0.055, 0.34, blackMetal, x, 0.22, chairZ, root, 10, false);
  buildDeskSucculent(root, x + 0.7, h, z + 0.25, plant, pot);
  holoPanel(root, 0.55, 0.4, x - 0.85, h + 0.55, z - 0.1, Math.PI / 2, 0xff4d9a);
}

function buildCollabTable(root, x, z, wood, woodWarm, blackMetal, plant, pot) {
  box(3.0, 0.06, 1.25, wood, x, 0.74, z, root);
  ledStrip(root, 2.9, 0.02, x, 0.78, z, 0x40c4ff, 0.4);
  for (const [lx, lz] of [
    [-1.25, -0.45],
    [1.25, -0.45],
    [-1.25, 0.45],
    [1.25, 0.45],
  ]) {
    box(0.08, 0.72, 0.08, woodWarm, x + lx, 0.36, z + lz, root);
  }
  buildDeskSucculent(root, x, 0.74, z, plant, pot, 1.35);
  const seat = mat(0x1a222c, { roughness: 0.55, metalness: 0.25 });
  for (const side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      const cx = x + i * 0.9;
      const cz = z + side * 0.9;
      box(0.42, 0.07, 0.42, seat, cx, 0.42, cz, root);
      box(0.42, 0.4, 0.06, seat, cx, 0.65, cz + side * 0.18, root);
      cyl(0.05, 0.05, 0.3, blackMetal, cx, 0.2, cz, root, 8, false);
    }
  }
  for (const ox of [-0.85, 0, 0.85]) {
    box(0.32, 0.015, 0.22, blackMetal, x + ox, 0.78, z + 0.22, root, false);
    box(0.32, 0.015, 0.22, blackMetal, x + ox, 0.78, z - 0.22, root, false);
  }
}

function buildSocialLounge(root, wood, woodWarm, sofaMat, loungeAccent, plant, plantDark, pot, potWarm) {
  // Glass / LED planter divider vs Programming
  box(0.45, 0.6, 4.6, mat(0x1a2430, { metalness: 0.5, roughness: 0.4 }), 3.0, 0.3, -3.5, root);
  ledStrip(root, 0.08, 4.4, 3.0, 0.62, -3.5, 0xb388ff, 0.7);
  for (let i = 0; i < 6; i++) {
    const pz = -5.4 + i * 0.75;
    buildProceduralPlant(root, 3.0, pz, plant, plantDark, plant, pot, potWarm, i % 2 ? 'bush' : 'fern', 0.55);
  }

  box(0.85, 0.42, 3.4, sofaMat, 7.55, 0.32, -3.6, root);
  box(0.18, 0.4, 3.4, sofaMat, 7.9, 0.68, -3.6, root);
  ledStrip(root, 0.06, 3.3, 7.95, 0.9, -3.6, 0xb388ff, 0.55);

  box(0.7, 0.38, 0.7, loungeAccent, 5.5, 0.3, -5.7, root);
  box(0.7, 0.45, 0.12, loungeAccent, 5.5, 0.7, -6.0, root);

  cyl(0.32, 0.32, 0.08, wood, 6.4, 0.28, -3.4, root, 20);
  cyl(0.06, 0.06, 0.26, blackMetalish(), 6.4, 0.13, -3.4, root, 10, false);
  cyl(0.28, 0.28, 0.08, wood, 6.9, 0.28, -2.2, root, 20);
  cyl(0.06, 0.06, 0.26, blackMetalish(), 6.9, 0.13, -2.2, root, 10, false);
  box(0.55, 0.28, 0.55, mat(0x2a3344, { roughness: 0.7 }), 5.2, 0.2, -2.5, root);

  buildProceduralPlant(root, 8.0, -5.9, plant, plantDark, plant, pot, potWarm, 'tall', 1.2);
  buildProceduralPlant(root, 8.1, -1.2, plant, plantDark, plant, pot, potWarm, 'monstera', 1.05);

  function blackMetalish() {
    return mat(0x1c242e, { roughness: 0.28, metalness: 0.72 });
  }
}

function buildMeetingRoom(root, wood, woodWarm, woodDark, glassMat, frost, blackMetal, screenGlow, plant, pot) {
  const cx = -5.6;
  const cz = 3.4;
  const gw = 5.0;
  const gd = 4.6;
  const gh = 2.55;

  box(gw, gh, 0.08, frost, cx, gh / 2, cz - gd / 2, root);
  box(0.08, gh, gd, frost, cx - gw / 2, gh / 2, cz, root);
  box(0.08, gh, gd, frost, cx + gw / 2, gh / 2, cz, root);
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
  ledStrip(root, gw, 0.03, cx, gh - 0.05, cz - gd / 2, 0x7c4dff, 0.7);
  ledStrip(root, 0.03, gd, cx - gw / 2, gh - 0.05, cz, 0x7c4dff, 0.55);

  for (const side of [
    { w: gw - 0.2, d: 0.04, x: cx, z: cz - gd / 2 + 0.02 },
    { w: 0.04, d: gd - 0.2, x: cx - gw / 2 + 0.02, z: cz },
    { w: 0.04, d: gd - 0.2, x: cx + gw / 2 - 0.02, z: cz },
  ]) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(side.w, 1.1, side.d), glassMat);
    g.position.set(side.x, 1.85, side.z);
    root.add(g);
  }

  box(2.8, 0.06, 1.3, wood, cx, 0.74, cz, root);
  ledStrip(root, 2.6, 0.02, cx, 0.78, cz, 0x7c4dff, 0.5);
  for (const [lx, lz] of [
    [-1.1, -0.45],
    [1.1, -0.45],
    [-1.1, 0.45],
    [1.1, 0.45],
  ]) {
    box(0.08, 0.72, 0.08, woodWarm, cx + lx, 0.36, cz + lz, root);
  }
  const seat = mat(0x1a222c, { roughness: 0.55, metalness: 0.25 });
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
    box(
      0.42,
      0.4,
      0.06,
      seat,
      cx + ox,
      0.65,
      cz + oz + (oz === 0 ? (ox > 0 ? 0.18 : -0.18) : Math.sign(oz) * 0.18),
      root,
    );
  }

  box(0.06, 1.1, 1.8, blackMetal, cx - gw / 2 + 0.12, 1.55, cz, root);
  box(0.04, 1.0, 1.65, screenGlow, cx - gw / 2 + 0.16, 1.55, cz, root, false);

  buildProceduralPlant(root, cx - 1.8, cz + 1.8, plant, plant, plant, pot, pot, 'fern', 0.9);
}

function buildPhoneBooths(root, wood, woodWarm, blackMetal, partitionMat, screenGlow, frost) {
  // Slim amenity pods tucked west of General / east of Meeting
  const baseX = -2.85;
  const baseZ = 5.35;
  box(1.5, 2.15, 0.06, partitionMat, baseX, 1.08, baseZ - 0.7, root);
  box(1.5, 2.15, 0.06, partitionMat, baseX, 1.08, baseZ + 0.7, root);
  box(0.06, 2.15, 1.4, frost, baseX - 0.72, 1.08, baseZ, root);
  box(0.06, 2.15, 1.4, partitionMat, baseX + 0.72, 1.08, baseZ, root);
  ledStrip(root, 1.4, 0.02, baseX, 2.15, baseZ - 0.7, 0x40c4ff, 0.6);
  box(0.85, 0.05, 0.5, wood, baseX, 0.74, baseZ, root);
  box(0.4, 0.3, 0.03, blackMetal, baseX, 1.0, baseZ - 0.15, root);
  box(0.36, 0.24, 0.012, screenGlow, baseX, 1.0, baseZ - 0.13, root, false);
  const seat = mat(0x1a222c, { roughness: 0.55, metalness: 0.25 });
  box(0.38, 0.07, 0.38, seat, baseX, 0.42, baseZ + 0.28, root);
  void woodWarm;
}

function buildReception(root, wood, woodWarm, blackMetal, sofaMat, plant, plantDark, pot, potWarm, screenGlow) {
  // L-shaped reception desk (shifted into SE zone)
  box(3.0, 0.95, 0.7, wood, 4.0, 0.48, 4.55, root);
  box(3.0, 0.05, 0.75, woodWarm, 4.0, 0.98, 4.55, root);
  ledStrip(root, 2.9, 0.025, 4.0, 1.01, 4.2, 0xff80ab, 0.75);
  box(0.7, 0.95, 2.0, wood, 5.15, 0.48, 3.4, root);
  box(0.75, 0.05, 2.0, woodWarm, 5.15, 0.98, 3.4, root);

  box(0.5, 0.34, 0.03, blackMetal, 4.0, 1.25, 4.35, root);
  box(0.46, 0.28, 0.012, screenGlow, 4.0, 1.25, 4.33, root, false);

  const seat = mat(0x1a222c, { roughness: 0.55, metalness: 0.25 });
  const chairZ = 4.2 - 0.55;
  box(0.5, 0.08, 0.5, seat, 4.0, 0.435, chairZ, root);
  box(0.5, 0.52, 0.07, seat, 4.0, 0.72, chairZ - 0.2, root);
  cyl(0.055, 0.055, 0.34, blackMetal, 4.0, 0.22, chairZ, root, 10, false);

  // LED green-wall / planter
  box(0.45, 2.2, 3.0, mat(0x1a2430, { metalness: 0.45, roughness: 0.45 }), 6.5, 1.1, 3.5, root);
  ledStrip(root, 0.08, 2.9, 6.5, 2.25, 3.5, 0xff80ab, 0.65);
  for (let i = 0; i < 7; i++) {
    const pz = 2.15 + i * 0.38;
    buildProceduralPlant(root, 6.5, pz, plant, plantDark, plant, pot, potWarm, i % 3 === 0 ? 'fern' : 'bush', 0.5);
  }

  box(0.7, 0.4, 0.7, sofaMat, 7.3, 0.32, 4.7, root);
  box(0.7, 0.45, 0.12, sofaMat, 7.3, 0.7, 5.0, root);
  box(0.7, 0.4, 0.7, sofaMat, 7.3, 0.32, 3.1, root);
  box(0.7, 0.45, 0.12, sofaMat, 7.3, 0.7, 2.8, root);
  cyl(0.28, 0.28, 0.08, wood, 8.0, 0.28, 3.9, root, 18);
  cyl(0.05, 0.05, 0.26, blackMetal, 8.0, 0.13, 3.9, root, 10, false);

  buildProceduralPlant(root, 8.2, 5.5, plant, plantDark, plant, pot, potWarm, 'tall', 1.1);
}

/** Flat elliptical leaf plane (double-sided) — reads as foliage, not a blob. */
function makeLeafMesh(material, w, h) {
  const geo = new THREE.PlaneGeometry(w, h, 1, 1);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  return mesh;
}

function leafMaterial(color, roughness = 0.55) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
}

/** Small multi-leaf desk plant */
function buildDeskSucculent(root, x, deskH, z, plant, pot, scale = 1) {
  const s = scale;
  cyl(0.04 * s, 0.05 * s, 0.05 * s, pot, x, deskH + 0.03 * s, z, root, 10, false);
  const mats = [
    plant,
    leafMaterial(0x2f7a48),
    leafMaterial(0x5bb576),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const lf = makeLeafMesh(mats[i % 3], 0.1 * s, 0.16 * s);
    lf.position.set(
      x + Math.cos(a) * 0.03 * s,
      deskH + 0.1 * s,
      z + Math.sin(a) * 0.03 * s,
    );
    lf.rotation.set(-0.9, a, 0.15);
    root.add(lf);
  }
  const tip = makeLeafMesh(mats[2], 0.07 * s, 0.12 * s);
  tip.position.set(x, deskH + 0.16 * s, z);
  tip.rotation.x = -Math.PI / 2;
  root.add(tip);
}

/**
 * Procedural plants with stem + flat leaves (stylized high-quality foliage).
 * @param {'tall'|'bush'|'fern'|'monstera'} type
 */
function buildProceduralPlant(root, x, z, leaf, leafDark, leafLite, pot, potWarm, type = 'bush', scale = 1) {
  const s = scale;
  const potMat = type === 'tall' ? potWarm : pot;
  // Ceramic / tech pot with rim
  cyl(0.15 * s, 0.12 * s, 0.28 * s, potMat, x, 0.14 * s, z, root, 16);
  cyl(0.16 * s, 0.16 * s, 0.03 * s, potMat, x, 0.27 * s, z, root, 16, false);
  cyl(0.11 * s, 0.11 * s, 0.025 * s, mat(0x2a1e14, { roughness: 0.95 }), x, 0.27 * s, z, root, 12, false);

  const L = leafMaterial(0x3d9a62);
  const D = leafMaterial(0x246b42);
  const Lite = leafMaterial(0x6bc48a);
  // Prefer flat materials over sphere mats passed in
  void leaf; void leafDark; void leafLite;

  if (type === 'tall') {
    cyl(0.03 * s, 0.045 * s, 0.95 * s, mat(0x5a4030, { roughness: 0.85 }), x, 0.7 * s, z, root, 10);
    for (let layer = 0; layer < 5; layer++) {
      const y = (0.85 + layer * 0.2) * s;
      const count = 7;
      const rad = (0.28 - layer * 0.03) * s;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + layer * 0.35;
        const lf = makeLeafMesh(layer % 2 ? L : D, (0.2 - layer * 0.015) * s, (0.32 - layer * 0.02) * s);
        lf.position.set(x + Math.cos(a) * rad, y, z + Math.sin(a) * rad);
        // Upright frond: face outward so iso top-down shows leaf shape, not disc stack
        lf.rotation.set(-0.25, a + Math.PI / 2, 0.35);
        root.add(lf);
      }
    }
  } else if (type === 'fern') {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const lean = 0.55;
      for (let j = 0; j < 5; j++) {
        const t = j / 4;
        const lf = makeLeafMesh(j % 2 ? L : Lite, 0.07 * s, 0.16 * s);
        lf.position.set(
          x + Math.cos(a) * (0.05 + t * 0.38) * s,
          (0.32 + t * 0.55) * s,
          z + Math.sin(a) * (0.05 + t * 0.38) * s,
        );
        lf.rotation.set(0.3 - t * 0.5, a, lean * (0.4 - t * 0.2));
        root.add(lf);
      }
    }
  } else if (type === 'monstera') {
    cyl(0.025 * s, 0.035 * s, 0.5 * s, mat(0x4a6038), x, 0.5 * s, z, root, 8, false);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.15;
      const lf = makeLeafMesh(i % 2 ? L : D, 0.28 * s, 0.34 * s);
      lf.position.set(
        x + Math.cos(a) * 0.2 * s,
        (0.55 + (i % 4) * 0.1) * s,
        z + Math.sin(a) * 0.2 * s,
      );
      lf.rotation.set(-0.2, a + Math.PI / 2, 0.45);
      root.add(lf);
    }
  } else {
    // bush — radial flat leaves in 3 tiers
    for (let layer = 0; layer < 3; layer++) {
      const y = (0.38 + layer * 0.16) * s;
      const count = 9;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + layer * 0.4;
        const rad = (0.12 + layer * 0.06) * s;
        const lf = makeLeafMesh(layer === 2 ? Lite : layer ? D : L, 0.14 * s, 0.2 * s);
        lf.position.set(x + Math.cos(a) * rad, y, z + Math.sin(a) * rad);
        lf.rotation.set(-0.35 + layer * 0.08, a + Math.PI / 2, 0.55);
        root.add(lf);
      }
    }
    const crown = makeLeafMesh(Lite, 0.16 * s, 0.16 * s);
    crown.position.set(x, 0.82 * s, z);
    crown.rotation.x = -Math.PI / 2;
    root.add(crown);
  }
}

function makeTechFloorMaterial() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#121820';
  g.fillRect(0, 0, 512, 512);
  // Panel grid
  g.strokeStyle = 'rgba(0, 220, 255, 0.12)';
  g.lineWidth = 1;
  for (let i = 0; i <= 16; i++) {
    g.beginPath();
    g.moveTo(i * 32, 0);
    g.lineTo(i * 32, 512);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i * 32);
    g.lineTo(512, i * 32);
    g.stroke();
  }
  // Subtle warmer wood striping underglow
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 === 0 ? 'rgba(80, 60, 40, 0.18)' : 'rgba(60, 50, 40, 0.1)';
    g.fillRect(0, i * 64, 512, 64);
  }
  // Cool LED micro dots
  g.fillStyle = 'rgba(0, 229, 255, 0.25)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % 512;
    const y = (i * 53) % 512;
    g.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.7,
    metalness: 0.25,
  });
}

function buildZoneOutlines(root) {
  for (const z of ZONES) {
    const color = new THREE.Color(z.color);
    const edgeMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
    });
    const y = 0.024;
    const t = 0.045;
    const hw = z.w / 2;
    const hd = z.d / 2;
    const mk = (bw, bd, x, zz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.014, bd), edgeMat.clone());
      m.position.set(x, y, zz);
      root.add(m);
    };
    mk(z.w, t, z.x, z.z - hd);
    mk(z.w, t, z.x, z.z + hd);
    mk(t, z.d, z.x - hw, z.z);
    mk(t, z.d, z.x + hw, z.z);

    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(z.w - 0.1, z.d - 0.1),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.04, depthWrite: false }),
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(z.x, 0.018, z.z);
    root.add(fill);

    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 88;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 420, 88);
    // Glow plate
    ctx.fillStyle = 'rgba(8, 16, 28, 0.72)';
    ctx.roundRect(20, 14, 380, 60, 10);
    ctx.fill();
    ctx.strokeStyle = `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},0.85)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '700 24px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label =
      z.labelEn === z.labelZh ? z.labelEn : `${z.labelEn} · ${z.labelZh}`;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillText(label, 211, 46);
    ctx.fillStyle = '#e8f7ff';
    ctx.fillText(label, 210, 44);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const spr = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }),
    );
    spr.scale.set(2.8, 0.58, 1);
    spr.position.set(z.x, 0.14, z.z + hd - 0.35);
    root.add(spr);
  }
}

/**
 * @returns {{ hemi: THREE.HemisphereLight, sun: THREE.DirectionalLight, fill: THREE.DirectionalLight, ambient: THREE.AmbientLight, points: THREE.PointLight[] }}
 */
export function setupLighting(scene) {
  scene.background = new THREE.Color(0x0b121c);
  scene.fog = new THREE.Fog(0x0b121c, 32, 72);

  const hemi = new THREE.HemisphereLight(0xb0d4f0, 0x1a2030, 0.75);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xd8e8ff, 1.7);
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

  const fill = new THREE.DirectionalLight(0x88aacc, 0.45);
  fill.position.set(10, 8, 6);
  scene.add(fill);

  const ambient = new THREE.AmbientLight(0x6a8098, 0.4);
  scene.add(ambient);

  const points = [];
  for (const [x, z, i, col] of [
    [-5.0, -3.5, 0.7, 0x00e5ff],
    [1.15, -3.6, 0.6, 0xff4d9a],
    [5.5, -3.5, 0.55, 0xb388ff],
    [-5.5, 3.2, 0.5, 0x7c4dff],
    [-0.3, 3.5, 0.55, 0x40c4ff],
    [4.6, 3.4, 0.55, 0xff80ab],
  ]) {
    const p = new THREE.PointLight(col, i, 11, 2);
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
      bg: 0x152030,
      fog: 0x152030,
      hemiSky: 0xc0d8f0,
      hemiGround: 0x1a2838,
      hemiI: 0.85,
      sunC: 0xe0f0ff,
      sunI: 1.85,
      fillC: 0x90b0cc,
      fillI: 0.5,
      ambC: 0x7a90a8,
      ambI: 0.42,
      pointMul: 1,
      exposure: 1.05,
    },
    evening: {
      bg: 0x1a1528,
      fog: 0x1a1528,
      hemiSky: 0xffb090,
      hemiGround: 0x2a2030,
      hemiI: 0.65,
      sunC: 0xff8a5a,
      sunI: 1.35,
      fillC: 0x8090c0,
      fillI: 0.4,
      ambC: 0x6a5878,
      ambI: 0.35,
      pointMul: 1.25,
      exposure: 1.0,
    },
    night: {
      bg: 0x060a12,
      fog: 0x060a12,
      hemiSky: 0x304060,
      hemiGround: 0x0a1018,
      hemiI: 0.28,
      sunC: 0x506080,
      sunI: 0.25,
      fillC: 0x304858,
      fillI: 0.2,
      ambC: 0x182030,
      ambI: 0.25,
      pointMul: 1.85,
      exposure: 0.92,
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
  const base = [0.7, 0.6, 0.55, 0.5, 0.55, 0.55];
  lights.points.forEach((pt, i) => {
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
  renderer.toneMappingExposure = 1.05;
  return renderer;
}

/** Elevated isometric / dollhouse cutaway framing. */
export function createCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 90);
  camera.position.set(12.5, 11.5, 13.5);
  camera.lookAt(0.2, 0.3, 0.2);
  return camera;
}
