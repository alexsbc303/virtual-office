/**
 * Polished 2D anime office scene (Canvas2D).
 * Layout mirrors the anime reference: floor-to-ceiling windows + city,
 * open wood desks, glass meeting room, kitchenette, hanging plants.
 */

import { LEAD_ID } from './team.js';

/** Logical scene size (drawn then scaled to canvas). */
export const SCENE_W = 1600;
export const SCENE_H = 900;

/**
 * Desk / seat anchors in scene pixels (feet position).
 * Open plan two rows + lead in glass room + one near kitchen.
 */
export function deskLayout() {
  const desks = new Map();
  // Lead — glass meeting / directorate room (mid-right)
  desks.set(LEAD_ID, { x: 1040, y: 430, zone: 'lead', facing: -1 });

  const openPlan = [
    // Front row (closer to viewer) — seated at wood desks
    { id: '26fffc1c-3c69-4346-8a68-199db47277fd', x: 280, y: 620 },
    { id: '4f070b62-ac92-4824-9953-886cda5433d1', x: 430, y: 640 },
    { id: '28c84d63-5b73-4b78-aebc-3a2e02376fc2', x: 580, y: 630 },
    { id: '2fb3b7e8-b556-45ea-8b10-1ced7f05c0b4', x: 730, y: 645 },
    { id: '9f0fa493-9994-409c-b398-974b67de306e', x: 880, y: 620 },
    // Back row (near windows)
    { id: 'aecd27e2-8d49-4c33-962c-cdfa1860fd26', x: 260, y: 380 },
    { id: 'b7c9b07d-4a12-49af-bbdf-7fa19bdc96b2', x: 410, y: 400 },
    { id: '5f8f09c0-fe3d-40a5-87c1-2fcc440bb9c3', x: 560, y: 390 },
    { id: 'c7f037b0-0082-4290-a543-00f203e4c150', x: 710, y: 405 },
    { id: '764c93f4-9330-4daa-9f86-481be3b19e60', x: 860, y: 385 },
    // Near kitchenette / standing zone
    { id: '6a0dc819-57c2-4507-ae25-f3b3122c3f46', x: 1180, y: 580 },
  ];
  for (const d of openPlan) {
    desks.set(d.id, { x: d.x, y: d.y, zone: 'open', facing: 1 });
  }
  return desks;
}

export const LEAD_HANDOFF = { x: 980, y: 500 };

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

function drawSkyCity(ctx) {
  // Soft sky gradient through windows
  const sky = ctx.createLinearGradient(0, 80, 0, 520);
  sky.addColorStop(0, '#8ec5e8');
  sky.addColorStop(0.45, '#b8daf2');
  sky.addColorStop(1, '#dceaf5');
  ctx.fillStyle = sky;
  ctx.fillRect(40, 90, 920, 430);

  // Distant buildings
  const buildings = [
    [60, 280, 70, 240],
    [140, 220, 90, 300],
    [240, 300, 60, 220],
    [310, 180, 110, 340],
    [430, 250, 80, 270],
    [520, 200, 95, 320],
    [625, 270, 70, 250],
    [710, 160, 120, 360],
    [840, 230, 85, 290],
  ];
  for (let i = 0; i < buildings.length; i++) {
    const [x, y, w, h] = buildings[i];
    ctx.fillStyle = i % 3 === 0 ? '#9aafbe' : i % 3 === 1 ? '#8799a8' : '#a8b8c4';
    ctx.fillRect(x, y, w, h);
    // Windows grid
    ctx.fillStyle = 'rgba(220,235,245,0.55)';
    for (let wy = y + 12; wy < y + h - 10; wy += 18) {
      for (let wx = x + 8; wx < x + w - 8; wx += 14) {
        ctx.fillRect(wx, wy, 7, 10);
      }
    }
  }
  // Soft haze
  ctx.fillStyle = 'rgba(200,220,235,0.25)';
  ctx.fillRect(40, 400, 920, 120);
}

function drawWindows(ctx) {
  // Wall around windows
  ctx.fillStyle = '#f2eee8';
  ctx.fillRect(0, 60, 980, 40);
  ctx.fillRect(0, 520, 980, 30);

  // Frame mullions
  ctx.strokeStyle = '#3d4650';
  ctx.lineWidth = 6;
  ctx.strokeRect(36, 86, 928, 438);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(346, 86);
  ctx.lineTo(346, 524);
  ctx.moveTo(656, 86);
  ctx.lineTo(656, 524);
  ctx.moveTo(36, 300);
  ctx.lineTo(964, 300);
  ctx.stroke();

  // Glass sheen
  const sheen = ctx.createLinearGradient(60, 100, 400, 500);
  sheen.addColorStop(0, 'rgba(255,255,255,0.18)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
  sheen.addColorStop(1, 'rgba(180,210,230,0.12)');
  ctx.fillStyle = sheen;
  ctx.fillRect(40, 90, 920, 430);
}

function drawFloor(ctx) {
  // Main floor — warm light wood wash
  const floor = ctx.createLinearGradient(0, 520, 0, SCENE_H);
  floor.addColorStop(0, '#e8e0d4');
  floor.addColorStop(1, '#d4c9b8');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 520, SCENE_W, SCENE_H - 520);

  // Perspective floor boards
  ctx.strokeStyle = 'rgba(160,140,110,0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const y = 530 + i * 22;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCENE_W, y + i * 2);
    ctx.stroke();
  }

  // Soft rug under open plan
  ctx.fillStyle = 'rgba(110,125,140,0.28)';
  ctx.beginPath();
  ctx.ellipse(560, 620, 420, 140, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCeiling(ctx) {
  // Ceiling band
  ctx.fillStyle = '#e4e2de';
  ctx.fillRect(0, 0, SCENE_W, 90);

  // Industrial ducts
  ctx.fillStyle = '#c8ccd0';
  roundRect(ctx, 80, 18, 520, 36, 8);
  ctx.fill();
  roundRect(ctx, 640, 22, 400, 30, 8);
  ctx.fill();
  roundRect(ctx, 1080, 16, 420, 34, 8);
  ctx.fill();
  // Duct seams
  ctx.strokeStyle = 'rgba(90,100,110,0.25)';
  ctx.lineWidth = 1;
  for (const [x, w] of [
    [80, 520],
    [640, 400],
    [1080, 420],
  ]) {
    for (let i = 40; i < w; i += 50) {
      ctx.beginPath();
      ctx.moveTo(x + i, 18);
      ctx.lineTo(x + i, 52);
      ctx.stroke();
    }
  }

  // Track lights
  ctx.fillStyle = '#2a3038';
  ctx.fillRect(120, 55, 700, 4);
  ctx.fillRect(900, 52, 500, 4);
  for (let x = 160; x < 820; x += 90) {
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.ellipse(x, 68, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.15)';
    ctx.beginPath();
    ctx.moveTo(x - 20, 72);
    ctx.lineTo(x + 20, 72);
    ctx.lineTo(x + 50, 200);
    ctx.lineTo(x - 50, 200);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHangingPlant(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Rope
  ctx.strokeStyle = '#8d6e4c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(0, 0);
  ctx.stroke();
  // Basket
  ctx.fillStyle = '#c4a574';
  roundRect(ctx, -18, 0, 36, 22, 4);
  ctx.fill();
  ctx.fillStyle = '#a88455';
  roundRect(ctx, -16, 4, 32, 14, 3);
  ctx.fill();
  // Leaves
  const leaves = [
    [-12, 8, 14],
    [0, -2, 16],
    [12, 6, 13],
    [-6, 18, 12],
    [8, 16, 11],
  ];
  for (const [lx, ly, r] of leaves) {
    ctx.fillStyle = ly < 10 ? '#4caf67' : '#3d9a55';
    ctx.beginPath();
    ctx.ellipse(lx, ly, r * 0.55, r, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDesk(ctx, x, y, w = 130, depth = false) {
  // Desktop — light wood
  ctx.fillStyle = '#d8c4a8';
  roundRect(ctx, x - w / 2, y - 8, w, 18, 4);
  ctx.fill();
  ctx.fillStyle = '#c9b496';
  roundRect(ctx, x - w / 2, y + 6, w, 6, 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#2c333a';
  ctx.fillRect(x - w / 2 + 8, y + 12, 6, 36);
  ctx.fillRect(x + w / 2 - 14, y + 12, 6, 36);

  // Dual monitors
  const mx = x - 18;
  ctx.fillStyle = '#1a2330';
  roundRect(ctx, mx - 28, y - 52, 36, 28, 3);
  ctx.fill();
  roundRect(ctx, mx + 14, y - 50, 34, 26, 3);
  ctx.fill();
  // Screens glow
  ctx.fillStyle = depth ? '#3a5a78' : '#4a7a9a';
  roundRect(ctx, mx - 25, y - 49, 30, 22, 2);
  ctx.fill();
  roundRect(ctx, mx + 17, y - 47, 28, 20, 2);
  ctx.fill();
  // Code-ish lines
  ctx.fillStyle = 'rgba(180,220,255,0.35)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(mx - 22, y - 44 + i * 6, 18 + (i % 2) * 6, 2);
    ctx.fillRect(mx + 20, y - 42 + i * 6, 16 + ((i + 1) % 2) * 5, 2);
  }
  // Stands
  ctx.fillStyle = '#37474f';
  ctx.fillRect(mx - 12, y - 24, 4, 16);
  ctx.fillRect(mx + 28, y - 24, 4, 14);
  ctx.fillRect(mx - 20, y - 10, 20, 4);
  ctx.fillRect(mx + 20, y - 10, 20, 4);

  // Keyboard + mug
  ctx.fillStyle = '#eceff1';
  roundRect(ctx, x - 20, y - 2, 36, 8, 2);
  ctx.fill();
  ctx.fillStyle = '#f5f0ea';
  ctx.beginPath();
  ctx.arc(x + 40, y - 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6d4c41';
  ctx.beginPath();
  ctx.arc(x + 40, y - 5, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawChair(ctx, x, y) {
  ctx.fillStyle = '#2f3842';
  roundRect(ctx, x - 16, y - 4, 32, 14, 4);
  ctx.fill();
  ctx.fillStyle = '#3a4552';
  roundRect(ctx, x - 14, y - 28, 28, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#2a323c';
  ctx.fillRect(x - 3, y + 8, 6, 18);
  ctx.fillRect(x - 14, y + 22, 28, 4);
}

function drawBookshelf(ctx, x, y) {
  ctx.fillStyle = '#c9b496';
  roundRect(ctx, x, y, 70, 110, 3);
  ctx.fill();
  ctx.fillStyle = '#b08968';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 4, y + 28 + i * 28, 62, 4);
  }
  const colors = ['#5c6bc0', '#ef5350', '#66bb6a', '#ffa726', '#42a5f5', '#8d6e63'];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(x + 8 + (i % 3) * 18, y + 8 + Math.floor(i / 3) * 28, 14, 22);
  }
  // Plant on top
  ctx.fillStyle = '#b08968';
  ctx.fillRect(x + 24, y - 14, 22, 14);
  ctx.fillStyle = '#4caf67';
  ctx.beginPath();
  ctx.ellipse(x + 35, y - 22, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawMeetingRoom(ctx) {
  // Glass enclosure
  ctx.fillStyle = 'rgba(197,224,240,0.22)';
  roundRect(ctx, 920, 200, 260, 280, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(61,70,80,0.55)';
  ctx.lineWidth = 3;
  roundRect(ctx, 920, 200, 260, 280, 6);
  ctx.stroke();
  // Door frame
  ctx.strokeStyle = '#3d4650';
  ctx.lineWidth = 4;
  ctx.strokeRect(920, 360, 48, 120);

  // Meeting table
  ctx.fillStyle = '#c9b496';
  roundRect(ctx, 970, 320, 150, 70, 8);
  ctx.fill();
  ctx.fillStyle = '#b89f7e';
  roundRect(ctx, 975, 380, 140, 8, 2);
  ctx.fill();

  // Wall plaque
  ctx.fillStyle = '#fffdf9';
  roundRect(ctx, 960, 220, 180, 42, 4);
  ctx.fill();
  ctx.strokeStyle = '#b8c0c8';
  ctx.strokeRect(960, 220, 180, 42);
  ctx.fillStyle = '#24303c';
  ctx.font = '600 14px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Directorate Office', 1050, 238);
  ctx.fillStyle = '#667482';
  ctx.font = '500 12px "Noto Sans TC", sans-serif';
  ctx.fillText('總管室', 1050, 254);

  // Soft interior light
  ctx.fillStyle = 'rgba(255,248,230,0.12)';
  roundRect(ctx, 930, 210, 240, 260, 4);
  ctx.fill();
}

function drawKitchenette(ctx) {
  // Counter
  ctx.fillStyle = '#c4a882';
  roundRect(ctx, 1220, 280, 240, 90, 4);
  ctx.fill();
  ctx.fillStyle = '#f2efe8';
  roundRect(ctx, 1224, 284, 232, 28, 3);
  ctx.fill();
  // Cabinets
  ctx.fillStyle = '#b8956e';
  roundRect(ctx, 1220, 370, 240, 100, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,60,40,0.25)';
  ctx.strokeRect(1220, 370, 120, 100);
  ctx.strokeRect(1340, 370, 120, 100);

  // Coffee machine
  ctx.fillStyle = '#37474f';
  roundRect(ctx, 1240, 300, 40, 50, 4);
  ctx.fill();
  ctx.fillStyle = '#263238';
  roundRect(ctx, 1246, 306, 28, 16, 2);
  ctx.fill();
  ctx.fillStyle = '#81c784';
  ctx.beginPath();
  ctx.arc(1268, 314, 3, 0, Math.PI * 2);
  ctx.fill();

  // Water cooler
  ctx.fillStyle = '#90caf9';
  roundRect(ctx, 1300, 295, 28, 55, 6);
  ctx.fill();
  ctx.fillStyle = '#e3f2fd';
  roundRect(ctx, 1304, 300, 20, 30, 4);
  ctx.fill();

  // Notice board with sticky notes
  ctx.fillStyle = '#eceff1';
  roundRect(ctx, 1360, 250, 90, 110, 3);
  ctx.fill();
  ctx.strokeStyle = '#90a4ae';
  ctx.strokeRect(1360, 250, 90, 110);
  const notes = ['#fff59d', '#ffccbc', '#c8e6c9', '#bbdefb', '#f8bbd0'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = notes[i];
    const nx = 1370 + (i % 2) * 36;
    const ny = 262 + Math.floor(i / 2) * 32;
    roundRect(ctx, nx, ny, 30, 26, 2);
    ctx.fill();
  }

  // Label
  ctx.fillStyle = '#fffdf9';
  roundRect(ctx, 1260, 480, 160, 36, 4);
  ctx.fill();
  ctx.fillStyle = '#24303c';
  ctx.font = '600 12px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Pantry · 茶水間', 1340, 502);
}

function drawPottedPlant(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#b08968';
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-10, 28);
  ctx.lineTo(10, 28);
  ctx.lineTo(14, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4caf67';
  ctx.beginPath();
  ctx.ellipse(0, -8, 18, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#66bb6a';
  ctx.beginPath();
  ctx.ellipse(-10, -4, 10, 12, -0.4, 0, Math.PI * 2);
  ctx.ellipse(10, -6, 11, 13, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWallLabels(ctx) {
  // Open office plaque near windows
  ctx.fillStyle = '#fffdf9';
  roundRect(ctx, 40, 540, 200, 40, 4);
  ctx.fill();
  ctx.strokeStyle = '#b8c0c8';
  ctx.strokeRect(40, 540, 200, 40);
  ctx.fillStyle = '#24303c';
  ctx.font = '600 13px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Open Office · 開放辦公區', 140, 564);
}

/**
 * Paint the static office background into an offscreen canvas.
 */
export function buildOfficeBackground() {
  const c = document.createElement('canvas');
  c.width = SCENE_W;
  c.height = SCENE_H;
  const ctx = c.getContext('2d');

  // Far wall
  ctx.fillStyle = '#f4f1eb';
  ctx.fillRect(0, 0, SCENE_W, SCENE_H);

  drawSkyCity(ctx);
  drawFloor(ctx);
  drawWindows(ctx);
  drawCeiling(ctx);

  // Right wall tone
  ctx.fillStyle = '#efeae3';
  ctx.fillRect(1180, 90, 420, 430);

  drawMeetingRoom(ctx);
  drawKitchenette(ctx);
  drawWallLabels(ctx);

  // Bookshelves near windows
  drawBookshelf(ctx, 50, 380);
  drawBookshelf(ctx, 900, 360);

  // Desk row (back)
  const backDesks = [260, 410, 560, 710, 860];
  for (const x of backDesks) {
    drawDesk(ctx, x, 360, 120, true);
    drawChair(ctx, x, 390);
  }
  // Desk row (front)
  const frontDesks = [280, 430, 580, 730, 880];
  for (const x of frontDesks) {
    drawDesk(ctx, x, 600, 130, false);
    drawChair(ctx, x, 635);
  }

  // Standing desk near kitchen
  drawDesk(ctx, 1180, 560, 110, false);

  // Hanging plants
  const plants = [
    [200, 100],
    [380, 95],
    [560, 105],
    [740, 98],
    [920, 102],
    [1100, 108],
    [1280, 100],
    [1480, 95],
  ];
  for (const [px, py] of plants) drawHangingPlant(ctx, px, py, 1 + (px % 40) / 100);

  // Floor plants
  drawPottedPlant(ctx, 160, 700, 1.1);
  drawPottedPlant(ctx, 980, 680, 0.95);
  drawPottedPlant(ctx, 1500, 620, 1.05);
  drawPottedPlant(ctx, 100, 450, 0.8);

  // Soft window light cast
  const light = ctx.createLinearGradient(40, 100, 700, 800);
  light.addColorStop(0, 'rgba(255,250,235,0.18)');
  light.addColorStop(1, 'rgba(255,250,235,0)');
  ctx.fillStyle = light;
  ctx.fillRect(40, 90, 900, 700);

  // Brand watermark (AS Virtual Office only)
  ctx.fillStyle = 'rgba(26,35,126,0.08)';
  ctx.font = '600 18px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('AS Virtual Office', SCENE_W - 24, SCENE_H - 18);

  return c;
}

/** No-op kept for API parity with old Three.js anims. */
export function updateOfficeAnims() {}
