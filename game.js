// ---------- FLOW ----------
function startRun() {
  S.level = 1;
  S.score = 0;
  S.coins = 0;
  S.inv = { shield: 0, freeze: 0, magnet: 0 };
  S.dead = false;
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
  openShop();
}

function die() {
  S.running = false;
  S.dead = true;
  document.getElementById('deadMsg').textContent =
    'Score: ' + S.score + ' · Level ' + S.level + ' · ◈ ' + S.coins;
  showOverlay('dead');
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

// ---------- MOVE ----------
function move(dr, dc) {
  if (!S.running || S.dead) return;
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
      if (S.shield) { S.shield = false; toast('Shield saved you'); break; }
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

  S.score += got * scoreMult;
  S.coins += gotCoins * coinMult;
  S.totalCoins += gotCoins * coinMult;
  updateHUD();
  if (gotCoins) toast('+' + (gotCoins * coinMult) + ' ◈');

  S.player.r = r; S.player.c = c;
  S.player.scale = 1.4;

  if (S.dots.size === 0) levelClear();
}

// ---------- UPDATE ----------
let lastT = 0;
function update(dt) {
  if (!S.running || S.dead) return;
  if (S.freezeT > 0) S.freezeT = Math.max(0, S.freezeT - dt);
  if (S.magnetT > 0) S.magnetT = Math.max(0, S.magnetT - dt);
  updateHazards(dt);
}

// ---------- LOOP ----------
function loop(now) {
  const t = now / 1000;
  const dt = Math.min(0.05, t - lastT || 0);
  lastT = t;
  S.t = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ---------- THEME ----------
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

// ---------- BUTTONS ----------
document.getElementById('playBtn').addEventListener('click', startRun);
document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
document.getElementById('retryBtn').addEventListener('click', startRun);
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

// ---------- INIT ----------
applyTheme();
resize();
genLevel();
S.running = false;
renderMaskMenu();
requestAnimationFrame(loop);
