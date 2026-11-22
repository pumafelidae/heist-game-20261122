// audio.js — synthesized sound (WebAudio, no files): footsteps, chimes, alarm.
// One job: sound. No game logic, no drawing.

export function makeAudio() {
  return {
    ctx: null,
    muted: false,
    alarmOsc: null,
    alarmGain: null,
    stepFlip: false,
  };
}

export function ensureAudio(audio) {
  if (audio.ctx) {
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return;
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audio.ctx = new Ctx();
  } catch {
    audio.ctx = null;
  }
}

function tone(audio, freq, dur, type, vol, when = 0) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime + when;
  const osc = audio.ctx.createOscillator();
  const gain = audio.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audio.ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playStep(audio) {
  if (!audio.ctx || audio.muted) return;
  audio.stepFlip = !audio.stepFlip;
  tone(audio, audio.stepFlip ? 190 : 160, 0.05, 'sine', 0.05);
}

export function playPickup(audio, big) {
  tone(audio, 660, 0.12, 'sine', 0.12);
  tone(audio, 990, 0.18, 'sine', 0.12, 0.08);
  if (big) tone(audio, 1320, 0.3, 'sine', 0.14, 0.16);
}

export function playCaught(audio) {
  tone(audio, 320, 0.25, 'sawtooth', 0.1);
  tone(audio, 210, 0.35, 'sawtooth', 0.1, 0.18);
  tone(audio, 140, 0.5, 'sawtooth', 0.1, 0.36);
}

export function playRoomClear(audio) {
  tone(audio, 523, 0.14, 'triangle', 0.12);
  tone(audio, 659, 0.14, 'triangle', 0.12, 0.12);
  tone(audio, 784, 0.28, 'triangle', 0.12, 0.24);
}

export function playWin(audio) {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((n, i) => tone(audio, n, 0.22, 'triangle', 0.13, i * 0.13));
}

export function playTool(audio) {
  tone(audio, 440, 0.1, 'square', 0.06);
  tone(audio, 587, 0.14, 'square', 0.06, 0.07);
}

export function playClick(audio) {
  tone(audio, 880, 0.05, 'sine', 0.05);
}

// A soft alarm drone whose pitch follows the alarm meter. Call every frame.
export function updateAlarmDrone(audio, alarm) {
  if (!audio.ctx || audio.muted) {
    stopAlarmDrone(audio);
    return;
  }
  if (alarm < 30) {
    stopAlarmDrone(audio);
    return;
  }
  if (!audio.alarmOsc) {
    audio.alarmOsc = audio.ctx.createOscillator();
    audio.alarmGain = audio.ctx.createGain();
    audio.alarmOsc.type = 'sine';
    audio.alarmGain.gain.setValueAtTime(0.0001, audio.ctx.currentTime);
    audio.alarmOsc.connect(audio.alarmGain);
    audio.alarmGain.connect(audio.ctx.destination);
    audio.alarmOsc.start();
  }
  const f = 110 + alarm * 1.6;
  audio.alarmOsc.frequency.setTargetAtTime(f, audio.ctx.currentTime, 0.1);
  audio.alarmGain.gain.setTargetAtTime(0.015 + alarm * 0.0002, audio.ctx.currentTime, 0.1);
}

export function stopAlarmDrone(audio) {
  if (audio.alarmOsc) {
    try { audio.alarmOsc.stop(); } catch { /* already stopped */ }
    audio.alarmOsc = null;
    audio.alarmGain = null;
  }
}
