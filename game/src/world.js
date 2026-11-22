// world.js — the three museum rooms, collision, line of sight, alarm, score.
// One job: the world state and its rules. No drawing, no input, no sound.

import {
  FIELD,
  ALARM_MAX,
  ALARM_DECAY,
  LIVES_START,
  RESPAWN_ALARM,
  LOOT_SMALL,
  LOOT_MEDIUM,
  LOOT_GARUDA,
  ROOM_CLEAR_BONUS,
  STEALTH_BONUS,
  GETAWAY_BONUS,
} from './config.js';

// A wall is {x, y, w, h}. A pedestal is {x, y, w, h, kind}.
// Loot is {x, y, value, name, taken, garuda?}.
// Exit is {x, y, w, h, label, open}.
export function buildRooms() {
  const rooms = [];

  // Room 0 — LOBBY. Wide entrance hall, ticket desk, gift shop, donation box.
  rooms.push({
    name: 'LOBBI',
    sub: 'Selamat datang',
    start: { x: 90, y: 620 },
    walls: [
      { x: 420, y: 92, w: 26, h: 210 }, // pillar wall north-west
      { x: 420, y: 420, w: 26, h: 284 }, // pillar wall south-west (gap = door)
      { x: 760, y: 92, w: 26, h: 150 },
      { x: 760, y: 360, w: 26, h: 344 },
      { x: 980, y: 480, w: 264, h: 24 },
    ],
    pedestals: [
      { x: 240, y: 200, w: 90, h: 60, kind: 'desk' },
      { x: 560, y: 520, w: 110, h: 60, kind: 'shop' },
      { x: 880, y: 180, w: 90, h: 60, kind: 'vase' },
      { x: 1080, y: 560, w: 90, h: 60, kind: 'desk' },
    ],
    paintings: [
      { x: 120, y: 96, w: 150, h: 54, hue: 210 },
      { x: 560, y: 96, w: 150, h: 54, hue: 20 },
      { x: 900, y: 96, w: 150, h: 54, hue: 150 },
    ],
    ropes: [
      { x1: 240, y1: 200, x2: 330, y2: 200 },
      { x1: 880, y1: 180, x2: 970, y2: 180 },
    ],
    loot: [
      { x: 285, y: 230, value: LOOT_SMALL, name: 'Koin karcis', taken: false },
      { x: 615, y: 550, value: LOOT_MEDIUM, name: 'Vas suvenir', taken: false },
      { x: 925, y: 210, value: LOOT_SMALL, name: 'Kotak donasi', taken: false },
    ],
    guards: [
      { x: 520, y: 260, waypoints: [[520, 260], [520, 640], [700, 640], [700, 260]], angle: 0 },
      { x: 1050, y: 200, waypoints: [[1050, 200], [1150, 200], [1150, 330], [1050, 330]], angle: Math.PI },
    ],
    cameras: [
      { x: 1240, y: 150, base: Math.PI * 0.85, phase: 0 },
    ],
    exit: { x: 1212, y: 330, w: 32, h: 90, label: 'GALERI →', open: false },
  });

  // Room 1 — GALLERY. Long hall of Nusantara paintings, rope barriers, more cover.
  rooms.push({
    name: 'GALERI',
    sub: 'Lukisan Nusantara',
    start: { x: 90, y: 375 },
    walls: [
      { x: 380, y: 92, w: 26, h: 190 },
      { x: 380, y: 400, w: 26, h: 304 },
      { x: 700, y: 92, w: 26, h: 140 },
      { x: 700, y: 350, w: 26, h: 354 },
      { x: 1000, y: 92, w: 26, h: 200 },
      { x: 1000, y: 410, w: 26, h: 294 },
    ],
    pedestals: [
      { x: 200, y: 180, w: 90, h: 60, kind: 'statue' },
      { x: 200, y: 540, w: 90, h: 60, kind: 'statue' },
      { x: 520, y: 340, w: 100, h: 60, kind: 'vase' },
      { x: 840, y: 180, w: 90, h: 60, kind: 'statue' },
      { x: 840, y: 540, w: 90, h: 60, kind: 'vase' },
      { x: 1120, y: 340, w: 90, h: 60, kind: 'statue' },
    ],
    paintings: [
      { x: 120, y: 96, w: 170, h: 58, hue: 35 },
      { x: 470, y: 96, w: 170, h: 58, hue: 200 },
      { x: 810, y: 96, w: 170, h: 58, hue: 120 },
      { x: 120, y: 646, w: 170, h: 58, hue: 280 },
      { x: 810, y: 646, w: 170, h: 58, hue: 0 },
    ],
    ropes: [
      { x1: 200, y1: 180, x2: 290, y2: 180 },
      { x1: 520, y1: 340, x2: 620, y2: 340 },
      { x1: 840, y1: 540, x2: 930, y2: 540 },
      { x1: 1120, y1: 340, x2: 1210, y2: 340 },
    ],
    loot: [
      { x: 245, y: 210, value: LOOT_MEDIUM, name: 'Patung perunggu', taken: false },
      { x: 570, y: 370, value: LOOT_SMALL, name: 'Guci keramik', taken: false },
      { x: 885, y: 210, value: LOOT_MEDIUM, name: 'Topeng kayu', taken: false },
      { x: 1165, y: 370, value: LOOT_SMALL, name: 'Keris pajangan', taken: false },
    ],
    guards: [
      { x: 320, y: 420, waypoints: [[320, 420], [620, 420], [620, 620], [320, 620]], angle: 0 },
      { x: 960, y: 320, waypoints: [[960, 320], [960, 480], [1080, 480], [1080, 320]], angle: Math.PI },
      { x: 620, y: 260, waypoints: [[620, 260], [620, 320], [900, 320], [900, 260]], angle: Math.PI / 2 },
    ],
    cameras: [
      { x: 640, y: 96, base: Math.PI / 2, phase: 0 },
      { x: 1240, y: 640, base: Math.PI, phase: 1.6 },
    ],
    exit: { x: 1212, y: 330, w: 32, h: 90, label: 'BRANKAS →', open: false },
  });

  // Room 2 — VAULT. The Garuda Mas sits on a central plinth under two cameras.
  rooms.push({
    name: 'BRANKAS',
    sub: 'Garuda Mas',
    start: { x: 90, y: 375 },
    walls: [
      { x: 420, y: 92, w: 26, h: 240 },
      { x: 420, y: 450, w: 26, h: 254 },
      { x: 820, y: 92, w: 26, h: 180 },
      { x: 820, y: 390, w: 26, h: 314 },
    ],
    pedestals: [
      { x: 560, y: 320, w: 160, h: 100, kind: 'garuda' },
      { x: 240, y: 180, w: 90, h: 60, kind: 'vase' },
      { x: 240, y: 540, w: 90, h: 60, kind: 'statue' },
      { x: 1000, y: 180, w: 90, h: 60, kind: 'statue' },
      { x: 1000, y: 540, w: 90, h: 60, kind: 'vase' },
    ],
    paintings: [
      { x: 520, y: 96, w: 200, h: 58, hue: 45 },
    ],
    ropes: [
      { x1: 560, y1: 320, x2: 720, y2: 320 },
      { x1: 560, y1: 420, x2: 720, y2: 420 },
    ],
    loot: [
      { x: 285, y: 210, value: LOOT_MEDIUM, name: 'Mahkota perak', taken: false },
      { x: 1045, y: 210, value: LOOT_MEDIUM, name: 'Kalung zamrud', taken: false },
      { x: 640, y: 370, value: LOOT_GARUDA, name: 'GARUDA MAS', taken: false, garuda: true },
    ],
    guards: [
      { x: 480, y: 560, waypoints: [[480, 560], [900, 560], [900, 640], [480, 640]], angle: 0 },
      { x: 900, y: 180, waypoints: [[900, 180], [480, 180], [480, 260], [900, 260]], angle: Math.PI },
    ],
    cameras: [
      { x: 640, y: 96, base: Math.PI / 2, phase: 0.4 },
      { x: 640, y: 700, base: -Math.PI / 2, phase: 2.1 },
    ],
    exit: { x: 36, y: 330, w: 32, h: 90, label: '← KABUR', open: false },
  });

  return rooms;
}

export function newGameState() {
  return {
    screen: 'title', // title | playing | paused | roomclear | win | lose | caught
    roomIndex: 0,
    rooms: buildRooms(),
    score: 0,
    lootGot: 0,
    lootTotal: 0,
    alarm: 0,
    lives: LIVES_START,
    time: 0,
    alarmTrippedThisRoom: false,
    caughtFlash: 0,
    grace: 0,
    roomClearTimer: 0,
    winBreakdown: null,
    message: '',
    messageTimer: 0,
  };
}

export function countLoot(rooms) {
  let n = 0;
  for (const r of rooms) n += r.loot.length;
  return n;
}

export function currentRoom(state) {
  return state.rooms[state.roomIndex];
}

export function roomLootLeft(state) {
  return currentRoom(state).loot.filter((l) => !l.taken).length;
}

export function roomGarudaTaken(state) {
  const g = currentRoom(state).loot.find((l) => l.garuda);
  return !g || g.taken;
}

// Circle vs rect: true when they overlap.
export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function solidRects(room) {
  return room.walls.concat(room.pedestals);
}

// Does segment (x1,y1)-(x2,y2) hit rect? Used for line of sight.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function lineOfSightClear(x1, y1, x2, y2, room) {
  for (const rect of solidRects(room)) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function clampToField(x, y, r) {
  return {
    x: Math.max(FIELD.x + r, Math.min(FIELD.x + FIELD.w - r, x)),
    y: Math.max(FIELD.y + r, Math.min(FIELD.y + FIELD.h - r, y)),
  };
}

// Move a circle by (dx, dy) with axis-separated collision against solids.
export function moveCircle(x, y, r, dx, dy, room) {
  let nx = x + dx;
  for (const rect of solidRects(room)) {
    if (circleHitsRect(nx, y, r, rect)) { nx = x; break; }
  }
  let ny = y + dy;
  for (const rect of solidRects(room)) {
    if (circleHitsRect(nx, ny, r, rect)) { ny = y; break; }
  }
  const c = clampToField(nx, ny, r);
  return { x: c.x, y: c.y, movedX: c.x !== x, movedY: c.y !== y };
}

export function addAlarm(state, dt, seen) {
  if (state.grace > 0) return;
  if (seen) {
    state.alarm = Math.min(ALARM_MAX, state.alarm + dt * seen);
    if (state.alarm >= ALARM_MAX) state.alarmTrippedThisRoom = true;
  } else {
    state.alarm = Math.max(0, state.alarm - dt * ALARM_DECAY);
  }
}

export function onCaught(state) {
  state.lives -= 1;
  state.alarm = RESPAWN_ALARM;
  state.caughtFlash = 1.2;
  state.grace = 2.0;
  if (state.lives <= 0) {
    state.screen = 'lose';
    return 'lose';
  }
  state.screen = 'caught';
  return 'caught';
}

export function onRoomCleared(state) {
  const bonus = ROOM_CLEAR_BONUS + (state.alarmTrippedThisRoom ? 0 : STEALTH_BONUS);
  state.score += bonus;
  return bonus;
}

export function onWin(state) {
  const timeBonus = Math.max(0, 1200 - Math.floor(state.time) * 2);
  state.score += GETAWAY_BONUS + timeBonus;
  state.winBreakdown = {
    loot: state.score - GETAWAY_BONUS - timeBonus,
    getaway: GETAWAY_BONUS,
    timeBonus,
    total: state.score,
    time: Math.floor(state.time),
    lives: state.lives,
  };
  state.screen = 'win';
}
