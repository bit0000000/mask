const S = {
  screen: 'menu',
  previousScreen: null,
  mode: 'stage',

  level: 1,
  score: 0,
  coins: 0,
  totalCoins: 0,

  mask: localStorage.getItem('mask-skin') || 'classic',
  owned: JSON.parse(localStorage.getItem('mask-owned') || '["classic"]'),
  best: JSON.parse(localStorage.getItem('mask-best') || '{"score":0,"level":1,"arcade":0}'),
  style: localStorage.getItem('mask-style') || 'yueliang',
  settings: (() => {
    const d = { sound: true, haptics: true, reducedMotion: false, trail: true };
    try {
      const s = JSON.parse(localStorage.getItem('mask-settings') || '{}');
      return Object.assign({}, d, s);
    } catch(e) { return d; }
  })(),

  inv: { shield: 0, freeze: 0, magnet: 0 },
  shield: false,
  freezeT: 0,
  magnetT: 0,

  grid: [],
  dots: new Set(),
  coinsSet: new Set(),
  hazards: [],
  darts: [],

  worldRows: ROWS,
  camY: 0,

  lavaActive: false,
  lavaLevel: 0,
  lavaRise: 0,
  lavaWave: 0,

  chain: 0,
  chainBest: 0,
  boss: false,

  arcadeHeight: 0,
  arcadeLavaTimer: 0,

  transition: 0,
  transitionText: '',

  particles: [],
  trail: [],
  popups: [],
  shake: 0,
  flash: 0,
  flashColor: '#fff',
  levelIntroT: 0,

  startTime: 0,
  deathStats: null,

  player: { r: 0, c: 0, px: 0, py: 0, scale: 1, alive: true, shatter: null },
  running: false,
  dead: false,
  moveLock: 0,
  t: 0
};

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
    S.player.py = (S.player.r + 0.5) * CELL - S.camY + offY;
  }
  if (typeof draw === 'function') draw();
}
window.addEventListener('resize', resize);

function saveSettings() { localStorage.setItem('mask-settings', JSON.stringify(S.settings)); }
function saveBest() { localStorage.setItem('mask-best', JSON.stringify(S.best)); }
