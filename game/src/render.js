// render.js — everything the player sees: museum, cones, HUD, screens.
// One job: drawing. No game logic, no input, no sound.

import { VIEW_W, VIEW_H, HUD_H, FIELD, COLORS, ALARM_DANGER, GUARD_CONE_RANGE, GUARD_CONE_HALF, CAMERA_RANGE, CAMERA_CONE_HALF, CAMERA_SWEEP } from './config.js';
import { roomLootLeft } from './world.js';

function conePath(ctx, x, y, angle, half, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

// Deterministic 0..1 hash of integer tile coords — same floor every run.
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function drawFloor(ctx, room, t) {
  const floor = room.floor || 'stone';
  if (floor === 'wood') {
    // Warm wood planks: horizontal boards with grain and per-board shade.
    const plankH = 38;
    let row = 0;
    for (let y = FIELD.y; y < FIELD.y + FIELD.h; y += plankH, row++) {
      const segs = 3;
      for (let s = 0; s < segs; s++) {
        const x0 = FIELD.x + (FIELD.w / segs) * s;
        const w = FIELD.w / segs;
        const v = hash2(row, s) - 0.5;
        ctx.fillStyle = shade(v > 0 ? COLORS.woodA : COLORS.woodB, Math.round(v * 22));
        ctx.fillRect(x0, y, w, plankH);
        // Grain: two wavy dark lines per board, deterministic.
        ctx.strokeStyle = COLORS.woodLine;
        ctx.lineWidth = 1;
        for (let gLine = 0; gLine < 2; gLine++) {
          const gy = y + 8 + gLine * 14 + hash2(row, s * 7 + gLine) * 6;
          ctx.beginPath();
          ctx.moveTo(x0 + 4, gy);
          ctx.quadraticCurveTo(x0 + w / 2, gy + (hash2(row, s + gLine) - 0.5) * 6, x0 + w - 4, gy);
          ctx.stroke();
        }
      }
      ctx.fillStyle = COLORS.woodLine;
      ctx.fillRect(FIELD.x, y + plankH - 1, FIELD.w, 1);
    }
    // Board joints: staggered vertical seams.
    ctx.fillStyle = COLORS.woodLine;
    for (let r = 0; r < Math.ceil(FIELD.h / plankH); r++) {
      const jx = FIELD.x + ((r % 3) + 1) * (FIELD.w / 4);
      ctx.fillRect(jx, FIELD.y + r * plankH, 1, plankH);
    }
  } else if (floor === 'marble') {
    // Dark marble: big tiles, gold veining, gold trim around the field.
    const tile = 76;
    for (let y = FIELD.y; y < FIELD.y + FIELD.h; y += tile) {
      for (let x = FIELD.x; x < FIELD.x + FIELD.w; x += tile) {
        const v = hash2((x - FIELD.x) / tile, (y - FIELD.y) / tile) - 0.5;
        ctx.fillStyle = shade(v > 0 ? COLORS.marbleA : COLORS.marbleB, Math.round(v * 14));
        ctx.fillRect(x, y, tile, tile);
        // One diagonal gold vein per tile, deterministic angle.
        const a = hash2(x, y) * Math.PI;
        ctx.strokeStyle = COLORS.marbleVein;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + 8 + Math.sin(a) * 20);
        ctx.lineTo(x + tile - 8, y + tile - 8 - Math.cos(a) * 20);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = COLORS.grout;
    ctx.lineWidth = 1;
    for (let x = FIELD.x; x <= FIELD.x + FIELD.w; x += tile) {
      ctx.beginPath(); ctx.moveTo(x, FIELD.y); ctx.lineTo(x, FIELD.y + FIELD.h); ctx.stroke();
    }
    for (let y = FIELD.y; y <= FIELD.y + FIELD.h; y += tile) {
      ctx.beginPath(); ctx.moveTo(FIELD.x, y); ctx.lineTo(FIELD.x + FIELD.w, y); ctx.stroke();
    }
    // Gold trim border around the vault floor.
    ctx.strokeStyle = COLORS.marbleGold;
    ctx.lineWidth = 2;
    ctx.strokeRect(FIELD.x + 6, FIELD.y + 6, FIELD.w - 12, FIELD.h - 12);
  } else {
    // Polished stone: tiles with shade variation + faint veins.
    const tile = 76;
    for (let y = FIELD.y; y < FIELD.y + FIELD.h; y += tile) {
      for (let x = FIELD.x; x < FIELD.x + FIELD.w; x += tile) {
        const v = hash2((x - FIELD.x) / tile, (y - FIELD.y) / tile) - 0.5;
        ctx.fillStyle = shade(v > 0 ? COLORS.stoneA : COLORS.stoneB, Math.round(v * 12));
        ctx.fillRect(x, y, tile, tile);
        ctx.strokeStyle = COLORS.stoneVein;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + tile / 2, y + tile / 2, 20 + hash2(x, y) * 18, hash2(y, x) * 3, hash2(y, x) * 3 + 2.2);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = COLORS.grout;
    ctx.lineWidth = 1;
    for (let x = FIELD.x; x <= FIELD.x + FIELD.w; x += tile) {
      ctx.beginPath(); ctx.moveTo(x, FIELD.y); ctx.lineTo(x, FIELD.y + FIELD.h); ctx.stroke();
    }
    for (let y = FIELD.y; y <= FIELD.y + FIELD.h; y += tile) {
      ctx.beginPath(); ctx.moveTo(FIELD.x, y); ctx.lineTo(FIELD.x + FIELD.w, y); ctx.stroke();
    }
    // Red rugs with gold borders under the paintings.
    for (const p of room.paintings) {
      const ry = p.y < 300 ? p.y + p.h + 16 : p.y - 64;
      ctx.fillStyle = COLORS.rug;
      ctx.fillRect(p.x + 6, ry, p.w - 12, 48);
      ctx.strokeStyle = COLORS.rugEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 6, ry, p.w - 12, 48);
      ctx.fillStyle = COLORS.rugInner;
      ctx.fillRect(p.x + 16, ry + 8, p.w - 32, 32);
      ctx.strokeStyle = COLORS.rugEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x + 16, ry + 8, p.w - 32, 32);
    }
  }
  // Warm spotlight pools under the ceiling lamps.
  for (const lx of [220, 640, 1060]) {
    const g = ctx.createRadialGradient(lx, 400, 10, lx, 400, 260);
    g.addColorStop(0, 'rgba(232, 193, 90, 0.10)');
    g.addColorStop(1, 'rgba(232, 193, 90, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(lx - 260, 140, 520, 520);
  }
  // Red carpet runner down the middle.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(FIELD.x + 560, FIELD.y, 88, FIELD.h);
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(FIELD.x + 560, FIELD.y, 88, FIELD.h);
  ctx.fillStyle = COLORS.carpetEdge;
  ctx.fillRect(FIELD.x + 560, FIELD.y, 88, 4);
  ctx.fillRect(FIELD.x + 560, FIELD.y + FIELD.h - 4, 88, 4);
  // Wall shadows: soft dark gradient just inside the field edges.
  const sh = ctx.createLinearGradient(0, FIELD.y, 0, FIELD.y + 26);
  sh.addColorStop(0, COLORS.wallShadow);
  sh.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(FIELD.x, FIELD.y, FIELD.w, 26);
  const sh2 = ctx.createLinearGradient(0, FIELD.y + FIELD.h, 0, FIELD.y + FIELD.h - 26);
  sh2.addColorStop(0, COLORS.wallShadow);
  sh2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sh2;
  ctx.fillRect(FIELD.x, FIELD.y + FIELD.h - 26, FIELD.w, 26);
  void t;
}

// Drifting dust motes in the lamplight — deterministic, no RNG state.
function drawDust(ctx, t) {
  ctx.fillStyle = COLORS.dust;
  for (let i = 0; i < 42; i++) {
    const bx = FIELD.x + hash2(i, 11) * FIELD.w;
    const by = FIELD.y + hash2(i, 23) * FIELD.h;
    const x = bx + Math.sin(t * 0.12 + i * 1.7) * 14;
    const y = by + Math.cos(t * 0.09 + i * 2.3) * 10;
    const a = 0.05 + 0.09 * (0.5 + 0.5 * Math.sin(t * 0.7 + i));
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(x, y, 1 + hash2(i, 5) * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWalls(ctx, room) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, HUD_H, VIEW_W, 14);
  ctx.fillRect(0, VIEW_H - 14, VIEW_W, 14);
  ctx.fillRect(0, HUD_H, 14, VIEW_H - HUD_H);
  ctx.fillRect(VIEW_W - 14, HUD_H, 14, VIEW_H - HUD_H);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, HUD_H + 14, VIEW_W, 2);
  ctx.fillRect(0, VIEW_H - 16, VIEW_W, 2);
  ctx.fillRect(14, HUD_H, 2, VIEW_H - HUD_H);
  ctx.fillRect(VIEW_W - 16, HUD_H, 2, VIEW_H - HUD_H);
  for (const w of room.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = COLORS.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }
}

function drawPaintings(ctx, room) {
  room.paintings.forEach((p, i) => {
    // Ornate frame: dark outer, gold inner line, corner studs.
    ctx.fillStyle = COLORS.frameDark;
    ctx.fillRect(p.x - 5, p.y - 5, p.w + 10, p.h + 10);
    ctx.strokeStyle = COLORS.frameGold;
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 5, p.y - 5, p.w + 10, p.h + 10);
    ctx.fillStyle = COLORS.gold;
    for (const [cx, cy] of [[p.x - 5, p.y - 5], [p.x + p.w + 5, p.y - 5], [p.x - 5, p.y + p.h + 5], [p.x + p.w + 5, p.y + p.h + 5]]) {
      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    // Canvas.
    ctx.fillStyle = `hsl(${p.hue}, 45%, 32%)`;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    const style = i % 4;
    if (style === 0) {
      // Mountain + sun.
      ctx.fillStyle = `hsl(${p.hue + 40}, 60%, 55%)`;
      ctx.beginPath();
      ctx.moveTo(p.x + 12, p.y + p.h - 10);
      ctx.lineTo(p.x + p.w * 0.45, p.y + 12);
      ctx.lineTo(p.x + p.w - 14, p.y + p.h - 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
      ctx.beginPath();
      ctx.arc(p.x + p.w - 22, p.y + 16, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 1) {
      // Waves: three arcs.
      ctx.strokeStyle = `hsl(${p.hue + 60}, 65%, 65%)`;
      ctx.lineWidth = 4;
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h + 6 - w * 14, 22 + w * 10, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 220, 120, 0.9)';
      ctx.beginPath();
      ctx.arc(p.x + 20, p.y + 14, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 2) {
      // Portrait: head + shoulders.
      ctx.fillStyle = `hsl(${p.hue + 30}, 50%, 60%)`;
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + 20, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(p.x + p.w / 2 - 20, p.y + p.h - 8);
      ctx.quadraticCurveTo(p.x + p.w / 2, p.y + 22, p.x + p.w / 2 + 20, p.y + p.h - 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 220, 120, 0.8)';
      ctx.fillRect(p.x + 8, p.y + 8, 4, p.h - 16);
    } else {
      // Abstract: bold blocks.
      ctx.fillStyle = `hsl(${p.hue + 120}, 70%, 55%)`;
      ctx.fillRect(p.x + 10, p.y + 10, p.w * 0.3, p.h - 20);
      ctx.fillStyle = `hsl(${p.hue + 200}, 65%, 60%)`;
      ctx.beginPath();
      ctx.arc(p.x + p.w * 0.65, p.y + p.h / 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 220, 120, 0.9)';
      ctx.fillRect(p.x + p.w - 26, p.y + 10, 12, p.h - 20);
    }
  });
}

function drawPedestals(ctx, room, t) {
  for (const p of room.pedestals) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(p.x + 4, p.y + 5, p.w, p.h);
    ctx.fillStyle = COLORS.pedestal;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = COLORS.pedestalTop;
    ctx.fillRect(p.x, p.y, p.w, 10);
    ctx.strokeStyle = COLORS.goldDim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    if (p.kind === 'vase') {
      ctx.fillStyle = '#7a9cc6';
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2 - 4, p.y + p.h / 2 - 6, 3, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'statue') {
      ctx.fillStyle = '#b8a888';
      ctx.fillRect(p.x + p.w / 2 - 8, p.y + 12, 16, 30);
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + 12, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(p.x + p.w / 2 - 8, p.y + 12, 4, 30);
    } else if (p.kind === 'desk') {
      // Ticket desk: counter + sign board + ticket stubs.
      ctx.fillStyle = '#5a3a22';
      ctx.fillRect(p.x + 8, p.y + 14, p.w - 16, p.h - 24);
      ctx.fillStyle = '#e8e2c8';
      ctx.fillRect(p.x + p.w / 2 - 18, p.y + 20, 36, 12);
      ctx.fillStyle = '#8e1f2f';
      ctx.font = 'bold 8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TIKET', p.x + p.w / 2, p.y + 29);
      ctx.fillStyle = '#e8e2c8';
      for (let s = 0; s < 3; s++) ctx.fillRect(p.x + 16 + s * 24, p.y + p.h - 14, 14, 6);
    } else if (p.kind === 'shop') {
      // Gift counter: colourful souvenir dots.
      const cols = ['#d93a2b', '#58b368', '#e8c15a', '#7a9cc6'];
      for (let s = 0; s < 4; s++) {
        ctx.fillStyle = cols[s];
        ctx.beginPath();
        ctx.arc(p.x + 18 + s * 24, p.y + p.h / 2 + 4, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.kind === 'garuda') {
      // The Garuda Mas plinth: a wide golden bird on a dark slab,
      // gold-bar stacks at both ends, red laser beams across the slab.
      ctx.fillStyle = '#1a1d2e';
      ctx.fillRect(p.x + 10, p.y + 12, p.w - 20, p.h - 24);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 10, p.y + 12, p.w - 20, p.h - 24);
      // Gold bars stacked at the slab ends.
      for (const bx of [p.x + 16, p.x + p.w - 34]) {
        ctx.fillStyle = COLORS.goldBarDark;
        ctx.fillRect(bx, p.y + p.h - 26, 18, 8);
        ctx.fillStyle = COLORS.goldBar;
        ctx.fillRect(bx + 2, p.y + p.h - 33, 14, 7);
      }
      // Laser grid: two pulsing red beams across the slab + emitters.
      const pulse = 0.55 + 0.35 * Math.sin(t * 5);
      ctx.strokeStyle = `rgba(255, 60, 60, ${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x + 10, p.y + 18); ctx.lineTo(p.x + p.w - 10, p.y + p.h - 18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x + p.w - 10, p.y + 18); ctx.lineTo(p.x + 10, p.y + p.h - 18); ctx.stroke();
      ctx.fillStyle = '#ff3c3c';
      for (const [ex, ey] of [[p.x + 10, p.y + 18], [p.x + p.w - 10, p.y + 18], [p.x + 10, p.y + p.h - 18], [p.x + p.w - 10, p.y + p.h - 18]]) {
        ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  // Non-solid decor: benches and potted plants (drawn after pedestals).
  for (const d of room.decor || []) {
    if (d.kind === 'bench') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(d.x + 3, d.y + 4, 84, 22);
      ctx.fillStyle = COLORS.benchWood;
      ctx.fillRect(d.x, d.y, 84, 16);
      ctx.fillStyle = COLORS.benchWood2;
      ctx.fillRect(d.x, d.y, 84, 4);
      ctx.fillRect(d.x + 4, d.y + 16, 6, 8);
      ctx.fillRect(d.x + 74, d.y + 16, 6, 8);
    } else if (d.kind === 'plant') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(d.x + 3, d.y + 26, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = COLORS.plantGreen;
      for (const [lx, ly, lr] of [[-8, -14, 9], [0, -22, 10], [9, -13, 8], [-3, -8, 7], [5, -6, 6]]) {
        ctx.beginPath();
        ctx.ellipse(d.x + lx, d.y + ly, lr * 0.55, lr, lx * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = COLORS.plantGreen2;
      ctx.beginPath();
      ctx.ellipse(d.x + 2, d.y - 10, 5, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.plantPot;
      ctx.beginPath();
      ctx.moveTo(d.x - 12, d.y);
      ctx.lineTo(d.x + 12, d.y);
      ctx.lineTo(d.x + 8, d.y + 18);
      ctx.lineTo(d.x - 8, d.y + 18);
      ctx.closePath();
      ctx.fill();
    }
  }
  for (const r of room.ropes) {
    ctx.strokeStyle = COLORS.rope;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y1);
    ctx.quadraticCurveTo((r.x1 + r.x2) / 2, Math.max(r.y1, r.y2) + 14, r.x2, r.y2);
    ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    for (const [px, py] of [[r.x1, r.y1], [r.x2, r.y2]]) {
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  void t;
}

function drawExit(ctx, room, open) {
  const e = room.exit;
  ctx.fillStyle = open ? '#1d4d2a' : '#3a2028';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? COLORS.exitGlow : COLORS.rope;
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.rotate(e.x < 100 ? -Math.PI / 2 : Math.PI / 2);
  ctx.fillStyle = open ? '#bfe9c6' : '#d98a94';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(e.label, 0, 0);
  ctx.restore();
}

function drawLoot(ctx, room, t) {
  for (const loot of room.loot) {
    if (loot.taken) continue;
    const pulse = 1 + Math.sin(t * 3 + loot.x) * 0.12;
    const r = (loot.garuda ? 26 : 14) * pulse;
    // Stronger halo + orbiting sparkles so loot pops off the floor.
    const g = ctx.createRadialGradient(loot.x, loot.y, 2, loot.x, loot.y, r * 3);
    g.addColorStop(0, 'rgba(255, 217, 77, 0.7)');
    g.addColorStop(0.45, 'rgba(255, 217, 77, 0.22)');
    g.addColorStop(1, 'rgba(255, 217, 77, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(loot.x, loot.y, r * 3, 0, Math.PI * 2); ctx.fill();
    for (let s = 0; s < 3; s++) {
      const sa = t * 1.4 + loot.x + (s * Math.PI * 2) / 3;
      const sx = loot.x + Math.cos(sa) * r * 1.7;
      const sy = loot.y + Math.sin(sa) * r * 1.7;
      const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 5 + s * 2.1 + loot.x));
      ctx.globalAlpha = tw;
      ctx.fillStyle = '#ffe98a';
      ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (loot.garuda) {
      // Stylised golden garuda: spread wings + head.
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.moveTo(loot.x - 24, loot.y + 12);
      ctx.lineTo(loot.x - 4, loot.y - 14);
      ctx.lineTo(loot.x, loot.y + 2);
      ctx.lineTo(loot.x + 4, loot.y - 14);
      ctx.lineTo(loot.x + 24, loot.y + 12);
      ctx.lineTo(loot.x + 8, loot.y + 16);
      ctx.lineTo(loot.x, loot.y + 6);
      ctx.lineTo(loot.x - 8, loot.y + 16);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(loot.x, loot.y - 12, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.lootGlow;
      ctx.beginPath();
      ctx.moveTo(loot.x, loot.y - 10);
      ctx.lineTo(loot.x + 8, loot.y);
      ctx.lineTo(loot.x, loot.y + 10);
      ctx.lineTo(loot.x - 8, loot.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#1c2138';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const label = loot.garuda ? 'GARUDA MAS' : loot.name.toUpperCase();
    const ly = loot.y + (loot.garuda ? 34 : 24);
    const lw = ctx.measureText(label).width + 14;
    ctx.fillStyle = 'rgba(8, 10, 20, 0.9)';
    ctx.fillRect(loot.x - lw / 2, ly - 9, lw, 17);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(loot.x - lw / 2, ly - 9, lw, 17);
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(label, loot.x, ly + 4);
  }
}

function drawCones(ctx, guards, cameras) {
  for (const cam of cameras) {
    if (cam.disabled > 0) continue;
    conePath(ctx, cam.x, cam.y, cam.angle, CAMERA_CONE_HALF, CAMERA_RANGE);
    ctx.fillStyle = COLORS.cameraCone;
    ctx.fill();
  }
  for (const g of guards) {
    const hot = g.state !== 'patrol';
    conePath(ctx, g.x, g.y, g.angle, GUARD_CONE_HALF, GUARD_CONE_RANGE);
    ctx.fillStyle = hot ? COLORS.guardConeHot : COLORS.guardCone;
    ctx.fill();
  }
}

function drawCameras(ctx, cameras, t) {
  for (const cam of cameras) {
    // Faint arc showing the full sweep extent.
    ctx.strokeStyle = 'rgba(140, 220, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, CAMERA_RANGE, cam.base - CAMERA_SWEEP - CAMERA_CONE_HALF, cam.base + CAMERA_SWEEP + CAMERA_CONE_HALF);
    ctx.stroke();
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    // Wall mount bracket.
    ctx.fillStyle = '#3a4152';
    ctx.fillRect(-10, -3, 8, 6);
    ctx.fillStyle = cam.disabled > 0 ? '#555' : '#c8d8e8';
    ctx.fillRect(-4, -6, 18, 12);
    ctx.fillStyle = cam.disabled > 0 ? '#333' : '#d93a2b';
    // Blinking red lens.
    const blink = cam.disabled > 0 ? 0.3 : (Math.sin(t * 4 + cam.id * 1.7) > 0 ? 1 : 0.25);
    ctx.globalAlpha = blink;
    ctx.beginPath(); ctx.arc(14, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    if (cam.disabled > 0) {
      ctx.fillStyle = '#9fb4c8';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP ' + Math.ceil(cam.disabled) + 's', cam.x, cam.y + 22);
    }
  }
  void t;
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(g.x + 2, g.y + 3, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g.state === 'chase' ? '#a33327' : COLORS.guardBody;
    ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d8e2f2';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, Math.PI * 2); ctx.stroke();
    // Uniform belt.
    ctx.strokeStyle = COLORS.guardBelt;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x - 10, g.y + 4);
    ctx.lineTo(g.x + 10, g.y + 4);
    ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#d8e2f2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
    ctx.stroke();
    // Peaked cap: dome + brim, turned to the facing angle.
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.angle);
    ctx.fillStyle = COLORS.guardCap;
    ctx.beginPath(); ctx.arc(-2, 0, 6, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
    ctx.fillRect(-8, -6, 6, 12);
    ctx.restore();
    if (g.state === 'suspect') {
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 22);
    } else if (g.state === 'chase') {
      ctx.fillStyle = '#ff6a4d';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 22);
    }
  }
}

function drawPlayer(ctx, player, t) {
  // Smoke clouds first (under the player).
  for (const s of player.smokeClouds) {
    const g = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, s.r);
    g.addColorStop(0, COLORS.smoke);
    g.addColorStop(1, 'rgba(200,200,210,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  const bob = player.moving ? Math.sin(player.stepT * 14) * 1.5 : 0;
  // A soft gold glow under the thief so the player always pops off the floor.
  const glow = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, 30);
  glow.addColorStop(0, 'rgba(232, 193, 90, 0.35)');
  glow.addColorStop(1, 'rgba(232, 193, 90, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(player.x, player.y, 30, 0, Math.PI * 2); ctx.fill();
  const pr = player.sneaking ? 12 : 14;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(player.x + 2, player.y + 4, pr + 1, pr, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = player.disguiseTimer > 0 ? '#3a4a2e' : '#39415e';
  ctx.beginPath(); ctx.arc(player.x, player.y + bob * 0.3, pr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.playerTrim;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(player.x, player.y + bob * 0.3, pr, 0, Math.PI * 2); ctx.stroke();
  // Hood point + facing tick, plus a pale face dot so the facing reads.
  ctx.fillStyle = COLORS.playerTrim;
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.angle) * (pr + 3), player.y + Math.sin(player.angle) * (pr + 3));
  ctx.lineTo(player.x + Math.cos(player.angle + 2.5) * 8, player.y + Math.sin(player.angle + 2.5) * 8);
  ctx.lineTo(player.x + Math.cos(player.angle - 2.5) * 8, player.y + Math.sin(player.angle - 2.5) * 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8e2c8';
  ctx.beginPath();
  ctx.arc(player.x + Math.cos(player.angle) * (pr - 4), player.y + Math.sin(player.angle) * (pr - 4), 3, 0, Math.PI * 2);
  ctx.fill();
  if (player.hasGaruda) {
    const gg = ctx.createRadialGradient(player.x, player.y - 18, 1, player.x, player.y - 18, 14);
    gg.addColorStop(0, 'rgba(255, 217, 77, 0.8)');
    gg.addColorStop(1, 'rgba(255, 217, 77, 0)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(player.x, player.y - 18, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath(); ctx.arc(player.x, player.y - 18, 7, 0, Math.PI * 2); ctx.fill();
  }
  // Click-to-move target ring.
  if (player.clickTarget) {
    ctx.strokeStyle = 'rgba(232, 193, 90, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.clickTarget.x, player.clickTarget.y, 8 + Math.sin(t * 6) * 2, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawHud(ctx, game) {
  const s = game.state;
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);
  const room = s.rooms[s.roomIndex];
  // Left: room name + loot.
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MUSEUM MALAM', 18, 20);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`${room.name} · ${room.sub}`, 18, 44);
  ctx.fillStyle = COLORS.lootGlow;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`LOOT ${s.lootGot}/${s.lootTotal}`, 330, 20);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Ruangan ${s.roomIndex + 1}/3 · tersisa ${roomLootLeft(s)}`, 330, 44);
  // Center: alarm meter — pulses red when high.
  const ax = 520;
  const aw = 260;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALARM', ax + aw / 2, 14);
  const frac = s.alarm / 100;
  const col = frac < 0.4 ? COLORS.alarmLow : frac < ALARM_DANGER / 100 ? COLORS.alarmMid : COLORS.alarmHigh;
  if (frac >= ALARM_DANGER / 100) {
    const pulse = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(game.t * 8));
    ctx.fillStyle = `rgba(217, 58, 43, ${pulse})`;
    ctx.fillRect(ax - 4, 20, aw + 8, 24);
  }
  ctx.fillStyle = '#22263a';
  ctx.fillRect(ax, 24, aw, 16);
  ctx.fillStyle = col;
  ctx.fillRect(ax, 24, aw * frac, 16);
  ctx.strokeStyle = '#e8e2c8';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax, 24, aw, 16);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(Math.round(s.alarm) + '%', ax + aw / 2, 32);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(s.alarm >= ALARM_DANGER ? 'TERLIHAT! SEMBUNYI!' : 'belum ketahuan', ax + aw / 2, 52);
  // Right: score, time, lives, tools as coloured chips.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('SKOR ' + s.score, 1262, 18);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px system-ui, sans-serif';
  const mm = Math.floor(s.time / 60);
  const ss = Math.floor(s.time % 60).toString().padStart(2, '0');
  ctx.fillText(`${mm}:${ss}  ·  ` + '♥'.repeat(s.lives) + '♡'.repeat(3 - s.lives), 1262, 40);
  const p = game.player;
  const tools = [
    { key: '[1]', name: 'Asap', n: p.smoke, color: COLORS.toolSmoke },
    { key: '[2]', name: 'EMP', n: p.emp, color: COLORS.toolEmp },
    { key: '[3]', name: 'Samaran', n: p.disguise, color: COLORS.toolDisguise },
  ];
  ctx.font = 'bold 12px system-ui, sans-serif';
  let tx = 1262;
  for (const tool of tools) {
    const label = `${tool.key} ${tool.name} ${tool.n}`;
    const tw = ctx.measureText(label).width + 12;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(tx - tw, 48, tw, 16);
    ctx.fillStyle = tool.color;
    ctx.fillRect(tx - tw, 48, 3, 16);
    ctx.fillStyle = tool.n > 0 ? COLORS.hudText : '#6a7086';
    ctx.fillText(label, tx - 6, 56);
    tx -= tw + 6;
  }
  ctx.textAlign = 'left';
}

function drawVignette(ctx, alarm, flash, t) {
  // Always-on soft vignette for night-museum atmosphere.
  const base = ctx.createRadialGradient(640, 370, 260, 640, 370, 720);
  base.addColorStop(0, 'rgba(0, 0, 0, 0)');
  base.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (alarm > 40 || flash > 0) {
    const a = Math.max(flash * 0.45, (alarm - 40) / 140);
    const g = ctx.createRadialGradient(640, 370, 240, 640, 370, 720);
    g.addColorStop(0, 'rgba(217, 58, 43, 0)');
    g.addColorStop(1, `rgba(217, 58, 43, ${Math.min(0.55, a)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  void t;
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 10, 20, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, VIEW_W / 2, 220);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '18px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 300 + i * 34);
  });
}

export function drawGame(ctx, game, t) {
  const s = game.state;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#0a0c16';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const room = s.rooms[s.roomIndex];
  drawFloor(ctx, room, t);
  drawDust(ctx, t);
  drawExit(ctx, room, room.exit.open);
  drawPedestals(ctx, room, t);
  drawPaintings(ctx, room);
  drawCones(ctx, game.guards, game.cameras);
  drawLoot(ctx, room, t);
  drawWalls(ctx, room);
  drawCameras(ctx, game.cameras, t);
  drawGuards(ctx, game.guards);
  drawPlayer(ctx, game.player, t);
  drawHud(ctx, game);
  drawVignette(ctx, s.alarm, s.caughtFlash, t);

  if (s.messageTimer > 0 && s.message) {
    ctx.fillStyle = 'rgba(8, 10, 20, 0.85)';
    const w = ctx.measureText(s.message).width + 40;
    ctx.fillRect(VIEW_W / 2 - w / 2, 84, w, 34);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(VIEW_W / 2 - w / 2, 84, w, 34);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.message, VIEW_W / 2, 101);
  }

  if (s.screen === 'title') {
    panel(ctx, 'MUSEUM MALAM', [
      'Museum Nasional tutup. Garuda Mas menunggu di brankas.',
      'Lewati 3 ruangan — lobbi, galeri, brankas — tanpa membangunkan alarm.',
      'WASD / panah gerak · Shift mengendap · E ambil barang · klik untuk jalan',
      '[1] Bom asap · [2] EMP kamera · [3] Samaran · P jeda · M suara',
      '',
      'Tekan ENTER untuk masuk lewat jendela belakang',
    ], COLORS.gold);
  } else if (s.screen === 'paused') {
    panel(ctx, 'JEDA', ['Istirahat sebentar. Penjaga tetap patroli.', 'Tekan P untuk lanjut'], COLORS.hudText);
  } else if (s.screen === 'caught') {
    panel(ctx, 'TERTANGKAP!', [
      'Lampu sorot menemukanmu. Satpam menggiringmu ke pintu masuk.',
      `Nyawa tersisa: ${s.lives} — alarm direset, tapi mereka waspada.`,
      'Tekan ENTER untuk mencoba lagi',
    ], COLORS.alarmHigh);
  } else if (s.screen === 'roomclear') {
    const bonus = s.lastBonus || 0;
    panel(ctx, 'RUANGAN BERSIH', [
      `Semua barang di ${room.name} sudah di tangan. Bonus +${bonus}.`,
      s.alarmTrippedThisRoom ? 'Alarm sempat meraung — tanpa bonus senyap.' : 'Tanpa satu pun alarm — bonus senyap +200.',
      'Tekan ENTER ke ruangan berikutnya',
    ], COLORS.exitGlow);
  } else if (s.screen === 'win') {
    const b = s.winBreakdown || { loot: 0, getaway: 0, timeBonus: 0, total: s.score, time: 0, lives: s.lives };
    panel(ctx, 'KABUR!', [
      'Garuda Mas aman di dalam tas. Fajar menyingsing — museum tak tahu apa-apa.',
      `Barang curian: ${b.loot}  ·  Bonus kabur: +${b.getaway}  ·  Bonus waktu: +${b.timeBonus}`,
      `SKOR AKHIR: ${b.total}   ·   Waktu ${Math.floor(b.time / 60)}:${String(Math.floor(b.time % 60)).padStart(2, '0')}   ·   Nyawa ${b.lives}`,
      'Tekan ENTER untuk main lagi',
    ], COLORS.gold);
  } else if (s.screen === 'lose') {
    panel(ctx, 'MUSEUM TUTUP UNTUKMU', [
      'Tiga kali tertangkap. Satpam mengenal wajahmu sekarang.',
      `Skor: ${s.score} — Garuda Mas tetap di brankas.`,
      'Tekan ENTER untuk coba lagi dari awal',
    ], COLORS.alarmHigh);
  }
}
