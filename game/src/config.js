// config.js — every tuning number and colour for MUSEUM MALAM in one place.
// One job: constants. No game logic lives here.

export const VIEW_W = 1280;
export const VIEW_H = 740;
export const HUD_H = 64;

// Playfield bounds (inside the museum walls).
export const FIELD = { x: 36, y: 92, w: 1208, h: 612 };

export const PLAYER_R = 12;
export const PLAYER_WALK = 150;
export const PLAYER_SNEAK = 82;
export const PLAYER_GRAB_R = 70; // reach over a pedestal edge to its loot

export const GUARD_R = 13;
export const GUARD_PATROL_SPEED = 56;
export const GUARD_CHASE_SPEED = 98;
export const GUARD_CONE_RANGE = 178;
export const GUARD_CONE_HALF = 0.62; // radians, ~35 degrees
export const GUARD_SUSPECT_TIME = 0.9; // seconds of sight before chase
export const GUARD_LOSE_TIME = 2.2; // seconds out of sight before giving up

export const CAMERA_RANGE = 212;
export const CAMERA_CONE_HALF = 0.5;
export const CAMERA_SWEEP = 0.85; // radians either side of base angle
export const CAMERA_SWEEP_SPEED = 0.55; // rad/s
export const CAMERA_SEE_RATE = 26; // alarm points per second while seen

export const ALARM_GUARD_RATE = 30; // alarm points per second while a guard sees you
export const ALARM_SNEAK_RATE = 16; // same, while you sneak
export const ALARM_DECAY = 13; // alarm points per second while nobody sees you
export const ALARM_MAX = 100;
export const ALARM_DANGER = 70;

export const LIVES_START = 3;
export const RESPAWN_ALARM = 40;
export const RESPAWN_GRACE = 2.0; // seconds unseen after a catch

export const TOOL_SMOKE_START = 2;
export const TOOL_EMP_START = 1;
export const TOOL_DISGUISE_START = 1;
export const SMOKE_R = 92;
export const SMOKE_TIME = 4.0;
export const EMP_TIME = 6.0;
export const DISGUISE_TIME = 5.0;
export const DISGUISE_CLOSE_R = 42; // guards still spot you this close

export const LOOT_SMALL = 100;
export const LOOT_MEDIUM = 250;
export const LOOT_GARUDA = 1000;
export const ROOM_CLEAR_BONUS = 300;
export const STEALTH_BONUS = 200;
export const GETAWAY_BONUS = 500;

export const COLORS = {
  floorA: '#1c2138',
  floorB: '#181c30',
  grout: '#232947',
  wall: '#0d0f1c',
  wallTrim: '#c9a227',
  carpet: '#3d1f2b',
  carpetEdge: '#6b2f3f',
  pedestal: '#2a2f45',
  pedestalTop: '#3a4066',
  rope: '#8e1f2f',
  gold: '#e8c15a',
  goldDim: '#a8852f',
  lootGlow: '#ffd94d',
  guardBody: '#2e4a7a',
  guardCone: 'rgba(255, 214, 90, 0.16)',
  guardConeHot: 'rgba(255, 120, 60, 0.28)',
  cameraCone: 'rgba(140, 220, 255, 0.13)',
  cameraConeHot: 'rgba(255, 80, 80, 0.25)',
  player: '#20242e',
  playerTrim: '#e8c15a',
  hudBg: '#0a0c16',
  hudText: '#e8e2c8',
  alarmLow: '#58b368',
  alarmMid: '#e8a13c',
  alarmHigh: '#d93a2b',
  smoke: 'rgba(200, 200, 210, 0.35)',
  exitGlow: '#58b368',
};
