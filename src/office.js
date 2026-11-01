/**
 * AS Virtual Office — polished Three.js anime-style 3D room.
 * Soft Shinkai-like lighting, wood desks, glass meeting room, pantry,
 * hanging plants, industrial ceiling. Procedural anime city in windows.
 */
import * as THREE from 'three';
import { LEAD_ID } from './team.js';
import { createSkylineTexture } from './skyline.js';

export const ROOM = { w: 18, d: 12, h: 4.2 };

/**
 * Chair / desk seating constants — keep in sync with buildDesk().
 * Desk surface at (deskX, deskH, deskZ); monitors face +Z; chair sits on +Z side.
 * Seated figures face −Z (toward keyboard/monitors): faceYaw = Math.PI.
 */
export const CHAIR = {
  /** Chair seat center relative to desk center on Z */
  offsetZ: 0.58,
  /** Top of seat cushion (figure root Y) */
  seatY: 0.45,
  /** Yaw so local +Z (face) aims at desk (−Z world) */
  faceYaw: Math.PI,
};

/**
 * Build seat pose from a desk center.
 * @param {number} deskX
 * @param {number} deskZ
 * @param {string} zone
 */
export function seatFromDesk(deskX, deskZ, zone = 'open') {
  return {
    x: deskX,
    y: 0,
    z: deskZ,
    seatX: deskX,
    seatY: CHAIR.seatY,
    seatZ: deskZ + CHAIR.offsetZ,
    faceYaw: CHAIR.faceYaw,
    zone,
  };
}

/**
 * Desk / seat anchors in world space.
 * +X = pantry side, −X = windows, +Z = camera / entrance, −Z = back wall.
 * Use seatX/seatY/seatZ for figure placement; x/z remain desk centers.
 */
export function deskLayout() {
  const desks = new Map();
  desks.set(LEAD_ID, seatFromDesk(3.2, -2.8, 'lead'));

  const openPlan = [
    { id: '26fffc1c-3c69-4346-8a68-199db47277fd', x: -5.2, z: 2.4 },
    { id: '4f070b62-ac92-4824-9953-886cda5433d1', x: -3.4, z: 2.6 },
    { id: '28c84d63-5b73-4b78-aebc-3a2e02376fc2', x: -1.6, z: 2.5 },
    { id: '2fb3b7e8-b556-45ea-8b10-1ced7f05c0b4', x: 0.2, z: 2.7 },
    { id: '9f0fa493-9994-409c-b398-974b67de306e', x: 2.0, z: 2.4 },
    { id: 'aecd27e2-8d49-4c33-962c-cdfa1860fd26', x: -5.4, z: 0.2 },
    { id: 'b7c9b07d-4a12-49af-bbdf-7fa19bdc96b2', x: -3.6, z: 0.4 },
    { id: '5f8f09c0-fe3d-40a5-87c1-2fcc440bb9c3', x: -1.8, z: 0.3 },
    { id: 'c7f037b0-0082-4290-a543-00f203e4c150', x: 0.0, z: 0.5 },
    { id: '764c93f4-9330-4daa-9f86-481be3b19e60', x: 1.8, z: 0.2 },
    { id: '6a0dc819-57c2-4507-ae25-f3b3122c3f46', x: 5.6, z: 1.8 },
  ];
  for (const d of openPlan) {
    desks.set(d.id, seatFromDesk(d.x, d.z, 'open'));
  }
  return desks;
}

export const LEAD_HANDOFF = { x: 2.4, y: CHAIR.seatY, z: -1.6 };

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
export function buildOfficeScene(scene, loader) {
  const root = new THREE.Group();
  root.name = 'office-root';
  scene.add(root);

  // Soft anime matte behind back wall (depth cue / Shinkai atmosphere)
  const matteTex = loader.load(`${import.meta.env.BASE_URL}office-matte.jpg`);
  matteTex.colorSpace = THREE.SRGBColorSpace;
  const matte = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 14),
    new THREE.MeshBasicMaterial({ map: matteTex, transparent: true, opacity: 0.55 }),
  );
  matte.position.set(-2, 3.2, -14);
  root.add(matte);

  const wood = mat(0xd8bc96, { roughness: 0.48 });
  const woodDark = mat(0xa8845e, { roughness: 0.45 });
  const wall = mat(0xf6f1e9, { roughness: 0.92 });
  const floorMat = mat(0xcfc6b8, { roughness: 0.78 });
  const ductMat = mat(0x9aa3ab, { roughness: 0.55, metalness: 0.25 });
  const metal = mat(0x4a5058, { roughness: 0.32, metalness: 0.7 });
  const blackMetal = mat(0x1c2128, { roughness: 0.38, metalness: 0.6 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xcfe4f4,
    roughness: 0.05,
    metalness: 0.0,
    transmission: 0.85,
    thickness: 0.2,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  const frost = new THREE.MeshPhysicalMaterial({
    color: 0xeaf2f8,
    roughness: 0.62,
    metalness: 0,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide,
  });
  const plant = mat(0x3f9452, { roughness: 0.78 });
  const plantDark = mat(0x2c6e3c, { roughness: 0.82 });
  const pot = mat(0xc8a878, { roughness: 0.68 });
  const screenGlow = mat(0x9ad0ef, {
    roughness: 0.25,
    metalness: 0.15,
    emissive: 0x4a88aa,
    emissiveIntensity: 0.65,
  });
  const rugMat = mat(0x6a7684, { roughness: 0.96 });
  const sofaMat = mat(0x74808c, { roughness: 0.86 });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  // Soft rugs
  const rug1 = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 4.6), rugMat);
  rug1.rotation.x = -Math.PI / 2;
  rug1.position.set(-1.4, 0.012, 1.35);
  rug1.receiveShadow = true;
  root.add(rug1);

  // Walls
  box(ROOM.w, ROOM.h, 0.22, wall, 0, ROOM.h / 2, -ROOM.d / 2, root);
  box(0.22, ROOM.h, ROOM.d, wall, ROOM.w / 2, ROOM.h / 2, 0, root);

  buildWindowWall(root, wall, glassMat);
  // Ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), mat(0xfaf7f2, { roughness: 0.96 }));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, ROOM.h, 0);
  root.add(ceil);

  buildCeilingGear(root, ductMat, metal, blackMetal);

  const deskPositions = [
    [-5.2, 2.4], [-3.4, 2.6], [-1.6, 2.5], [0.2, 2.7], [2.0, 2.4],
    [-5.4, 0.2], [-3.6, 0.4], [-1.8, 0.3], [0.0, 0.5], [1.8, 0.2],
  ];
  for (const [dx, dz] of deskPositions) {
    buildDesk(root, dx, dz, wood, woodDark, blackMetal, screenGlow, plant, pot);
  }
  buildDesk(root, 5.6, 1.8, wood, woodDark, blackMetal, screenGlow, plant, pot, true);

  buildMeetingRoom(root, wood, woodDark, glassMat, frost, blackMetal);
  buildPantry(root, wood, woodDark, metal);

  // Lounge
  box(2.4, 0.42, 0.9, sofaMat, -6.3, 0.32, -1.4, root);
  box(2.4, 0.38, 0.16, sofaMat, -6.3, 0.68, -1.78, root);
  box(0.6, 0.08, 0.6, wood, -6.3, 0.32, -0.45, root);

  // Bookshelf
  box(1.5, 1.9, 0.38, woodDark, 1.1, 0.95, -5.55, root);
  for (let i = 0; i < 4; i++) {
    box(1.3, 0.05, 0.3, wood, 1.1, 0.35 + i * 0.42, -5.55, root);
    // Book blocks
    for (let b = 0; b < 5; b++) {
      const col = [0x5c6bc0, 0xc62828, 0x2e7d32, 0x6d4c41, 0x00838f][b];
      box(0.12, 0.28, 0.22, mat(col), 0.55 + b * 0.22, 0.52 + i * 0.42, -5.55, root, false);
    }
  }

  const hangSpots = [
    [-4.2, -1.1], [-2.1, 1.6], [0.6, -0.4], [2.8, 2.1], [-5.6, 2.9], [4.6, 0.2], [-0.8, 3.1], [5.2, -3.5],
  ];
  for (const [hx, hz] of hangSpots) {
    buildHangingPlant(root, hx, hz, plant, plantDark, pot, metal);
  }

  // Wall clock
  const clock = cyl(0.3, 0.3, 0.05, mat(0xf8f4ec), 5.6, 2.7, -ROOM.d / 2 + 0.14, root, 32, false);
  clock.rotation.x = Math.PI / 2;
  box(0.02, 0.18, 0.01, blackMetal, 5.6, 2.78, -ROOM.d / 2 + 0.17, root, false);

  // Whiteboard
  box(1.7, 1.15, 0.04, mat(0xfafafa), ROOM.w / 2 - 0.14, 1.85, -0.4, root, false);
  box(1.78, 1.22, 0.03, woodDark, ROOM.w / 2 - 0.16, 1.85, -0.42, root, false);

  // Corner potted plants
  for (const [px, pz] of [[-7.6, 4.8], [-7.5, -4.8], [7.4, 4.5]]) {
    cyl(0.22, 0.18, 0.35, pot, px, 0.18, pz, root, 12);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 12), plant);
    bush.position.set(px, 0.55, pz);
    bush.castShadow = true;
    root.add(bush);
  }

  return { root, desks: deskLayout() };
}

function buildWindowWall(root, wall, glassMat) {
  const x = -ROOM.w / 2;
  const thick = 0.22;
  box(thick, 0.5, ROOM.d, wall, x, ROOM.h - 0.25, 0, root);
  box(thick, 0.4, ROOM.d, wall, x, 0.2, 0, root);
  for (const z of [-ROOM.d / 2 + 0.12, -2.1, 1.9, ROOM.d / 2 - 0.12]) {
    box(thick, ROOM.h, 0.16, wall, x, ROOM.h / 2, z, root);
  }
  box(thick, 0.1, ROOM.d - 0.35, wall, x, 2.15, 0, root);

  // Exterior anime skyline
  const skyTex = createSkylineTexture(THREE);
  const viewMat = new THREE.MeshBasicMaterial({ map: skyTex });
  const view = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.d * 1.2, ROOM.h * 1.1), viewMat);
  view.rotation.y = Math.PI / 2;
  view.position.set(x - 2.2, ROOM.h / 2 - 0.05, 0);
  root.add(view);

  // Warm light wash on glass plane
  const wash = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.d, ROOM.h),
    new THREE.MeshBasicMaterial({ color: 0xffe6c4, transparent: true, opacity: 0.08 }),
  );
  wash.rotation.y = Math.PI / 2;
  wash.position.set(x + 0.05, ROOM.h / 2, 0);
  root.add(wash);

  const paneH = 1.6;
  const paneZs = [
    [-ROOM.d / 2 + 1.15, 3.6],
    [-0.1, 3.7],
    [ROOM.d / 2 - 1.15, 3.6],
  ];
  for (const [cz, zw] of paneZs) {
    for (const y of [1.08, 3.05]) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(zw, paneH), glassMat);
      pane.rotation.y = Math.PI / 2;
      pane.position.set(x + 0.1, y, cz);
      root.add(pane);
    }
  }
}

function buildCeilingGear(root, ductMat, metal, blackMetal) {
  for (const z of [-3.4, 0.4, 3.4]) {
    const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, ROOM.w - 0.8, 14), ductMat);
    duct.rotation.z = Math.PI / 2;
    duct.position.set(0, ROOM.h - 0.38, z);
    duct.castShadow = true;
    root.add(duct);
  }
  for (const x of [-4.5, 0, 4.5]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, ROOM.d - 0.6, 10), metal);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(x, ROOM.h - 0.58, 0);
    root.add(pipe);
  }
  for (const z of [-2.4, 0.9, 3.1]) {
    box(ROOM.w - 1.6, 0.035, 0.055, blackMetal, 0, ROOM.h - 0.72, z, root, false);
    for (let i = -3; i <= 3; i++) {
      box(0.2, 0.14, 0.2, blackMetal, i * 2.15, ROOM.h - 0.84, z, root, false);
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xffe2b5,
          emissive: 0xffc878,
          emissiveIntensity: 1.4,
        }),
      );
      tip.position.set(i * 2.15, ROOM.h - 0.95, z);
      root.add(tip);
    }
  }
}

function buildDesk(root, x, z, wood, woodDark, blackMetal, screenGlow, plant, pot, tall = false) {
  const h = tall ? 1.05 : 0.74;
  box(1.45, 0.05, 0.78, wood, x, h, z, root);
  // Underframe
  box(1.35, 0.04, 0.68, woodDark, x, h - 0.05, z, root, false);
  for (const [lx, lz] of [[-0.62, -0.3], [0.62, -0.3], [-0.62, 0.3], [0.62, 0.3]]) {
    box(0.045, h, 0.045, blackMetal, x + lx, h / 2, z + lz, root);
  }
  // Dual monitors with stands
  for (const ox of [-0.3, 0.34]) {
    box(0.52, 0.34, 0.03, blackMetal, x + ox, h + 0.34, z - 0.24, root);
    box(0.48, 0.29, 0.012, screenGlow, x + ox, h + 0.34, z - 0.22, root, false);
    box(0.08, 0.16, 0.06, blackMetal, x + ox, h + 0.1, z - 0.24, root, false);
    box(0.22, 0.02, 0.14, blackMetal, x + ox, h + 0.02, z - 0.2, root, false);
  }
  box(0.36, 0.015, 0.2, blackMetal, x, h + 0.03, z + 0.12, root, false);
  // Chair — seat top at CHAIR.seatY (0.475); center at z + CHAIR.offsetZ
  const seat = mat(0x262c34, { roughness: 0.7 });
  const chairZ = z + 0.58;
  box(0.52, 0.08, 0.52, seat, x, 0.435, chairZ, root); // top ≈ 0.475
  box(0.52, 0.55, 0.08, seat, x, 0.74, chairZ + 0.22, root);
  cyl(0.06, 0.06, 0.35, blackMetal, x, 0.22, chairZ, root, 10, false);
  cyl(0.2, 0.2, 0.04, blackMetal, x, 0.08, chairZ, root, 12, false);
  // Desk plant + mug
  cyl(0.055, 0.07, 0.07, pot, x + 0.55, h + 0.05, z + 0.22, root, 10, false);
  const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 8), plant);
  leaf.position.set(x + 0.55, h + 0.2, z + 0.22);
  root.add(leaf);
  cyl(0.035, 0.03, 0.07, mat(0xf5f5f5), x - 0.5, h + 0.06, z + 0.2, root, 10, false);
}

function buildMeetingRoom(root, wood, woodDark, glassMat, frost, blackMetal) {
  const cx = 3.4;
  const cz = -3.2;
  const gw = 4.2;
  const gd = 3.4;
  const gh = 2.65;
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(gw, gd), mat(0xcbb9a2, { roughness: 0.9 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(cx, 0.014, cz);
  root.add(rug);
  const panes = [
    { w: gw, d: 0.05, x: cx, z: cz - gd / 2 },
    { w: gw, d: 0.05, x: cx, z: cz + gd / 2 },
    { w: 0.05, d: gd, x: cx - gw / 2, z: cz },
    { w: 0.05, d: gd, x: cx + gw / 2, z: cz },
  ];
  for (const p of panes) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(p.w, gh, p.d), glassMat);
    g.position.set(p.x, gh / 2, p.z);
    root.add(g);
    const f = new THREE.Mesh(new THREE.BoxGeometry(p.w * 0.98, 0.9, p.d * 1.25), frost);
    f.position.set(p.x, 0.58, p.z);
    root.add(f);
  }
  for (const [fx, fz] of [
    [cx - gw / 2, cz - gd / 2],
    [cx + gw / 2, cz - gd / 2],
    [cx - gw / 2, cz + gd / 2],
    [cx + gw / 2, cz + gd / 2],
  ]) {
    box(0.1, gh, 0.1, blackMetal, fx, gh / 2, fz, root);
  }
  box(2.5, 0.06, 1.25, wood, cx, 0.74, cz, root);
  for (const [lx, lz] of [[-0.95, -0.42], [0.95, -0.42], [-0.95, 0.42], [0.95, 0.42]]) {
    box(0.08, 0.72, 0.08, woodDark, cx + lx, 0.36, cz + lz, root);
  }
  // Lead workstation: laptop on +Z edge of table + office chair
  const leadX = 3.2;
  const leadDeskZ = -2.8;
  const leadChairZ = leadDeskZ + 0.58;
  box(0.42, 0.02, 0.28, blackMetal, leadX, 0.78, leadDeskZ - 0.05, root, false);
  box(0.38, 0.24, 0.015, mat(0x9ad0ef, { roughness: 0.25, emissive: 0x4a88aa, emissiveIntensity: 0.55 }), leadX, 0.92, leadDeskZ - 0.16, root, false);
  const seat = mat(0x262c34, { roughness: 0.7 });
  box(0.52, 0.08, 0.52, seat, leadX, 0.435, leadChairZ, root);
  box(0.52, 0.55, 0.08, seat, leadX, 0.74, leadChairZ + 0.22, root);
  cyl(0.06, 0.06, 0.35, blackMetal, leadX, 0.22, leadChairZ, root, 10, false);
  cyl(0.2, 0.2, 0.04, blackMetal, leadX, 0.08, leadChairZ, root, 12, false);
}

function buildPantry(root, wood, woodDark, metal) {
  const x = ROOM.w / 2 - 0.95;
  box(1.5, 0.92, 3.4, wood, x, 0.46, -2.2, root);
  box(1.5, 0.05, 3.4, mat(0xebe7df, { roughness: 0.4 }), x, 0.94, -2.2, root);
  box(0.75, 0.75, 2.5, woodDark, x + 0.28, 2.35, -2.4, root);
  box(0.3, 0.38, 0.24, metal, x - 0.25, 1.15, -1.15, root);
  box(0.34, 1.15, 0.34, mat(0xeef2f5), x - 0.2, 0.58, -3.45, root);
  cyl(0.13, 0.13, 0.38, mat(0xa8d4f0, { transparent: true, opacity: 0.72 }), x - 0.2, 1.35, -3.45, root, 12, false);
}

function buildHangingPlant(root, x, z, plant, plantDark, pot, metal) {
  const y = ROOM.h - 0.95;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6), metal);
  cord.position.set(x, ROOM.h - 0.38, z);
  root.add(cord);
  cyl(0.2, 0.15, 0.22, pot, x, y, z, root, 12, false);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), plant);
  leaf.position.set(x, y - 0.18, z);
  leaf.scale.set(1, 1.15, 1);
  leaf.castShadow = true;
  root.add(leaf);
  const leaf2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), plantDark);
  leaf2.position.set(x + 0.16, y - 0.3, z + 0.06);
  root.add(leaf2);
  const leaf3 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), plant);
  leaf3.position.set(x - 0.14, y - 0.32, z - 0.1);
  root.add(leaf3);
}

export function setupLighting(scene) {
  scene.background = new THREE.Color(0xdfe8f2);
  scene.fog = new THREE.Fog(0xdfe8f2, 18, 48);

  const hemi = new THREE.HemisphereLight(0xfff1dd, 0x7e95ae, 0.95);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe0b0, 2.6);
  sun.position.set(-14, 11, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 45;
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xb7cae0, 0.55);
  fill.position.set(8, 9, -6);
  scene.add(fill);

  scene.add(new THREE.AmbientLight(0xfff6ec, 0.4));

  for (const [x, z, i] of [[-4, 2, 0.7], [0, 0.2, 0.6], [3.2, 2, 0.55], [-2, -3, 0.5], [5, -2, 0.45]]) {
    const p = new THREE.PointLight(0xffd6a0, i, 9, 2);
    p.position.set(x, 3.35, z);
    scene.add(p);
  }
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
  renderer.toneMappingExposure = 1.12;
  return renderer;
}

/** Cinematic corner camera matching the anime reference framing. */
export function createCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 80);
  camera.position.set(9.2, 4.6, 10.2);
  camera.lookAt(-1.8, 1.15, -0.2);
  return camera;
}
