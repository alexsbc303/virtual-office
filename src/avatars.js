/**
 * Procedural anime-adjacent avatar sprites (Canvas).
 * Semi-realistic anime proportions (not chibi/toy): larger detailed eyes,
 * styled hair in team colour, casual-pro outfits with team accents.
 */

const SKINS = ['#f3d0b5', '#e8c4a4', '#f0d5c4', '#e0b898', '#d4a888', '#f5d8c0'];
const HAIR_STYLES = ['bob', 'short', 'side', 'ponytail', 'messy', 'long'];
const OUTFITS = ['hoodie', 'blazer', 'sweater', 'shirt'];

function hexToRgb(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function shade(hex, f) {
  const { r, g, b } = hexToRgb(hex);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
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
 * @param {{ color: string, name: string, isLead?: boolean }} member
 * @param {number} index
 * @param {number} [size=192]
 */
export function createAvatarSprite(member, index, size = 192) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const s = size / 192;
  ctx.scale(s, s);

  const team = member.color;
  const skin = SKINS[index % SKINS.length];
  const style = HAIR_STYLES[index % HAIR_STYLES.length];
  const outfit = OUTFITS[index % OUTFITS.length];
  const facing = index % 2 === 0 ? 1 : -1;

  // Soft ground shadow
  ctx.fillStyle = 'rgba(40,50,60,0.2)';
  ctx.beginPath();
  ctx.ellipse(96, 182, 36, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // —— Legs / pants ——
  ctx.fillStyle = '#2a3440';
  roundRect(ctx, 74, 128, 16, 46, 5);
  ctx.fill();
  roundRect(ctx, 102, 128, 16, 46, 5);
  ctx.fill();
  // Shoes
  ctx.fillStyle = '#151b22';
  roundRect(ctx, 70, 168, 22, 10, 4);
  ctx.fill();
  roundRect(ctx, 100, 168, 22, 10, 4);
  ctx.fill();

  // —— Torso ——
  drawOutfit(ctx, outfit, team, skin);

  // —— Arms ——
  const sleeve = outfit === 'blazer' ? shade(team, 0.45) : shade(team, 0.75);
  ctx.fillStyle = sleeve;
  roundRect(ctx, 48, 88, 18, 42, 7);
  ctx.fill();
  roundRect(ctx, 126, 88, 18, 42, 7);
  ctx.fill();
  // Hands
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(57, 132, 8, 0, Math.PI * 2);
  ctx.arc(135, 132, 8, 0, Math.PI * 2);
  ctx.fill();

  // Lead badge / lanyard
  if (member.isLead) {
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(96, 78);
    ctx.lineTo(96, 100);
    ctx.stroke();
    ctx.fillStyle = '#ffd54f';
    roundRect(ctx, 88, 98, 16, 18, 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Neck
  ctx.fillStyle = skin;
  roundRect(ctx, 88, 72, 16, 16, 4);
  ctx.fill();

  // —— Head (anime oval) ——
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(96, 48, 30, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  // Soft jaw shading
  ctx.fillStyle = 'rgba(200,140,110,0.12)';
  ctx.beginPath();
  ctx.ellipse(96, 62, 22, 14, 0, 0, Math.PI);
  ctx.fill();

  // Ears
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(66, 52, 6, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(126, 52, 6, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(230,150,140,0.35)';
  ctx.beginPath();
  ctx.ellipse(66, 52, 3, 5, 0, 0, Math.PI * 2);
  ctx.ellipse(126, 52, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair under-layer then eyes then fringe
  drawHairBack(ctx, style, team, facing);
  drawFace(ctx, facing);
  drawHairFront(ctx, style, team, facing);

  // Accessory (tablet / folder)
  ctx.fillStyle = shade(team, 0.85);
  roundRect(ctx, 128, 118, 22, 16, 3);
  ctx.fill();
  ctx.fillStyle = '#eef3f8';
  roundRect(ctx, 131, 121, 16, 10, 2);
  ctx.fill();
  ctx.fillStyle = shade(team, 0.6);
  ctx.fillRect(133, 123, 10, 1.5);
  ctx.fillRect(133, 126, 8, 1.5);

  // Headphones on some bots
  if (index % 3 === 1) {
    ctx.fillStyle = '#37474f';
    ctx.beginPath();
    ctx.arc(66, 48, 9, 0, Math.PI * 2);
    ctx.arc(126, 48, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#455a64';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(96, 36, 32, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }

  return c;
}

function drawOutfit(ctx, outfit, team, skin) {
  if (outfit === 'hoodie') {
    ctx.fillStyle = shade(team, 0.7);
    roundRect(ctx, 66, 82, 60, 52, 14);
    ctx.fill();
    ctx.fillStyle = shade(team, 0.95);
    roundRect(ctx, 78, 88, 36, 40, 8);
    ctx.fill();
    // Hood
    ctx.fillStyle = shade(team, 0.6);
    ctx.beginPath();
    ctx.ellipse(96, 84, 28, 10, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Drawstring
    ctx.strokeStyle = shade(team, 1.1);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(90, 90);
    ctx.lineTo(88, 110);
    ctx.moveTo(102, 90);
    ctx.lineTo(104, 110);
    ctx.stroke();
  } else if (outfit === 'blazer') {
    ctx.fillStyle = '#eceff1';
    roundRect(ctx, 72, 84, 48, 48, 6);
    ctx.fill();
    ctx.fillStyle = shade(team, 0.5);
    roundRect(ctx, 64, 82, 64, 52, 8);
    ctx.fill();
    // Lapels
    ctx.fillStyle = shade(team, 0.4);
    ctx.beginPath();
    ctx.moveTo(96, 84);
    ctx.lineTo(78, 110);
    ctx.lineTo(96, 118);
    ctx.lineTo(114, 110);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    roundRect(ctx, 88, 88, 16, 28, 2);
    ctx.fill();
    // Accent pocket square
    ctx.fillStyle = team;
    ctx.fillRect(118, 100, 8, 6);
  } else if (outfit === 'sweater') {
    ctx.fillStyle = shade(team, 0.8);
    roundRect(ctx, 66, 82, 60, 52, 12);
    ctx.fill();
    ctx.fillStyle = shade(team, 0.95);
    // Collar band
    roundRect(ctx, 80, 82, 32, 10, 4);
    ctx.fill();
    ctx.strokeStyle = shade(team, 0.55);
    ctx.lineWidth = 2;
    for (let y = 100; y < 128; y += 6) {
      ctx.beginPath();
      ctx.moveTo(74, y);
      ctx.lineTo(118, y);
      ctx.stroke();
    }
  } else {
    // button shirt
    ctx.fillStyle = '#f5f7fa';
    roundRect(ctx, 70, 84, 52, 50, 6);
    ctx.fill();
    ctx.fillStyle = team;
    ctx.fillRect(70, 84, 52, 6);
    ctx.fillStyle = shade(team, 0.55);
    // Tie / accent
    ctx.beginPath();
    ctx.moveTo(96, 90);
    ctx.lineTo(90, 128);
    ctx.lineTo(102, 128);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#cfd8dc';
    for (const by of [100, 112, 124]) {
      ctx.beginPath();
      ctx.arc(96, by, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawFace(ctx, facing) {
  const ox = facing * 1.5;
  // Eyes white
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(82 + ox, 50, 9, 12, 0, 0, Math.PI * 2);
  ctx.ellipse(110 + ox, 50, 9, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Iris
  ctx.fillStyle = '#2c3a4a';
  ctx.beginPath();
  ctx.ellipse(83 + ox, 52, 5.5, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(111 + ox, 52, 5.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = '#0d1116';
  ctx.beginPath();
  ctx.ellipse(83.5 + ox, 53, 2.8, 4.5, 0, 0, Math.PI * 2);
  ctx.ellipse(111.5 + ox, 53, 2.8, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(80.5 + ox, 47, 2.6, 0, Math.PI * 2);
  ctx.arc(108.5 + ox, 47, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(85 + ox, 55, 1.2, 0, Math.PI * 2);
  ctx.arc(113 + ox, 55, 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Upper lash line
  ctx.strokeStyle = '#1a1a22';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(82 + ox, 50, 9, 12, 0, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(110 + ox, 50, 9, 12, 0, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  // Brows
  ctx.strokeStyle = 'rgba(40,40,50,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(72 + ox, 36);
  ctx.quadraticCurveTo(82 + ox, 32, 92 + ox, 36);
  ctx.moveTo(100 + ox, 36);
  ctx.quadraticCurveTo(110 + ox, 32, 120 + ox, 36);
  ctx.stroke();
  // Blush
  ctx.fillStyle = 'rgba(240,120,130,0.32)';
  ctx.beginPath();
  ctx.ellipse(70, 64, 8, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(122, 64, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nose hint
  ctx.strokeStyle = 'rgba(180,120,100,0.45)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(96, 58);
  ctx.lineTo(94, 64);
  ctx.stroke();
  // Mouth
  ctx.strokeStyle = '#c47a72';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(96, 70, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();
}

function drawHairBack(ctx, style, team, facing) {
  ctx.fillStyle = team;
  ctx.beginPath();
  if (style === 'bob') {
    ctx.ellipse(96, 40, 36, 30, 0, Math.PI * 0.95, Math.PI * 2.05);
    ctx.ellipse(96, 58, 34, 26, 0, 0, Math.PI);
  } else if (style === 'short') {
    ctx.ellipse(96, 36, 34, 26, 0, Math.PI * 0.9, Math.PI * 2.1);
  } else if (style === 'side') {
    ctx.ellipse(96, 38, 34, 28, 0, Math.PI, Math.PI * 2);
    ctx.ellipse(96 + 20 * facing, 70, 12, 30, 0.25 * facing, 0, Math.PI * 2);
  } else if (style === 'ponytail') {
    ctx.ellipse(96, 36, 32, 26, 0, Math.PI, Math.PI * 2);
    ctx.ellipse(96 - 24 * facing, 78, 11, 28, -0.35 * facing, 0, Math.PI * 2);
  } else if (style === 'messy') {
    ctx.ellipse(96, 34, 35, 28, 0, Math.PI * 0.85, Math.PI * 2.15);
    ctx.ellipse(72, 28, 12, 14, -0.5, 0, Math.PI * 2);
    ctx.ellipse(120, 26, 11, 13, 0.4, 0, Math.PI * 2);
    ctx.ellipse(96, 18, 10, 10, 0, 0, Math.PI * 2);
  } else {
    ctx.ellipse(96, 40, 35, 28, 0, Math.PI, Math.PI * 2);
    ctx.ellipse(72, 80, 16, 40, 0, 0, Math.PI * 2);
    ctx.ellipse(120, 80, 16, 40, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  // Depth shade
  ctx.fillStyle = shade(team, 0.7);
  ctx.beginPath();
  ctx.ellipse(96, 48, 26, 10, 0, 0, Math.PI);
  ctx.fill();
}

function drawHairFront(ctx, style, team, facing) {
  ctx.fillStyle = shade(team, 1.08);
  ctx.beginPath();
  if (style === 'side' || style === 'ponytail') {
    ctx.moveTo(66, 28);
    ctx.quadraticCurveTo(78, 58, 88, 36);
    ctx.quadraticCurveTo(96, 60, 108, 34);
    ctx.quadraticCurveTo(118, 52, 128, 26);
  } else if (style === 'messy') {
    ctx.moveTo(64, 30);
    ctx.quadraticCurveTo(74, 55, 86, 32);
    ctx.quadraticCurveTo(96, 58, 106, 30);
    ctx.quadraticCurveTo(116, 50, 130, 24);
    ctx.lineTo(124, 12);
    ctx.quadraticCurveTo(96, 4, 68, 14);
  } else {
    ctx.moveTo(64, 30);
    ctx.quadraticCurveTo(76, 58, 88, 34);
    ctx.quadraticCurveTo(96, 56, 104, 34);
    ctx.quadraticCurveTo(116, 58, 128, 28);
  }
  ctx.lineTo(124, 14);
  ctx.quadraticCurveTo(96, 6, 68, 14);
  ctx.closePath();
  ctx.fill();

  // Side bang accent
  if (facing > 0) {
    ctx.fillStyle = shade(team, 0.95);
    ctx.beginPath();
    ctx.moveTo(64, 36);
    ctx.quadraticCurveTo(58, 60, 70, 68);
    ctx.quadraticCurveTo(72, 48, 68, 34);
    ctx.fill();
  }
}

export function createAvatarBadge(member, index, size = 40) {
  const full = createAvatarSprite(member, index, 128);
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(full, 28, 2, 72, 72, 0, 0, size, size);
  return c;
}
