/**
 * Soft plain sky gradient for windows — no city / exterior mural.
 */
export function createSoftSkyTexture(THREE, width = 1024, height = 512) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#c8d9ea');
  sky.addColorStop(0.4, '#dde8f2');
  sky.addColorStop(0.75, '#eef3f7');
  sky.addColorStop(1, '#f7f5f0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Soft sun bloom only — no buildings, mountains, or city plates
  const sun = ctx.createRadialGradient(
    width * 0.72,
    height * 0.28,
    8,
    width * 0.72,
    height * 0.28,
    180,
  );
  sun.addColorStop(0, 'rgba(255,244,210,0.7)');
  sun.addColorStop(0.4, 'rgba(255,220,170,0.22)');
  sun.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, height);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** @deprecated use createSoftSkyTexture — kept for import compatibility */
export function createSkylineTexture(THREE, width = 1024, height = 512) {
  return createSoftSkyTexture(THREE, width, height);
}
