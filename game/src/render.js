// render.js — everything the player sees: museum, cones, HUD, screens.
// One job: drawing. No game logic, no input, no sound.

import { VIEW_W, VIEW_H, HUD_H, FIELD, COLORS, ALARM_DANGER, GUARD_CONE_RANGE, GUARD_CONE_HALF, CAMERA_RANGE, CAMERA_CONE_HALF } from './config.js';
import { roomLootLeft } from './world.js';

function conePath(ctx, x, y, angle, half, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function drawFloor(ctx, room, t) {
  // Marble checker.
  const tile = 76;
  for (let y = FIELD.y; y < FIELD.y + FIELD.h; y += tile) {
    for (let x = FIELD.x; x < FIELD.x + FIELD.w; x += tile) {
      const even = ((x - FIELD.x) / tile + (y - FIELD.y) / tile) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, tile, tile);
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
  void t;
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
  for (const p of room.paintings) {
    ctx.fillStyle = '#3a2c12';
    ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
    ctx.fillStyle = `hsl(${p.hue}, 45%, 32%)`;
    ctx.fillRect(p.x, p.y, p.w, p.h);
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
  }
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
    } else if (p.kind === 'statue') {
      ctx.fillStyle = '#b8a888';
      ctx.fillRect(p.x + p.w / 2 - 8, p.y + 12, 16, 30);
      ctx.beginPath();
      ctx.arc(p.x + p.w / 2, p.y + 12, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'garuda') {
      // The Garuda Mas plinth: a wide golden bird on a dark slab.
      ctx.fillStyle = '#1a1d2e';
      ctx.fillRect(p.x + 10, p.y + 12, p.w - 20, p.h - 24);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 10, p.y + 12, p.w - 20, p.h - 24);
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
    const g = ctx.createRadialGradient(loot.x, loot.y, 2, loot.x, loot.y, r * 2.4);
    g.addColorStop(0, 'rgba(255, 217, 77, 0.55)');
    g.addColorStop(1, 'rgba(255, 217, 77, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(loot.x, loot.y, r * 2.4, 0, Math.PI * 2); ctx.fill();
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
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    const label = loot.garuda ? 'GARUDA MAS' : loot.name.toUpperCase();
    const ly = loot.y + (loot.garuda ? 34 : 24);
    const lw = ctx.measureText(label).width + 12;
    ctx.fillStyle = 'rgba(8, 10, 20, 0.85)';
    ctx.fillRect(loot.x - lw / 2, ly - 9, lw, 16);
    ctx.strokeStyle = COLORS.goldDim;
    ctx.lineWidth = 1;
    ctx.strokeRect(loot.x - lw / 2, ly - 9, lw, 16);
    ctx.fillStyle = COLORS.gold;
    ctx.fillText(label, loot.x, ly + 3);
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

function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = cam.disabled > 0 ? '#555' : '#c8d8e8';
    ctx.fillRect(-4, -6, 18, 12);
    ctx.fillStyle = cam.disabled > 0 ? '#333' : '#d93a2b';
    ctx.beginPath(); ctx.arc(14, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (cam.disabled > 0) {
      ctx.fillStyle = '#9fb4c8';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP ' + Math.ceil(cam.disabled) + 's', cam.x, cam.y + 22);
    }
  }
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
    // Facing tick + cap.
    ctx.strokeStyle = '#d8e2f2';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
    ctx.stroke();
    ctx.fillStyle = '#d8e2f2';
    ctx.beginPath(); ctx.arc(g.x, g.y - 3, 5, Math.PI, 0); ctx.fill();
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
  // Center: alarm meter.
  const ax = 520;
  const aw = 260;
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALARM', ax + aw / 2, 14);
  ctx.fillStyle = '#22263a';
  ctx.fillRect(ax, 24, aw, 16);
  const frac = s.alarm / 100;
  const col = frac < 0.4 ? COLORS.alarmLow : frac < ALARM_DANGER / 100 ? COLORS.alarmMid : COLORS.alarmHigh;
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
  // Right: score, time, lives, tools.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('SKOR ' + s.score, 1262, 18);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '13px system-ui, sans-serif';
  const mm = Math.floor(s.time / 60);
  const ss = Math.floor(s.time % 60).toString().padStart(2, '0');
  ctx.fillText(`${mm}:${ss}  ·  ` + '♥'.repeat(s.lives) + '♡'.repeat(3 - s.lives), 1262, 40);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '12px system-ui, sans-serif';
  const p = game.player;
  ctx.fillText(`[1] Asap ${p.smoke}   [2] EMP ${p.emp}   [3] Samaran ${p.disguise}`, 1262, 56);
  ctx.textAlign = 'left';
}

function drawVignette(ctx, alarm, flash, t) {
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
  drawExit(ctx, room, room.exit.open);
  drawPedestals(ctx, room, t);
  drawPaintings(ctx, room);
  drawCones(ctx, game.guards, game.cameras);
  drawLoot(ctx, room, t);
  drawWalls(ctx, room);
  drawCameras(ctx, game.cameras);
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
