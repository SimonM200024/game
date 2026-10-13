(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'dust-and-glory-v1';
  const COLORS = { rust: '#ac4735', teal: '#397a79', purple: '#796080' };
  const CLASSES = {
    soldier: { label: 'Soldier', hp: 105, attack: 18, defense: 4, energy: 8 },
    brute: { label: 'Brute', hp: 120, attack: 22, defense: 3, energy: 6 },
    duelist: { label: 'Duelist', hp: 90, attack: 17, defense: 3, energy: 11 }
  };
  const OPPONENTS = [
    { name: 'Grit the Unwashed', title: 'The rookie', hp: 65, attack: 12, defense: 2, energy: 6, gold: 38, xp: 35, color: '#8b8052', style: 'soldier' },
    { name: 'Mara Quickblade', title: 'The duelist', hp: 90, attack: 17, defense: 3, energy: 9, gold: 50, xp: 40, color: '#477b7a', style: 'duelist' },
    { name: 'Boulder', title: 'The bruiser', hp: 132, attack: 23, defense: 4, energy: 6, gold: 65, xp: 45, color: '#99613e', style: 'brute' },
    { name: 'The Copper Fang', title: 'The veteran', hp: 145, attack: 25, defense: 6, energy: 9, gold: 80, xp: 50, color: '#b98346', style: 'soldier' },
    { name: 'Nyx of the Dunes', title: 'The executioner', hp: 155, attack: 29, defense: 6, energy: 11, gold: 100, xp: 55, color: '#716386', style: 'duelist' },
    { name: 'Aurelius the Golden', title: 'The champion', hp: 195, attack: 32, defense: 8, energy: 10, gold: 150, xp: 75, color: '#b79a43', style: 'soldier' }
  ];
  const WEAPONS = [{ name: 'Iron sword', cost: 35, attack: 3 }, { name: 'Steel gladius', cost: 75, attack: 4 }, { name: 'Champion’s blade', cost: 120, attack: 5 }];
  const ARMOR = [{ name: 'Leather & bronze', cost: 30, defense: 2 }, { name: 'Arena plate', cost: 65, defense: 3 }, { name: 'Champion’s armor', cost: 110, defense: 4 }];
  let selectedClass = 'soldier', selectedColor = 'rust', hero = null, enemy = null;
  let state = 'creator', busy = false, heroHp = 0, heroEnergy = 0, enemyHp = 0, enemyEnergy = 0;
  let enemyIntent = 'strike', enemyGuard = false, bandages = 2, specialCooldown = 0, turn = 1;
  let audio = null, sound = false, generation = 0, savedHero = null;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const rand = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

  // All SVG inputs are internal palette values and validated numeric equipment tiers.
  function avatar(color, style = 'soldier', weapon = 0, armor = 0, facing = false) {
    const broad = style === 'brute';
    const metal = armor > 1 ? '#c6c6b4' : armor > 0 ? '#b79459' : '#a47d49';
    return `<svg viewBox="0 0 180 250" xmlns="http://www.w3.org/2000/svg"><ellipse cx="89" cy="230" rx="62" ry="9" fill="#543920" opacity=".2"/><g ${facing ? 'transform="translate(180 0) scale(-1 1)"' : ''} stroke="#3f3027" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="m66 171-7 43 19 3 10-43m7-2 10 44 19-5-12-44" fill="#c88e60"/><path d="m57 209 23 2v16H47q-5-11 10-18Zm47 0 21-5 14 18-31 5Z" fill="#66503a"/><path d="m62 215 13 2m37-3 12-3" fill="none" stroke="#bb9765" stroke-width="3"/>
      <path d="M56 113q-12 17-12 39l13 9 15-39m40-9q18 7 20 27l-7 17-13-5-5-24" fill="#c88e60"/>
      <path d="m62 100-8 61 14 20 50-4 10-21-17-57Z" fill="${color}"/><path d="m65 146-11 24 13 10 9-18 4 19h15l2-20 8 18 15-6-8-27" fill="#624332"/><path d="m62 150 53-1" stroke="#d4ae68" stroke-width="8"/><rect x="81" y="144" width="14" height="13" rx="2" fill="#d2ad62"/>
      <path d="M62 101q24 17 50-1l${broad ? '8' : '1'} 35q-29 15-51-1Z" fill="${armor > 0 ? metal : color}"/><path d="m72 109 28 22m-27-6 25-10" stroke="${armor > 0 ? '#8e784f' : '#e8ba75'}" stroke-width="3" opacity=".6"/>
      <path d="m59 99-10 14 19 11 12-19m27-4 11 19 16-10-12-15" fill="${metal}"/>
      <path d="M72 62q-11 7-5 26l7 8v11q18 13 32-2l-2-12q12-7 9-24Z" fill="#d99c6b"/><path d="m77 88 5 1m15-1 5-2" fill="none" stroke-width="4"/><path d="m90 99 10-1" stroke-width="2.5"/>
      <path d="M61 75q-5-39 29-41 32 1 31 38l-15-6-4 15-11-17-10 14-7-7-4 21-10-2Z" fill="${metal}"/><path d="M63 60q25-16 54 0" stroke="#e7c382" stroke-width="5"/><path d="M84 37 78 16q19-11 32 5l-7 20" fill="${color}"/><path d="m87 34-2-15m10 14 1-15" stroke="#edcc96" stroke-width="2" opacity=".5"/>
      <path d="m127 140 14-5 11 9-13 13-12-3Z" fill="#d99c6b"/><g transform="rotate(18 145 130)"><path d="m141 135 2-70 7-19 7 19-6 71Z" fill="${weapon > 1 ? '#f4e6a1' : '#cdd0c5'}"/><path d="m150 57-4 74" stroke="#f6f6dc" stroke-width="2"/><path d="m132 136 29 2" stroke="#d0a253" stroke-width="7"/><path d="m145 140-1 17" stroke="#725137" stroke-width="8"/></g>
      <path d="M30 136q17-15 37-1v41q-17 25-37-1Z" fill="${color}"/><path d="M35 139q12-8 26 0v32q-12 18-26 0Z" fill="${metal}"/><circle cx="48" cy="154" r="9" fill="#e0c18c"/><path d="m48 147 0 14m-7-7h14" stroke="#8e6a3a" stroke-width="2"/>
    </g></svg>`;
  }
  function drawFighters() {
    document.body.dataset.screen = state;
    const data = hero || { color: selectedColor, style: selectedClass, weapon: 0, armor: 0 };
    window.arena3d?.setFighters(
      { color: COLORS[data.color], style: data.style, weapon: data.weapon, armor: data.armor },
      enemy ? { color: enemy.color, style: enemy.style, weapon: Math.min(hero.wins, 3), armor: Math.min(Math.floor(hero.wins / 2), 3) } : null
    );
    $('player-figure').innerHTML = avatar(COLORS[data.color], data.style, data.weapon, data.armor);
    if (enemy) $('enemy-figure').innerHTML = avatar(enemy.color, enemy.style, Math.min(hero.wins, 3), Math.min(Math.floor(hero.wins / 2), 3), true);
  }
  function stats() {
    const base = CLASSES[hero.style];
    return {
      hp: base.hp + (hero.level - 1) * 10 + hero.armor * 10,
      attack: base.attack + (hero.level - 1) * 2 + WEAPONS.slice(0, hero.weapon).reduce((sum, w) => sum + w.attack, 0),
      defense: base.defense + hero.level - 1 + ARMOR.slice(0, hero.armor).reduce((sum, a) => sum + a.defense, 0),
      energy: base.energy + hero.training
    };
  }
  function validSave(data) {
    return data && data.version === 1 && typeof data.name === 'string' && data.name.length > 0 && data.name.length <= 20 && Object.hasOwn(CLASSES, data.style) && Object.hasOwn(COLORS, data.color)
      && ['gold', 'xp', 'wins', 'level', 'weapon', 'armor', 'training'].every(key => Number.isInteger(data[key]) && data[key] >= 0)
      && data.wins <= 6 && data.level >= 1 && data.level <= 10 && data.weapon <= 3 && data.armor <= 3 && data.training <= 3 && data.gold <= 10000 && data.xp < 60;
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (validSave(parsed)) savedHero = parsed;
  } catch {}
  $('continue').hidden = !savedHero;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(hero)); savedHero = { ...hero }; $('save-note').textContent = 'Progress saved. Your next bout is waiting.'; }
    catch { $('save-note').textContent = 'Browser storage unavailable. Keep this tab open to retain progress.'; }
  }
  function note(text) {
    const p = document.createElement('p'); p.textContent = text; $('battle-log').append(p);
    while ($('battle-log').children.length > 35) $('battle-log').firstChild.remove();
    $('battle-log').scrollTop = $('battle-log').scrollHeight;
  }
  function tone(hz, type = 'triangle', length = .12) {
    if (!sound || !audio || audio.state !== 'running') return;
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = type; osc.frequency.setValueAtTime(hz, audio.currentTime); osc.frequency.exponentialRampToValueAtTime(hz * .55, audio.currentTime + length);
    gain.gain.setValueAtTime(.05, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + length);
    osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime + length);
  }
  function animate(id, className) {
    if (id.endsWith('-figure')) window.arena3d?.animate(id.startsWith('player') ? 'player' : 'enemy', className);
    const element = $(id); element.classList.remove(className); void element.offsetWidth; element.classList.add(className);
    setTimeout(() => element.classList.remove(className), 850);
  }
  function float(side, text, healing = false) {
    const element = $(`${side}-float`); element.textContent = text; element.classList.toggle('heal', healing); animate(`${side}-float`, 'pop');
  }
  function update() {
    if (!hero) return;
    const s = stats();
    $('champion-summary').textContent = `${hero.name} · Level ${hero.level} ${CLASSES[hero.style].label}`;
    $('stats-summary').textContent = `${s.attack} ATK / ${s.defense} DEF / ${s.hp} HP`;
    $('gold').textContent = hero.gold; $('xp').textContent = `${hero.xp} / 60 XP`;
    $('player-name').textContent = hero.name; $('player-level').textContent = `LV. ${hero.level}`;
    $('player-health').textContent = `${Math.max(0, heroHp)} / ${s.hp}`; $('player-health-bar').style.width = `${clamp(heroHp / s.hp, 0, 1) * 100}%`;
    $('player-energy').textContent = `ϟ ${heroEnergy} / ${s.energy}`;
    if (enemy) {
      $('enemy-name').textContent = enemy.name; $('enemy-level').textContent = `LV. ${hero.wins + 1}`;
      $('enemy-health').textContent = `${Math.max(0, enemyHp)} / ${enemy.hp}`; $('enemy-health-bar').style.width = `${clamp(enemyHp / enemy.hp, 0, 1) * 100}%`;
      $('enemy-energy').textContent = `ϟ ${enemyEnergy} / ${enemy.energy}`;
    }
    const cost = { strike: 0, heavy: 3, guard: 0, recover: 0, special: 5, bandage: 0 };
    document.querySelectorAll('[data-action]').forEach(button => {
      const action = button.dataset.action;
      button.disabled = state !== 'combat' || busy || heroEnergy < cost[action] || (action === 'special' && specialCooldown > 0) || (action === 'bandage' && (bandages === 0 || heroHp === s.hp));
    });
    $('bandage-label').textContent = `Heal 30 · ${bandages} left`;
    document.querySelector('[data-action="special"] span').textContent = specialCooldown > 0 ? `Ready in ${specialCooldown} turn${specialCooldown === 1 ? '' : 's'}` : 'Big damage · 5 energy';
    $('turn-label').textContent = busy ? 'OPPONENT’S TURN' : `YOUR TURN · ${turn}`;
  }
  function shop() {
    const weapon = WEAPONS[hero.weapon], armor = ARMOR[hero.armor];
    $('weapon-name').textContent = weapon ? weapon.name : 'Champion’s blade'; $('weapon-info').textContent = weapon ? `+${weapon.attack} attack` : 'Fully upgraded'; $('weapon-price').textContent = weapon ? `${weapon.cost} G` : 'MAX';
    $('armor-name').textContent = armor ? armor.name : 'Champion’s armor'; $('armor-info').textContent = armor ? `+${armor.defense} defense, +10 health` : 'Fully upgraded'; $('armor-price').textContent = armor ? `${armor.cost} G` : 'MAX';
    const price = 45 + hero.training * 30;
    $('training-price').textContent = hero.training < 3 ? `${price} G` : 'MAX'; $('training-info').textContent = hero.training < 3 ? '+1 maximum energy' : 'Fully trained';
    $('buy-weapon').disabled = !weapon || hero.gold < weapon.cost; $('buy-armor').disabled = !armor || hero.gold < armor.cost; $('buy-training').disabled = hero.training >= 3 || hero.gold < price;
    $('campaign-track').replaceChildren();
    OPPONENTS.forEach((opponent, i) => {
      const stop = document.createElement('div'); stop.className = `campaign-stop ${i < hero.wins ? 'done' : i === hero.wins ? 'current' : ''}`;
      const number = document.createElement('b'); number.textContent = i < hero.wins ? '✓' : String(i + 1).padStart(2, '0'); stop.append(number, opponent.title); $('campaign-track').append(stop);
    });
  }
  function camp(result = '') {
    state = 'camp'; busy = false; generation++;
    $('creator').hidden = true; $('game-panel').hidden = false; $('combat-panel').hidden = true; $('camp-panel').hidden = false;
    $('fight-hud').hidden = true; $('intent').hidden = true; $('arena-caption').hidden = false;
    $('arena').classList.add('creating'); $('player-figure').classList.remove('fallen', 'guarding'); $('enemy-figure').classList.remove('fallen', 'guarding');
    const complete = hero.wins === 6;
    $('arena-caption').querySelector('span').textContent = complete ? 'THE CROWD KNOWS YOUR NAME' : result === 'loss' ? 'THE DIRT BUILDS CHARACTER' : 'BLOOD, SWEAT &';
    $('arena-caption').querySelector('strong').textContent = complete ? 'CHAMPION.' : result === 'loss' ? 'RISE AGAIN.' : 'BETTER GEAR.';
    $('camp-eyebrow').textContent = complete ? 'THE ARENA IS YOURS' : result === 'win' ? 'VICTORY! SPOILS WELL EARNED.' : result === 'loss' ? 'DEFEATED. NOT FINISHED.' : 'THE ARMORY';
    $('camp-title').textContent = complete ? `All hail ${hero.name}.` : result === 'win' ? 'One step closer to glory.' : result === 'loss' ? 'Every legend takes a few hits.' : 'Fortune favors the prepared.';
    $('camp-description').textContent = complete ? 'Six opponents defeated. Your name belongs to the arena now.' : result === 'win' ? `Earned ${OPPONENTS[hero.wins - 1].gold} gold and ${OPPONENTS[hero.wins - 1].xp} XP. Spend wisely. The next fight is tougher.` : result === 'loss' ? 'Your gold and equipment are safe. Try guarding heavy attacks and using bandages earlier.' : 'Buy your first upgrade. Health and energy refill at the start of every fight.';
    $('next-fight').hidden = complete;
    $('next-fight').innerHTML = `${result === 'loss' ? 'TRY AGAIN' : hero.wins === 0 ? 'FIRST FIGHT' : 'NEXT FIGHT'} <span>→</span>`;
    $('chapter').textContent = complete ? 'SIX VICTORIES. ONE LEGEND.' : `${hero.wins} OF 6 OPPONENTS DEFEATED`;
    $('crowd-label').textContent = complete ? 'THE CROWD ROARS YOUR NAME.' : 'NEXT UP: ' + OPPONENTS[hero.wins].name.toUpperCase();
    heroHp = stats().hp; heroEnergy = stats().energy;
    drawFighters(); update(); shop(); save();
  }
  function chooseIntent() {
    if (enemyEnergy < 3) enemyIntent = 'recover';
    else {
      const roll = Math.random();
      enemyIntent = roll < .43 ? 'strike' : roll < .78 ? 'heavy' : 'guard';
    }
    const messages = { strike: 'Sword raised. A quick strike is coming.', heavy: 'Winding up a heavy blow. Brace yourself!', guard: 'Raising a shield. They’ll defend next.', recover: 'Out of breath. They need to recover.' };
    $('intent').textContent = messages[enemyIntent];
  }
  function beginFight() {
    if (state !== 'camp' || hero.wins >= 6) return;
    state = 'combat'; busy = false; generation++; enemy = { ...OPPONENTS[hero.wins] };
    heroHp = stats().hp; heroEnergy = stats().energy; enemyHp = enemy.hp; enemyEnergy = enemy.energy;
    bandages = 2; specialCooldown = 0; enemyGuard = false; turn = 1;
    $('arena').classList.remove('creating'); $('arena-caption').hidden = true; $('fight-hud').hidden = false; $('intent').hidden = false;
    $('camp-panel').hidden = true; $('combat-panel').hidden = false; $('battle-log').replaceChildren();
    $('round-label').textContent = `BOUT ${String(hero.wins + 1).padStart(2, '0')}`;
    $('chapter').textContent = `BOUT ${hero.wins + 1} / ${enemy.title.toUpperCase()}`; $('crowd-label').textContent = 'THE CROWD WANTS A GOOD FIGHT.';
    $('player-figure').classList.remove('fallen', 'guarding'); $('enemy-figure').classList.remove('fallen', 'guarding');
    drawFighters(); chooseIntent(); update(); note(`${hero.name} faces ${enemy.name}. Read their next move and choose wisely.`);
    $('actions').querySelector('button').focus({ preventScroll: true }); tone(330);
  }
  function damage(attack, defense, multiplier = 1, guarding = false) {
    return Math.max(1, Math.round((attack * multiplier + rand(-2, 2) - defense) * (guarding ? .3 : 1)));
  }
  async function finishBattle(won, token) {
    state = 'result'; busy = true; update();
    $(won ? 'enemy-figure' : 'player-figure').classList.add('fallen');
    note(won ? `Victory! ${enemy.name} is defeated.` : `${hero.name} falls. The arena will give you another chance.`);
    tone(won ? 550 : 110, 'triangle', .4);
    if (won) {
      hero.gold += enemy.gold; hero.xp += enemy.xp; hero.wins++;
      while (hero.xp >= 60) { hero.xp -= 60; hero.level++; }
      save();
    }
    await wait(1100); if (token !== generation) return;
    camp(won ? 'win' : 'loss');
  }
  async function act(action) {
    const button = document.querySelector(`[data-action="${action}"]`);
    if (!button || button.disabled || busy || state !== 'combat' || $('help-dialog').open) return;
    busy = true; const token = generation, s = stats();
    const gap = $('enemy-figure').offsetLeft - $('player-figure').offsetLeft - $('player-figure').offsetWidth + 45;
    $('arena').style.setProperty('--lunge-distance', `${Math.max(25, gap)}px`);
    if (specialCooldown > 0) specialCooldown--;
    let guarded = false;
    if (action === 'guard') {
      heroEnergy = Math.min(s.energy, heroEnergy + 2); guarded = true; $('player-figure').classList.add('guarding'); note('You brace behind your shield. +2 energy.'); tone(200);
    } else if (action === 'recover') {
      const restored = Math.min(4, s.energy - heroEnergy); heroEnergy += restored; float('player', `+${restored} ENERGY`, true); note(`You catch your breath. +${restored} energy.`);
    } else if (action === 'bandage') {
      const healed = Math.min(30, s.hp - heroHp); heroHp += healed; bandages--; float('player', `+${healed}`, true); note(`You bandage your wounds. +${healed} health.`); tone(440);
    } else {
      const heavy = action === 'heavy', special = action === 'special';
      heroEnergy -= special ? 5 : heavy ? 3 : 0; if (special) specialCooldown = 3;
      animate('player-figure', 'lunge');
      const hit = Math.random() < (heavy ? .78 : special ? 1 : .97);
      if (hit) {
        const dealt = damage(s.attack, enemy.defense, special ? 2 : heavy ? 1.65 : 1, enemyGuard);
        enemyHp = Math.max(0, enemyHp - dealt); float('enemy', `−${dealt}`); animate('enemy-figure', 'hit');
        note(`${special ? 'Glory strike' : heavy ? 'Heavy blow' : 'Quick strike'} deals ${dealt} damage${enemyGuard ? ' through their guard' : ''}.`); tone(special ? 170 : 120, 'sawtooth');
      } else { float('enemy', 'MISS'); note(heavy ? 'Your heavy swing misses.' : 'Your strike misses.'); tone(80); }
    }
    enemyGuard = false; $('enemy-figure').classList.remove('guarding'); update();
    if (enemyHp <= 0) { await finishBattle(true, token); return; }
    await wait(650); if (token !== generation || state !== 'combat') return;
    if (enemyIntent === 'recover') {
      enemyEnergy = Math.min(enemy.energy, enemyEnergy + 4); float('enemy', '+ENERGY', true); note(`${enemy.name} catches a breath. +4 energy.`);
    } else if (enemyIntent === 'guard') {
      enemyGuard = true; enemyEnergy = Math.min(enemy.energy, enemyEnergy + 2); $('enemy-figure').classList.add('guarding'); note(`${enemy.name} raises a shield. Their next hit taken will be reduced.`);
    } else {
      const heavy = enemyIntent === 'heavy'; if (heavy) enemyEnergy -= 3; else enemyEnergy = Math.max(0, enemyEnergy - 1);
      animate('enemy-figure', 'lunge');
      if (Math.random() < (heavy ? .86 : .96)) {
        const dealt = damage(enemy.attack, s.defense, heavy ? 1.65 : 1, guarded);
        heroHp = Math.max(0, heroHp - dealt); float('player', `−${dealt}`); animate('player-figure', 'hit'); note(`${enemy.name} hits for ${dealt}${guarded ? ' damage. Your shield absorbs most of the blow' : ' damage'}.`); tone(90, 'sawtooth');
      } else { float('player', 'MISS'); note(`${enemy.name} misses. A lucky break!`); }
    }
    update();
    if (heroHp <= 0) { await finishBattle(false, token); return; }
    await wait(350); if (token !== generation || state !== 'combat') return;
    $('player-figure').classList.remove('guarding'); turn++; busy = false; chooseIntent(); update();
  }
  document.querySelectorAll('[data-class]').forEach(button => button.addEventListener('click', () => {
    selectedClass = button.dataset.class;
    document.querySelectorAll('[data-class]').forEach(item => { const chosen = item === button; item.classList.toggle('selected', chosen); item.setAttribute('aria-pressed', String(chosen)); }); drawFighters();
  }));
  document.querySelectorAll('[data-color]').forEach(button => button.addEventListener('click', () => {
    selectedColor = button.dataset.color;
    document.querySelectorAll('[data-color]').forEach(item => { const chosen = item === button; item.classList.toggle('selected', chosen); item.setAttribute('aria-pressed', String(chosen)); }); drawFighters();
  }));
  $('create-form').addEventListener('submit', event => {
    event.preventDefault(); const name = $('name').value.trim();
    if (!name) { $('name').setCustomValidity('Your gladiator needs a name.'); $('name').reportValidity(); return; }
    if (savedHero && !confirm('Replace your saved champion with a new character?')) return;
    hero = { version: 1, name, style: selectedClass, color: selectedColor, level: 1, xp: 0, gold: 45, wins: 0, weapon: 0, armor: 0, training: 0 }; camp();
  });
  $('name').addEventListener('input', () => $('name').setCustomValidity(''));
  $('continue').addEventListener('click', () => { if (savedHero) { hero = { ...savedHero }; camp(); } });
  $('next-fight').addEventListener('click', beginFight);
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => act(button.dataset.action)));
  window.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || $('help-dialog').open || event.target.matches('input,textarea')) return;
    if (/^[1-6]$/.test(event.key) && state === 'combat') { event.preventDefault(); act(['strike', 'heavy', 'guard', 'recover', 'special', 'bandage'][Number(event.key) - 1]); }
  });
  function purchase(kind) {
    if (state !== 'camp') return;
    const item = kind === 'weapon' ? WEAPONS[hero.weapon] : kind === 'armor' ? ARMOR[hero.armor] : hero.training < 3 ? { cost: 45 + hero.training * 30 } : null;
    if (!item || hero.gold < item.cost) return;
    hero.gold -= item.cost; hero[kind]++; heroHp = stats().hp; heroEnergy = stats().energy; drawFighters(); update(); shop(); save(); tone(600);
  }
  $('buy-weapon').addEventListener('click', () => purchase('weapon')); $('buy-armor').addEventListener('click', () => purchase('armor')); $('buy-training').addEventListener('click', () => purchase('training'));
  $('new-character').addEventListener('click', () => {
    state = 'creator'; hero = null; enemy = null; generation++;
    $('creator').hidden = false; $('game-panel').hidden = true; $('fight-hud').hidden = true; $('intent').hidden = true; $('continue').hidden = !savedHero;
    $('arena').classList.add('creating'); $('arena-caption').querySelector('span').textContent = 'FROM NOBODY'; $('arena-caption').querySelector('strong').textContent = 'TO LEGEND.';
    $('chapter').textContent = 'YOUR LEGEND STARTS IN THE DIRT'; $('crowd-label').textContent = 'THE CROWD IS WAITING.'; drawFighters();
  });
  $('sound').addEventListener('click', async () => {
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); await audio.resume(); sound = !sound; $('sound').textContent = sound ? 'Sound on' : 'Sound off'; $('sound').setAttribute('aria-pressed', String(sound)); tone(400); }
    catch { $('sound').textContent = 'Audio unavailable'; }
  });
  $('help').addEventListener('click', () => $('help-dialog').showModal());
  $('close-help').addEventListener('click', () => $('help-dialog').close()); $('help-done').addEventListener('click', () => $('help-dialog').close());
  const fullscreenButton = $('fullscreen');
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else { fullscreenButton.textContent = 'Screen filled'; fullscreenButton.title = 'This browser does not support fullscreen. The game already fills the window.'; }
    } catch { fullscreenButton.textContent = 'Use browser fullscreen'; fullscreenButton.title = 'Fullscreen was blocked by the browser. The game still fills the window.'; }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
    fullscreenButton.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
  });
  $('arena').classList.add('creating'); drawFighters();
})();
