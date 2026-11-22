// guards.js — patrols, vision cones, suspicion, chase and giving up.
// One job: guard brains. No drawing, no input.

import {
  GUARD_R,
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_CONE_RANGE,
  GUARD_CONE_HALF,
  GUARD_SUSPECT_TIME,
  GUARD_LOSE_TIME,
} from './config.js';
import { moveCircle, lineOfSightClear } from './world.js';

export function makeGuards(roomDef) {
  return roomDef.guards.map((g, i) => ({
    id: i,
    x: g.x,
    y: g.y,
    angle: g.angle,
    waypoints: g.waypoints,
    wp: 0,
    state: 'patrol', // patrol | suspect | chase
    suspect: 0,
    lose: 0,
    speed: GUARD_PATROL_SPEED,
    lastX: g.x,
    lastY: g.y,
    stuckT: 0,
  }));
}

export function guardSeesPlayer(guard, px, py, room, smokes, disguised) {
  if (disguised) {
    const d = Math.hypot(px - guard.x, py - guard.y);
    if (d > 42) return false;
  }
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_CONE_RANGE) return false;
  let ang = Math.atan2(dy, dx) - guard.angle;
  while (ang > Math.PI) ang -= Math.PI * 2;
  while (ang < -Math.PI) ang += Math.PI * 2;
  if (Math.abs(ang) > GUARD_CONE_HALF) return false;
  for (const s of smokes) {
    if (Math.hypot(px - s.x, py - s.y) < s.r) return false;
    if (segmentInSmoke(guard.x, guard.y, px, py, s)) return false;
  }
  return lineOfSightClear(guard.x, guard.y, px, py, room);
}

function segmentInSmoke(x1, y1, x2, y2, s) {
  // Does the sight line pass through the smoke cloud?
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return false;
  let t = ((s.x - x1) * dx + (s.y - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(s.x - cx, s.y - cy) < s.r * 0.8;
}

export function updateGuard(guard, dt, px, py, room, smokes, disguised, sneaking) {
  const sees = guardSeesPlayer(guard, px, py, room, smokes, disguised);
  let speed = GUARD_PATROL_SPEED;
  let targetX = guard.x;
  let targetY = guard.y;

  if (guard.state === 'chase') {
    if (sees) {
      guard.lose = 0;
      targetX = px;
      targetY = py;
      speed = GUARD_CHASE_SPEED;
    } else {
      guard.lose += dt;
      if (guard.lose > GUARD_LOSE_TIME) {
        guard.state = 'patrol';
        guard.suspect = 0;
        guard.lose = 0;
      } else {
        targetX = px;
        targetY = py;
        speed = GUARD_CHASE_SPEED * 0.7;
      }
    }
  } else if (sees) {
    guard.suspect += dt * (sneaking ? 0.55 : 1);
    if (guard.suspect >= GUARD_SUSPECT_TIME) {
      guard.state = 'chase';
      guard.lose = 0;
    }
    // Suspicious guard turns toward you and creeps closer.
    targetX = px;
    targetY = py;
    speed = GUARD_PATROL_SPEED * 0.6;
  } else {
    guard.suspect = Math.max(0, guard.suspect - dt * 0.45);
    const wp = guard.waypoints[guard.wp];
    targetX = wp[0];
    targetY = wp[1];
    const d = Math.hypot(targetX - guard.x, targetY - guard.y);
    if (d < 8) {
      guard.wp = (guard.wp + 1) % guard.waypoints.length;
    }
    speed = GUARD_PATROL_SPEED;
  }

  const dx = targetX - guard.x;
  const dy = targetY - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 1) {
    const step = Math.min(dist, speed * dt);
    const nx = guard.x + (dx / dist) * step;
    const ny = guard.y + (dy / dist) * step;
    const moved = moveCircle(guard.x, guard.y, GUARD_R, nx - guard.x, ny - guard.y, room);
    guard.x = moved.x;
    guard.y = moved.y;
    guard.angle = Math.atan2(dy, dx);
    // Stuck safety net: if a patrol leg is blocked (bad waypoint), skip it
    // instead of pushing into a wall forever.
    const movedDist = Math.hypot(guard.x - guard.lastX, guard.y - guard.lastY);
    if (movedDist < 0.5 && guard.state === 'patrol') {
      guard.stuckT += dt;
      if (guard.stuckT > 1.5) {
        guard.wp = (guard.wp + 1) % guard.waypoints.length;
        guard.stuckT = 0;
      }
    } else {
      guard.stuckT = 0;
    }
    guard.lastX = guard.x;
    guard.lastY = guard.y;
  }
  return sees;
}
