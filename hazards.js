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
    } else if (h.type === 'saw') {
      if (Math.round(h.r) === r && Math.round(h.c) === c) return true;
    } else if (h.type === 'snake') {
      if (h.state === 'active' && h.progress > 0.2) {
        const sr = Math.round(h.r + (h.dir ? h.dir[0] * h.progress : 0));
        const sc = Math.round(h.c + (h.dir ? h.dir[1] * h.progress : 0));
        if (sr === r && sc === c) return true;
      }
    }
  }
  for (const d of S.darts) {
    if (Math.round(d.r) === r && Math.round(d.c) === c) return true;
  }
  return false;
}

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
    } else if (h.type === 'saw' && !frozen) {
      h.spin += dt * 12;
      const speed = h.speed * dt;
      const nr = h.r + h.dr * h.dir * speed;
      const nc = h.c + h.dc * h.dir * speed;
      const checkR = Math.round(nr + h.dr * h.dir * 0.5);
      const checkC = Math.round(nc + h.dc * h.dir * 0.5);
      const blocked = checkR < 0 || checkR >= ROWS || checkC < 0 || checkC >= COLS ||
                      S.grid[checkR][checkC] === 1;
      if (blocked) h.dir *= -1;
      else { h.r = nr; h.c = nc; }
    } else if (h.type === 'snake') {
      if (h.state === 'idle' && !frozen) {
        // trigger when player is in same row or col
        if (h.r === S.player.r) {
          h.dir = [0, S.player.c > h.c ? 1 : -1];
          h.state = 'active';
          h.progress = 0;
          sfx.buy();
        } else if (h.c === S.player.c) {
          h.dir = [S.player.r > h.r ? 1 : -1, 0];
          h.state = 'active';
          h.progress = 0;
          sfx.buy();
        }
      } else if (h.state === 'active' && !frozen) {
        h.progress += dt * 6;
        // kill if hits player
        const sr = Math.round(h.r + h.dir[0] * h.progress);
        const sc = Math.round(h.c + h.dir[1] * h.progress);
        if (sr === S.player.r && sc === S.player.c) {
          if (S.shield) { S.shield = false; toast('Shield saved you'); sfx.shield(); vibrate(20); shakeScreen(6); }
          else { die(); return; }
        }
        // hit wall = die
        if (sr < 0 || sr >= ROWS || sc < 0 || sc >= COLS || S.grid[sr][sc] === 1) {
          h.state = 'done';
        }
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
        if (S.shield) { S.shield = false; toast('Shield saved you'); sfx.shield(); vibrate(20); shakeScreen(6); }
        else { die(); return; }
      }
    }
  }

  for (const h of S.hazards) {
    if (h.type === 'bat' || h.type === 'saw') {
      if (Math.round(h.r) === S.player.r && Math.round(h.c) === S.player.c) {
        if (S.shield) { S.shield = false; toast('Shield saved you'); sfx.shield(); vibrate(20); shakeScreen(6); }
        else { die(); return; }
      }
    } else if (h.type === 'puffer') {
      const expanding = Math.sin(h.t / h.period * Math.PI * 2) > 0;
      if (expanding && Math.abs(h.r - S.player.r) <= 1 && Math.abs(h.c - S.player.c) <= 1) {
        if (S.shield) { S.shield = false; toast('Shield saved you'); sfx.shield(); vibrate(20); shakeScreen(6); }
        else { die(); return; }
      }
    }
  }
}
