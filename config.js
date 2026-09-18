// Grid & timing
const COLS = 8, ROWS = 12;
const MOVE_DELAY = 70;

// Read a CSS variable from body
function cv(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

// Convert #rrggbb to rgba()
function hexA(hex, a) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// 8x8 pixel sprites — '#' is a filled pixel
const SPR_PLAYER = [
  "........",
  ".######.",
  "########",
  "##.##.##",
  "########",
  "##....##",
  "########",
  ".######."
];
const SPR_BAT = [
  "#.....#",
  "##...##",
  ".#####.",
  "..###..",
  "...#..."
];
