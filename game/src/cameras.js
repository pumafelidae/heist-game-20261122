// cameras.js — wall-mounted security cameras with sweeping cones and blind spots.
// One job: camera brains. No drawing, no input.

import { CAMERA_RANGE, CAMERA_CONE_HALF, CAMERA_SWEEP, CAMERA_SWEEP_SPEED } from './config.js';
import { lineOfSightClear } from './world.js';

export function makeCameras(roomDef) {
  return roomDef.cameras.map((c, i) => ({
    id: i,
    x: c.x,
    y: c.y,
    base: c.base,
    phase: c.phase,
    angle: c.base,
    disabled: 0, // seconds left of EMP shutdown
    sweepT: c.phase,
  }));
}

export function updateCamera(cam, dt) {
  if (cam.disabled > 0) {
    cam.disabled = Math.max(0, cam.disabled - dt);
    return;
  }
  cam.sweepT += dt;
  cam.angle = cam.base + Math.sin(cam.sweepT * CAMERA_SWEEP_SPEED) * CAMERA_SWEEP;
}

export function cameraSeesPlayer(cam, px, py, room, smokes, disguised) {
  if (cam.disabled > 0) return false;
  if (disguised) {
    const d = Math.hypot(px - cam.x, py - cam.y);
    if (d > 42) return false;
  }
  const dx = px - cam.x;
  const dy = py - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA_RANGE) return false;
  let ang = Math.atan2(dy, dx) - cam.angle;
  while (ang > Math.PI) ang -= Math.PI * 2;
  while (ang < -Math.PI) ang += Math.PI * 2;
  if (Math.abs(ang) > CAMERA_CONE_HALF) return false;
  for (const s of smokes) {
    if (Math.hypot(px - s.x, py - s.y) < s.r) return false;
  }
  return lineOfSightClear(cam.x, cam.y, px, py, room);
}
