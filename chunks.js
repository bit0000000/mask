const CHUNKS = [
  { w:4,h:4, cells:[
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0]
  ]},
  { w:4,h:4, cells:[
    [0,0,0,0],
    [0,1,1,0],
    [0,1,1,0],
    [0,0,0,0]
  ]},
  { w:5,h:5, cells:[
    [0,0,1,0,0],
    [0,0,1,0,0],
    [1,1,0,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0]
  ]},
  { w:4,h:4, cells:[
    [0,0,0,1],
    [0,0,1,1],
    [0,1,1,0],
    [1,1,0,0]
  ]},
  { w:4,h:4, cells:[
    [1,0,0,1],
    [0,0,0,0],
    [0,0,0,0],
    [1,0,0,1]
  ]},
  { w:5,h:4, cells:[
    [0,0,0,0,0],
    [0,1,0,1,0],
    [0,1,0,1,0],
    [0,0,0,0,0]
  ]},
  { w:5,h:4, cells:[
    [0,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,0],
    [0,1,1,1,0]
  ]},
  { w:5,h:4, cells:[
    [0,0,0,0,0],
    [0,1,0,1,0],
    [0,1,0,1,0],
    [0,0,0,0,0]
  ]},
  { w:5,h:5, cells:[
    [0,0,0,0,0],
    [0,1,1,0,1],
    [0,1,1,0,1],
    [0,0,0,0,0],
    [1,0,1,1,0]
  ]},
  { w:5,h:5, cells:[
    [0,0,0,0,0],
    [0,0,1,0,0],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,0,0,0,0]
  ]}
];

function transformChunk(chunk) {
  let cells = chunk.cells.map(r => r.slice());
  let w = chunk.w, h = chunk.h;
  const rot = Math.floor(Math.random() * 4);
  for (let k = 0; k < rot; k++) {
    const nc = [];
    for (let c = 0; c < w; c++) {
      const row = [];
      for (let r = h - 1; r >= 0; r--) row.push(cells[r][c]);
      nc.push(row);
    }
    cells = nc;
    [w, h] = [h, w];
  }
  if (Math.random() < 0.5) {
    cells = cells.map(row => row.slice().reverse());
  }
  return { w, h, cells };
}

function fillWithChunks(cols, rows) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) grid[r][c] = 0;
  }

  const placed = [];
  let attempts = 0;
  const maxAttempts = 200;

  while (placed.length < 40 && attempts < maxAttempts) {
    attempts++;
    const t = transformChunk(CHUNKS[Math.floor(Math.random() * CHUNKS.length)]);
    const maxR = rows - t.h;
    const maxC = cols - t.w;
    if (maxR < 1 || maxC < 1) continue;
    const r = 1 + Math.floor(Math.random() * (maxR - 2));
    const c = 1 + Math.floor(Math.random() * (maxC - 2));

    let ok = true;
    for (let dr = 0; dr < t.h && ok; dr++) {
      for (let dc = 0; dc < t.w && ok; dc++) {
        if (t.cells[dr][dc] === 1 && grid[r + dr][c + dc] === 1) ok = false;
      }
    }
    if (!ok) continue;

    for (let dr = 0; dr < t.h; dr++) {
      for (let dc = 0; dc < t.w; dc++) {
        if (t.cells[dr][dc] === 1) grid[r + dr][c + dc] = 1;
      }
    }
    placed.push({ r, c, w: t.w, h: t.h });
  }

  for (let r = 0; r < rows; r++) {
    grid[r][0] = 1;
    grid[r][cols - 1] = 1;
  }
  for (let c = 0; c < cols; c++) {
    grid[0][c] = 1;
    grid[rows - 1][c] = 1;
  }

  return grid;
}

function reachableFrom(grid, sr, sc) {
  const seen = new Set();
  const q = [[sr, sc]];
  seen.add(sr + ',' + sc);
  while (q.length) {
    const [r, c] = q.shift();
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) continue;
      if (grid[nr][nc] === 1) continue;
      const k = nr + ',' + nc;
      if (seen.has(k)) continue;
      seen.add(k);
      q.push([nr, nc]);
    }
  }
  return seen;
}
