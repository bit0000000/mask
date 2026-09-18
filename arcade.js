// Arcade mode: endless vertical climb with rising lava.

function startArcade() {
  S.mode = 'arcade';
  S.level = 1;
  S.score = 0;
  S.coins = 0;
  S.arcadeHeight = 0;
  S.arcadeLavaTimer = 0;
  S.inv = { shield: 0, freeze: 0, magnet: 0 };
  S.dead = false;
  S.deathStats = null;
  S.startTime = performance.now();

  // Build starting grid
  S.grid = [];
  for (let r = 0; r < ROWS; r++) {
    S.grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      S.grid[r][c] = (c === 0 || c === COLS - 1) ? 1 : 0;
    }
  }
  // Scatter some walls (avoid bottom rows where player starts)
  for (let i = 0; i < 15; i++) {
    const r = 2 + Math.floor(Math.random() * (ROWS - 5));
    const c = 1 + Math.floor(Math.random() * (COLS - 2));
    S.grid[r][c] = 1;
  }

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

  // Start player at bottom area, guarantee open cell in that row
  S.player.r = ROWS - 3;
  const midC = Math.floor(COLS / 2);
  S.grid[S.player.r][midC] = 0;
  S.player.c = midC;
  S.player.px = offX + (S.player.c + 0.5) * CELL;
  S.player.py = offY + (S.player.r + 0.5) * CELL;
  S.player.scale = 1;
  S.player.alive = true;
  S.player.shatter = null;

  // Lava starts below the player
  initLava(ROWS - 1 + 0.5, 0.28);

  // Fill dots above player
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (S.grid[r][c] === 0 && Math.random() < 0.4) S.dots.add(r + ',' + c);
    }
  }

  // Starting coins
  for (let i = 0; i < 3; i++) {
    for (let tries = 0; tries < 20; tries++) {
      const r = 2 + Math.floor(Math.random() * (ROWS - 6));
      const c = 1 + Math.floor(Math.random() * (COLS - 2));
      if (S.grid[r][c] === 0) {
        S.coinsSet.add(r + ',' + c);
        break;
      }
    }
  }

  S.levelIntroT = 1.2;
  S.transitionText = 'ARCADE';
  S.transition = 1.2;

  // Mask bonuses
  if (S.inv.shield > 0) { S.inv.shield--; S.shield = true; }
  else S.shield = MASKS[S.mask].bonus === 'shield';
  S.freezeT = 0;
  S.magnetT = 0;

  updateHUD();
  showOverlay(null);
  S.running = true;
}

function arcadeUpdate(dt) {
  if (!S.running || S.dead) return;

  // Track max height climbed (lower row index = higher)
  const climbed = (ROWS - 3) - S.player.r;
  if (climbed > S.arcadeHeight) {
    const gain = climbed - S.arcadeHeight;
    S.arcadeHeight = climbed;
    S.score += gain * 2;
    updateHUD();
  }

  // Shift world down when player reaches top rows.
  // Bounded loop in case of unexpected state.
  let safety = 0;
  while (S.player.r <= 3 && safety < 8) {
    shiftWorldDown();
    safety++;
  }
}

function shiftWorldDown() {
  // Build new top row
  const newTop = new Array(COLS).fill(0);
  newTop[0] = 1;
  newTop[COLS - 1] = 1;
  for (let c = 1; c < COLS - 1; c++) {
    newTop[c] = Math.random() < 0.25 ? 1 : 0;
  }
  // Guarantee at least one open cell
  let hasOpen = false;
  for (let c = 1; c < COLS - 1; c++) if (newTop[c] === 0) hasOpen = true;
  if (!hasOpen) newTop[1 + Math.floor(Math.random() * (COLS - 2))] = 0;

  // Shift grid: newTop on top, old rows 0..ROWS-2 shift down
  const newGrid = [newTop];
  for (let r = 0; r < ROWS - 1; r++) {
    newGrid.push(S.grid[r].slice());
  }
  S.grid = newGrid;

  // Shift player
  S.player.r += 1;
  S.player.py += CELL;

  // Shift lava down so it keeps pace with the world
  S.lavaLevel += 1;

  // Shift hazards, keep only valid rows
  S.hazards = S.hazards.filter(h => {
    h.r += 1;
    return h.r >= 1 && h.r < ROWS;
  });

  // Shift darts
  S.darts = S.darts.filter(d => {
    d.r += 1;
    return d.r < ROWS;
  });

  // Shift dots
  const newDots = new Set();
  for (const k of S.dots) {
    const [r, c] = k.split(',').map(Number);
    if (r + 1 < ROWS) newDots.add((r + 1) + ',' + c);
  }
  S.dots = newDots;

  // Shift coins
  const newCoins = new Set();
  for (const k of S.coinsSet) {
    const [r, c] = k.split(',').map(Number);
    if (r + 1 < ROWS) newCoins.add((r + 1) + ',' + c);
  }
  S.coinsSet = newCoins;

  // Shift trail, drop rows that fell off the bottom
  S.trail = S.trail
    .map(t => ({ ...t, r: t.r + 1 }))
    .filter(t => t.r < ROWS);

  // Spawn content in new top row
  const diff = Math.floor(S.arcadeHeight / 8);
  for (let c = 1; c < COLS - 1; c++) {
    if (S.grid[1][c] === 0) {
      if (Math.random() < 0.5)
