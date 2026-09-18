const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const levelEl = document.getElementById('level');

function updateHUD() {
  scoreEl.textContent = S.score;
  coinsEl.textContent = S.coins;
  levelEl.textContent = S.level;
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
  menu:  document.getElementById('menuOverlay'),
  shop:  document.getElementById('shopOverlay'),
  dead:  document.getElementById('deadOverlay'),
  pause: document.getElementById('pauseOverlay')
};

function showOverlay(name) {
  Object.values(overlays).forEach(o => o.classList.remove('show'));
  if (name && overlays[name]) overlays[name].classList.add('show');
  S.screen = name || 'playing';
}

// ---------- SHOP ----------
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
      <div class="info">
        <b>${it.name}</b>
        <span>${it.desc}</span>
      </div>
      <button class="btn small">◈ ${it.cost}</button>
    `;
    grid.appendChild(row);
    row.querySelector('button').addEventListener('click', () => {
      if (S.coins < it.cost) { toast('Not enough ◈'); return; }
      S.coins -= it.cost;
      S.inv[it.key]++;
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
      <div class="info">
        <b>Unlock ${m.name} mask</b>
        <span>Permanent unlock</span>
      </div>
      <button class="btn small">◈ ${m.cost}</button>
    `;
    grid.appendChild(row);
    row.querySelector('button').addEventListener('click', () => {
      if (S.coins < m.cost) { toast('Not enough ◈'); return; }
      S.coins -= m.cost;
      S.owned.push(id);
      localStorage.setItem('mask-owned', JSON.stringify(S.owned));
      updateHUD();
      toast('Unlocked ' + m.name);
      openShop();
    });
  });

  showOverlay('shop');
}

// ---------- MASK MENU ----------
function renderMaskMenu() {
  const grid = document.getElementById('maskGrid');
  grid.innerHTML = '';
  document.getElementById('menuCoins').textContent = S.totalCoins;

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
}
