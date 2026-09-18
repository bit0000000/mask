const S = {
  screen: 'menu',
  level: 1,
  score: 0,
  coins: 0,
  totalCoins: 0,
  mask: localStorage.getItem('mask-skin') || 'classic',
  owned: JSON.parse(localStorage.getItem('mask-owned') || '["classic"]'),
  inv: { shield: 0, freeze: 0, magnet: 0 },
  shield: false,
  freezeT: 0,
  magnetT: 0,
  grid: [],
  dots: new Set(),
  coinsSet: new Set(),
  hazards: [],
  darts: [],
  player: { r: 0, c: 0, px: 0, py: 0, scale: 1 },
  running: false,
  dead: false,
  moveLock: 0,
  t: 0
};

// Canvas — sized on load and on resize
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, CELL = 0, offX = 0, offY = 0;

function resize() {
  const r = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  W = r.width;
  H = r.height;
  CELL = Math.min(W / COLS, H / ROWS);
  offX = (W - CELL * COLS) / 2;
  offY = (H - CELL * ROWS) / 2;
  if (S.grid.length) {
    S.player.px = offX + (S.player.c + 0.5) * CELL;
    S.player.py = offY + (S.player.r + 0.5) * CELL;
  }
  draw();
}
window.addEventListener('resize', resize);
