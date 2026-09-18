function genLevel() {
  const lvl = S.level;
  S.grid = [];
  S.hazards = [];
  S.darts = [];
  S.dots = new Set();
  S.coinsSet = new Set();
  S.particles = [];
  S.trail = [];
  S.popups = [];
  S.shake = 0;
  S.flash = 0;
  S.levelIntroT = 0.9;

  const wallD = Math.min(0.24 + lvl * 0.005, 0.32);
  for (let r = 0; r < ROWS; r++) {
    S.grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      const border = (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1);
      S.grid[r][c] = border ? 1 : (Math.random() < wallD ? 1 : 0);
    }
  }

  const open = [];
  for (let r = 1; r < ROWS - 1; r++)
    for (let c = 1; c < COLS - 1; c++)
      if (S.grid[r][c] === 0) open.push([r, c]);
  if (open.length < 20) return genLevel();

  for (let i = open.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [open[i], open[j]] = [open[j], open[i]];
  }

  let start = null;
  for (let i = open.length - 1; i >= 0; i--) {
    const [r, c] = open[i];
    if (r >= 2 && r <= ROWS - 3 && c >= 2 && c <= COLS - 3) {
      start = [r, c];
      open.splice(i, 1);
      break;
    }
  }
  if (!start) start = open.pop();

  const safe = new Set();
  for (let c = 0; c < COLS; c++) safe.add(start[0] + ',' + c);
  for (let r = 0; r < ROWS; r++) safe.add(r + ',' + start[1]);

  function pickOpen() {
    for (let i = open.length - 1; i >= 0; i--) {
      const [r, c] = open[i];
      if (safe.has(r + ',' + c)) continue;
      open.splice(i, 1);
      return [r, c];
    }
    return null;
  }

  const spikeCount  = Math.min(2 + lvl * 2, Math.floor(open.length * 0.30));
  const hiddenCount = lvl >= 3 ? Math.min(1 + Math.floor(lvl / 3), 4) : 0;
  const batCount    = lvl >= 2 ? Math.min(1 + Math.floor(lvl / 4), 3) : 0;
  const dartCount   = lvl >= 4 ? Math.min(1 + Math.floor(lvl / 6), 2) : 0;
  const pufferCount = lvl >= 5 ? Math.min(1 + Math.floor(lvl / 8), 2) : 0;

  for (let i = 0; i < spikeCount; i++) {
    const p = pickOpen(); if (!p) break;
    S.hazards.push({ type: 'spike', r: p[0], c: p[1] });
  }
  for (let i = 0; i < hiddenCount; i++) {
    const p = pickOpen(); if (!p) break;
    S.hazards.push({ type: 'hidden', r: p[0], c: p[1], reveal: 0 });
  }
  for (let i = 0; i < batCount; i++) {
    const p = pickOpen(); if (!p) break;
    const horiz = Math.random() < 0.5;
    S.hazards.push({
      type: 'bat', r: p[0], c: p[1],
      dr: horiz ? 0 : 1, dc: horiz ? 1 : 0,
      dir: 1, speed: 1.6 + lvl * 0.04
    });
  }
  for (let i = 0; i < dartCount; i++) {
    const p = pickOpen(); if (!p) break;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dr, dc]) => {
      const nr = p[0] + dr, nc = p[1] + dc;
      return nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && S.grid[nr][nc] === 0;
    });
    if (!dirs.length) continue;
    const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
    S.hazards.push({ type: 'dart', r: p[0], c: p[1], dr, dc, t: 0, interval: 1.6 });
  }
  for (let i = 0; i < pufferCount; i++) {
    const p = pickOpen(); if (!p) break;
    if (p[0] < 1 || p[0] > ROWS - 2 || p[1] < 1 || p[1] > COLS - 2) continue;
    S.hazards.push({ type: 'puffer', r: p[0], c: p[1], t: Math.random() * 2, period: 2.4 });
  }

  const dotChance = Math.max(0.40, 0.62 - lvl * 0.012);
  for (const [r, c] of open) {
    if (S.grid[r][c] === 0 && Math.random() < dotChance) S.dots.add(r + ',' + c);
  }
  if (S.dots.size < 3) {
    for (const [r, c] of open) {
      if (!S.grid[r][c]) S.dots.add(r + ',' + c);
      if (S.dots.size >= 3) break;
    }
  }

  const coinCount = 2 + Math.floor(Math.random() * 3) + Math.floor(lvl / 4);
  for (let i = 0; i < coinCount; i++) {
    const p = pickOpen(); if (!p) break;
    S.coinsSet.add(p[0] + ',' + p[1]);
  }

  S.player.r = start[0];
  S.player.c = start[1];
  S.player.px = offX + (start[1] + 0.5) * CELL;
  S.player.py = offY + (start[0] + 0.5) * CELL;
  S.player.scale = 1;

  if (S.inv.shield > 0) { S.inv.shield--; S.shield = true; }
  else S.shield = MASKS[S.mask].bonus === 'shield';

  if (S.inv.freeze > 0) { S.inv.freeze--; S.freezeT = 3; }
  else if (MASKS[S.mask].bonus === 'freeze') S.freezeT = 3;
  else S.freezeT = 0;

  if (S.inv.magnet > 0) { S.inv.magnet--; S.magnetT = 5; }
  else S.magnetT = 0;
}
