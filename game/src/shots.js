// shots.js — staged, deterministic scenes for the four screenshots.
// One job: place the game in a photogenic state for ?shot=cover|play|alert|escape.
// The cover frame shows room + guard cones + cameras + loot + alarm meter together.

import { makePlayer } from './player.js';
import { makeGuards } from './guards.js';
import { makeCameras } from './cameras.js';
import { currentRoom } from './world.js';

// Run the world a fixed number of steps so cones and patrols settle identically.
export function settle(game, steps) {
  for (let i = 0; i < steps; i++) game.step(1 / 60, true);
}

export function setupShot(game, name, seed) {
  const s = game.state;
  s.screen = 'playing';
  s.time = 0;
  s.score = 0;
  s.lootGot = 0;
  s.alarm = 0;
  s.lives = 3;
  s.alarmTrippedThisRoom = false;
  s.caughtFlash = 0;
  s.grace = 0;
  void seed;

  if (name === 'cover') {
    // GALLERY, mid-heist: thief behind a pedestal, a guard cone sweeping past,
    // a camera cone crossing the room, loot glowing, alarm at 35.
    s.roomIndex = 1;
    game.loadRoom();
    const p = game.player;
    p.x = 470; p.y = 430; p.angle = -Math.PI / 2; p.sneaking = true;
    game.guards[0].x = 420; game.guards[0].y = 300; game.guards[0].angle = Math.PI / 2;
    game.guards[1].x = 980; game.guards[1].y = 480; game.guards[1].angle = Math.PI;
    game.guards[2].x = 700; game.guards[2].y = 220; game.guards[2].angle = Math.PI / 2;
    game.guards[3].x = 1150; game.guards[3].y = 420; game.guards[3].angle = -Math.PI / 2;
    game.cameras[0].angle = Math.PI / 2 + 0.5;
    game.cameras[1].angle = Math.PI - 0.4;
    s.alarm = 35;
    s.score = 350;
    s.lootGot = 2;
    currentRoom(s).loot[0].taken = true;
    currentRoom(s).loot[2].taken = true;
    s.time = 96;
    settle(game, 12);
    game.guards[0].angle = Math.PI / 2;
    game.guards[1].angle = Math.PI;
    game.guards[2].angle = Math.PI / 2;
    game.guards[3].angle = -Math.PI / 2;
    game.cameras[0].angle = Math.PI / 2 + 0.5;
    game.cameras[1].angle = Math.PI - 0.4;
    s.alarm = 35;
  } else if (name === 'play') {
    // LOBBY, opening sneak: thief crouched behind the ticket desk,
    // guard patrolling away down the hall.
    s.roomIndex = 0;
    game.loadRoom();
    const p = game.player;
    p.x = 210; p.y = 300; p.angle = 0; p.sneaking = true;
    game.guards[0].x = 640; game.guards[0].y = 560; game.guards[0].angle = 0;
    game.guards[1].x = 980; game.guards[1].y = 480; game.guards[1].angle = -Math.PI / 2;
    game.cameras[0].angle = Math.PI * 0.85 - 0.4;
    s.alarm = 8;
    s.time = 24;
    settle(game, 12);
    game.guards[0].angle = 0;
    game.guards[1].angle = -Math.PI / 2;
    game.cameras[0].angle = Math.PI * 0.85 - 0.4;
    s.alarm = 8;
  } else if (name === 'alert') {
    // GALLERY, alarm high: a guard in full chase, red vignette, alarm 82.
    s.roomIndex = 1;
    game.loadRoom();
    const p = game.player;
    p.x = 560; p.y = 470; p.angle = Math.PI; p.sneaking = false;
    game.guards[0].x = 640; game.guards[0].y = 420; game.guards[0].angle = Math.PI;
    game.guards[0].state = 'chase';
    game.guards[1].x = 980; game.guards[1].y = 300; game.guards[1].angle = -Math.PI / 2;
    game.guards[1].state = 'suspect';
    game.guards[2].x = 700; game.guards[2].y = 260; game.guards[2].angle = Math.PI / 2;
    game.guards[3].x = 1150; game.guards[3].y = 300; game.guards[3].angle = Math.PI / 2;
    game.guards[3].state = 'suspect';
    game.cameras[0].angle = Math.PI / 2 + 0.6;
    game.cameras[1].angle = Math.PI + 0.3;
    s.alarm = 82;
    s.score = 600;
    s.lootGot = 3;
    currentRoom(s).loot[0].taken = true;
    currentRoom(s).loot[1].taken = true;
    currentRoom(s).loot[2].taken = true;
    s.time = 150;
    settle(game, 6);
    game.guards[0].x = 640; game.guards[0].y = 420; game.guards[0].angle = Math.PI;
    game.guards[0].state = 'chase';
    game.guards[1].state = 'suspect';
    game.guards[3].state = 'suspect';
    s.alarm = 82;
  } else if (name === 'escape') {
    // VAULT, the getaway: Garuda Mas just grabbed, exit door open and green,
    // thief running for the door, cameras sweeping behind.
    s.roomIndex = 2;
    game.loadRoom();
    const p = game.player;
    p.x = 700; p.y = 430; p.angle = Math.PI; p.sneaking = false;
    p.hasGaruda = true;
    game.guards[0].x = 520; game.guards[0].y = 600; game.guards[0].angle = 0;
    game.guards[1].x = 860; game.guards[1].y = 220; game.guards[1].angle = Math.PI;
    game.guards[2].x = 700; game.guards[2].y = 560; game.guards[2].angle = Math.PI / 2;
    game.cameras[0].angle = Math.PI / 2 - 0.5;
    game.cameras[1].angle = -Math.PI / 2 + 0.5;
    const room = currentRoom(s);
    room.loot[0].taken = true;
    room.loot[1].taken = true;
    room.loot[2].taken = true;
    room.exit.open = true;
    s.alarm = 20;
    s.score = 1650;
    s.lootGot = 9;
    s.time = 262;
    settle(game, 12);
    game.guards[0].angle = 0;
    game.guards[1].angle = Math.PI;
    game.guards[2].angle = Math.PI / 2;
    game.cameras[0].angle = Math.PI / 2 - 0.5;
    game.cameras[1].angle = -Math.PI / 2 + 0.5;
    room.exit.open = true;
    s.alarm = 20;
  } else {
    // Default: lobby, fresh start.
    s.roomIndex = 0;
    game.loadRoom();
  }
  s.screen = 'playing';
}

export function shotNames() {
  return ['cover', 'play', 'alert', 'escape'];
}

export { makePlayer, makeGuards, makeCameras };
