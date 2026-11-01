/**
 * Seated rilakkuma figures: chair placement, status motion, ray pick.
 */
import * as THREE from 'three';
import { TEAM, LEAD_ID } from './team.js';
import { getEffectiveStatus } from './supabase.js';
import { createNameTagCanvas } from './avatars.js';
import { createFigure } from './figures.js';
import { LEAD_HANDOFF, CHAIR } from './office.js';

/**
 * @param {THREE.Scene} scene
 * @param {Map<string, object>} desks
 * @param {THREE.Camera} camera
 */
export function createBotManager(scene, desks, camera) {
  const group = new THREE.Group();
  group.name = 'bots';
  scene.add(group);

  /** @type {Map<string, object>} */
  const bots = new Map();
  /** @type {Map<string, object>} */
  const motion = new Map();

  const ringGeo = new THREE.RingGeometry(0.28, 0.38, 32);
  ringGeo.rotateX(-Math.PI / 2);

  /** Meshes used for ray picking */
  const pickables = [];

  TEAM.forEach((member, index) => {
    const { root: figure, figureType, height, arms, head } = createFigure(member, index);

    const desk = desks.get(member.id);
    const seatX = desk?.seatX ?? desk?.x ?? 0;
    const rawSeatZ = desk?.seatZ ?? (desk ? desk.z + CHAIR.offsetZ : 0);
    const seatZ = rawSeatZ - 0.05; // nestle toward desk
    const seatY = desk?.seatY ?? CHAIR.seatY;
    const faceYaw = desk?.faceYaw ?? CHAIR.faceYaw;

    figure.position.set(seatX, seatY, seatZ);
    figure.rotation.y = faceYaw;

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x78909c,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(seatX, 0.03, seatZ);

    const accentGeo = new THREE.RingGeometry(0.2, 0.26, 32);
    accentGeo.rotateX(-Math.PI / 2);
    const accentMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(member.color),
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const accentRing = new THREE.Mesh(accentGeo, accentMat);
    accentRing.position.set(seatX, 0.025, seatZ);

    const tagCanvas = createNameTagCanvas(member);
    const tagTex = new THREE.CanvasTexture(tagCanvas);
    tagTex.colorSpace = THREE.SRGBColorSpace;
    const tagMat = new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthWrite: false });
    const tag = new THREE.Sprite(tagMat);
    tag.scale.set(1.25, 0.3, 1);
    tag.position.set(seatX, seatY + height + 0.18, seatZ);

    group.add(accentRing);
    group.add(ring);
    group.add(figure);
    group.add(tag);

    figure.traverse((obj) => {
      if (obj.isMesh) pickables.push(obj);
    });

    bots.set(member.id, {
      member,
      figure,
      figureType,
      arms,
      head,
      ring,
      accentRing,
      tag,
      tagTex,
      height,
      x: seatX,
      y: seatY,
      z: seatZ,
      seatY,
      facing: faceYaw,
      homeFacing: faceYaw,
      bob: index * 0.7,
      label: shortLabel(member.name),
    });
    motion.set(member.id, {
      state: 'idle',
      from: { x: seatX, z: seatZ },
      to: { x: seatX, z: seatZ },
      t: 1,
      duration: 1,
      phase: 'idle',
      home: { x: seatX, z: seatZ },
    });
  });

  function shortLabel(name) {
    if (name.length <= 14) return name;
    return name.slice(0, 13) + '…';
  }

  /** Seated nestled on cushion (slightly toward desk, clear of backrest) */
  function seated(desk) {
    const sx = desk.seatX ?? desk.x;
    const sz = desk.seatZ ?? desk.z + CHAIR.offsetZ;
    return { x: sx, z: sz - 0.05 };
  }

  /** Scoot toward keyboard / monitors while working */
  function working(desk) {
    const sx = desk.seatX ?? desk.x;
    const sz = desk.seatZ ?? desk.z + CHAIR.offsetZ;
    return { x: sx, z: sz - 0.14 };
  }

  function handoffTarget(id) {
    if (id === LEAD_ID) {
      const home = motion.get(id)?.home;
      return { x: home.x, z: home.z };
    }
    // Scoot in wheeled chair toward lead (stay at seat height)
    return { x: LEAD_HANDOFF.x, z: LEAD_HANDOFF.z };
  }

  function startMove(id, target, duration, phase) {
    const b = bots.get(id);
    const m = motion.get(id);
    if (!b || !m) return;
    m.from = { x: b.x, z: b.z };
    m.to = target;
    m.t = 0;
    m.duration = Math.max(duration, 0.4);
    m.phase = phase;
  }

  function syncFromStatus() {
    for (const member of TEAM) {
      const vis = getEffectiveStatus(member.id);
      const m = motion.get(member.id);
      const desk = desks.get(member.id);
      if (!m || !desk) continue;

      if (vis.state === m.state && m.phase !== 'returning') continue;

      const prev = m.state;
      m.state = vis.state;

      if (vis.state === 'idle') {
        startMove(member.id, seated(desk), 2.2, 'to-seat');
      } else if (vis.state === 'working') {
        startMove(member.id, working(desk), 1.2, 'to-desk');
      } else if (vis.state === 'handoff') {
        startMove(member.id, handoffTarget(member.id), member.id === LEAD_ID ? 1.0 : 3.2, 'to-lead');
      } else if (prev !== 'idle') {
        startMove(member.id, seated(desk), 2.2, 'to-seat');
        m.state = 'idle';
      }
    }
  }

  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function ringColor(state) {
    if (state === 'working') return 0x2e7d32;
    if (state === 'handoff') return 0xe65100;
    return 0x78909c;
  }

  function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  function update(dt) {
    for (const [id, b] of bots) {
      const m = motion.get(id);
      if (!m) continue;
      b.bob += dt;

      let moving = false;
      if (m.t < 1) {
        moving = true;
        m.t = Math.min(1, m.t + dt / m.duration);
        const e = ease(m.t);
        b.x = m.from.x + (m.to.x - m.from.x) * e;
        b.z = m.from.z + (m.to.z - m.from.z) * e;

        const dx = m.to.x - m.from.x;
        const dz = m.to.z - m.from.z;
        if (dx * dx + dz * dz > 1e-6) {
          // Face travel direction while chair-scooting
          const desired = Math.atan2(dx, dz);
          b.facing = lerpAngle(b.facing, desired, Math.min(1, dt * 4));
        }

        if (m.t >= 1) {
          if (m.phase === 'to-lead' && id !== LEAD_ID) {
            const desk = desks.get(id);
            setTimeout(() => {
              if (motion.get(id)?.state === 'handoff') {
                startMove(id, seated(desk), 3.2, 'returning');
              }
            }, 1600);
          }
          if (m.phase === 'returning') {
            m.state = 'idle';
            m.phase = 'idle';
          }
        }
      }

      const st = getEffectiveStatus(id);

      // Gentle seated sway / work typing bob / handoff bounce
      let bounce =
        st.state === 'working'
          ? Math.sin(b.bob * 5) * 0.012
          : st.state === 'handoff'
            ? Math.sin(b.bob * 5.5) * 0.03
            : Math.sin(b.bob * 1.4) * 0.01;

      let leanX = 0;
      let armBob = 0;
      if (st.state === 'working' && !moving) {
        // Nod toward monitor / keyboard
        leanX = 0.08 + Math.sin(b.bob * 3.4) * 0.04;
        armBob = Math.sin(b.bob * 6) * 0.05;
        bounce += Math.abs(Math.sin(b.bob * 3.4)) * 0.006;
      }

      if (st.state === 'handoff' && !moving && id !== LEAD_ID) {
        const dx = LEAD_HANDOFF.x - b.x;
        const dz = LEAD_HANDOFF.z - 0.3 - b.z;
        const desired = Math.atan2(dx, dz);
        b.facing = lerpAngle(b.facing, desired, Math.min(1, dt * 3));
      } else if (!moving && (st.state === 'idle' || st.state === 'working')) {
        b.facing = lerpAngle(b.facing, b.homeFacing, Math.min(1, dt * 2.2));
      }

      b.y = b.seatY;
      b.figure.position.set(b.x, b.y + bounce, b.z);
      b.figure.rotation.y = b.facing;
      b.figure.rotation.x = leanX;

      if (b.arms) {
        b.arms.rotation.x = armBob;
        b.arms.position.z = st.state === 'working' ? 0.02 : 0;
      }
      if (b.head && st.state === 'working' && !moving) {
        b.head.rotation.x = Math.sin(b.bob * 2.8) * 0.05;
      } else if (b.head) {
        b.head.rotation.x = lerpAngle(b.head.rotation.x, 0, Math.min(1, dt * 3));
      }

      b.ring.position.set(b.x, 0.03, b.z);
      b.ring.material.color.setHex(ringColor(st.state));
      b.accentRing.position.set(b.x, 0.025, b.z);
      b.tag.position.set(b.x, b.y + b.height + 0.18 + bounce, b.z);
    }
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  /**
   * Pick bot under pointer (CSS pixels relative to canvas).
   * @param {HTMLCanvasElement} canvas
   * @param {number} clientX
   * @param {number} clientY
   */
  function pickBot(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(pickables, false);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj && obj.parent) {
        for (const b of bots.values()) {
          if (obj === b.figure || b.figure.children.includes(obj)) {
            return b.member;
          }
        }
        if (obj.parent?.name?.startsWith?.('figure-')) {
          for (const b of bots.values()) {
            if (b.figure === obj.parent || b.figure === obj) return b.member;
          }
        }
        obj = obj.parent;
        for (const b of bots.values()) {
          if (obj === b.figure) return b.member;
        }
      }
    }

    let best = null;
    let bestDist = Infinity;
    for (const b of bots.values()) {
      const center = new THREE.Vector3(b.x, b.y + b.height * 0.55, b.z);
      const projected = center.project(camera);
      const dx = projected.x - pointer.x;
      const dy = projected.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 0.014 && d2 < bestDist) {
        bestDist = d2;
        best = b.member;
      }
    }
    return best;
  }

  return { syncFromStatus, update, pickBot, bots, group };
}
