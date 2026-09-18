function genLevel() {
  const lvl = S.level;
  const isBoss = (S.mode === 'stage') && (lvl % 10 === 0);
  S.boss = isBoss;

  S.worldRows = WORLD_ROWS;

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
  S.chain = 0;
  S.levelIntroT = 0.9;
  S.transition = 0;
  S.camY = 0;

  S.lavaActive = false;
  S.lavaLevel = S.worldRows + 1;
  S.lavaRise = 0;

  let attempts = 0;
  let open = [];
  let start = null;

  while (attempts < 15) {
    attempts++;
    S.grid = fillWithChunks(COLS, S.worldRows);

    let found = null;
    for (let r = S.worldRows - 3; r >= 2 && !found; r--) {
      for (let c = 2; c < COLS - 2; c++) {
        if (S.grid[r][c] === 0) { found = [r, c]; break; }
      }
    }
    if (!found) continue;

    const reach = reachableFrom(S.grid, found[0], found[1]);
    if (reach.size < 90) continue;

    start = found;
    open = [];
    for (const k of reach) {
      const [r, c] = k.split(',').map(Number);
      open.push([r, c]);
    }
    break;
  }

  if (!start) {
    S.grid = [];
    for (let r = 0; r < S.worldRows; r++) {
      S.grid[r] = [];
      for (let c = 0; c < COLS; c++) {
        S.grid[r][c] = (r === 0 || r === S.worldRows - 1 || c === 0 || c === COLS - 1) ? 1 : 0;
      }
    }
    start = [S.worldRows - 3, Math.floor(COLS / 2)];
    open = [];
    for (let r = 1; r < S.worldRows - 1; r++)
      for (let c = 1; c < COLS - 1; c++) open.push([r, c]);
  }

  for (let i = open.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [open[i], open[j]] = [open[j], open[i]];
  }

  const safe = new Set();
  for (let c = 0; c < COLS; c++) safe.add(start[0] + ',' + c);
  for (let r = 0; r < S.worldRows; r++) safe.add(r + ',' + start[1]);

  const placed = new Set();
  const tooClose = (r, c) => {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if (placed.has((r + dr) + ',' + (c + dc))) return true;
    return false;
  };

  function pickOpen(enforceSpacing) {
    for (let i = open.length - 1; i >= 0; i--) {
      const [r, c] = open[i];
      if (safe.has(r + ',' + c)) continue;
      if (S.grid[r][c] !== 0) continue;
      if (enforceSpacing && tooClose(r, c)) continue;
      open.splice(i, 1);
      placed.add(r + ',' + c);
      return [r, c];
    }
    return null;
  }

  const spikeCount  = Math.min(3 + lvl, Math.floor(open.length * 0.10));
  const hiddenCount = lvl >= 5  ? Math.min(1 + Math.floor((lvl - 5) / 4), 3)   : 0;
  const batCount    = lvl >= 4  ? Math.min(1 + Math.floor((lvl - 4) / 5), 3)   : 0;
  const dartCount   = lvl >= 7  ? Math.min(1 + Math.floor((lvl - 7) / 7), 2)   : 0;
  const pufferCount = lvl >= 9  ? Math.min(1 + Math.floor((lvl - 9) / 10), 2)  : 0;
  const sawCount    = lvl >= 12 ? Math.min(1 + Math.floor((lvl - 12) / 12), 2) : 0;
  const snakeCount  = lvl >= 15 ? Math.min(1 + Math.floor((lvl - 15) / 15), 1) : 0;

  for (let i = 0; i < spikeCount; i++) {
    const p = pickOpen(true);
    if (!p) break;
    S.hazards.push({ type: 'spike', r: p[0], c: p[1] });
  }
  for (let i = 0; i < hiddenCount; i++) {
    const p = pickOpen(true);
    if (!p) break;
    S.hazards.push({ type: 'hidden', r: p[0], c: p[1], reveal: 0 });
  }
  for (let i = 0; i < batCount; i++) {
    const p = pickOpen(false);
    if (!p) break;
    const horiz = Math.random() < 0.5;
    S.hazards.push({
      type: 'bat', r: p[0], c: p[1],
      dr: horiz ? 0 : 1, dc: horiz ? 1 : 0,
      dir: 1, speed: 1.6 + lvl * 0.03
    });
  }
  for (let i = 0; i < dartCount; i++) {
    const p = pickOpen(false);
    if (!p) break;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dr, dc]) => {
      const nr = p[0] + dr, nc = p[1] + dc;
      return nr >= 0 && nr < S.worldRows && nc >= 0 && nc < COLS && S.grid[nr][nc] === 0;
    });
    if (!dirs.length) continue;
    const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
    S.hazards.push({ type: 'dart', r: p[0], c: p[1], dr, dc, t: 0, interval: 2.0 });
  }
  for (let i = 0; i < pufferCount; i++) {
    const p = pickOpen(false);
    if (!p) break;
    if (p[0] < 1 || p[0] > S.worldRows - 2 || p[1] < 1 || p[1] > COLS - 2) continue;
    S.hazards.push({ type: 'puffer', r: p[0], c: p[1], t: Math.random() * 2, period: 2.4 });
  }
  for (let i = 0; i < sawCount; i++) {
    const p = pickOpen(false);
    if (!p) break;
    const horiz = Math.random() < 0.5;
    S.hazards.push({
      type: 'saw', r: p[0], c: p[1],
      dr: horiz ? 0 : 1, dc: horiz ? 1 : 0,
      dir: 1, speed: 3.0, spin: 0
    });
  }
  for (let i = 0; i < snakeCount; i++) {
    const p = pickOpen(false);
    if (!p) break;
    S.hazards.push({
      type: 'snake', r: p[0], c: p[1],
      state: 'idle', progress: 0, dir: null
    });
  }

  const dotTarget = 14 + Math.floor(lvl * 0.5);
  for (let i = 0; i < dotTarget; i++) {
    const p = pickOpen(false);
    if (!p) break;
    S.dots.add(p[0] + ',' + p[1]);
  }
  if (S.dots.size < 6) {
    for (const [r, c] of open) {
      if (!S.grid[r][c]) S.dots.add(r + ',' + c);
      if (S.dots.size >= 6) break;
    }
  }

  const coinCount = 3 + Math.floor(Math.random() * 3) + Math.floor(lvl / 4);
  for (let i = 0; i < coinCount; i++) {
    const p = pickOpen(false);
    if (!p) break;
    S.coinsSet.add(p[0] + ',' + p[1]);
  }
  if (isBoss) {
    for (let i = 0; i < 10; i++) {
      const p = pickOpen(false);
      if (!p) break;
      S.coinsSet.add(p[0] + ',' + p[1]);
    }
  }

  S.player.r = start[0];
  S.player.c = start[1];
  S.player.px = offX + (start[1] + 0.5) * CELL;
  const startWorldY = (start[0] + 0.5) * CELL;
  const maxCamY = Math.max(0, S.worldRows * CELL - H);
  S.camY = Math.max(0, Math.min(maxCamY, startWorldY - H * 0.65));
  S.player.py = startWorldY - S.camY + offY;
  S.player.scale = 1;
  S.player.alive = true;
  S.player.shatter = null;

  if (S.inv.shield > 0) { S.inv.shield--; S.shield = true; }
  else S.shield = MASKS[S.mask].bonus === 'shield';

  if (S.inv.freeze > 0) { S.inv.freeze--; S.freezeT = 3; }
  else if (MASKS[S.mask].bonus === 'freeze') S.freezeT = 3;
  else S.freezeT = 0;

  if (S.inv.magnet > 0) { S.inv.magnet--; S.magnetT = 5; }
  else S.magnetT = 0;
}
