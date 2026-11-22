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
export const GUARD_PATROL_SPEED = 56; // back to the original: the 64 patrol gave the player no window to cross the gallery's middle; the medium difficulty stays via +1 guards, faster alarm, scarcer tools, faster cameras
export const GUARD_CHASE_SPEED = 100; // was 108: a chasing guard must be outrunnable on foot (walk 150); 100 keeps it faster than the original 98
export const GUARD_CONE_RANGE = 178;
export const GUARD_CONE_HALF = 0.62; // radians, ~35 degrees
export const GUARD_SUSPECT_TIME = 0.75; // seconds of sight before chase
export const GUARD_LOSE_TIME = 2.8; // seconds out of sight before giving up (was 3.5; still longer than the original 2.2, but a broken line of sight must actually end the chase)

export const CAMERA_RANGE = 230;
export const CAMERA_CONE_HALF = 0.5; // half-angle in radians (back to the original: the wider 0.58 cone covered the whole northern crossing and proved unwinnable)
export const CAMERA_SWEEP = 0.85; // radians either side of base angle
export const CAMERA_SWEEP_SPEED = 0.7; // rad/s (was 0.85: the sweep crossed the player's path mid-crossing; 0.7 is still faster than the original 0.55)
export const CAMERA_SEE_RATE = 36; // alarm points per second while seen

export const ALARM_GUARD_RATE = 36; // alarm points per second while a guard sees you (20% faster than the original 30; 42 proved unwinnable)
export const ALARM_SNEAK_RATE = 22; // same, while you sneak
export const ALARM_DECAY = 13; // alarm points per second while nobody sees you (back to the original: the slower 9/11 never let the meter recover between the gallery's frequent brief sightings)
export const ALARM_MAX = 100;
export const ALARM_DANGER = 70;

export const LIVES_START = 3;
export const RESPAWN_ALARM = 40;
export const RESPAWN_GRACE = 2.0; // seconds unseen after a catch

export const TOOL_SMOKE_START = 1; // tools are for the WHOLE run: no refill
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
  guardCap: '#d8e2f2',
  guardBelt: '#141c33',
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
  // Per-room floors.
  woodA: '#4a3423',
  woodB: '#42301f',
  woodLine: '#33261a',
  woodGlow: '#6b4a2a',
  stoneA: '#2e3448',
  stoneB: '#293042',
  stoneVein: 'rgba(180, 190, 220, 0.07)',
  marbleA: '#242839',
  marbleB: '#1f2433',
  marbleVein: 'rgba(200, 180, 120, 0.09)',
  marbleGold: '#c9a227',
  rug: '#5e1f2a',
  rugEdge: '#c9a227',
  rugInner: '#7a2a38',
  wallShadow: 'rgba(0, 0, 0, 0.45)',
  dust: 'rgba(232, 220, 180, 0.4)',
  laser: 'rgba(255, 60, 60, 0.85)',
  laserGlow: 'rgba(255, 60, 60, 0.25)',
  goldBar: '#e8c15a',
  goldBarDark: '#a8852f',
  plantGreen: '#3f7a4a',
  plantGreen2: '#2e5c38',
  plantPot: '#7a4a2a',
  benchWood: '#6b4a2a',
  benchWood2: '#54371f',
  frameGold: '#8a6d1f',
  frameDark: '#3a2c12',
  toolSmoke: '#8fa3b8',
  toolEmp: '#e8c15a',
  toolDisguise: '#58b368',
};
