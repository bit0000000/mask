function initLava(startRow, riseSpeed) {
  S.lavaLevel = startRow;
  S.lavaRise = riseSpeed;
  S.lavaActive = true;
  S.lavaWave = 0;
}

function updateLava(dt) {
  if (!S.lavaActive) return;
  if (S.freezeT > 0) return;

  S.lavaWave += dt;
  S.lavaLevel -= S.lavaRise * dt;

  if (S.player.r >= S.lavaLevel - 0.1) {
    if (S.shield) {
      S.shield = false;
      toast('Shield consumed by lava');
      sfx.shield();
      S.lavaLevel += 3;
    } else {
      die();
    }
  }
}

function drawLava() {
  if (!S.lavaActive) return;

  const lava = cv('--lava');
  const yTop = S.lavaLevel * CELL - S.camY + offY;

  if (yTop > H) return;

  const grad = ctx.createLinearGradient(0, yTop, 0, H);
  grad.addColorStop(0, hexA(lava, 0.85));
  grad.addColorStop(1, hexA(lava, 0.4));
  ctx.fillStyle = grad;
  ctx.fillRect(0, yTop, W, H - yTop);

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
