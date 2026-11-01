/**
 * Soft cool void sky for windows — no city / exterior mural.
 */
export function createSoftSkyTexture(THREE, width = 1024, height = 512) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#0a1628');
  sky.addColorStop(0.35, '#152840');
  sky.addColorStop(0.7, '#1e3a55');
  sky.addColorStop(1, '#2a4558');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Soft cyan bloom — no buildings
  const sun = ctx.createRadialGradient(
    width * 0.7,
    height * 0.3,
    8,
    width * 0.7,
    height * 0.3,
    200,
  );
  sun.addColorStop(0, 'rgba(120,220,255,0.55)');
  sun.addColorStop(0.35, 'rgba(80,160,220,0.18)');
  sun.addColorStop(1, 'rgba(40,80,120,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, height);

  // Sparse star flecks
  ctx.fillStyle = 'rgba(200,230,255,0.55)';
  for (let i = 0; i < 60; i++) {
    const x = (i * 149) % width;
    const y = (i * 97) % (height * 0.55);
    const r = (i % 3 === 0) ? 1.5 : 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** @deprecated use createSoftSkyTexture — kept for import compatibility */
export function createSkylineTexture(THREE, width = 1024, height = 512) {
  return createSoftSkyTexture(THREE, width, height);
}
