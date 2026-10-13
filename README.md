# Dust & Glory

An original turn-based gladiator RPG with a full-window 3D arena, inspired by classic arena games. Create a fighter, read your opponent’s intentions, buy better equipment, and travel through four story chapters and defeat twelve rivals to decide the arena’s future.

**Play:** https://simonm200024.github.io/game/

## Run locally

Open `index.html` in a modern browser, or serve the repository:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

The published game needs no installation, external CDN, API keys, or account. The committed graphics bundle includes Three.js and runs locally. The modeled gladiators, colosseum, shadows, procedural textures, and synthesized sound are created in the browser. If WebGL is unavailable, combat remains playable with the illustrated arena. GitHub Pages serves the root of `main`.

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

The game fills the browser window. Use **Fullscreen** in the top bar to hide browser chrome on supported browsers; Escape exits fullscreen. Compact control panels scroll internally on small screens. Buttons work with mouse and touch. Sound is optional and off by default. The in-game help explains the rules.

Victories award gold and experience. Every 60 XP increases your level, health, attack, and defense. Brann’s Forge offers five weapons, five armor upgrades, and three shields beyond your starter gear. Owned items can be equipped freely, and bonuses come from your equipped gear. Stock unlocks as you win bouts. Cassian offers six endurance lessons. All health, energy, and bandages refill before each fight. Defeat costs no gold and allows a retry.

Progress saves between fights in this browser’s local storage. Reloading during a bout returns you to the last saved camp. Choose **Continue your saved champion** on the title screen to resume. Starting a new character asks before replacing an existing save. The game remains playable when storage is unavailable, but progress then lasts only for that tab.

## Story and town

Your debt papers lead you through four regions, each with three named opponents:

1. **A Name in the Dust** — Redhaven’s Copper Trial.
2. **The Price of Applause** — the tournament in Highcourt.
3. **Blood on the Ledger** — Cinderport and the prison quay.
4. **The Unbroken** — the Crown Arena in Dawnspire.

Each rival has an introduction, a taunt, and a conclusion. Between bouts, a 3D town replaces the arena:

- **Brann’s Forge:** buy and equip named weapons, armor, and shields. Compare their bonuses with your current gear. New purchases equip automatically; swapping owned gear costs nothing.
- **The Bent Coin:** hear Mira’s chapter-specific rumors and collect one-time rewards for completed jobs.
- **Cassian’s Yard:** purchase permanent maximum-energy upgrades.
- **Your Chronicle:** read unlocked chapters, defeated rivals’ stories, and your ending.

After the final fight, choose to tear up the debt charter or rebuild the arena under the fighters’ control. The ending is saved.

Existing saves from the six-fight version upgrade automatically without losing gold, levels, gear, or wins. A previous champion continues into Chapter III. The storage key remains `dust-and-glory-v1` for compatibility; records now use save schema version 2.

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
npm run test:graphics
npm run test:campaign
npm run test:town
```

The tests use `/usr/bin/chromium` when available, otherwise Playwright’s installed Chromium. Set `CHROMIUM_PATH` to use another Chromium executable or `BASE_URL` to test a different server. Browser screenshots go into the ignored `test-results/` directory.

`test:campaign` checks save migration, inventory validation, chapter boundaries, and job eligibility. `test:town` checks old saves in the browser, stat changes, free re-equipping, shield purchases, one-time rewards, training, and the alternate ending.

The campaign suite uses the illustrated fallback to keep deterministic rule tests fast. The graphics suite separately verifies actual WebGL rendering, fullscreen entry/exit, desktop/mobile/landscape controls, offline combat, and the no-WebGL fallback.

The browser suite covers character creation, purchases, action locking, cooldowns, all twelve campaign victories, leveling, save restoration, chapter introductions, jobs, equipment switching, endings, mobile controls, and the original game. `test:classes` repeats the campaign with Soldier, Brute, and Duelist.

## Starfall

The original space arcade game is still playable at [starfall/](starfall/). Use WASD, arrows, or drag to move; Space activates the shield, and P pauses.

## Editing the 3D graphics

`arena3d.js` contains the Three.js renderer. `game.js` owns combat, town interactions, and saves; `campaign.js` contains the chapters, rivals, gear, jobs, and save migration. `fullscreen.css` contains the viewport layout and `town.css` styles shops, dialogue, and the journal. After changing the renderer, regenerate its committed browser bundle:

```sh
npm run build:graphics
```

Commit `assets/arena3d.bundle.js` and its legal-notice file with renderer changes. GitHub Pages serves that bundle directly, so deployment does not require a Node build. Three.js is distributed under the MIT license in `assets/THREE-LICENSE.txt`.

Live fighters now use a skinned VRM anime model, with a normalized humanoid skeleton, procedural full-body idle/walk/attack/guard/recoil poses, hand-attached sword and shield, blinking, and VRM spring-bone hair simulation. The character viewer supports genuine 360-degree rotation and animation previews. Player and rival share a model with different outfit colors. This is a browser-scale animation implementation, not a AAA animation library. Old illustrated characters remain available when WebGL or model loading fails, and for story portraits.

The model is pixiv's `VRM1_Constraint_Twist_Sample` v1.0.1, distributed according to its embedded VRM 1.0 permission metadata. See `assets/models/ATTRIBUTION.md` and `MODEL-LICENSE.json`. `@pixiv/three-vrm` is MIT licensed. Model, textures, and the painted anime environments are bundled locally; no external avatar service is used during play.

Run `BASE_URL=http://127.0.0.1:8000 node tests/rigged.cjs` for desktop/mobile loading, back-view rotation, visible walking, combat previews, disposal/reopening, and combat checks. `tests/portrait.cjs` covers the illustrated no-WebGL fallback; `tests/world.cjs` checks reduced-motion behavior. Equipment stats and old saves are preserved. Reduced-motion preferences disable idle movement and motion effects.
