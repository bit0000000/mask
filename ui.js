const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const chainEl = document.getElementById('chainDisplay');
const lvlDisplayEl = document.getElementById('lvlDisplay');

function updateHUD() {
  scoreEl.textContent = S.score;
  coinsEl.textContent = S.coins;
  if (S.mode === 'arcade') {
    lvlDisplayEl.textContent = '↑ ' + S.arcadeHeight;
  } else {
    lvlDisplayEl.textContent = (S.boss ? 'BOSS ' : 'LV ') + S.level;
  }
  if (S.chain >= 3) {
    chainEl.textContent = '×' + S.chain;
  } else {
    chainEl.textContent = '';
  }
}

const toastEl = document.getElementById('toast');
let toastT;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 1400);
}

const overlays = {
  menu: document.getElementById('menuOverlay'),
  shop: document.getElementById('shopOverlay'),
  dead: document.getElementById('deadOverlay'),
  pause: document.getElementById('pauseOverlay'),
  settings: document.getElementById('settingsOverlay')
};

function showOverlay(name) {
  Object.values(overlays).forEach(o => o.classList.remove('show'));
  if (name && overlays[name]) overlays[name].classList.add('show');
  S.screen = name || 'playing';
}

const SHOP_ITEMS = [
  { key: 'shield', icon: '🛡', name: 'Shield', desc: 'Absorbs one hit next level', cost: 15 },
  { key: 'freeze', icon: '❄', name: 'Freeze', desc: 'Freeze hazards for 3s',     cost: 12 },
  { key: 'magnet', icon: '🧲', name: 'Magnet', desc: 'Attract coins for 5s',      cost: 8  }
];

function openShop() {
  document.getElementById('shopLevel').textContent = S.level;
  const grid = document.getElementById('shopGrid');
  grid.innerHTML = '';

  SHOP_ITEMS.forEach(it => {
    const row = document.createElement('div');
    row.className = 'shop-row';
    row.innerHTML = `
      <div class="icon">${it.icon}</div>
      <div class="info"><b>${it.name}</b><span>${it.desc}</span></div>
      <button class="btn small">◈ ${it.cost}</button>
    `;
    grid.appendChild(row);
    row.querySelector('button').addEventListener('click', () => {
      if (S.coins < it.cost) { toast('Not enough ◈'); return; }
      S.coins -= it.cost;
      S.inv[it.key]++;
      sfx.buy();
      updateHUD();
      toast('Bought ' + it.name);
      openShop();
    });
  });

  const lockedAffordable = MASK_ORDER.filter(id =>
    !S.owned.includes(id) && S.coins >= MASKS[id].cost);

  lockedAffordable.forEach(id => {
    const m = MASKS[id];
    const row = document.createElement('div');
    row.className = 'shop-row';
    row.style.borderColor = 'var(--coin)';
    row.innerHTML = `
      <div class="icon">🎭</div>
      <div class="info"><b>Unlock ${m.name} mask</b><span>Permanent unlock</span></div>
      <button class="btn small">◈ ${m.cost}</button>
    `;
    grid.appendChild(row);
    row.querySelector('button').addEventListener('click', () => {
      if (S.coins < m.cost) { toast('Not enough ◈'); return; }
      S.coins -= m.cost;
      S.owned.push(id);
      localStorage.setItem('mask-owned', JSON.stringify(S.owned));
      sfx.buy();
      updateHUD();
      toast('Unlocked ' + m.name);
      openShop();
    });
  });

  showOverlay('shop');
}

function renderMaskMenu() {
  const grid = document.getElementById('maskGrid');
  grid.innerHTML = '';
  document.getElementById('menuCoins').textContent = S.totalCoins;
  const bestText = S.mode === 'arcade'
    ? 'ARCADE BEST ↑' + (S.best.arcade || 0)
    : 'BEST ' + S.best.score + ' · LEVEL ' + S.best.level;
  document.getElementById('menuBest').textContent = bestText;

  MASK_ORDER.forEach(id => {
    const m = MASKS[id];
    const owned = S.owned.includes(id);
    const active = S.mask === id;
    const card = document.createElement('div');
    card.className = 'mask-card' + (active ? ' active' : '') + (owned ? '' : ' locked');
    const col = m.fixed || cv('--accent');
    card.innerHTML = `
      <div class="swatch" style="background:${col}"></div>
      <div class="name">${m.name}</div>
      ${owned ? (active ? '<div class="cost">EQUIPPED</div>' : '') : `<div class="cost">◈ ${m.cost}</div>`}
    `;
    card.addEventListener('click', () => {
      if (!owned) { toast('Unlock in shop'); return; }
      S.mask = id;
      localStorage.setItem('mask-skin', id);
      renderMaskMenu();
    });
    grid.appendChild(card);
  });

  const pracBtn = document.getElementById('practiceBtn');
  if (S.mode === 'stage' && S.best.level > 1) {
    pracBtn.style.display = '';
    pracBtn.textContent = 'PRACTICE FROM LEVEL ' + S.best.level;
  } else {
    pracBtn.style.display = 'none';
  }

  document.getElementById('modeStage').classList.toggle('active', S.mode === 'stage');
  document.getElementById('modeArcade').classList.toggle('active', S.mode === 'arcade');
}

function renderDeathStats() {
  const el = document.getElementById('deadStats');
  if (!S.deathStats) { el.innerHTML = ''; return; }
  const d = S.deathStats;
  const timeStr = Math.floor(d.time / 60) + ':' + String(Math.floor(d.time % 60)).padStart(2, '0');
  const heightRow = S.mode === 'arcade'
    ? `<div class="k">Height</div><div class="v">${d.height || 0}</div>`
    : '';
  el.innerHTML = `
    ${heightRow}
    <div class="k">Score</div><div class="v">${d.score}</div>
    <div class="k">Coins earned</div><div class="v">${d.coins}</div>
    <div class="k">Time played</div><div class="v">${timeStr}</div>
    <div class="k">Best</div><div class="v">${S.mode === 'arcade' ? '↑' + (S.best.arcade || 0) : S.best.score}</div>
  `;
}

let settingsWired = false;
function wireSettings() {
  if (settingsWired) return;
  settingsWired = true;
  const ids = { sound: 'setSound', haptics: 'setHaptics', trail: 'setTrail', reducedMotion: 'setMotion' };
  Object.keys(ids).forEach(key => {
    const el = document.getElementById(ids[key]);
    el.checked = S.settings[key];
    el.onchange = () => {
      S.settings[key] = el.checked;
      saveSettings();
      if (key === 'sound' && el.checked) initAudio();
    };
  });
}

function maybeShowTutorial() {
  if (localStorage.getItem('mask-tutorial-seen') === 'true') return;
  const wrap = document.querySelector('.game-wrap');
  if (!wrap || document.getElementById('tutorialHint')) return;

  const el = document.createElement('div');
  el.id = 'tutorialHint';
  el.style.cssText = `
    position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    pointer-events:none;z-index:15;animation:tutFade 2.5s ease forwards;
  `;
  el.innerHTML = `
    <div style="
      background:rgba(10,18,38,.85);color:#fff;padding:14px 22px;border-radius:16px;
      font-size:.9rem;font-weight:600;letter-spacing:.03em;text-align:center;
      box-shadow:0 8px 30px rgba(0,0,0,.35);backdrop-filter:blur(4px);
    ">
      <div style="font-size:1.3rem;margin-bottom:4px">↕ ↔</div>
      Swipe to slide
    </div>
  `;
  wrap.appendChild(el);

  if (!document.getElementById('tutStyle')) {
    const s = document.createElement('style');
    s.id = 'tutStyle';
    s.textContent = `
      @keyframes tutFade {
        0%   { opacity:0; transform:translateY(8px); }
        15%  { opacity:1; transform:translateY(0); }
        75%  { opacity:1; transform:translateY(0); }
        100% { opacity:0; transform:translateY(-6px); }
      }
    `;
    document.head.appendChild(s);
  }

  localStorage.setItem('mask-tutorial-seen', 'true');
  setTimeout(() => el.remove(), 2600);
}
