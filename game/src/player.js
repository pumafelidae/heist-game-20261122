// player.js — the thief: movement, sneaking, grabbing loot, tools, click-to-move.
// One job: the player. No drawing, no input polling (input.js owns that).

import {
  PLAYER_R,
  PLAYER_WALK,
  PLAYER_SNEAK,
  PLAYER_GRAB_R,
  TOOL_SMOKE_START,
  TOOL_EMP_START,
  TOOL_DISGUISE_START,
  SMOKE_R,
  SMOKE_TIME,
  EMP_TIME,
  DISGUISE_TIME,
} from './config.js';
import { moveCircle, pointInRect } from './world.js';

export function makePlayer(room) {
  return {
    x: room.start.x,
    y: room.start.y,
    r: PLAYER_R,
    angle: 0,
    sneaking: false,
    moving: false,
    stepT: 0,
    clickTarget: null,
    clickStuckT: 0,
    clickLastX: 0,
    clickLastY: 0,
    smoke: TOOL_SMOKE_START,
    emp: TOOL_EMP_START,
    disguise: TOOL_DISGUISE_START,
    smokeClouds: [], // {x, y, r, t}
    empTimer: 0,
    disguiseTimer: 0,
    hasGaruda: false,
  };
}

export function updatePlayer(player, dt, input, room) {
  // Tools tick down.
  player.smokeClouds = player.smokeClouds.filter((s) => (s.t -= dt) > 0);
  if (player.empTimer > 0) player.empTimer -= dt;
  if (player.disguiseTimer > 0) player.disguiseTimer -= dt;

  // Direction from keys, or from a click target.
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy -= 1;
  if (dx !== 0 || dy !== 0) {
    player.clickTarget = null;
  } else if (player.clickTarget) {
    const tx = player.clickTarget.x - player.x;
    const ty = player.clickTarget.y - player.y;
    const d = Math.hypot(tx, ty);
    if (d < 6) {
      player.clickTarget = null;
    } else {
      dx = tx / d;
      dy = ty / d;
      // Give up on a click target that makes no progress (behind a wall).
      const moved = Math.hypot(player.x - player.clickLastX, player.y - player.clickLastY);
      if (moved < 0.5) {
        player.clickStuckT += dt;
        if (player.clickStuckT > 1.5) player.clickTarget = null;
      } else {
        player.clickStuckT = 0;
      }
      player.clickLastX = player.x;
      player.clickLastY = player.y;
    }
  }

  player.sneaking = !!input.sneak;
  const speed = player.sneaking ? PLAYER_SNEAK : PLAYER_WALK;
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    const len = Math.hypot(dx, dy) || 1;
    const step = speed * dt;
    const moved = moveCircle(player.x, player.y, player.r, (dx / len) * step, (dy / len) * step, room);
    player.x = moved.x;
    player.y = moved.y;
    player.angle = Math.atan2(dy, dx);
    player.stepT += dt;
  }
  return player.moving;
}

export function nearestLoot(player, room) {
  let best = null;
  let bestD = Infinity;
  for (const loot of room.loot) {
    if (loot.taken) continue;
    const d = Math.hypot(loot.x - player.x, loot.y - player.y);
    if (d < bestD) {
      bestD = d;
      best = loot;
    }
  }
  return { loot: best, dist: bestD };
}

export function tryGrab(player, room) {
  const { loot, dist } = nearestLoot(player, room);
  if (!loot || dist > PLAYER_GRAB_R) return null;
  loot.taken = true;
  if (loot.garuda) player.hasGaruda = true;
  return loot;
}

export function useSmoke(player) {
  if (player.smoke <= 0) return false;
  player.smoke -= 1;
  player.smokeClouds.push({ x: player.x, y: player.y, r: SMOKE_R, t: SMOKE_TIME });
  return true;
}

export function useEmp(player, cameras) {
  if (player.emp <= 0) return false;
  player.emp -= 1;
  player.empTimer = EMP_TIME;
  for (const cam of cameras) cam.disabled = EMP_TIME;
  return true;
}

export function useDisguise(player) {
  if (player.disguise <= 0) return false;
  player.disguise -= 1;
  player.disguiseTimer = DISGUISE_TIME;
  return true;
}

function lootLeftInRoom(room) {
  return room.loot.filter((l) => !l.taken).length;
}

export function playerOnExit(player, room) {
  if (!pointInRect(player.x, player.y, room.exit)) return false;
  if (room.exit.open) return true;
  // The exit opens when the room is empty of loot — or, in the vault,
  // only once the Garuda Mas is in hand.
  if (lootLeftInRoom(room) === 0) return true;
  return false;
}

export function exitShouldOpen(room) {
  if (lootLeftInRoom(room) === 0) return true;
  return false;
}

export function isGarudaRoom(room) {
  return room.loot.some((l) => l.garuda);
}

export function vaultExitReady(player, room) {
  return isGarudaRoom(room) ? player.hasGaruda : lootLeftInRoom(room) === 0;
}
