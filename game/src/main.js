// main.js — boot, the fixed-step loop, screens, and the glue between modules.
// One job: run the game. No drawing, no world rules of its own.

import { VIEW_W, VIEW_H, ALARM_MAX, ALARM_GUARD_RATE, ALARM_SNEAK_RATE, CAMERA_SEE_RATE } from './config.js';
import { newGameState, countLoot, currentRoom, onCaught, onRoomCleared, onWin, roomLootLeft } from './world.js';
import { makeGuards, updateGuard } from './guards.js';
import { makeCameras, updateCamera, cameraSeesPlayer } from './cameras.js';
import { makePlayer, updatePlayer, tryGrab, useSmoke, useEmp, useDisguise, playerOnExit } from './player.js';
import { makeInput, attachInput, clearEdges } from './input.js';
import { makeAudio, ensureAudio, playStep, playPickup, playCaught, playRoomClear, playWin, playTool, playClick, updateAlarmDrone } from './audio.js';
import { drawGame } from './render.js';
import { setupShot } from './shots.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = newGameState();
    this.state.lootTotal = countLoot(this.state.rooms);
    this.input = makeInput();
    this.audio = makeAudio();
    this.player = null;
    this.guards = [];
    this.cameras = [];
    this.t = 0;
    this.lastStepSound = 0;
    this.loadRoom();
  }

  loadRoom() {
    const room = currentRoom(this.state);
    const keep = this.player;
    this.player = makePlayer(room);
    if (keep) {
      // Keep tools and Garuda across rooms; reset position only.
      this.player.smoke = keep.smoke;
      this.player.emp = keep.emp;
      this.player.disguise = keep.disguise;
      this.player.hasGaruda = keep.hasGaruda;
    }
    this.guards = makeGuards(room);
    this.cameras = makeCameras(room);
    this.state.alarmTrippedThisRoom = false;
    this.state.grace = 0;
    room.exit.open = false;
  }

  resetRun() {
    const lootTotal = this.state.lootTotal;
    this.state = newGameState();
    this.state.lootTotal = lootTotal;
    this.player = null;
    this.loadRoom();
  }

  startRun() {
    this.resetRun();
    this.state.screen = 'playing';
  }

  step(dt, quiet = false) {
    const s = this.state;
    this.t += dt;
    if (s.caughtFlash > 0) s.caughtFlash = Math.max(0, s.caughtFlash - dt);
    if (s.messageTimer > 0) s.messageTimer = Math.max(0, s.messageTimer - dt);
    if (s.grace > 0) s.grace = Math.max(0, s.grace - dt);

    const input = this.input;
    if (input.mute) {
      this.audio.muted = !this.audio.muted;
      input.mute = false;
    }

    if (s.screen === 'title' || s.screen === 'win' || s.screen === 'lose') {
      if (input.confirm) {
        if (!quiet) { ensureAudio(this.audio); playClick(this.audio); }
        this.startRun();
      }
      clearEdges(input);
      return;
    }

    if (s.screen === 'caught') {
      if (input.confirm) {
        if (!quiet) { ensureAudio(this.audio); playClick(this.audio); }
        this.respawn();
      }
      clearEdges(input);
      return;
    }

    if (s.screen === 'roomclear') {
      if (input.confirm) {
        if (!quiet) { ensureAudio(this.audio); playClick(this.audio); }
        s.roomIndex += 1;
        this.loadRoom();
        s.screen = 'playing';
      }
      clearEdges(input);
      return;
    }

    if (s.screen !== 'playing') {
      if (s.screen === 'paused' && input.pause) {
        s.screen = 'playing';
      }
      clearEdges(input);
      return;
    }

    if (input.pause) {
      s.screen = 'paused';
      clearEdges(input);
      return;
    }

    s.time += dt;
    const room = currentRoom(s);

    // Click-to-move.
    if (input.clicked) {
      this.player.clickTarget = { x: input.clickX, y: input.clickY };
      input.clicked = false;
    }

    // Tools.
    if (input.smoke) {
      if (useSmoke(this.player)) {
        if (!quiet) { ensureAudio(this.audio); playTool(this.audio); }
        s.message = 'Bom asap! Pandangan mereka tertutup.';
        s.messageTimer = 2;
      } else {
        s.message = 'Bom asap habis!';
        s.messageTimer = 1.5;
      }
    }
    if (input.emp) {
      if (useEmp(this.player, this.cameras)) {
        if (!quiet) { ensureAudio(this.audio); playTool(this.audio); }
        s.message = 'EMP! Semua kamera mati 6 detik.';
        s.messageTimer = 2;
      } else {
        s.message = 'EMP habis!';
        s.messageTimer = 1.5;
      }
    }
    if (input.disguise) {
      if (useDisguise(this.player)) {
        if (!quiet) { ensureAudio(this.audio); playTool(this.audio); }
        s.message = 'Samaran! Kau terlihat seperti staf museum.';
        s.messageTimer = 2;
      } else {
        s.message = 'Samaran habis!';
        s.messageTimer = 1.5;
      }
    }

    const moving = updatePlayer(this.player, dt, input, room);
    if (moving && !quiet) {
      ensureAudio(this.audio);
      if (this.t - this.lastStepSound > (this.player.sneaking ? 0.55 : 0.34)) {
        this.lastStepSound = this.t;
        playStep(this.audio);
      }
    }

    // Grab loot.
    if (input.grab) {
      const loot = tryGrab(this.player, room);
      if (loot) {
        s.score += loot.value;
        s.lootGot += 1;
        if (!quiet) { ensureAudio(this.audio); playPickup(this.audio, !!loot.garuda); }
        s.message = loot.garuda
          ? 'GARUDA MAS DI TANGAN! Kabur lewat pintu masuk!'
          : `${loot.name} diamankan (+${loot.value}).`;
        s.messageTimer = 2.5;
      }
    }

    // Guards + cameras.
    const smokes = this.player.smokeClouds;
    const disguised = this.player.disguiseTimer > 0;
    let seenByGuard = false;
    let seenByCamera = false;
    for (const g of this.guards) {
      const sees = updateGuard(g, dt, this.player.x, this.player.y, room, smokes, disguised, this.player.sneaking);
      if (sees) seenByGuard = true;
    }
    for (const cam of this.cameras) {
      updateCamera(cam, dt);
      if (cameraSeesPlayer(cam, this.player.x, this.player.y, room, smokes, disguised)) seenByCamera = true;
    }

    // Alarm: rises in sight, falls when hidden.
    let rate = 0;
    if (seenByGuard) rate += this.player.sneaking ? ALARM_SNEAK_RATE : ALARM_GUARD_RATE;
    if (seenByCamera) rate += CAMERA_SEE_RATE;
    if (rate > 0) {
      s.alarm = Math.min(ALARM_MAX, s.alarm + dt * rate);
      if (s.alarm >= ALARM_MAX) s.alarmTrippedThisRoom = true;
    } else {
      s.alarm = Math.max(0, s.alarm - dt * 13);
    }
    if (!quiet) updateAlarmDrone(this.audio, s.alarm);

    // Exit opens when the room is emptied.
    room.exit.open = roomLootLeft(s) === 0;

    // Caught?
    if (s.alarm >= ALARM_MAX) {
      const result = onCaught(s);
      if (!quiet) { ensureAudio(this.audio); playCaught(this.audio); }
      if (result === 'lose') {
        clearEdges(input);
        return;
      }
      clearEdges(input);
      return;
    }

    // Reached the exit?
    if (playerOnExit(this.player, room)) {
      if (s.roomIndex >= 2) {
        onWin(s);
        if (!quiet) { ensureAudio(this.audio); playWin(this.audio); }
      } else {
        const bonus = onRoomCleared(s);
        s.lastBonus = bonus;
        s.roomClearTimer = 0;
        s.screen = 'roomclear';
        if (!quiet) { ensureAudio(this.audio); playRoomClear(this.audio); }
        // +1 smoke for the next room.
        this.player.smoke = Math.min(3, this.player.smoke + 1);
      }
      clearEdges(input);
      return;
    }

    clearEdges(input);
  }

  respawn() {
    const room = currentRoom(this.state);
    this.player.x = room.start.x;
    this.player.y = room.start.y;
    this.player.clickTarget = null;
    this.guards = makeGuards(room);
    this.cameras = makeCameras(room);
    this.state.screen = 'playing';
  }

  render() {
    drawGame(this.ctx, this, this.t);
  }

  snapshot() {
    const s = this.state;
    return {
      screen: s.screen,
      roomIndex: s.roomIndex,
      room: s.rooms[s.roomIndex].name,
      score: s.score,
      alarm: Math.round(s.alarm),
      lives: s.lives,
      lootGot: s.lootGot,
      lootTotal: s.lootTotal,
      time: Math.round(s.time * 10) / 10,
      player: { x: Math.round(this.player.x), y: Math.round(this.player.y), hasGaruda: this.player.hasGaruda },
      guards: this.guards.map((g) => ({ state: g.state, x: Math.round(g.x), y: Math.round(g.y) })),
      cameras: this.cameras.map((c) => ({ angle: Math.round(c.angle * 100) / 100, disabled: Math.round(c.disabled * 10) / 10 })),
      tools: { smoke: this.player.smoke, emp: this.player.emp, disguise: this.player.disguise },
      exitOpen: currentRoom(s).exit.open,
    };
  }
}

export function boot() {
  const canvas = document.getElementById('game');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const game = new Game(canvas);
  attachInput(game.input, canvas);

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || 1);
  if (shot) {
    setupShot(game, shot, seed);
    game.render();
    window.__ready = true;
    window.__museum = game;
    return game;
  }

  window.__museum = game;
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= STEP) {
      game.step(STEP);
      acc -= STEP;
    }
    game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__ready = true;
  return game;
}

if (typeof document !== 'undefined') {
  boot();
}
