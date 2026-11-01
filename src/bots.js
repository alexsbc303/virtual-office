/**
 * 2D anime bot sprites: placement, status motion, hit-testing.
 */
import { TEAM, LEAD_ID } from './team.js';
import { getEffectiveStatus } from './supabase.js';
import { createAvatarSprite } from './avatars.js';
import { LEAD_HANDOFF } from './office.js';

/**
 * @param {Map<string, {x:number,y:number,zone:string}>} desks
 */
export function createBotManager(desks) {
  /** @type {Map<string, { member: object, sprite: HTMLCanvasElement, x:number, y:number, scale:number, bob:number }>} */
  const bots = new Map();
  /** @type {Map<string, object>} */
  const motion = new Map();

  TEAM.forEach((member, index) => {
    const sprite = createAvatarSprite(member, index, 192);
    const desk = desks.get(member.id);
    const scale = desk?.zone === 'lead' ? 0.78 : desk?.y < 500 ? 0.68 : 0.92;
    const x = desk?.x ?? 400;
    const y = desk?.y ?? 500;
    bots.set(member.id, {
      member,
      sprite,
      x,
      y,
      scale,
      bob: index * 0.7,
      label: shortLabel(member.name),
    });
    motion.set(member.id, {
      state: 'idle',
      from: { x, y },
      to: { x, y },
      t: 1,
      duration: 1,
      phase: 'idle',
      home: { x, y, scale },
    });
  });

  function shortLabel(name) {
    if (name.length <= 14) return name;
    return name.slice(0, 13) + '…';
  }

  function seated(desk) {
    return { x: desk.x, y: desk.y };
  }

  function working(desk) {
    // Slight lean toward monitors
    return { x: desk.x, y: desk.y - 6 };
  }

  function handoffTarget(id) {
    if (id === LEAD_ID) {
      const home = motion.get(id)?.home;
      return { x: home.x, y: home.y };
    }
    return { x: LEAD_HANDOFF.x, y: LEAD_HANDOFF.y };
  }

  function startMove(id, target, duration, phase) {
    const b = bots.get(id);
    const m = motion.get(id);
    if (!b || !m) return;
    m.from = { x: b.x, y: b.y };
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

  function update(dt) {
    for (const [id, b] of bots) {
      const m = motion.get(id);
      if (!m) continue;
      b.bob += dt;

      if (m.t < 1) {
        m.t = Math.min(1, m.t + dt / m.duration);
        const e = ease(m.t);
        b.x = m.from.x + (m.to.x - m.from.x) * e;
        b.y = m.from.y + (m.to.y - m.from.y) * e;

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
    }
  }

  /**
   * Draw bots sorted by Y (painter's algorithm).
   * @param {CanvasRenderingContext2D} ctx
   * @param {(id:string)=>object} getStatus
   */
  function draw(ctx, getStatus) {
    const ordered = [...bots.values()].sort((a, b) => a.y - b.y);
    for (const b of ordered) {
      const st = getStatus(b.member.id);
      const bounce =
        st.state === 'working' ? Math.sin(b.bob * 4) * 2 : st.state === 'handoff' ? Math.sin(b.bob * 6) * 3 : 0;
      const w = 192 * b.scale;
      const h = 192 * b.scale;
      const dx = b.x - w / 2;
      const dy = b.y - h + bounce;

      // Status ring under feet
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle =
        st.state === 'working' ? '#2e7d32' : st.state === 'handoff' ? '#e65100' : '#78909c';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y - 4, 22 * b.scale, 6 * b.scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.drawImage(b.sprite, dx, dy, w, h);

      // Name tag
      const tagW = Math.min(150, 10 + b.label.length * 7.5);
      const tagX = b.x - tagW / 2;
      const tagY = dy - 18;
      ctx.fillStyle = 'rgba(255,253,249,0.92)';
      roundRect(ctx, tagX, tagY, tagW, 16, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,130,140,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Team colour pip
      ctx.fillStyle = b.member.color;
      ctx.beginPath();
      ctx.arc(tagX + 8, tagY + 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a4550';
      ctx.font = '500 10px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, tagX + 16, tagY + 8.5);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /**
   * Hit-test in scene coordinates.
   */
  function pickBot(sceneX, sceneY) {
    const ordered = [...bots.values()].sort((a, b) => b.y - a.y);
    for (const b of ordered) {
      const w = 192 * b.scale;
      const h = 192 * b.scale;
      const dx = b.x - w / 2;
      const dy = b.y - h;
      if (sceneX >= dx && sceneX <= dx + w && sceneY >= dy && sceneY <= b.y) {
        return b.member;
      }
    }
    return null;
  }

  return { syncFromStatus, update, draw, pickBot, bots };
}
