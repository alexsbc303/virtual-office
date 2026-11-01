/**
 * Procedural cute stylized 3D plush/chibi figures for AS Virtual Office.
 * Display uses the rilakkuma (golden-brown relaxed bear) silhouette only.
 * Figures are built in a seated desk pose (hips on chair, arms to keyboard).
 * Original meshes — no branded assets or trademarked UI strings.
 */
import * as THREE from 'three';

/** @typedef {'rilakkuma'} FigureType */

export const FIGURE_TYPES = /** @type {const} */ (['rilakkuma']);

/**
 * All bots use the rilakkuma silhouette (kept for API compatibility).
 * @param {number} _index
 * @returns {FigureType}
 */
export function figureTypeForIndex(_index) {
  return 'rilakkuma';
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

/** Team-colour scarf / neck ribbon accent */
function addTeamScarf(root, teamColor, y = 0.34) {
  const accent = softMat(hexNumber(teamColor), { roughness: 0.7 });
  const dark = softMat(shadeHex(teamColor, 0.7), { roughness: 0.72 });
  addSphere(root, 0.145, accent, 0, y, 0.02, 1.15, 0.35, 1.05, 18);
  addCapsule(root, 0.03, 0.1, dark, 0.1, y - 0.08, 0.1, 0.4, 0, 0.3);
  return accent;
}

/** Lead gold badge on chest */
function addLeadBadge(root, y = 0.22) {
  const gold = softMat(0xffd54f, { roughness: 0.35, metalness: 0.45, emissive: 0xffa000, emissiveIntensity: 0.12 });
  const rim = softMat(0xb8860b, { roughness: 0.4, metalness: 0.5 });
  addSphere(root, 0.045, gold, 0, y, 0.18, 1, 1, 0.55, 14);
  addSphere(root, 0.055, rim, 0, y, 0.17, 1, 1, 0.4, 14);
}

/**
 * Golden-brown relaxed bear — clearly seated.
 * Root origin = hip contact on chair cushion. Face along local +Z (desk when yaw=π).
 */
function buildRilakkumaSeated(teamColor, isLead) {
  const root = new THREE.Group();
  const fur = softMat(0xc9a66b, { roughness: 0.88 });
  const furWarm = softMat(0xb8956a, { roughness: 0.9 });
  const muzzle = softMat(0xf3e5d0, { roughness: 0.9 });
  const belly = softMat(0xe8d5b7, { roughness: 0.9 });
  const noseMat = softMat(0x3e2723, { roughness: 0.45 });

  // Squatter torso — sits deep on the cushion (bottom ≈ y=0)
  addSphere(root, 0.26, fur, 0, 0.2, -0.02, 1.2, 0.88, 1.05, 28);
  addSphere(root, 0.16, belly, 0, 0.18, 0.14, 1.25, 1.0, 0.55, 18);

  // Head — slightly forward over the desk
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.46, 0.04);
  root.add(head);
  addSphere(head, 0.25, fur, 0, 0, 0, 1.1, 1.0, 1.02, 28);
  addSphere(head, 0.125, muzzle, 0, -0.06, 0.16, 1.35, 1.05, 0.8, 20);
  addSphere(head, 0.042, noseMat, 0, -0.03, 0.26, 1.15, 0.85, 0.7, 14);

  addSphere(head, 0.085, furWarm, -0.19, 0.19, -0.03, 1, 1.0, 0.65, 16);
  addSphere(head, 0.085, furWarm, 0.19, 0.19, -0.03, 1, 1.0, 0.65, 16);
  addSphere(head, 0.04, softMat(0xd7ccc8, { roughness: 0.9 }), -0.19, 0.19, 0.02, 1, 1, 0.45, 10);
  addSphere(head, 0.04, softMat(0xd7ccc8, { roughness: 0.9 }), 0.19, 0.19, 0.02, 1, 1, 0.45, 10);

  const eyeMat = softMat(0x2a2a32, { roughness: 0.45 });
  const shineMat = softMat(0xffffff, { roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.12 });
  addSphere(head, 0.034, eyeMat, -0.09, 0.045, 0.23, 1, 1.2, 0.85, 14);
  addSphere(head, 0.034, eyeMat, 0.09, 0.045, 0.23, 1, 1.2, 0.85, 14);
  addSphere(head, 0.012, shineMat, -0.1, 0.06, 0.26, 1, 1, 1, 8);
  addSphere(head, 0.012, shineMat, 0.08, 0.06, 0.26, 1, 1, 1, 8);

  const smileMat = softMat(0x5d4037, { roughness: 0.6 });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 8, 16, Math.PI), smileMat);
  smile.position.set(0, -0.11, 0.24);
  smile.rotation.set(0.25, 0, Math.PI);
  head.add(smile);

  const blushMat = softMat(0xe57373, { roughness: 0.9, transparent: true, opacity: 0.35 });
  addSphere(head, 0.035, blushMat, -0.16, -0.015, 0.18, 1.3, 0.7, 0.5, 10);
  addSphere(head, 0.035, blushMat, 0.16, -0.015, 0.18, 1.3, 0.7, 0.5, 10);

  // Horizontal thighs on the seat + feet dangling a little toward the desk
  const legs = new THREE.Group();
  legs.name = 'legs';
  root.add(legs);
  // Thighs flat along +Z (toward desk)
  addCapsule(legs, 0.08, 0.14, fur, -0.12, 0.05, 0.12, Math.PI / 2, 0, 0.12);
  addCapsule(legs, 0.08, 0.14, fur, 0.12, 0.05, 0.12, Math.PI / 2, 0, -0.12);
  // Lower legs drop toward floor a bit
  addCapsule(legs, 0.065, 0.08, furWarm, -0.13, -0.02, 0.3, 0.35, 0, 0);
  addCapsule(legs, 0.065, 0.08, furWarm, 0.13, -0.02, 0.3, 0.35, 0, 0);
  addSphere(legs, 0.085, furWarm, -0.13, -0.06, 0.38, 1.2, 0.6, 1.3, 14);
  addSphere(legs, 0.085, furWarm, 0.13, -0.06, 0.38, 1.2, 0.6, 1.3, 14);

  // Arms reaching onto the desk / keyboard
  const arms = new THREE.Group();
  arms.name = 'arms';
  root.add(arms);
  addCapsule(arms, 0.06, 0.14, fur, -0.22, 0.24, 0.14, 1.05, 0, 0.25);
  addCapsule(arms, 0.06, 0.14, fur, 0.22, 0.24, 0.14, 1.05, 0, -0.25);
  addSphere(arms, 0.062, furWarm, -0.16, 0.16, 0.36, 1.15, 0.8, 1.1, 12);
  addSphere(arms, 0.062, furWarm, 0.16, 0.16, 0.36, 1.15, 0.8, 1.1, 12);

  addTeamScarf(root, teamColor, 0.34);
  if (isLead) addLeadBadge(root, 0.22);

  return root;
}

/**
 * Build a seated rilakkuma figure for a team member.
 * @param {{ color: string, isLead?: boolean }} member
 * @param {number} index
 * @returns {{ root: THREE.Group, figureType: FigureType, height: number, arms: THREE.Object3D | null, head: THREE.Object3D | null }}
 */
export function createFigure(member, index) {
  void index;
  const figureType = /** @type {FigureType} */ ('rilakkuma');
  const root = buildRilakkumaSeated(member.color, !!member.isLead);
  root.name = `figure-${figureType}`;
  const s = member.isLead ? 1.12 : 1.02;
  root.scale.setScalar(s);
  // Head top ≈ 0.46+0.25 = 0.71 local
  const height = 0.74 * s;
  const arms = root.getObjectByName('arms') || null;
  const head = root.getObjectByName('head') || null;
  return { root, figureType, height, arms, head };
}
