/**
 * Window sky — no city / exterior mural.
 * `band` is day (sunny), evening, or night (LED). Default night matches the old void.
 * @param {'day'|'evening'|'night'} [band]
 */
export function createSoftSkyTexture(THREE, width = 1024, height = 512, band = 'night') {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  if (band === 'day') {
    sky.addColorStop(0, '#4aa6ef');
    sky.addColorStop(0.42, '#8fd0ff');
    sky.addColorStop(0.72, '#e7f6ff');
    sky.addColorStop(1, '#fff3d4');
  } else if (band === 'evening') {
    sky.addColorStop(0, '#2a1848');
    sky.addColorStop(0.4, '#c45a3a');
    sky.addColorStop(0.72, '#ffb07a');
    sky.addColorStop(1, '#ffd9a8');
  } else {
    sky.addColorStop(0, '#050910');
    sky.addColorStop(0.4, '#0c1828');
    sky.addColorStop(0.75, '#122033');
    sky.addColorStop(1, '#1a2c3c');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if (band === 'day') {
    const sun = ctx.createRadialGradient(
      width * 0.72,
      height * 0.28,
      8,
      width * 0.72,
      height * 0.28,
      280,
    );
    sun.addColorStop(0, 'rgba(255,248,220,0.95)');
    sun.addColorStop(0.25, 'rgba(255,214,120,0.55)');
    sun.addColorStop(0.6, 'rgba(255,190,90,0.16)');
    sun.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, width, height);
  } else if (band === 'evening') {
    const sun = ctx.createRadialGradient(
      width * 0.78,
      height * 0.62,
      6,
      width * 0.78,
      height * 0.62,
      220,
    );
    sun.addColorStop(0, 'rgba(255,220,170,0.9)');
    sun.addColorStop(0.4, 'rgba(255,120,60,0.35)');
    sun.addColorStop(1, 'rgba(255,80,40,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, width, height);
  } else {
    const bloom = ctx.createRadialGradient(
      width * 0.7,
      height * 0.3,
      8,
      width * 0.7,
      height * 0.3,
      180,
    );
    bloom.addColorStop(0, 'rgba(80,140,220,0.28)');
    bloom.addColorStop(1, 'rgba(40,80,120,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(210,230,255,0.7)';
    for (let i = 0; i < 70; i++) {
      const x = (i * 149) % width;
      const y = (i * 97) % (height * 0.62);
      const r = i % 3 === 0 ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
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
