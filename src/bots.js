/**
 * 3D anime billboard avatars: placement, status motion, ray pick.
 */
import * as THREE from 'three';
import { TEAM, LEAD_ID } from './team.js';
import { getEffectiveStatus } from './supabase.js';
import { createAvatarSprite, createNameTagCanvas } from './avatars.js';
import { LEAD_HANDOFF } from './office.js';

/**
 * @param {THREE.Scene} scene
 * @param {Map<string, {x:number,y:number,z:number,zone:string}>} desks
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

  TEAM.forEach((member, index) => {
    const spriteCanvas = createAvatarSprite(member, index, 256);
    const tex = new THREE.CanvasTexture(spriteCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;

    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const scale = member.isLead ? 1.75 : 1.6;
    sprite.scale.set(scale, scale, 1);

    const desk = desks.get(member.id);
    const x = desk?.x ?? 0;
    const z = desk?.z ?? 0;
    sprite.position.set(x, scale * 0.5, z);

    // Status ring under feet
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x78909c,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, 0.03, z);

    // Name tag billboard
    const tagCanvas = createNameTagCanvas(member);
    const tagTex = new THREE.CanvasTexture(tagCanvas);
    tagTex.colorSpace = THREE.SRGBColorSpace;
    const tagMat = new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthWrite: false });
    const tag = new THREE.Sprite(tagMat);
    tag.scale.set(1.25, 0.3, 1);
    tag.position.set(x, scale + 0.15, z);

    group.add(ring);
    group.add(sprite);
    group.add(tag);

    bots.set(member.id, {
      member,
      sprite,
      ring,
      tag,
      tagTex,
      scale,
      x,
      y: 0,
      z,
      bob: index * 0.7,
      label: shortLabel(member.name),
    });
    motion.set(member.id, {
      state: 'idle',
      from: { x, z },
      to: { x, z },
      t: 1,
      duration: 1,
      phase: 'idle',
      home: { x, z },
    });
  });

  function shortLabel(name) {
    if (name.length <= 14) return name;
    return name.slice(0, 13) + '…';
  }

  function seated(desk) {
    return { x: desk.x, z: desk.z };
  }

  function working(desk) {
    return { x: desk.x, z: desk.z - 0.08 };
  }

  function handoffTarget(id) {
    if (id === LEAD_ID) {
      const home = motion.get(id)?.home;
      return { x: home.x, z: home.z };
    }
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
        startMove(member.id, working(desk), 1.6, 'to-desk');
      } else if (vis.state === 'handoff') {
        startMove(member.id, handoffTarget(member.id), member.id === LEAD_ID ? 1.2 : 3.5, 'to-lead');
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

  function update(dt) {
    for (const [id, b] of bots) {
      const m = motion.get(id);
      if (!m) continue;
      b.bob += dt;

      if (m.t < 1) {
        m.t = Math.min(1, m.t + dt / m.duration);
        const e = ease(m.t);
        b.x = m.from.x + (m.to.x - m.from.x) * e;
        b.z = m.from.z + (m.to.z - m.from.z) * e;

        if (m.t >= 1) {
          if (m.phase === 'to-lead' && id !== LEAD_ID) {
            const desk = desks.get(id);
            setTimeout(() => {
              if (motion.get(id)?.state === 'handoff') {
                startMove(id, seated(desk), 3.5, 'returning');
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
      const bounce =
        st.state === 'working'
          ? Math.sin(b.bob * 4) * 0.03
          : st.state === 'handoff'
            ? Math.sin(b.bob * 6) * 0.05
            : Math.sin(b.bob * 1.5) * 0.01;

      b.sprite.position.set(b.x, b.scale * 0.5 + bounce, b.z);
      b.ring.position.set(b.x, 0.03, b.z);
      b.ring.material.color.setHex(ringColor(st.state));
      b.tag.position.set(b.x, b.scale + 0.18 + bounce, b.z);
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

    // Prefer nearest sprite by projected distance
    let best = null;
    let bestDist = Infinity;
    for (const b of bots.values()) {
      const sp = b.sprite;
      const dist = raycaster.ray.distanceToPoint(sp.position);
      // Approximate hit: project sprite center to NDC and compare
      const projected = sp.position.clone().project(camera);
      const dx = projected.x - pointer.x;
      const dy = projected.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 0.012 && d2 < bestDist) {
        bestDist = d2;
        best = b.member;
      }
      void dist;
    }
    return best;
  }

  return { syncFromStatus, update, pickBot, bots, group };
}
