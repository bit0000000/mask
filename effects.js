function spawnBurst(r, c, color, count) {
  if (S.settings.reducedMotion) return;
  const cx = offX + (c + 0.5) * CELL;
  const cy = offY + (r + 0.5) * CELL;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const sp = 1.5 + Math.random() * 2.5;
    S.particles.push({
      x: cx, y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      color,
      size: 2 + Math.random() * 2
    });
  }
}

function updateParticles(dt) {
  const decay = S.settings.reducedMotion ? 0.06 : 0.035;
  for (let i = S.particles.length - 1; i >= 0; i--) {
    const p = S.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= decay;
    if (p.life <= 0) S.particles.splice(i, 1);
  }
}

function shakeScreen(amount) {
  if (S.settings.reducedMotion) return;
  S.shake = Math.max(S.shake, amount);
}

function flashScreen(color, strength) {
  if (S.settings.reducedMotion) return;
  S.flash = strength || 0.35;
  S.flashColor = color || '#ffffff';
}

function addTrail(r, c) {
  if (!S.settings.trail || S.settings.reducedMotion) return;
  S.trail.push({ r, c, life: 1 });
  if (S.trail.length > 30) S.trail.shift();
}

function updateTrail(dt) {
  for (let i = S.trail.length - 1; i >= 0; i--) {
    S.trail[i].life -= dt * 1.8;
    if (S.trail[i].life <= 0) S.trail.splice(i, 1);
  }
}

function popText(text, r, c, color) {
  if (S.settings.reducedMotion) return;
  S.popups.push({ text, r, c, life: 1, color: color || cv('--accent') });
}

function updatePopups(dt) {
  for (let i = S.popups.length - 1; i >= 0; i--) {
    S.popups[i].life -= dt * 1.1;
    if (S.popups[i].life <= 0) S.popups.splice(i, 1);
  }
}

function vibrate(ms) {
  if (!S.settings.haptics) return;
  if (navigator.vibrate) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}
