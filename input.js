document.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'arrowup' || k === 'w')         { e.preventDefault(); move(-1, 0); }
  else if (k === 'arrowdown' || k === 's')  { e.preventDefault(); move(1, 0); }
  else if (k === 'arrowleft' || k === 'a')  { e.preventDefault(); move(0, -1); }
  else if (k === 'arrowright' || k === 'd') { e.preventDefault(); move(0, 1); }
  else if (k === 'escape') {
    if (S.screen === 'playing' && S.running) pauseGame();
    else if (S.screen === 'pause') resumeGame();
  }
});

let touchStart = null;
canvas.addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  if (Math.hypot(dx, dy) < 18) { touchStart = null; return; }
  if (Math.abs(dx) > Math.abs(dy)) move(0, dx > 0 ? 1 : -1);
  else move(dy > 0 ? 1 : -1, 0);
  touchStart = null;
}, { passive: true });

canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

let mouseDown = null;
canvas.addEventListener('mousedown', (e) => { mouseDown = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('mouseup', (e) => {
  if (!mouseDown) return;
  const dx = e.clientX - mouseDown.x;
  const dy = e.clientY - mouseDown.y;
  if (Math.hypot(dx, dy) < 18) { mouseDown = null; return; }
  if (Math.abs(dx) > Math.abs(dy)) move(0, dx > 0 ? 1 : -1);
  else move(dy > 0 ? 1 : -1, 0);
  mouseDown = null;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
