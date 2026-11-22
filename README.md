# heist-game-20261122

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/pumafelidae/heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/pumafelidae/heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**MUSEUM MALAM** — a night-museum heist. The National Museum is closed and the
Garuda Mas waits in the vault. Slip through three rooms — the lobby, the
Nusantara painting gallery, the vault — past guards with vision cones and
sweeping security cameras, take the loot and the Garuda Mas, and escape through
the entrance before the alarm meter fills. The alarm recovers when you hide,
tools cost a use (smoke bomb, camera EMP, staff disguise) and there are only
three of them for the whole run — no refills — and every room has more than
one route. Medium difficulty: the alarm rises fast inside a cone and falls
slowly, guards patrol faster and stay suspicious longer, and the gallery and
vault each have an extra guard watching the loot.

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome:

```sh
python3 -m http.server --directory game 8080
```

No network request is made; every script is a file under `game/` and every
sound is synthesized in code.

Controls: WASD / arrows to move, Shift to sneak, E to grab loot, click to walk
to a point, 1 smoke bomb, 2 EMP, 3 disguise, P to pause, M to mute. The three
tools are for the whole run — use them wisely.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Files

- `game/index.html` — the page shell (canvas + status line)
- `game/src/config.js` — every tuning number and colour in one place
- `game/src/random.js` — seeded random (mulberry32), so shots repeat
- `game/src/world.js` — the three rooms, collision, line of sight, alarm, score
- `game/src/guards.js` — patrols, vision cones, suspicion, chase
- `game/src/cameras.js` — sweeping security cameras with blind spots
- `game/src/player.js` — movement, sneaking, grabbing loot, tools
- `game/src/render.js` — top-down night-museum drawing, cones, HUD, panels
- `game/src/input.js` — keyboard + pointer input
- `game/src/audio.js` — synthesized footsteps, alarm drone, chimes (WebAudio, no files)
- `game/src/shots.js` — the four staged screenshot scenes (?shot=cover|play|alert|escape)
- `game/src/main.js` — boot, the fixed-step loop, the six screens
- `main.ts` — the entry program: copies game/ + screenshots/, writes dossier.json
