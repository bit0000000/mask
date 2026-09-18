function startRun(practiceLevel) {
  S.mode = 'stage';
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
  if (practiceLevel && practiceLevel > 1) S.levelIntroT = 1.8;
  S.running = true;
  showOverlay(null);
}

function levelClear() {
  S.running = false;
  const bonus = 3 + Math.floor(S.level / 2);
  S.coins += bonus;
  S.totalCoins += bonus;
  updateHUD();
  if (S.level > S.best.level) S.best.level = S.level;
  if (S.score > S.best.score) S.best.score = S.score;
  saveBest();
  sfx.level();
  vibrate(15);
  S.transition = 1;
  S.transitionText = 'CLEAR';
  setTimeout(() => { S.transition = 0; openShop(); }, 400);
}

function die() {
  S.running = false;
  S.dead = true;
  S.player.alive = false;

  // shatter effect
  const pColor = maskColor(S.mask);
  const shards = [];
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1 + Math.random() * 3;
    shards.push({
      x: S.player.px, y: S.player.py,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 1
    });
  }
  S.player.shatter = shards;

  const elapsed = (performance.now() - S.startTime) / 1000;
  S.deathStats = { score: S.score, coins: S.coins, time: elapsed };

  let isNewBest = false;
  if (S.mode === 'arcade') {
    S.deathStats.height = S.arcadeHeight;
    if (S.arcadeHeight > (S.best.arcade || 0)) {
      S.best.arcade = S.arcadeHeight;
      isNewBest = true;
    }
  } else {
    if (S.score > S.best.score) { S.best.score = S.score; isNewBest = true; }
    if (S.level > S.best.level) S.best.level = S.level;
  }
  saveBest();

  shakeScreen(14);
  flashScreen(cv('--danger'), 0.5);
  vibrate([40, 30, 60]);

  document.getElementById('deadTitle').textContent = isNewBest ? 'NEW BEST!' : 'You died';
  document.getElementById('deadMsg').textContent =
    S.mode === 'arcade'
      ? 'Height ' + S.arcadeHeight + ' · Score ' + S.score
      : 'Score: ' + S.score + ' · Level ' + S.level;

  renderDeathStats();
  setTimeout(() => showOverlay('dead'), 600);
  if (isNewBest) sfx.best(); else sfx.die();
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
    S.mode === 'arcade'
      ? 'Height ' + S.arcadeHeight + ' · Score ' + S.score
      : 'Level ' + S.level + ' · Score ' + S.score + ' · ◈ ' + S.coins;
  showOverlay('pause');
}

function resumeGame() {
  if (S.dead) return;
  S.running = true;
  showOverlay(null);
}

function move(dr, dc) {
  if (!S.running || S.dead || !S.player.alive) return;
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
        addTrail(pr, pc);
        return;
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

  // Chain counter: increments on each dot collected in this slide
  if (got >= 3) {
    S.chain++;
    if (S.chain > S.chainBest) S.chainBest = S.chain;
    popText('×' + got + (S.chain > 1 ? ' · STREAK ' + S.chain : ''), r, c, cv('--danger'));
  } else if (got === 0 && path.length < 2) {
    // short bump without collect resets streak
    S.chain = 0;
  }

  const maskB = MASKS[S.mask].bonus;
  const scoreMult = maskB === 'score2x' ? 2 : 1;
  const coinMult  = maskB === 'coin2x'  ? 2 : 1;

  let comboBonus = 0;
  if (got >= 3) comboBonus = got * 2 * scoreMult;

  S.score += got * scoreMult + comboBonus;
  S.coins += gotCoins * coinMult;
  S.totalCoins += gotCoins * coinMult;

  // Magnet: if active, pull coins from nearby cells
  if (S.magnetT > 0) {
    for (let rr = Math.max(0, r-2); rr <= Math.min(ROWS-1, r+2); rr++) {
      for (let cc = Math.max(0, c-2); cc <= Math.min(COLS-1, c+2); cc++) {
        const k = rr + ',' + cc;
        if (S.coinsSet.has(k)) {
          S.coinsSet.delete(k);
          S.coins += 1 * coinMult;
          S.totalCoins += 1 * coinMult;
          gotCoins++;
          spawnBurst(rr, cc, cv('--coin'), 4);
        }
      }
    }
  }

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

  for (const [pr, pc] of path) addTrail(pr, pc);

  S.player.r = r; S.player.c = c;
  S.player.scale = 1.4;

  if (S.mode === 'stage' && S.dots.size === 0) levelClear();
}

let lastT = 0;
function update(dt) {
  if (S.levelIntroT > 0) S.levelIntroT = Math.max(0, S.levelIntroT - dt);
  if (S.transition > 0) S.transition = Math.max(0, S.transition - dt * 2);

  if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 40);
  if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 2.2);

  updateParticles(dt);
  updateTrail(dt);
  updatePopups(dt);

  // shatter update
  if (S.player.shatter) {
    for (const p of S.player.shatter) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.life -= dt * 1.5;
    }
    S.player.shatter = S.player.shatter.filter(p => p.life > 0);
  }

  if (!S.running || S.dead) return;
  if (S.freezeT > 0) S.freezeT = Math.max(0, S.freezeT - dt);
  if (S.magnetT > 0) S.magnetT = Math.max(0, S.magnetT - dt);

  updateHazards(dt);
  updateLava(dt);

  if (S.mode === 'arcade') arcadeUpdate(dt);
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
  document.documentElement.style.background = '';
  document.documentElement.style.color = '';
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
document.getElementById('playBtn').addEventListener('click', () => {
  if (S.mode === 'arcade') startArcade();
  else startRun(1);
});
document.getElementById('practiceBtn').addEventListener('click', () => startRun(S.best.level));
document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
document.getElementById('retryBtn').addEventListener('click', () => {
  if (S.mode === 'arcade') startArcade();
  else startRun(1);
});
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

// Mode buttons
document.getElementById('modeStage').addEventListener('click', () => {
  S.mode = 'stage';
  renderMaskMenu();
});
document.getElementById('modeArcade').addEventListener('click', () => {
  S.mode = 'arcade';
  renderMaskMenu();
});

// Settings
const settingsBtn = document.getElementById('settingsBtn');
const settingsClose = document.getElementById('settingsClose');
const resetProgress = document.getElementById('resetProgress');

settingsBtn.addEventListener('click', () => {
  S.previousScreen = S.screen === 'settings' ? S.previousScreen : S.screen;
  if (S.running) pauseGame();
  wireSettings();
  showOverlay('settings');
});

settingsClose.addEventListener('click', () => {
  const back = S.previousScreen;
  S.previousScreen = null;
  if (back === 'playing' || back === 'pause') {
    S.dead = false;
    resumeGame();
  } else if (back === 'dead') {
    showOverlay('dead');
  } else if (back === 'shop') {
    showOverlay('shop');
  } else {
    renderMaskMenu();
    showOverlay('menu');
  }
});

resetProgress.addEventListener('click', () => {
  if (!confirm('Reset all progress? Coins, masks, and best score will be cleared.')) return;
  localStorage.removeItem('mask-best');
  localStorage.removeItem('mask-owned');
  localStorage.removeItem('mask-skin');
  S.best = { score: 0, level: 1, arcade: 0 };
  S.owned = ['classic'];
  S.mask = 'classic';
  S.totalCoins = 0;
  S.running = false;
  S.dead = false;
  S.previousScreen = null;
  renderMaskMenu();
  showOverlay('menu');
  toast('Progress reset');
});

// Init
applyTheme();
resize();
genLevel();
S.running = false;
renderMaskMenu();
requestAnimationFrame(loop);
// ---------- SERVICE WORKER ----------
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
