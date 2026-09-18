function startRun(practiceLevel) {
  S.level = practiceLevel || 1;
  S.score = 0;
  S.coins = 0;
  S.inv = { shield: 0, freeze: 0, magnet: 0 };
  S.dead = false;
  S.deathStats = null;
  S.startTime = performance.now();
  updateHUD();
  resize();
  genLevel();
  S.running = true;
  showOverlay(null);
}

function levelClear() {
  S.running = false;
  const bonus = 3 + Math.floor(S.level / 2);
  S.coins += bonus;
  S.totalCoins += bonus;
  updateHUD();
  sfx.level();
  vibrate(15);
  openShop();
}

function die() {
  S.running = false;
  S.dead = true;

  const elapsed = (performance.now() - S.startTime) / 1000;
  S.deathStats = {
    dots: S.score,
    coins: S.coins,
    time: elapsed
  };

  const isNewBest = S.score > S.best.score;
  if (isNewBest) {
    S.best.score = S.score;
  }
  if (S.level > S.best.level) {
    S.best.level = S.level;
  }
  saveBest();

  shakeScreen(14);
  flashScreen(cv('--danger'), 0.5);
  vibrate([40, 30, 60]);

  const title = document.getElementById('deadTitle');
  title.textContent = isNewBest ? 'NEW BEST!' : 'You died';
  document.getElementById('deadMsg').textContent =
    'Score: ' + S.score + ' · Level ' + S.level;

  renderDeathStats();
  showOverlay('dead');

  if (isNewBest) {
    sfx.best();
  } else {
    sfx.die();
  }
}

function nextLevel() {
  S.level++;
  updateHUD();
  genLevel();
  S.running = true;
  showOverlay(null);
}

function pauseGame() {
  if (!S.running) return;
  S.running = false;
  document.getElementById('pauseInfo').textContent =
    'Level ' + S.level + ' · Score ' + S.score + ' · ◈ ' + S.coins;
  showOverlay('pause');
}

function resumeGame() {
  if (S.dead) return;
  S.running = true;
  showOverlay(null);
}

function move(dr, dc) {
  if (!S.running || S.dead) return;
  if (S.levelIntroT > 0) return;
  if (S.t < S.moveLock) return;
  S.moveLock = S.t + MOVE_DELAY / 1000;

  let r = S.player.r, c = S.player.c;
  const path = [];

  while (true) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
    if (S.grid[nr][nc] === 1) break;
    r = nr; c = nc;
    path.push([r, c]);
  }
  if (!path.length) return;

  for (const [pr, pc] of path) {
    if (hazardAt(pr, pc)) {
      S.player.r = pr; S.player.c = pc;
      S.player.px = offX + (pc + 0.5) * CELL;
      S.player.py = offY + (pr + 0.5) * CELL;
      if (S.shield) {
        S.shield = false;
        toast('Shield saved you');
        sfx.shield();
        vibrate(20);
        shakeScreen(6);
        break;
      }
      die(); return;
    }
  }

  let got = 0, gotCoins = 0;
  for (const [pr, pc] of path) {
    const k = pr + ',' + pc;
    if (S.dots.has(k))     { S.dots.delete(k); got++; }
    if (S.coinsSet.has(k)) { S.coinsSet.delete(k); gotCoins++; }
  }

  const maskB = MASKS[S.mask].bonus;
  const scoreMult = maskB === 'score2x' ? 2 : 1;
  const coinMult  = maskB === 'coin2x'  ? 2 : 1;

  // Combo bonus
  let comboBonus = 0;
  if (got >= 3) {
    comboBonus = got * 2;
    popText('×' + got, r, c, cv('--accent'));
  }

  S.score += got * scoreMult + comboBonus;
  S.coins += gotCoins * coinMult;
  S.totalCoins += gotCoins * coinMult;
  updateHUD();

  if (got > 0) {
    spawnBurst(r, c, cv('--accent'), 6 + got);
    sfx.tick();
    vibrate(8);
  }
  if (gotCoins > 0) {
    spawnBurst(r, c, cv('--coin'), 8);
    sfx.coin();
    toast('+' + (gotCoins * coinMult) + ' ◈');
  }

  // Trail: add every cell along path
  for (const [pr, pc] of path) addTrail(pr, pc);

  S.player.r = r; S.player.c = c;
  S.player.scale = 1.4;

  if (S.dots.size === 0) levelClear();
}

let lastT = 0;
function update(dt) {
  if (S.levelIntroT > 0) S.levelIntroT = Math.max(0, S.levelIntroT - dt);

  if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 40);
  if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 2.2);

  updateParticles(dt);
  updateTrail(dt);
  updatePopups(dt);

  if (!S.running || S.dead) return;
  if (S.freezeT > 0) S.freezeT = Math.max(0, S.freezeT - dt);
  if (S.magnetT > 0) S.magnetT = Math.max(0, S.magnetT - dt);
  updateHazards(dt);
}

function loop(now) {
  const t = now / 1000;
  const dt = Math.min(0.05, t - lastT || 0);
  lastT = t;
  S.t = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

const themeBtn = document.getElementById('themeBtn');
function applyTheme() {
  const stored = localStorage.getItem('mask-theme');
  const isDark = stored ? stored === 'dark' : true;
  document.body.classList.toggle('dark', isDark);
  themeBtn.textContent = isDark ? '☀' : '☾';
  if (S.grid.length) draw();
}
themeBtn.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark');
  document.body.classList.toggle('dark', isDark);
  themeBtn.textContent = isDark ? '☀' : '☾';
  localStorage.setItem('mask-theme', isDark ? 'dark' : 'light');
  if (S.grid.length) draw();
});

// Buttons
document.getElementById('playBtn').addEventListener('click', () => startRun(1));
document.getElementById('practiceBtn').addEventListener('click', () => startRun(S.best.level));
document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
document.getElementById('retryBtn').addEventListener('click', () => startRun(1));
document.getElementById('menuBtn').addEventListener('click', () => {
  S.running = false; S.dead = false;
  renderMaskMenu();
  showOverlay('menu');
});
document.getElementById('pauseBtn').addEventListener('click', () => {
  if (S.screen === 'playing' && S.running) pauseGame();
});
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('quitBtn').addEventListener('click', () => {
  S.running = false; S.dead = false;
  renderMaskMenu();
  showOverlay('menu');
});

// Settings
const settingsBtn = document.getElementById('settingsBtn');
const settingsClose = document.getElementById('settingsClose');
const resetProgress = document.getElementById('resetProgress');

settingsBtn.addEventListener('click', () => {
  if (S.running) pauseGame();
  wireSettings();
  showOverlay('settings');
});
settingsClose.addEventListener('click', () => {
  if (S.dead) showOverlay('dead');
  else if (S.screen === 'settings' && !S.running) showOverlay('menu');
});
resetProgress.addEventListener('click', () => {
  if (!confirm('Reset all progress? Coins, masks, and best score will be cleared.')) return;
  localStorage.removeItem('mask-best');
  localStorage.removeItem('mask-owned');
  localStorage.removeItem('mask-skin');
  S.best = { score: 0, level: 1 };
  S.owned = ['classic'];
  S.mask = 'classic';
  S.totalCoins = 0;
  toast('Progress reset');
  renderMaskMenu();
});

// Init
applyTheme();
resize();
genLevel();
S.running = false;
renderMaskMenu();
requestAnimationFrame(loop);
