/**
 * Procedural anime / Shinkai-like city skyline canvas texture for windows.
 */
export function createSkylineTexture(THREE, width = 2048, height = 1024) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');

  // Soft sky
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#7eb6e8');
  sky.addColorStop(0.35, '#a9d0f0');
  sky.addColorStop(0.7, '#d5e8f6');
  sky.addColorStop(1, '#eef4f8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Soft sun bloom
  const sun = ctx.createRadialGradient(width * 0.18, height * 0.28, 10, width * 0.18, height * 0.28, 220);
  sun.addColorStop(0, 'rgba(255,244,210,0.95)');
  sun.addColorStop(0.35, 'rgba(255,220,160,0.35)');
  sun.addColorStop(1, 'rgba(255,220,160,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, height);

  // Distant haze band
  const haze = ctx.createLinearGradient(0, height * 0.55, 0, height);
  haze.addColorStop(0, 'rgba(200,220,235,0)');
  haze.addColorStop(1, 'rgba(190,210,225,0.55)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);

  // Buildings — layered silhouettes
  drawBuildings(ctx, width, height, 0.42, 0.95, ['#8fa4b5', '#7d93a6', '#9aafbf'], 0.55);
  drawBuildings(ctx, width, height, 0.52, 1.0, ['#6f8496', '#5e7386', '#7a8fa0'], 0.85);

  // Near trees / greenery silhouette along bottom of exterior
  ctx.fillStyle = '#3d6b4f';
  for (let i = 0; i < 18; i++) {
    const x = (i / 18) * width + (i % 3) * 12;
    const h = 40 + (i % 5) * 18;
    ctx.beginPath();
    ctx.ellipse(x, height - 10, 28 + (i % 4) * 8, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2f5a40';
  ctx.fillRect(0, height - 28, width, 28);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function drawBuildings(ctx, width, height, baseY, dens, colors, alpha) {
  const ground = height * 0.88;
  let x = -40;
  let i = 0;
  while (x < width + 80) {
    const w = 50 + ((i * 37) % 90);
    const h = height * (0.18 + ((i * 53) % 40) / 100) * (baseY + 0.35);
    const y = ground - h;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(x, y, w, h);

    // Window lights
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = '#dceaf5';
    for (let wy = y + 10; wy < ground - 8; wy += 14) {
      for (let wx = x + 6; wx < x + w - 6; wx += 11) {
        if (((wx + wy + i) % 5) !== 0) ctx.fillRect(wx, wy, 5, 8);
      }
    }
    ctx.globalAlpha = 1;
    x += w + 8 + (i % 3) * 6;
    i += 1;
  }
}
