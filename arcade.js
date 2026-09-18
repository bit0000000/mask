// Arcade mode: endless vertical climb with rising lava.
// World shifts down when player reaches the top rows.

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

  // Build a tall starting world
  S.grid = [];
  for (let r = 0; r < ROWS; r++) {
    S.grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      S.grid[r][c] = (c === 0 || c === COLS - 1) ? 1 : 0;
    }
  }
  // Add some starting walls
  for (let i = 0; i < 15; i++) {
    const r = 2 + Math.floor(Math.random() * (ROWS - 4));
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

  // Start player at bottom area
  S.player.r = ROWS - 3;
  S.player.c = Math.floor(COLS / 2);
  while (S.grid[S.player.r][S.player.c] === 1) S.player.c = Math.max(1, S.player.c - 1);
  S.player.px = offX + (S.player.c + 0.5) * CELL;
  S.player.py = offY + (S.player.r + 0.5) * CELL;
  S.player.scale = 1;
  S.player.alive = true;
  S.player.shatter = null;

  // Lava starts below the player
  initLava(ROWS - 1 + 0.5, 0.28);

  // Fill dots above
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (S.grid[r][c] === 0 && Math.random() < 0.4) S.dots.add(r + ',' + c);
    }
  }

  S.levelIntroT = 1.2;
  S.transitionText = 'ARCADE';
  S.transition = 1.2;
  updateHUD();
  showOverlay(null);
  S.running = true;
}

function arcadeUpdate(dt) {
  if (!S.running || S.dead) return;

  // Track max height climbed (higher = lower row index)
  const climbed = (ROWS - 3) - S.player.r;
  if (climbed > S.arcadeHeight) {
    const gain = climbed - S.arcadeHeight;
    S.arcadeHeight = climbed;
    S.score += gain * 2;
    updateHUD();
  }

  // When player reaches top rows, shift world down and spawn new rows on top
  if (S.player.r <= 3) {
    shiftWorldDown();
  }
}

function shiftWorldDown() {
  // Shift all rows down by 1. New row at top.
  const newGrid = [];
  newGrid[0] = new Array(COLS).fill(1);
  newGrid[0][0] = 1;
  newGrid[0][COLS-1] = 1;
  for (let c = 1; c < COLS - 1; c++) {
    newGrid[0][c] = Math.random() < 0.25 ? 1 : 0;
  }
  for (let r = 0; r < ROWS - 1; r++) {
    newGrid[r + 1] = S.grid[r].slice();
  }
  S.grid = newGrid;

  // Shift player, hazards, dots, coins
  S.player.r += 1;
  S.player.py += CELL;

  S.hazards = S.hazards.filter(h => {
    h.r += 1;
    return h.r < ROWS;
  });
  S.darts = S.darts.filter(d => {
    d.r += 1;
    return d.r < ROWS;
  });

  const newDots = new Set();
  for (const k of S.dots) {
    const [r, c] = k.split(',').map(Number);
    if (r + 1 < ROWS) newDots.add((r + 1) + ',' + c);
  }
  S.dots = newDots;

  const newCoins = new Set();
  for (const k of S.coinsSet) {
    const [r, c] = k.split(',').map(Number);
    if (r + 1 < ROWS) newCoins.add((r + 1) + ',' + c);
  }
  S.coinsSet = newCoins;

  S.trail = S.trail.map(t => ({ ...t, r: t.r + 1 }));

  // Spawn new content in the top rows
  const diff = Math.floor(S.arcadeHeight / 8);
  for (let c = 1; c < COLS - 1; c++) {
    if (S.grid[1][c] === 0) {
      if (Math.random() < 0.5) S.dots.add('1,' + c);
      if (Math.random() < 0.08) S.coinsSet.add('1,' + c);
      // hazards grow with depth
      if (diff >= 1 && Math.random() < 0.04 * diff) {
        S.hazards.push({ type: 'spike', r: 1, c });
      } else if (diff >= 3 && Math.random() < 0.02 * diff) {
        const horiz = Math.random() < 0.5;
        S.hazards.push({
          type: 'bat', r: 1, c,
          dr: horiz ? 0 : 1, dc: horiz ? 1 : 0,
          dir: 1, speed: 1.6 + diff * 0.15
        });
      }
    }
  }

  // Speed up lava over time
  S.lavaRise = 0.28 + S.arcadeHeight * 0.005;
}

function arcadeDeath() {
  const isNewBest = S.arcadeHeight > (S.best.arcade || 0);
  if (isNewBest) S.best.arcade = S.arcadeHeight;
  saveBest();
  return isNewBest;
}
