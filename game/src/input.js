// input.js — keyboard + pointer input, kept in one small state object.
// One job: read the player's keys and clicks. No game logic.

export function makeInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    grab: false, // edge-triggered: true for one frame after E is pressed
    smoke: false, // edge-triggered: key 1
    emp: false, // edge-triggered: key 2
    disguise: false, // edge-triggered: key 3
    pause: false, // edge-triggered: P or Escape
    confirm: false, // edge-triggered: Enter
    mute: false, // edge-triggered: M
    clickX: 0,
    clickY: 0,
    clicked: false, // edge-triggered: mouse click on the canvas
  };
}

const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

const EDGE_KEYS = {
  KeyE: 'grab',
  Digit1: 'smoke',
  Digit2: 'emp',
  Digit3: 'disguise',
  KeyP: 'pause',
  Escape: 'pause',
  Enter: 'confirm',
  KeyM: 'mute',
};

export function attachInput(input, canvas) {
  window.addEventListener('keydown', (e) => {
    const held = KEYMAP[e.code];
    if (held) {
      input[held] = true;
      e.preventDefault();
      return;
    }
    const edge = EDGE_KEYS[e.code];
    if (edge && !e.repeat) {
      input[edge] = true;
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    const held = KEYMAP[e.code];
    if (held) input[held] = false;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.clicked = true;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.sneak = false;
  });
}

// Clear the one-frame edge flags after the game has read them.
export function clearEdges(input) {
  input.grab = false;
  input.smoke = false;
  input.emp = false;
  input.disguise = false;
  input.pause = false;
  input.confirm = false;
  input.mute = false;
  input.clicked = false;
}
