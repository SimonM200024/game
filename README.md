# Starfall

A small, dependency-free browser arcade game. Collect cyan stardust, dodge asteroids, and beat your personal best. Consecutive pickups within 3.3 seconds increase your points multiplier up to 5×. The asteroid field gets harder the longer you survive.

## Play

Open `index.html` directly in a modern browser, or serve this directory:

```sh
cd /workspace/game
python3 -m http.server 8000 --bind 0.0.0.0
```

Visit the server in your browser. No build, package installation, network services, or credentials are required. All assets and audio are generated locally.

- **Move:** WASD, arrow keys, or drag the ship with a mouse/finger.
- **Shield:** Space, or the Shield button on touch devices. Protects for 2 seconds; recharges in 8 seconds.
- **Pause/resume:** P, Escape, or the pause button. Switching tabs also pauses the game.
- **Sound:** Optional; enable it with the Sound button.

You have three hull points. After a hit, you are briefly invulnerable. Your best score is saved in this browser when storage is available.

## Files

- `index.html`: interface and accessible controls.
- `style.css`: responsive layout and visual design.
- `game.js`: canvas rendering, controls, audio, and game rules.

To check JavaScript syntax: `node --check game.js`. For a smoke test, start a run, move with the keyboard and touch, collect stardust, activate the shield, pause/resume, and restart after losing all three hull points.
