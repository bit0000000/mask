let actx = null;

function initAudio() {
  if (actx) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { actx = null; }
}

// Fix #6: initialise audio on any user gesture, including keyboard-only
document.addEventListener('touchstart', initAudio, { once: true, passive: true });
document.addEventListener('mousedown', initAudio, { once: true });
document.addEventListener('keydown', initAudio, { once: true });

function beep(freq, dur, type, vol) {
  if (!S.settings.sound || !actx) return;
  try {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    const now = actx.currentTime;
    const v = vol || 0.08;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(v, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(actx.destination);
    o.start(now);
    o.stop(now + dur + 0.02);
  } catch (e) {}
}

const sfx = {
  tick() { beep(880, 0.08, 'sine', 0.07); },
  coin() {
    beep(1320, 0.10, 'square', 0.05);
    setTimeout(() => beep(1760, 0.10, 'square', 0.045), 45);
  },
  die() {
    beep(220, 0.28, 'sawtooth', 0.09);
    setTimeout(() => beep(110, 0.36, 'sawtooth', 0.09), 70);
  },
  level() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => beep(f, 0.14, 'triangle', 0.08), i * 70));
  },
  best() {
    [659, 784, 988, 1319].forEach((f, i) =>
      setTimeout(() => beep(f, 0.18, 'square', 0.07), i * 80));
  },
  buy() {
    beep(660, 0.08, 'triangle', 0.07);
    setTimeout(() => beep(880, 0.10, 'triangle', 0.06), 55);
  },
  shield() {
    beep(440, 0.18, 'sine', 0.08);
    setTimeout(() => beep(660, 0.18, 'sine', 0.07), 80);
  }
};
