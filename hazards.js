// Returns true if cell (r,c) currently contains a lethal hazard
function hazardAt(r, c) {
  for (const h of S.hazards) {
    if (h.type === 'spike') {
      if (h.r === r && h.c === c) return true;
    } else if (h.type === 'hidden') {
      if (h.reveal >= 0.5 && h.r === r && h.c === c) return true;
    } else if (h.type === 'bat') {
      if (Math.round(h.r) === r && Math.round(h.c) === c) return true;
    } else if (h.type === 'puffer') {
      const expanding = Math.sin(h.t / h.period * Math.PI * 2) > 0;
      if (expanding) {
        if (Math.abs(h.r - r) <= 1 && Math.abs(h.c - c) <= 1) return true;
      } else if (h.r === r && h.c === c) return true;
    }
  }
  for (const d of S.darts) {
    if (Math.round(d.r) === r && Math.round(d.c) === c) return true;
  }
  return false;
}

// Advance hazard state each frame
function updateHazards(dt) {
  const frozen = S.freezeT > 0;

  for (const h of S.hazards) {
    if (h.type === 'hidden') {
      const dist = Math.max(Math.abs(h.r - S.player.r), Math.abs(h.c - S.player.c));
      if (dist <= 2) h.reveal = Math.min(1, h.reveal + dt * 3);
      else h.reveal = Math.max(0, h.reveal - dt * 1.5);
    } else if (h.type === 'bat' && !frozen) {
      const speed = h.speed * dt;
      const nr = h.r + h.dr * h.dir * speed;
      const nc = h.c + h.dc * h.dir * speed;
      const checkR = Math.round(nr + h.dr * h.dir * 0.5);
      const checkC = Math.round(nc + h.dc * h.dir * 0.5);
      const blocked = checkR < 0 || checkR >= ROWS || checkC < 0 || checkC >= COLS ||
                      S.grid[checkR][checkC] === 1;
      if (blocked) h.dir *= -1;
      else { h.r = nr; h.c = nc; }
    } else if (h.type === 'puffer' && !frozen) {
      h.t += dt;
    } else if (h.type === 'dart') {
      h.t += dt;
      if (h.t >= h.interval && !frozen) {
        h.t = 0;
        S.darts.push({ r: h.r + h.dr, c: h.c + h.dc, dr: h.dr, dc: h.dc, speed: 5 });
      }
    }
  }

  if (!frozen) {
    for (let i = S.darts.length - 1; i >= 0; i--) {
      const d = S.darts[i];
      d.r += d.dr * d.speed * dt;
      d.c += d.dc * d.speed * dt;
      const rr = Math.round(d.r), cc = Math.round(d.c);
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || S.grid[rr][cc] === 1) {
        S.darts.splice(i, 1);
        continue;
      }
      if (rr === S.player.r && cc === S.player.c) {
        S.darts.splice(i, 1);
        if (S.shield) { S.shield = false; toast('Shield saved you'); }
        else { die(); return; }
      }
    }
  }

  // Continuous contact check (bats, puffers)
  for (const h of S.hazards) {
    if (h.type === 'bat') {
      if (Math.round(h.r) === S.player.r && Math.round(h.c) === S.player.c) {
        if (S.shield) { S.shield = false; toast('Shield saved you'); }
        else { die(); return; }
      }
    } else if (h.type === 'puffer') {
      const expanding = Math.sin(h.t / h.period * Math.PI * 2) > 0;
      if (expanding &&
          Math.abs(h.r - S.player.r) <= 1 &&
          Math.abs(h.c - S.player.c) <= 1) {
        if (S.shield) { S.shield = false; toast('Shield saved you'); }
        else { die(); return; }
      }
    }
  }
}
