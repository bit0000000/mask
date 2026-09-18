// Lava system: a rising liquid that kills on contact.
// Represented as a fractional row index (higher = higher up = more dangerous).
// S.lavaLevel = row index (float). Player dies if player.r >= lavaLevel.

function initLava(startRow, riseSpeed) {
  S.lavaLevel = startRow;   // e.g. ROWS - 0.5 means just below play area
  S.lavaRise = riseSpeed;   // rows per second
  S.lavaActive = true;
  S.lavaWave = 0;           // animation phase
}

function updateLava(dt) {
  if (!S.lavaActive) return;
  if (S.freezeT > 0) return; // freeze pauses lava too

  S.lavaWave += dt;
  S.lavaLevel -= S.lavaRise * dt;

  // Kill check: player row equals or above lava line
  if (S.player.r >= S.lavaLevel - 0.1) {
    if (S.shield) {
      S.shield = false;
      toast('Shield consumed by lava');
      sfx.shield();
      // push lava down briefly
      S.lavaLevel += 3;
    } else {
      die();
    }
  }
}

function drawLava() {
  if (!S.lavaActive) return;

  const lava = cv('--lava');
  const yTop = offY + S.lavaLevel * CELL;

  // Fill below lava line
  const grad = ctx.createLinearGradient(0, yTop, 0, H);
  grad.addColorStop(0, hexA(lava, 0.85));
  grad.addColorStop(1, hexA(lava, 0.4));
  ctx.fillStyle = grad;
  ctx.fillRect(0, yTop, W, H - yTop);

  // Animated wave top edge
  ctx.beginPath();
  const waveAmp = CELL * 0.12;
  const waveLen = CELL * 0.7;
  ctx.moveTo(0, yTop + Math.sin(S.lavaWave * 3) * waveAmp);
  for (let x = 0; x <= W; x += 4) {
    const y = yTop + Math.sin(S.lavaWave * 3 + x / waveLen) * waveAmp;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, yTop + CELL);
  ctx.lineTo(0, yTop + CELL);
  ctx.closePath();
  ctx.fillStyle = hexA(lava, 0.9);
  ctx.fill();

  // Bright top stripe
  ctx.strokeStyle = hexA('#ffffff', 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, yTop + Math.sin(S.lavaWave * 3) * waveAmp);
  for (let x = 0; x <= W; x += 4) {
    const y = yTop + Math.sin(S.lavaWave * 3 + x / waveLen) * waveAmp;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}
