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
  const { chapters: CHAPTERS, opponents: OPPONENTS, catalog: CATALOG, jobs: JOBS, endings: ENDINGS, chapterIndex, normalizeSave } = window.GloryCampaign;
  const ownedKey = { weapon: 'ownedWeapons', armor: 'ownedArmor', shield: 'ownedShields' };
  let townPlace = 'blacksmith', smithCategory = 'weapon';
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
    window.arena3d?.setLocation(state === 'camp', hero ? chapterIndex(hero.wins) : 0);
    const data = hero || { color: selectedColor, style: selectedClass, weapon: 0, armor: 0 };
    window.arena3d?.setFighters(
      { color: COLORS[data.color], style: data.style, weapon: data.weapon, armor: data.armor, shield: data.shield || 0 },
      enemy ? { color: enemy.color, style: enemy.style, weapon: Math.min(hero.wins, 3), armor: Math.min(Math.floor(hero.wins / 2), 3) } : null
    );
    $('player-figure').innerHTML = avatar(COLORS[data.color], data.style, data.weapon, data.armor);
    if (enemy) $('enemy-figure').innerHTML = avatar(enemy.color, enemy.style, Math.min(hero.wins, 3), Math.min(Math.floor(hero.wins / 2), 3), true);
  }
  function stats() {
    const base = CLASSES[hero.style], weapon = CATALOG.weapon[hero.weapon], armor = CATALOG.armor[hero.armor], shield = CATALOG.shield[hero.shield];
    return {
      hp: base.hp + (hero.level - 1) * 10 + armor.hp + shield.hp,
      attack: base.attack + (hero.level - 1) * 2 + weapon.attack,
      defense: base.defense + hero.level - 1 + armor.defense + shield.defense,
      energy: base.energy + hero.training
    };
  }
  try { savedHero = normalizeSave(JSON.parse(localStorage.getItem(KEY))); } catch {}
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
    const current = chapterIndex(hero.wins), complete = hero.wins === OPPONENTS.length;
    $('story-speaker').textContent = CHAPTERS[current].mentor;
    $('story-summary').textContent = hero.ending ? ENDINGS[hero.ending].text : complete ? CHAPTERS[3].after : CHAPTERS[current].intro;
    $('story-objective').textContent = complete ? (hero.ending ? 'Your chronicle is complete. The choice is saved.' : 'The charter is yours. Choose what comes next.') : CHAPTERS[current].goal;
    $('ending-choices').hidden = !complete || Boolean(hero.ending);
    $('campaign-track').replaceChildren();
    CHAPTERS.forEach((chapter, i) => {
      const stop = document.createElement('div'); stop.className = `campaign-stop ${hero.wins >= (i + 1) * 3 ? 'done' : i === current ? 'current' : ''}`;
      const number = document.createElement('b'); number.textContent = hero.wins >= (i + 1) * 3 ? '✓' : `CH. ${i + 1}`;
      stop.append(number, chapter.name); $('campaign-track').append(stop);
    });
  }
  function camp(result = '') {
    state = 'camp'; busy = false; generation++;
    $('creator').hidden = true; $('game-panel').hidden = false; $('combat-panel').hidden = true; $('camp-panel').hidden = false;
    $('fight-hud').hidden = true; $('intent').hidden = true; $('arena-caption').hidden = false;
    $('arena').classList.add('creating'); $('player-figure').classList.remove('fallen', 'guarding'); $('enemy-figure').classList.remove('fallen', 'guarding');
    const complete = hero.wins === OPPONENTS.length;
    const chapter = CHAPTERS[chapterIndex(hero.wins)];
    $('location-name').textContent = `${chapter.town.toUpperCase()} · TOWN SQUARE`;
    $('arena-caption').querySelector('span').textContent = complete ? 'THE CROWD KNOWS YOUR NAME' : result === 'loss' ? 'THE DIRT BUILDS CHARACTER' : 'BLOOD, SWEAT &';
    $('arena-caption').querySelector('strong').textContent = complete ? 'CHAMPION.' : result === 'loss' ? 'RISE AGAIN.' : 'BETTER GEAR.';
    $('camp-eyebrow').textContent = complete ? 'THE ARENA IS YOURS' : result === 'win' ? 'VICTORY! SPOILS WELL EARNED.' : result === 'loss' ? 'DEFEATED. NOT FINISHED.' : `CHAPTER ${chapterIndex(hero.wins) + 1} · ${chapter.town.toUpperCase()}`;
    $('camp-title').textContent = complete ? (hero.ending ? ENDINGS[hero.ending].title : `All hail ${hero.name}.`) : result === 'win' ? 'One step closer to glory.' : result === 'loss' ? 'Every legend takes a few hits.' : chapter.name;
    $('camp-description').textContent = complete ? 'Twelve rivals defeated. The charter is yours. Your final choice will shape the arena.' : result === 'win' ? `${OPPONENTS[hero.wins - 1].aftermath} +${OPPONENTS[hero.wins - 1].gold} gold / +${OPPONENTS[hero.wins - 1].xp} XP.` : result === 'loss' ? 'Your gold and equipment are safe. Try guarding heavy attacks and using bandages earlier.' : 'Visit Brann for gear, hear the latest at the tavern, or meet your next rival.';
    $('next-fight').hidden = complete;
    $('next-fight').innerHTML = `${result === 'loss' ? 'REMATCH' : 'MEET YOUR RIVAL'} <span>→</span>`;
    $('chapter').textContent = complete ? 'THE UNBROKEN · YOUR LEGEND' : `CH. ${chapterIndex(hero.wins) + 1} · ${chapter.town.toUpperCase()} · ${hero.wins}/12 WINS`;
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
    if (state !== 'camp' || hero.wins >= OPPONENTS.length) return;
    $('location-name').textContent = CHAPTERS[chapterIndex(hero.wins)].arena.toUpperCase();
    state = 'combat'; busy = false; generation++; enemy = { ...OPPONENTS[hero.wins] };
    heroHp = stats().hp; heroEnergy = stats().energy; enemyHp = enemy.hp; enemyEnergy = enemy.energy;
    bandages = 2; specialCooldown = 0; enemyGuard = false; turn = 1;
    $('arena').classList.remove('creating'); $('arena-caption').hidden = true; $('fight-hud').hidden = false; $('intent').hidden = false;
    $('camp-panel').hidden = true; $('combat-panel').hidden = false; $('battle-log').replaceChildren();
    $('round-label').textContent = `BOUT ${String(hero.wins + 1).padStart(2, '0')}`;
    $('chapter').textContent = `CH. ${chapterIndex(hero.wins) + 1} · ${CHAPTERS[chapterIndex(hero.wins)].arena.toUpperCase()}`; $('crowd-label').textContent = 'THE CROWD WANTS A GOOD FIGHT.';
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
    hero = { version: 2, name, style: selectedClass, color: selectedColor, level: 1, xp: 0, gold: 45, wins: 0, weapon: 0, armor: 0, shield: 0, training: 0, ownedWeapons: [0], ownedArmor: [0], ownedShields: [0], claimedJobs: [], ending: null }; camp();
  });
  $('name').addEventListener('input', () => $('name').setCustomValidity(''));
  $('continue').addEventListener('click', () => { if (savedHero) { hero = { ...savedHero }; camp(); } });
  $('next-fight').addEventListener('click', introduceRival);
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => act(button.dataset.action)));
  window.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || $('help-dialog').open || event.target.matches('input,textarea')) return;
    if (/^[1-6]$/.test(event.key) && state === 'combat') { event.preventDefault(); act(['strike', 'heavy', 'guard', 'recover', 'special', 'bandage'][Number(event.key) - 1]); }
  });
  function element(tag, className, text) {
    const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
  }
  function shopHeading(title, subtitle, quote) {
    const header = element('div', 'merchant-heading'); header.append(element('span', 'eyebrow', subtitle), element('h2', '', title), element('p', '', quote));
    $('town-dialog-content').append(header);
  }
  function refreshTown() { heroHp = stats().hp; heroEnergy = stats().energy; drawFighters(); update(); shop(); save(); renderTown(); }
  function buyOrEquip(kind, tier) {
    if (state !== 'camp' || !Object.hasOwn(CATALOG, kind) || !Number.isInteger(tier)) return;
    const item = CATALOG[kind][tier]; if (!item) return;
    const owned = hero[ownedKey[kind]];
    if (!owned.includes(tier)) {
      if (hero.wins < item.unlock || hero.gold < item.cost) return;
      hero.gold -= item.cost; owned.push(tier);
    }
    hero[kind] = tier; refreshTown(); tone(600);
    $('merchant-message').textContent = `${item.name} equipped. Brann: “Let it bring you home.”`;
  }
  function itemStats(item) { return [item.attack ? `+${item.attack} ATK` : '', item.defense ? `+${item.defense} DEF` : '', item.hp ? `+${item.hp} HP` : ''].filter(Boolean).join(' · ') || 'Starter equipment'; }
  function renderSmith() {
    shopHeading('Brann’s Traveling Forge', 'BRANN IRONHAND · BLACKSMITH', '“Steel should serve the person holding it. Not the person holding their papers.”');
    const equipped = element('p', 'equipment-summary', `Equipped: ${CATALOG.weapon[hero.weapon].name} / ${CATALOG.armor[hero.armor].name} / ${CATALOG.shield[hero.shield].name}`);
    const purse = element('div', 'merchant-purse', `${hero.gold} GOLD · Choose gear to buy or equip. Owned gear is always free to equip.`);
    const tabs = element('div', 'merchant-tabs'); tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', 'Equipment category');
    for (const [kind, label] of [['weapon', 'Weapons'], ['armor', 'Armor'], ['shield', 'Shields']]) {
      const tab = element('button', kind === smithCategory ? 'selected' : '', label); tab.dataset.category = kind; tab.setAttribute('aria-pressed', String(kind === smithCategory)); tab.addEventListener('click', () => { smithCategory = kind; renderTown(); }); tabs.append(tab);
    }
    $('town-dialog-content').append(equipped, purse, tabs);
    const grid = element('div', 'equipment-grid');
    CATALOG[smithCategory].forEach((item, tier) => {
      const owned = hero[ownedKey[smithCategory]].includes(tier), equipped = hero[smithCategory] === tier, locked = !owned && hero.wins < item.unlock;
      const card = element('article', `equipment-card ${equipped ? 'equipped' : ''}`); card.dataset.item = `${smithCategory}-${tier}`;
      card.append(element('span', 'item-tier', tier === 0 ? 'STARTER' : `FORGE TIER ${tier}`), element('h3', '', item.name), element('strong', 'item-stats', itemStats(item)), element('p', '', item.flavor));
      const current = CATALOG[smithCategory][hero[smithCategory]];
      const changes = [['attack', 'ATK'], ['defense', 'DEF'], ['hp', 'HP']].map(([key, label]) => { const delta = (item[key] || 0) - (current[key] || 0); return delta ? `${delta > 0 ? '+' : ''}${delta} ${label}` : ''; }).filter(Boolean).join(' / ');
      card.append(element('small', 'item-comparison', equipped ? 'Currently equipped' : changes ? `Compared with your gear: ${changes}` : 'Same combat bonuses'));
      const button = element('button', 'primary item-buy', equipped ? 'EQUIPPED' : owned ? 'EQUIP' : locked ? `UNLOCKS AT ${item.unlock} WINS` : hero.gold < item.cost ? `${item.cost} G · NEED ${item.cost - hero.gold} MORE` : `BUY & EQUIP · ${item.cost} G`);
      button.disabled = equipped || locked || (!owned && hero.gold < item.cost); button.addEventListener('click', () => buyOrEquip(smithCategory, tier)); card.append(button); grid.append(card);
    });
    const message = element('p', 'merchant-message'); message.id = 'merchant-message'; message.setAttribute('role', 'status');
    $('town-dialog-content').append(grid, message);
  }
  function renderTavern() {
    const chapter = CHAPTERS[chapterIndex(hero.wins)];
    shopHeading('The Bent Coin', 'MIRA VALE · INNKEEPER & EXCELLENT LISTENER', '“You hear more with a clean cup and an open ear than with a drawn sword.”');
    $('town-dialog-content').append(element('blockquote', 'rumor', chapter.rumor), element('h3', '', 'Work worth doing'));
    for (const job of JOBS) {
      const claimed = hero.claimedJobs.includes(job.id), ready = job.ready(hero);
      const row = element('article', 'job-card'); row.append(element('h3', '', job.name), element('p', '', job.description));
      const button = element('button', 'primary', claimed ? 'REWARD COLLECTED' : ready ? `CLAIM ${job.gold} GOLD` : `IN PROGRESS · ${job.gold} GOLD`); button.dataset.job = job.id; button.disabled = claimed || !ready;
      button.addEventListener('click', () => {
        if (state !== 'camp' || hero.claimedJobs.includes(job.id) || !job.ready(hero)) return;
        hero.claimedJobs.push(job.id); hero.gold += job.gold; refreshTown(); tone(500);
      }); row.append(button); $('town-dialog-content').append(row);
    }
  }
  function renderTraining() {
    shopHeading('Cassian’s Training Yard', 'CASSIAN · RETIRED CHAMPION', '“The strongest fighter in the world still needs to breathe.”');
    const price = 45 + hero.training * 30;
    $('town-dialog-content').append(element('p', 'training-level', `${stats().energy} maximum energy · ${hero.training}/6 lessons completed`), element('p', '', 'Each lesson permanently adds one maximum energy. Your fighting style and every equipment bonus remain intact.'));
    const button = element('button', 'primary', hero.training >= 6 ? 'TRAINING COMPLETE' : `TRAIN ENDURANCE +1 · ${price} GOLD`); button.id = 'buy-training'; button.disabled = hero.training >= 6 || hero.gold < price;
    button.addEventListener('click', () => { if (state !== 'camp' || hero.training >= 6 || hero.gold < price) return; hero.gold -= price; hero.training++; refreshTown(); tone(450); }); $('town-dialog-content').append(button);
  }
  function renderJournal() {
    shopHeading('Your Chronicle', `${hero.name.toUpperCase()} · ${hero.wins}/12 VICTORIES`, 'A record of the people you fought, the allies you found, and the choices still ahead.');
    CHAPTERS.forEach((chapter, index) => {
      const unlocked = hero.wins >= index * 3, complete = hero.wins >= (index + 1) * 3;
      const details = element('details', 'journal-chapter'); details.open = index === chapterIndex(hero.wins);
      details.append(element('summary', '', `CHAPTER ${index + 1} · ${chapter.name}${complete ? ' · COMPLETE' : unlocked ? '' : ' · LOCKED'}`));
      if (unlocked) {
        details.append(element('p', '', chapter.intro), element('strong', '', chapter.goal));
        OPPONENTS.slice(index * 3, index * 3 + 3).forEach((rival, offset) => {
          const defeated = hero.wins > index * 3 + offset;
          details.append(element('h4', '', `${defeated ? '✓ ' : ''}${rival.name} · ${rival.title}`), element('p', '', defeated ? rival.aftermath : rival.intro));
        });
        if (complete) details.append(element('blockquote', 'rumor', chapter.after));
      } else details.append(element('p', '', 'Complete the previous chapter to discover this part of your story.'));
      $('town-dialog-content').append(details);
    });
    if (hero.ending) $('town-dialog-content').append(element('h3', '', ENDINGS[hero.ending].title), element('p', '', ENDINGS[hero.ending].text));
  }
  function renderTown() {
    $('town-dialog-content').replaceChildren();
    ({ blacksmith: renderSmith, tavern: renderTavern, training: renderTraining, journal: renderJournal })[townPlace]();
  }
  document.querySelectorAll('[data-place]').forEach(button => button.addEventListener('click', () => {
    if (state !== 'camp') return; townPlace = button.dataset.place; renderTown(); $('town-dialog').showModal();
  }));
  $('close-town').addEventListener('click', () => $('town-dialog').close());
  function introduceRival() {
    if (state !== 'camp' || hero.wins >= OPPONENTS.length) return;
    const rival = OPPONENTS[hero.wins], chapter = CHAPTERS[chapterIndex(hero.wins)];
    $('story-chapter-label').textContent = `CHAPTER ${chapterIndex(hero.wins) + 1} · ${chapter.name.toUpperCase()}`;
    $('story-bout-title').textContent = rival.name; $('story-rival-title').textContent = rival.title;
    $('story-intro').textContent = rival.intro; $('story-quote').textContent = `“${rival.quote}”`;
    $('story-reward').textContent = `${chapter.arena} · Victory earns ${rival.gold} gold + ${rival.xp} XP`;
    $('story-portrait').innerHTML = avatar(rival.color, rival.style, Math.min(hero.wins, 3), Math.min(Math.floor(hero.wins / 2), 3), true);
    $('story-dialog').showModal();
  }
  $('close-story').addEventListener('click', () => $('story-dialog').close());
  $('story-fight').addEventListener('click', () => { $('story-dialog').close(); beginFight(); });
  document.querySelectorAll('[data-ending]').forEach(button => button.addEventListener('click', () => {
    if (state !== 'camp' || hero.wins !== OPPONENTS.length || hero.ending) return;
    hero.ending = button.dataset.ending; $('camp-title').textContent = ENDINGS[hero.ending].title; shop(); save();
  }));
  $('new-character').addEventListener('click', () => {
    state = 'creator'; hero = null; enemy = null; generation++; $('location-name').textContent = 'THE SUNBLEACHED ARENA';
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
