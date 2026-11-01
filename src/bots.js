import * as THREE from 'three';
import { TEAM, LEAD_ID } from './team.js';
import { getEffectiveStatus } from './supabase.js';

const TAG_SCALE = 0.01;

function mat(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.92,
    metalness: 0.0,
  });
}

/** Low-contrast bilingual name-tag texture */
function makeTagTexture(shortName) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(245, 247, 249, 0.92)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = 'rgba(120, 130, 140, 0.55)';
  ctx.strokeRect(1, 1, 254, 62);
  ctx.fillStyle = '#3a4550';
  ctx.font = '500 22px "Segoe UI", "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  const label = shortName.length > 18 ? shortName.slice(0, 17) + '…' : shortName;
  ctx.fillText(label, 128, 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Blocky matte person in flat profile colour — no shimmer.
 */
function createPersonMesh(member) {
  const g = new THREE.Group();
  g.userData.botId = member.id;
  g.userData.member = member;

  const color = parseInt(member.color.slice(1), 16);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.22), mat(color));
  body.position.y = 0.95;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), mat(color));
  head.position.y = 1.4;
  head.castShadow = true;

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.14), mat(0x37474f));
  legL.position.set(-0.1, 0.35, 0);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.14), mat(0x37474f));
  legR.position.set(0.1, 0.35, 0);

  // Small accessory cue (block)
  const acc = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.1), mat(0xb0bec5));
  acc.position.set(0.22, 1.0, 0.05);

  g.add(body, head, legL, legR, acc);

  // Name tag pinned above head — no bobbing
  const tagTex = makeTagTexture(member.name);
  const tag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.28),
    new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, depthWrite: false }),
  );
  tag.position.y = 1.75;
  tag.userData.isTag = true;
  g.add(tag);

  g.userData.parts = { body, head, legL, legR, tag };
  return g;
}

/**
 * Manage bot avatars: idle seated (no bob), working walk to desk, handoff to lead.
 */
export function createBotManager(scene, desks, leadDoor) {
  /** @type {Map<string, THREE.Group>} */
  const meshes = new Map();
  /** @type {Map<string, object>} */
  const motion = new Map();

  for (const member of TEAM) {
    const mesh = createPersonMesh(member);
    const desk = desks.get(member.id);
    const seat = seatedPose(desk);
    mesh.position.set(seat.x, seat.y, seat.z);
    mesh.rotation.y = seat.rot;
    scene.add(mesh);
    meshes.set(member.id, mesh);
    motion.set(member.id, {
      state: 'idle',
      from: { ...seat },
      to: { ...seat },
      t: 1,
      duration: 1,
      phase: 'idle',
    });
  }

  function seatedPose(desk) {
    if (!desk) return { x: 0, y: 0, z: 0, rot: 0 };
    // Sit slightly in front of desk facing it
    const facing = desk.rot;
    const ox = Math.sin(facing) * 0.55;
    const oz = Math.cos(facing) * 0.55;
    return { x: desk.x + ox, y: 0, z: desk.z + oz, rot: facing + Math.PI };
  }

  function standingAtDesk(desk) {
    if (!desk) return { x: 0, y: 0, z: 0, rot: 0 };
    const facing = desk.rot;
    const ox = Math.sin(facing) * 0.35;
    const oz = Math.cos(facing) * 0.35;
    return { x: desk.x + ox, y: 0, z: desk.z + oz, rot: facing + Math.PI };
  }

  function leadApproach() {
    return { x: leadDoor.x, y: 0, z: leadDoor.z, rot: Math.PI / 4 };
  }

  function startMove(id, target, duration, phase) {
    const mesh = meshes.get(id);
    const m = motion.get(id);
    if (!mesh || !m) return;
    m.from = {
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
      rot: mesh.rotation.y,
    };
    m.to = target;
    m.t = 0;
    m.duration = Math.max(duration, 0.5);
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
        startMove(member.id, seatedPose(desk), 2.8, 'to-seat');
      } else if (vis.state === 'working') {
        startMove(member.id, standingAtDesk(desk), 2.2, 'to-desk');
      } else if (vis.state === 'handoff') {
        if (member.id === LEAD_ID) {
          startMove(member.id, standingAtDesk(desk), 1.5, 'lead-receive');
        } else {
          startMove(member.id, leadApproach(), 4.5, 'to-lead');
        }
      } else if (prev !== 'idle') {
        startMove(member.id, seatedPose(desk), 2.8, 'to-seat');
        m.state = 'idle';
      }
    }
  }

  function ease(t) {
    // Measured formal ease-in-out
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function update(dt, camera) {
    for (const [id, mesh] of meshes) {
      const m = motion.get(id);
      if (!m) continue;

      if (m.t < 1) {
        m.t = Math.min(1, m.t + dt / m.duration);
        const e = ease(m.t);
        mesh.position.x = m.from.x + (m.to.x - m.from.x) * e;
        mesh.position.z = m.from.z + (m.to.z - m.from.z) * e;
        // No bobbing — y stays 0 (or seated offset baked in pose)
        mesh.position.y = 0;

        let rotDiff = m.to.rot - m.from.rot;
        while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        mesh.rotation.y = m.from.rot + rotDiff * e;

        // Subtle measured stride (legs only, no body bob)
        const stride = Math.sin(m.t * Math.PI * 4) * 0.04 * (1 - Math.abs(m.t - 0.5) * 2);
        if (mesh.userData.parts) {
          mesh.userData.parts.legL.rotation.x = stride;
          mesh.userData.parts.legR.rotation.x = -stride;
        }

        if (m.t >= 1) {
          if (mesh.userData.parts) {
            mesh.userData.parts.legL.rotation.x = 0;
            mesh.userData.parts.legR.rotation.x = 0;
          }
          // After handoff arrival, hold then return
          if (m.phase === 'to-lead') {
            const desk = desks.get(id);
            setTimeout(() => {
              if (motion.get(id)?.state === 'handoff') {
                startMove(id, seatedPose(desk), 4.5, 'returning');
              }
            }, 1800);
          }
          if (m.phase === 'returning') {
            m.state = 'idle';
            m.phase = 'idle';
          }
        }
      }

      // Tags face camera, pinned (no bob)
      const tag = mesh.userData.parts?.tag;
      if (tag && camera) {
        tag.quaternion.copy(camera.quaternion);
      }
    }
  }

  function pickBot(raycaster) {
    const targets = [];
    for (const mesh of meshes.values()) {
      mesh.traverse((c) => {
        if (c.isMesh && !c.userData.isTag) targets.push(c);
      });
    }
    const hits = raycaster.intersectObjects(targets, false);
    if (!hits.length) return null;
    let obj = hits[0].object;
    while (obj && !obj.userData.botId) obj = obj.parent;
    return obj?.userData.member ?? null;
  }

  function getMesh(id) {
    return meshes.get(id);
  }

  return { syncFromStatus, update, pickBot, getMesh, meshes };
}
