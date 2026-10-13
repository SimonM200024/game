# Dust & Glory

A small, original turn-based gladiator RPG for the browser, inspired by classic arena games. Create a fighter, read your opponent’s intentions, buy better equipment, and defeat six opponents to become champion.

**Play:** https://simonm200024.github.io/game/

## Run locally

Open `index.html` in a modern browser, or serve the repository:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

The game has no runtime dependencies, build step, external assets, API keys, or account requirements. The HTML, CSS, SVG artwork, and synthesized sound all run locally. GitHub Pages serves the root of `main`.

## How to play

Choose a name, fighting style, and armor color. You begin with 45 gold—enough for a weapon or armor upgrade. Each action gives the opponent one turn. Their next move appears above the arena.

| Key | Action | Effect |
| --- | --- | --- |
| 1 | Quick strike | Accurate attack; no energy cost |
| 2 | Heavy blow | Stronger, less accurate attack; costs 3 energy |
| 3 | Guard | Reduces the next hit by 70%; restores 2 energy |
| 4 | Catch breath | Restores 4 energy |
| 5 | Glory strike | Powerful, guaranteed hit; costs 5 energy; three-turn cooldown |
| 6 | Bandage | Heals up to 30 health; two uses per fight |

Buttons work with mouse and touch. Sound is optional and off by default. The in-game help explains the rules.

Victories award gold and experience. Every 60 XP increases your level, health, attack, and defense. The armory offers three weapon upgrades, three armor upgrades, and three endurance upgrades. All health, energy, and bandages refill before each fight. Defeat costs no gold and allows a retry.

Progress saves between fights in this browser’s local storage. Reloading during a bout returns you to the last saved camp. Choose **Continue your saved champion** on the title screen to resume. Starting a new character asks before replacing an existing save. The game remains playable when storage is unavailable, but progress then lasts only for that tab.

## Development checks

Node.js and Python 3 are used for development checks; neither is required to play the downloaded game. Install browser-testing dependencies:

```sh
npm ci
npx playwright install chromium
```

Start the local server above in another terminal, then run:

```sh
npm run check
npm test
npm run test:classes
```

The tests use `/usr/bin/chromium` when available, otherwise Playwright’s installed Chromium. Set `CHROMIUM_PATH` to use another Chromium executable or `BASE_URL` to test a different server. Browser screenshots go into the ignored `test-results/` directory.

The browser suite covers character creation, purchases, action locking, cooldowns, all six campaign victories, leveling, save restoration, completed campaigns, help, mobile controls, and the original game. `test:classes` repeats the campaign with Soldier, Brute, and Duelist.

## Starfall

The original space arcade game is still playable at [starfall/](starfall/). Use WASD, arrows, or drag to move; Space activates the shield, and P pauses.
