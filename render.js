function drawSprite(spr, cx, cy, size, color) {
  const ph = spr.length, pw = spr[0].length;
  const px = size / pw;
  const x0 = cx - size / 2, y0 = cy - size / 2;
  ctx.fillStyle = color;
  for (let r = 0; r < ph; r++)
    for (let c = 0; c < pw; c++)
      if (spr[r][c] === '#') ctx.fillRect(x0 + c * px, y0 + r * px, px + 0.5, px + 0.5);
}

function drawWallCell(x, y, wallCol, wallHi, wallLo) {
  ctx.fillStyle = wallCol;
  ctx.fillRect(x, y, CELL, CELL);

  const cols = 4, rows = 4;
  const step = CELL / cols;
  const dot = Math.max(1.5, step * 0.32);

  ctx.fillStyle = wallHi;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if ((i + j) % 2 === 0) {
        const cx = x + i * step + step / 2;
        const cy = y + j * step + step / 2;
        ctx.fillRect(cx - dot / 2, cy - dot / 2, dot, dot);
      }
    }
  }

  ctx.fillStyle = wallLo;
  ctx.fillRect(x, y + CELL - 1.5, CELL, 1.5);
}

function draw() {
  const bg = cv('--game-bg'), wall = cv('--wall'), wallHi = cv('--wall-hi'),
        wallLo = cv('--wall-lo'), gridC = cv('--grid'), accent = cv('--accent'),
        danger = cv('--danger'), coin = cv('--coin'), bat = cv('--bat'),
        puffer = cv('--puffer'), dart = cv('--dart'), saw = cv('--saw'),
        snake = cv('--snake');

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  if (S.shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
  }
  if (S.transition > 0 && S.transitionText) {
    ctx.globalAlpha = Math.min(1, S.transition);
  }

  if (!S.grid.length) { ctx.restore(); return; }

  const camY = S.camY;
  const WR = S.worldRows;

  const firstRow = Math.max(0, Math.floor(camY / CELL) - 1);
  const lastRow = Math.min(WR - 1, Math.ceil((camY + H) / CELL) + 1);

  for (let r = firstRow; r <= lastRow; r++) {
    const yBase = offY + r * CELL - camY;
    for (let c = 0; c < COLS; c++) {
      const x = offX + c * CELL;
      if (S.grid[r][c] === 1) {
        drawWallCell(x, yBase, wall, wallHi, wallLo);
      } else {
        ctx.strokeStyle = gridC;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, yBase + 0.5, CELL - 1, CELL - 1);
      }
    }
  }

  drawLava();

  for (const t of S.trail) {
    const cy = offY + (t.r + 0.5) * CELL - camY;
    if (cy < -CELL || cy > H + CELL) continue;
    const cx = offX + (t.c + 0.5) * CELL;
    ctx.globalAlpha = t.life * 0.35;
    ctx.fillStyle = maskColor(S.mask);
    ctx.beginPath();
    ctx.arc(cx, cy, CELL * 0.22 * t.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = S.transition > 0 ? Math.min(1, S.transition) : 1;

  const pulse = 0.85 + Math.sin(S.t * 4) * 0.15;
  for (const key of S.dots) {
    const [r, c] = key.split(',').map(Number);
    const cy = offY + (r + 0.5) * CELL - camY;
    if (cy < -CELL || cy > H + CELL) continue;
    const cx = offX + (c + 0.5) * CELL;
    const s = CELL * 0.18 * pulse;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 0.5);
    g.addColorStop(0, hexA(accent, 0.35));
    g.addColorStop(1, hexA(accent, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
  }

  for (const key of S.coinsSet) {
    const [r, c] = key.split(',').map(Number);
    const cy = offY + (r + 0.5) * CELL - camY;
    if (cy < -CELL || cy > H + CELL) continue;
    const cx = offX + (c + 0.5) * CELL;
    const s = CELL * 0.14;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 0.55);
    g.addColorStop(0, hexA(coin, 0.4));
    g.addColorStop(1, hexA(coin, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = coin;
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 1.5); ctx.lineTo(cx + s, cy);
    ctx.lineTo(cx, cy + s * 1.5); ctx.lineTo(cx - s, cy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillRect(cx - s * 0.3, cy - s * 0.6, s * 0.5, s * 0.5);
  }

  for (const h of S.hazards) {
    const cy = offY + (h.r + 0.5) * CELL - camY;
    if (cy < -CELL * 2 || cy > H + CELL * 2) continue;
    const cx = offX + (h.c + 0.5) * CELL;

    if (h.type === 'spike') drawSpike(cx, cy, danger);
    else if (h.type === 'hidden' && h.reveal > 0) {
      ctx.globalAlpha = h.reveal;
      drawSpike(cx, cy, danger);
      ctx.globalAlpha = 1;
    }
    else if (h.type === 'bat') drawBat(cx, cy, bat);
    else if (h.type === 'puffer') drawPuffer(h, cx, cy, puffer);
    else if (h.type === 'dart') drawDartTrap(h, cx, cy, dart);
    else if (h.type === 'saw') drawSaw(h, cx, cy, saw);
    else if (h.type === 'snake') drawSnake(h, cx, cy, snake);
  }

  for (const d of S.darts) {
    const cy = offY + (d.r + 0.5) * CELL - camY;
    if (cy < -CELL || cy > H + CELL) continue;
    const cx = offX + (d.c + 0.5) * CELL;
    drawDartProjectile(cx, cy, dart);
  }

  if (S.player.shatter) {
    drawShatter();
  } else {
    const worldY = (S.player.r + 0.5) * CELL;
    const targetScreenY = worldY - camY + offY;
    const targetScreenX = offX + (S.player.c + 0.5) * CELL;
    S.player.px += (targetScreenX - S.player.px) * 0.4;
    S.player.py += (targetScreenY - S.player.py) * 0.4;
    S.player.scale += (1 - S.player.scale) * 0.2;

    const pColor = maskColor(S.mask);

    if (S.magnetT > 0) {
      ctx.strokeStyle = hexA(coin, 0.35 + Math.sin(S.t * 10) * 0.15);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(S.player.px, S.player.py, CELL * 1.8, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (S.shield) {
      ctx.strokeStyle = hexA('#ffffff', 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(S.player.px, S.player.py, CELL * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(S.player.px, S.player.py, 0, S.player.px, S.player.py, CELL * 1.1);
    g.addColorStop(0, hexA(pColor, 0.32));
    g.addColorStop(1, hexA(pColor, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(S.player.px, S.player.py, CELL * 1.1, 0, Math.PI * 2); ctx.fill();
    drawSprite(SPR_PLAYER, S.player.px, S.player.py, CELL * 0.85 * S.player.scale, pColor);
  }

  for (const p of S.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const pop of S.popups) {
    const cx = offX + (pop.c + 0.5) * CELL;
    const cy = offY + (pop.r + 0.5) * CELL - camY - (1 - pop.life) * CELL * 1.4;
    ctx.globalAlpha = Math.max(0, pop.life);
    ctx.font = 'bold 18px Montserrat, sans-serif';
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, cx, cy);
  }
  ctx.globalAlpha = 1;

  if (S.levelIntroT > 0) {
    const a = Math.min(1, S.levelIntroT * 1.5);
    ctx.globalAlpha = a;
    ctx.fillStyle = hexA(accent, 0.85);
    ctx.font = 'bold 34px Montserrat, sans-serif';
    const label = S.mode === 'arcade' ? 'ARCADE' :
                  (S.boss ? 'BOSS LEVEL' : 'LEVEL ' + S.level);
    ctx.fillText(label, W / 2, H / 2);
    ctx.globalAlpha = 1;
  }

  if (S.freezeT > 0) {
    ctx.fillStyle = hexA('#22d3ee', 0.10);
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();

  if (S.flash > 0.01) {
    ctx.globalAlpha = Math.min(1, S.flash);
    ctx.fillStyle = S.flashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

function drawShatter() {
  const p = S.player;
  if (!p.shatter) return;
  const pColor = maskColor(S.mask);
  for (const piece of p.shatter) {
    ctx.globalAlpha = Math.max(0, piece.life);
    ctx.fillStyle = pColor;
    ctx.fillRect(piece.x, piece.y, 3, 3);
  }
  ctx.globalAlpha = 1;
}

function drawSpike(cx, cy, color) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 0.6);
  g.addColorStop(0, hexA(color, 0.28));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.6, 0, Math.PI * 2); ctx.fill();
  const s = CELL * 0.36;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.9, cy + s * 0.6); ctx.lineTo(cx - s * 0.9, cy + s * 0.6);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.4); ctx.lineTo(cx + s * 0.35, cy + s * 0.3); ctx.lineTo(cx - s * 0.35, cy + s * 0.3);
  ctx.closePath(); ctx.fill();
}

function drawBat(cx, cy, color) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 0.55);
  g.addColorStop(0, hexA(color, 0.35));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.55, 0, Math.PI * 2); ctx.fill();
  drawSprite(SPR_BAT, cx, cy, CELL * 0.75, color);
}

function drawPuffer(h, cx, cy, color) {
  const expanding = Math.sin(h.t / h.period * Math.PI * 2) > 0;
  if (expanding) {
    const x = offX + (h.c - 1) * CELL;
    const y = cy - CELL;
    const sz = CELL * 3;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 1.8);
    g.addColorStop(0, hexA(color, 0.35));
    g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, CELL * 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hexA(color, 0.35);
    ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4);
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      ctx.fillRect(offX + (h.c - 1 + j) * CELL + 3, cy - CELL + i * CELL + 3, CELL - 6, CELL - 6);
    }
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
  } else {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 0.4);
    g.addColorStop(0, hexA(color, 0.4));
    g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.4, 0, Math.PI * 2); ctx.fill();
    const s = CELL * 0.25;
    ctx.fillStyle = color;
    ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  }
}

function drawDartTrap(h, cx, cy, color) {
  const s = CELL * 0.22;
  ctx.fillStyle = color;
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  ctx.fillStyle = hexA(color, 0.5);
  const bl = CELL * 0.35;
  if (h.dc > 0)      ctx.fillRect(cx + s, cy - s * 0.4, bl, s * 0.8);
  else if (h.dc < 0) ctx.fillRect(cx - s - bl, cy - s * 0.4, bl, s * 0.8);
  else if (h.dr > 0) ctx.fillRect(cx - s * 0.4, cy + s, s * 0.8, bl);
  else if (h.dr < 0) ctx.fillRect(cx - s * 0.4, cy - s - bl, s * 0.8, bl);
}

function drawDartProjectile(cx, cy, color) {
  const s = CELL * 0.16;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 0.4);
  g.addColorStop(0, hexA(color, 0.6));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);
  ctx.fillStyle = '#fff';
  ctx.fillRect(cx - s * 0.4, cy - s * 0.4, s * 0.8, s * 0.8);
}

function drawSaw(h, cx, cy, color) {
  const r = CELL * 0.38;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, CELL * 0.55);
  g.addColorStop(0, hexA(color, 0.35));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.55, 0, Math.PI * 2); ctx.fill();

  const teeth = 8;
  ctx.fillStyle = color;
  for (let i = 0; i < teeth; i++) {
    const a = h.spin + (i * Math.PI * 2 / teeth);
    const tx = cx + Math.cos(a) * r;
    const ty = cy + Math.sin(a) * r;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5);
    ctx.lineTo(tx + Math.cos(a + 0.4) * r * 0.4, ty + Math.sin(a + 0.4) * r * 0.4);
    ctx.lineTo(tx + Math.cos(a - 0.4) * r * 0.4, ty + Math.sin(a - 0.4) * r * 0.4);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2); ctx.fill();
}

function drawSnake(h, cx, cy, color) {
  const s = CELL * 0.3;
  ctx.fillStyle = hexA(color, 0.3);
  ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(cx - s, cy - s, s * 2, s * 2);

  if (h.state === 'active' && h.progress > 0) {
    const endR = h.r + h.dir[0] * h.progress;
    const endC = h.c + h.dir[1] * h.progress;
    const ey = offY + (endR + 0.5) * CELL - S.camY;
    const ex = offX + (endC + 0.5) * CELL;
    ctx.strokeStyle = color;
    ctx.lineWidth = CELL * 0.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ex, ey, CELL * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(ex - 3, ey - 3, 6, 6);
  }
}
