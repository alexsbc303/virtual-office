/**
 * Procedural cute stylized 3D plush/chibi figures for AS Virtual Office.
 * figureType keys (code-only): bubu | dudu | melody | rilakkuma
 * Original meshes — no branded assets or trademarked UI strings.
 */
import * as THREE from 'three';

/** @typedef {'bubu'|'dudu'|'melody'|'rilakkuma'} FigureType */

export const FIGURE_TYPES = /** @type {const} */ (['bubu', 'dudu', 'melody', 'rilakkuma']);

/**
 * Cycle four figure silhouettes across the roster. Lead (index 0) → bubu.
 * @param {number} index
 * @returns {FigureType}
 */
export function figureTypeForIndex(index) {
  return FIGURE_TYPES[((index % 4) + 4) % 4];
}

function softMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.82,
    metalness: opts.metalness ?? 0.0,
    flatShading: false,
    ...opts,
  });
}

function addSphere(parent, radius, material, x, y, z, sx = 1, sy = 1, sz = 1, segs = 24) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segs, segs), material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCapsule(parent, radius, length, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 12), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function hexNumber(hex) {
  if (typeof hex === 'number') return hex;
  return parseInt(String(hex).replace('#', ''), 16);
}

function shadeHex(hex, f) {
  const n = hexNumber(hex);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return (r << 16) | (g << 8) | b;
}

/** Shared face: simple dots + shine for plush readability */
function addPlushFace(head, opts = {}) {
  const eyeMat = softMat(0x2a2a32, { roughness: 0.45 });
  const shineMat = softMat(0xffffff, { roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.15 });
  const noseMat = softMat(opts.noseColor ?? 0x3a2a28, { roughness: 0.5 });
  const blushMat = softMat(0xf48fb1, { roughness: 0.9, transparent: true, opacity: 0.45 });

  const eyeY = opts.eyeY ?? 0.06;
  const eyeZ = opts.eyeZ ?? 0.28;
  const eyeX = opts.eyeX ?? 0.11;
  const eyeR = opts.eyeR ?? 0.045;

  addSphere(head, eyeR, eyeMat, -eyeX, eyeY, eyeZ, 1, 1.15, 0.85, 16);
  addSphere(head, eyeR, eyeMat, eyeX, eyeY, eyeZ, 1, 1.15, 0.85, 16);
  addSphere(head, eyeR * 0.35, shineMat, -eyeX - 0.015, eyeY + 0.02, eyeZ + 0.03, 1, 1, 1, 10);
  addSphere(head, eyeR * 0.35, shineMat, eyeX - 0.015, eyeY + 0.02, eyeZ + 0.03, 1, 1, 1, 10);

  const nose = addSphere(head, opts.noseR ?? 0.04, noseMat, 0, eyeY - 0.08, eyeZ + 0.04, 1.1, 0.85, 0.9, 12);
  void nose;

  if (opts.blush !== false) {
    addSphere(head, 0.05, blushMat, -eyeX - 0.06, eyeY - 0.1, eyeZ - 0.02, 1.4, 0.7, 0.5, 10);
    addSphere(head, 0.05, blushMat, eyeX + 0.06, eyeY - 0.1, eyeZ - 0.02, 1.4, 0.7, 0.5, 10);
  }

  // Tiny smile (dark torus segment as flattened torus)
  const smileMat = softMat(0x5d4037, { roughness: 0.6 });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 16, Math.PI), smileMat);
  smile.position.set(0, eyeY - 0.14, eyeZ + 0.02);
  smile.rotation.set(0.2, 0, Math.PI);
  smile.castShadow = false;
  head.add(smile);
}

/** Team-colour scarf / neck ribbon accent */
function addTeamScarf(root, teamColor, y = 0.52) {
  const accent = softMat(hexNumber(teamColor), { roughness: 0.7 });
  const dark = softMat(shadeHex(teamColor, 0.7), { roughness: 0.72 });
  addSphere(root, 0.18, accent, 0, y, 0.02, 1.15, 0.35, 1.05, 18);
  // dangling tail
  addCapsule(root, 0.035, 0.14, dark, 0.12, y - 0.1, 0.12, 0.4, 0, 0.3);
  return accent;
}

/** Lead gold badge on chest */
function addLeadBadge(root, y = 0.38) {
  const gold = softMat(0xffd54f, { roughness: 0.35, metalness: 0.45, emissive: 0xffa000, emissiveIntensity: 0.12 });
  const rim = softMat(0xb8860b, { roughness: 0.4, metalness: 0.5 });
  addSphere(root, 0.055, gold, 0, y, 0.22, 1, 1, 0.55, 14);
  addSphere(root, 0.065, rim, 0, y, 0.21, 1, 1, 0.4, 14);
}

function addLimbs(root, furMat, opts = {}) {
  const armY = opts.armY ?? 0.38;
  const legY = opts.legY ?? 0.12;
  // Arms
  addCapsule(root, 0.07, 0.12, furMat, -0.28, armY, 0.02, 0, 0, 0.85);
  addCapsule(root, 0.07, 0.12, furMat, 0.28, armY, 0.02, 0, 0, -0.85);
  // Feet / legs — stubby plush feet
  const footMat = opts.footMat || furMat;
  addSphere(root, 0.1, footMat, -0.12, legY, 0.04, 1.1, 0.7, 1.35, 14);
  addSphere(root, 0.1, footMat, 0.12, legY, 0.04, 1.1, 0.7, 1.35, 14);
}

/**
 * Round cream bear with pink inner ears / cheek accents (bubu silhouette).
 */
function buildBubu(teamColor, isLead) {
  const root = new THREE.Group();
  const fur = softMat(0xfff6ea, { roughness: 0.88 });
  const furShade = softMat(0xf5e6d3, { roughness: 0.9 });
  const pink = softMat(0xf8bbd0, { roughness: 0.85 });
  const belly = softMat(0xfffaf5, { roughness: 0.9 });

  // Body
  addSphere(root, 0.32, fur, 0, 0.34, 0, 1.05, 0.95, 0.95, 28);
  addSphere(root, 0.2, belly, 0, 0.32, 0.18, 1.1, 1.0, 0.55, 18);
  // Head
  const head = new THREE.Group();
  head.position.set(0, 0.72, 0);
  root.add(head);
  addSphere(head, 0.3, fur, 0, 0, 0, 1.05, 1.0, 1.0, 28);
  // Ears
  addSphere(head, 0.1, furShade, -0.22, 0.22, -0.02, 1, 1.05, 0.7, 16);
  addSphere(head, 0.1, furShade, 0.22, 0.22, -0.02, 1, 1.05, 0.7, 16);
  addSphere(head, 0.055, pink, -0.22, 0.22, 0.04, 1, 1, 0.5, 12);
  addSphere(head, 0.055, pink, 0.22, 0.22, 0.04, 1, 1, 0.5, 12);

  addPlushFace(head, { eyeY: 0.02, eyeZ: 0.26, noseColor: 0x5d4037, noseR: 0.035 });
  addLimbs(root, fur, { footMat: softMat(0xfce4ec, { roughness: 0.88 }) });
  addTeamScarf(root, teamColor, 0.54);
  if (isLead) addLeadBadge(root);

  // Soft pink bow accent on ear
  addSphere(root, 0.045, pink, -0.26, 0.92, 0.08, 1.6, 0.7, 0.7, 10);
  return root;
}

/**
 * Soft brown companion bear (dudu silhouette).
 */
function buildDudu(teamColor, isLead) {
  const root = new THREE.Group();
  const fur = softMat(0x8d6e63, { roughness: 0.88 });
  const furDark = softMat(0x6d4c41, { roughness: 0.9 });
  const belly = softMat(0xd7ccc8, { roughness: 0.9 });
  const muzzle = softMat(0xe0d0c4, { roughness: 0.88 });

  addSphere(root, 0.33, fur, 0, 0.34, 0, 1.08, 0.95, 0.98, 28);
  addSphere(root, 0.2, belly, 0, 0.3, 0.18, 1.15, 1.05, 0.55, 18);

  const head = new THREE.Group();
  head.position.set(0, 0.74, 0);
  root.add(head);
  addSphere(head, 0.31, fur, 0, 0, 0, 1.05, 1.0, 1.0, 28);
  addSphere(head, 0.14, muzzle, 0, -0.06, 0.2, 1.25, 0.95, 0.75, 18);
  // Ears
  addSphere(head, 0.1, furDark, -0.23, 0.22, -0.02, 1, 1.05, 0.7, 16);
  addSphere(head, 0.1, furDark, 0.23, 0.22, -0.02, 1, 1.05, 0.7, 16);
  addSphere(head, 0.05, softMat(0xbcaaa4, { roughness: 0.88 }), -0.23, 0.22, 0.04, 1, 1, 0.5, 12);
  addSphere(head, 0.05, softMat(0xbcaaa4, { roughness: 0.88 }), 0.23, 0.22, 0.04, 1, 1, 0.5, 12);

  addPlushFace(head, { eyeY: 0.04, eyeZ: 0.28, eyeX: 0.1, noseColor: 0x3e2723, noseR: 0.038 });
  addLimbs(root, fur, { footMat: furDark });
  addTeamScarf(root, teamColor, 0.55);
  if (isLead) addLeadBadge(root);
  return root;
}

/**
 * Soft pink rabbit-hooded chibi (melody-inspired silhouette: hood + ears, white face oval, pink body).
 */
function buildMelody(teamColor, isLead) {
  const root = new THREE.Group();
  const pink = softMat(0xf48fb1, { roughness: 0.86 });
  const pinkDeep = softMat(0xec407a, { roughness: 0.84 });
  const hood = softMat(0xf8bbd0, { roughness: 0.88 });
  const face = softMat(0xfff8f5, { roughness: 0.9 });
  const white = softMat(0xffffff, { roughness: 0.88 });
  const earInner = softMat(0xfce4ec, { roughness: 0.9 });

  // Body (pink dress / plush torso)
  addSphere(root, 0.3, pink, 0, 0.32, 0, 1.1, 1.05, 1.0, 28);
  addSphere(root, 0.18, white, 0, 0.34, 0.16, 1.15, 1.0, 0.55, 16);
  // Skirt flare
  addSphere(root, 0.22, pinkDeep, 0, 0.18, 0, 1.35, 0.55, 1.2, 20);

  const head = new THREE.Group();
  head.position.set(0, 0.7, 0);
  root.add(head);
  // Hood / head pink shell
  addSphere(head, 0.3, hood, 0, 0.02, -0.02, 1.08, 1.05, 1.05, 28);
  // White face oval
  addSphere(head, 0.22, face, 0, -0.02, 0.12, 1.05, 1.1, 0.75, 22);

  // Long rabbit ears on hood
  const earL = addCapsule(head, 0.07, 0.28, hood, -0.14, 0.42, -0.02, 0.15, 0, 0.25);
  const earR = addCapsule(head, 0.07, 0.28, hood, 0.14, 0.42, -0.02, 0.15, 0, -0.25);
  earL.scale.set(1, 1, 0.7);
  earR.scale.set(1, 1, 0.7);
  addCapsule(head, 0.035, 0.18, earInner, -0.14, 0.4, 0.02, 0.15, 0, 0.25);
  addCapsule(head, 0.035, 0.18, earInner, 0.14, 0.4, 0.02, 0.15, 0, -0.25);

  // Soft hood side puffs
  addSphere(head, 0.1, hood, -0.26, 0.0, 0.0, 0.9, 1.0, 0.85, 14);
  addSphere(head, 0.1, hood, 0.26, 0.0, 0.0, 0.9, 1.0, 0.85, 14);

  addPlushFace(head, {
    eyeY: 0.0,
    eyeZ: 0.26,
    eyeX: 0.09,
    eyeR: 0.04,
    noseColor: 0xf06292,
    noseR: 0.03,
  });

  // Flower / team accent on hood
  const flower = softMat(hexNumber(teamColor), { roughness: 0.65 });
  addSphere(head, 0.055, flower, 0.2, 0.18, 0.18, 1, 1, 0.6, 12);
  addSphere(head, 0.025, softMat(0xfff59d, { roughness: 0.5 }), 0.2, 0.18, 0.22, 1, 1, 1, 8);

  addLimbs(root, pink, { footMat: softMat(0xfce4ec, { roughness: 0.88 }), armY: 0.36 });
  addTeamScarf(root, teamColor, 0.5);
  if (isLead) addLeadBadge(root, 0.36);
  return root;
}

/**
 * Golden-brown relaxed bear with cream muzzle oval (rilakkuma-inspired silhouette).
 */
function buildRilakkuma(teamColor, isLead) {
  const root = new THREE.Group();
  const fur = softMat(0xc9a66b, { roughness: 0.88 });
  const furWarm = softMat(0xb8956a, { roughness: 0.9 });
  const muzzle = softMat(0xf3e5d0, { roughness: 0.9 });
  const belly = softMat(0xe8d5b7, { roughness: 0.9 });
  const noseMat = softMat(0x3e2723, { roughness: 0.45 });

  addSphere(root, 0.34, fur, 0, 0.33, 0, 1.12, 0.92, 1.0, 28);
  addSphere(root, 0.2, belly, 0, 0.3, 0.18, 1.2, 1.05, 0.55, 18);

  const head = new THREE.Group();
  head.position.set(0, 0.72, 0);
  root.add(head);
  addSphere(head, 0.32, fur, 0, 0, 0, 1.08, 1.0, 1.02, 28);
  // Cream muzzle oval — signature silhouette cue
  addSphere(head, 0.16, muzzle, 0, -0.08, 0.2, 1.35, 1.05, 0.8, 20);
  // Dark oval nose
  addSphere(head, 0.055, noseMat, 0, -0.04, 0.32, 1.15, 0.85, 0.7, 14);

  // Simple round ears
  addSphere(head, 0.11, furWarm, -0.24, 0.24, -0.04, 1, 1.0, 0.65, 16);
  addSphere(head, 0.11, furWarm, 0.24, 0.24, -0.04, 1, 1.0, 0.65, 16);
  addSphere(head, 0.05, softMat(0xd7ccc8, { roughness: 0.9 }), -0.24, 0.24, 0.02, 1, 1, 0.45, 10);
  addSphere(head, 0.05, softMat(0xd7ccc8, { roughness: 0.9 }), 0.24, 0.24, 0.02, 1, 1, 0.45, 10);

  // Eyes a bit higher / spaced for relaxed look
  const eyeMat = softMat(0x2a2a32, { roughness: 0.45 });
  const shineMat = softMat(0xffffff, { roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.12 });
  addSphere(head, 0.042, eyeMat, -0.11, 0.06, 0.28, 1, 1.2, 0.85, 14);
  addSphere(head, 0.042, eyeMat, 0.11, 0.06, 0.28, 1, 1.2, 0.85, 14);
  addSphere(head, 0.015, shineMat, -0.12, 0.08, 0.31, 1, 1, 1, 8);
  addSphere(head, 0.015, shineMat, 0.1, 0.08, 0.31, 1, 1, 1, 8);

  // Soft smile on muzzle
  const smileMat = softMat(0x5d4037, { roughness: 0.6 });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), smileMat);
  smile.position.set(0, -0.14, 0.3);
  smile.rotation.set(0.25, 0, Math.PI);
  head.add(smile);

  // Blush
  const blushMat = softMat(0xe57373, { roughness: 0.9, transparent: true, opacity: 0.35 });
  addSphere(head, 0.045, blushMat, -0.2, -0.02, 0.22, 1.3, 0.7, 0.5, 10);
  addSphere(head, 0.045, blushMat, 0.2, -0.02, 0.22, 1.3, 0.7, 0.5, 10);

  addLimbs(root, fur, { footMat: furWarm, armY: 0.36 });
  addTeamScarf(root, teamColor, 0.52);
  if (isLead) addLeadBadge(root);
  return root;
}

const BUILDERS = {
  bubu: buildBubu,
  dudu: buildDudu,
  melody: buildMelody,
  rilakkuma: buildRilakkuma,
};

/**
 * Build a cute 3D figure group for a team member.
 * @param {{ color: string, isLead?: boolean }} member
 * @param {number} index
 * @returns {{ root: THREE.Group, figureType: FigureType, height: number }}
 */
export function createFigure(member, index) {
  const figureType = figureTypeForIndex(index);
  const builder = BUILDERS[figureType];
  const root = builder(member.color, !!member.isLead);
  root.name = `figure-${figureType}`;
  // Uniform scale — lead slightly larger
  const s = member.isLead ? 1.22 : 1.1;
  root.scale.setScalar(s);
  const height = 1.08 * s;
  return { root, figureType, height };
}
