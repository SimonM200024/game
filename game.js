(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const field = $('playfield');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 1000, height = 450, mode = 'ready', previous = 0, elapsed = 0;
  let score = 0, best = 0, hull = 3, chain = 0, lastPickup = -10;
  let rockTimer = 0, dustTimer = 0, shieldTime = 0, cooldown = 0, immunity = 0;
  let rocks = [], dust = [], particles = [], stars = [], keys = new Set();
  let pointer = null, soundOn = false, audio = null, shake = 0;
  const ship = { x: 500, y: 360, radius: 13 };
  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  try { best = Number(localStorage.getItem('starfall-best')) || 0; } catch {}
  $('best').textContent = String(best).padStart(4, '0');

  function resize() {
    const oldWidth = width, oldHeight = height;
    width = field.clientWidth; height = field.clientHeight;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ship.x = clamp(ship.x / oldWidth * width, 20, width - 20);
    ship.y = clamp(ship.y / oldHeight * height, 65, height - 45);
    for (const entity of [...rocks, ...dust]) { entity.x *= width / oldWidth; entity.y *= height / oldHeight; }
    stars = Array.from({ length: Math.floor(width * height / 2600) }, () => ({ x: random(0, width), y: random(0, height), size: random(.5, 1.5), depth: random(.2, 1) }));
  }
  new ResizeObserver(resize).observe(field);
  resize();

  function tone(frequency, duration = .09, type = 'sine', volume = .045) {
    if (!soundOn || !audio || audio.state !== 'running') return;
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + duration);
  }
  function burst(x, y, color, count = 14) {
    for (let i = 0; i < (reducedMotion ? 4 : count); i++) {
      const angle = random(0, Math.PI * 2), speed = random(35, 150);
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: random(.3, .7), color });
    }
  }
  function updateHud() {
    $('score').textContent = String(score).padStart(4, '0');
    $('health').textContent = '◆ '.repeat(hull) + '◇ '.repeat(3 - hull);
    $('health').style.color = hull === 1 ? '#ffb471' : '#a5f8e8';
    $('sector').textContent = `/ SECTOR ${String(1 + Math.floor(elapsed / 20)).padStart(2, '0')}`;
    $('shield-label').textContent = shieldTime > 0 ? 'SHIELD ACTIVE' : cooldown > 0 ? `RECHARGING ${Math.ceil(cooldown)}s` : 'SHIELD READY';
    $('shield').disabled = mode !== 'running' || cooldown > 0;
    $('combo').textContent = chain > 1 ? `${Math.min(chain, 5)}× STARDUST STREAK ✦` : 'CHASE THE SHINY STUFF ✦';
  }
  function start() {
    mode = 'running'; score = 0; hull = 3; chain = 0; elapsed = 0; lastPickup = -10;
    rocks = []; particles = []; dust = []; keys.clear(); pointer = null;
    rockTimer = .9; dustTimer = .3; shieldTime = cooldown = immunity = shake = 0;
    ship.x = width / 2; ship.y = height - 90;
    $('overlay').hidden = true; $('pause').disabled = false;
    $('pause').textContent = 'II'; $('pause').setAttribute('aria-label', 'Pause game');
    $('status').textContent = 'Good things come to those who dodge.';
    $('announcement').textContent = 'Run started. Collect stardust and avoid asteroids.';
    updateHud(); canvas.focus({ preventScroll: true }); tone(440);
  }
  function showOverlay(label, title, description, button, hint) {
    $('overlay-label').textContent = label; $('overlay-title').textContent = title; $('overlay-title').classList.add('compact-title');
    $('overlay-description').textContent = description;
    $('start').innerHTML = `${button} <span>↗</span>`;
    $('overlay-hint').textContent = hint; $('overlay').hidden = false;
  }
  function pause() {
    if (mode !== 'running' && mode !== 'paused') return;
    if (mode === 'running') {
      mode = 'paused'; keys.clear(); pointer = null;
      showOverlay('TAKE A BREATHER', 'Space can wait.', 'Your ship is safe. Come back when you’re ready.', 'KEEP FLYING', 'PRESS P OR ESC TO RESUME');
      $('pause').textContent = '>'; $('pause').setAttribute('aria-label', 'Resume game');
      $('announcement').textContent = 'Game paused.';
    } else {
      mode = 'running'; $('overlay').hidden = true;
      $('pause').textContent = 'II'; $('pause').setAttribute('aria-label', 'Pause game');
      canvas.focus({ preventScroll: true });
    }
    updateHud();
  }
  function end() {
    mode = 'over'; pointer = null; keys.clear();
    const record = score > best;
    best = Math.max(best, score);
    try { localStorage.setItem('starfall-best', String(best)); } catch {}
    $('best').textContent = String(best).padStart(4, '0');
    $('pause').disabled = true;
    showOverlay(record ? 'A NEW PERSONAL BEST. NICELY DONE.' : 'EVERY GREAT PILOT STARTS SOMEWHERE', 'One more run?', `${score} stardust · ${Math.floor(elapsed)} seconds survived · Sector ${1 + Math.floor(elapsed / 20)}`, 'FLY AGAIN', 'THE UNIVERSE BELIEVES IN SECOND CHANCES.');
    $('status').textContent = record ? 'That one goes in the history books.' : 'A little wiser. A little more cosmic.';
    $('announcement').textContent = `Game over. ${score} stardust. ${record ? 'New personal best.' : ''}`;
    updateHud(); $('start').focus({ preventScroll: true });
  }
  function activateShield() {
    if (mode !== 'running' || cooldown > 0) return;
    shieldTime = 2; cooldown = 8; tone(220, .3, 'triangle'); updateHud();
  }
  function addRock() {
    const radius = random(15, 30);
    rocks.push({ x: random(radius + 5, width - radius - 5), y: -45, radius, speed: random(85, 140) + Math.min(elapsed * 2.5, 170), drift: random(-23, 23), rotation: random(0, 6), spin: random(-1, 1), shape: Array.from({ length: 9 }, () => random(.72, 1.1)) });
  }
  function tick(dt) {
    elapsed += dt; rockTimer -= dt; dustTimer -= dt;
    cooldown = Math.max(0, cooldown - dt); shieldTime = Math.max(0, shieldTime - dt); immunity = Math.max(0, immunity - dt); shake = Math.max(0, shake - dt * 22);
    if (elapsed - lastPickup > 3.3) chain = 0;
    if (rockTimer <= 0) { addRock(); rockTimer = Math.max(.22, .8 - elapsed * .007); }
    if (dustTimer <= 0) { dust.push({ x: random(27, width - 27), y: -15, phase: random(0, 6), speed: 100 + Math.min(elapsed, 100) }); dustTimer = .65; }
    let dx = Number(keys.has('ArrowRight') || keys.has('d')) - Number(keys.has('ArrowLeft') || keys.has('a'));
    let dy = Number(keys.has('ArrowDown') || keys.has('s')) - Number(keys.has('ArrowUp') || keys.has('w'));
    if (dx || dy) { const length = Math.hypot(dx, dy); ship.x += dx / length * 330 * dt; ship.y += dy / length * 330 * dt; pointer = null; }
    else if (pointer) {
      const x = pointer.x - ship.x, y = pointer.y - ship.y, distance = Math.hypot(x, y), step = Math.min(distance, 600 * dt);
      if (distance > 1) { ship.x += x / distance * step; ship.y += y / distance * step; }
    }
    ship.x = clamp(ship.x, 20, width - 20); ship.y = clamp(ship.y, 65, height - 45);
    for (const rock of rocks) {
      rock.y += rock.speed * dt; rock.x += rock.drift * dt; rock.rotation += rock.spin * dt;
      if (!rock.dead && Math.hypot(ship.x - rock.x, ship.y - rock.y) < rock.radius * .85 + ship.radius) {
        if (shieldTime > 0) { rock.dead = true; burst(rock.x, rock.y, '#a5f8e8'); tone(140, .12, 'triangle'); }
        else if (immunity <= 0) {
          rock.dead = true; hull--; chain = 0; immunity = 1.5; shake = reducedMotion ? 0 : 6;
          burst(rock.x, rock.y, '#ffb471', 22); tone(90, .2, 'sawtooth');
          $('announcement').textContent = `Hit. ${hull} hull remaining.`;
          if (hull === 0) { end(); return; }
        }
      }
    }
    for (const item of dust) {
      item.y += item.speed * dt; item.phase += dt * 2;
      if (Math.hypot(ship.x - item.x, ship.y - item.y) < 25) {
        item.dead = true; chain++; lastPickup = elapsed; score += 10 * Math.min(chain, 5);
        burst(item.x, item.y, '#a5f8e8', 10); tone(520 + Math.min(chain, 5) * 100);
      }
    }
    rocks = rocks.filter(r => !r.dead && r.y < height + 50);
    dust = dust.filter(d => !d.dead && d.y < height + 20);
    updateHud();
  }
  function drawShip(time, decorative = false) {
    if (!decorative && mode !== 'running' && mode !== 'paused') return;
    ctx.save();
    if (decorative) { ctx.translate(width * .16, height * .66); ctx.rotate(-.45); ctx.scale(2.3, 2.3); }
    else ctx.translate(ship.x, ship.y);
    if (immunity > 0 && Math.floor(time / 90) % 2 === 0) ctx.globalAlpha = .4;
    if (shieldTime > 0) {
      ctx.beginPath(); ctx.arc(0, 0, 29, 0, Math.PI * 2); ctx.fillStyle = '#a5f8e817'; ctx.fill(); ctx.strokeStyle = '#a5f8e8'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-5, 15); ctx.lineTo(0, 24 + Math.sin(time / 65) * 5); ctx.lineTo(5, 15); ctx.fillStyle = '#ffb471'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(17, 17); ctx.lineTo(0, 10); ctx.lineTo(-17, 17); ctx.closePath(); ctx.fillStyle = '#a5f8e8'; ctx.shadowColor = '#a5f8e8'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(17, 17); ctx.lineTo(0, 10); ctx.fillStyle = '#55bcb4'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.fillStyle = '#102837'; ctx.fill(); ctx.restore();
  }
  function render(time, dt) {
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * .5, height * .5, 0, width * .5, height * .5, width * .7);
    glow.addColorStop(0, '#43236e'); glow.addColorStop(.55, '#25143f'); glow.addColorStop(1, '#110e28');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    // Distant planets are scenery; orange asteroids are the only obstacles.
    ctx.save(); ctx.globalAlpha = mode === 'running' || mode === 'paused' ? .22 : .85;
    const planetX = width * .12, planetY = height * .19, radius = Math.min(width * .095, 90);
    const planet = ctx.createLinearGradient(planetX - radius, planetY - radius, planetX + radius, planetY + radius);
    planet.addColorStop(0, '#d79adb'); planet.addColorStop(.45, '#9358ba'); planet.addColorStop(1, '#422875');
    ctx.fillStyle = planet; ctx.beginPath(); ctx.arc(planetX, planetY, radius, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(planetX, planetY); ctx.rotate(-.4);
    ctx.strokeStyle = '#ffb9cb90'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.55, radius * .28, 0, 0, Math.PI); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffdbd985'; ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.78, radius * .36, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    const moonX = width * .96, moonY = height * .89, moonRadius = Math.min(width * .18, 160);
    const moon = ctx.createLinearGradient(moonX - moonRadius, moonY - moonRadius, moonX + moonRadius, moonY + moonRadius);
    moon.addColorStop(0, '#c282d4'); moon.addColorStop(.35, '#734da1'); moon.addColorStop(1, '#211336');
    ctx.beginPath(); ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2); ctx.fillStyle = moon; ctx.fill();
    ctx.fillStyle = '#41285f65';
    for (const [x, y, r] of [[-.35, -.3, .2], [.13, -.55, .12], [-.3, .3, .3]]) {
      ctx.beginPath(); ctx.arc(moonX + x * moonRadius, moonY + y * moonRadius, r * moonRadius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    for (const star of stars) {
      if (mode !== 'paused' && !reducedMotion) star.y = (star.y + dt * (mode === 'running' ? 30 : 6) * star.depth) % height;
      ctx.globalAlpha = star.depth * .65; ctx.fillStyle = '#c1d6e7'; ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
    // Tiny four-point stars add depth without obscuring the flight path.
    ctx.fillStyle = '#f5ff7c';
    for (const [x, y, size] of [[.83,.22,5],[.24,.8,4],[.88,.57,3],[.3,.18,3],[.07,.48,4]]) {
      ctx.save(); ctx.translate(width * x, height * y);
      ctx.globalAlpha = mode === 'running' ? .35 : .8;
      ctx.beginPath(); ctx.moveTo(0,-size); ctx.quadraticCurveTo(0,0,size,0); ctx.quadraticCurveTo(0,0,0,size); ctx.quadraticCurveTo(0,0,-size,0); ctx.quadraticCurveTo(0,0,0,-size); ctx.fill(); ctx.restore();
    }
    if (mode === 'ready' && width > 700) drawShip(time, true);
    ctx.save(); if (shake > 0 && mode === 'running') ctx.translate(random(-shake, shake), random(-shake, shake));
    for (const item of dust) {
      ctx.save(); ctx.translate(item.x, item.y); ctx.rotate(item.phase * .35);
      ctx.shadowColor = '#a5f8e8'; ctx.shadowBlur = 16; ctx.fillStyle = '#a5f8e8';
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(3, -3); ctx.lineTo(9, 0); ctx.lineTo(3, 3); ctx.lineTo(0, 9); ctx.lineTo(-3, 3); ctx.lineTo(-9, 0); ctx.lineTo(-3, -3); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    for (const rock of rocks) {
      ctx.save(); ctx.translate(rock.x, rock.y); ctx.rotate(rock.rotation); ctx.beginPath();
      rock.shape.forEach((scale, i) => { const angle = i / 9 * Math.PI * 2; const x = Math.cos(angle) * rock.radius * scale, y = Math.sin(angle) * rock.radius * scale; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.closePath(); ctx.fillStyle = '#824860'; ctx.fill(); ctx.strokeStyle = '#ffb471'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(-rock.radius * .2, -rock.radius * .15, rock.radius * .24, 0, Math.PI * 2); ctx.fillStyle = '#492c49'; ctx.fill(); ctx.strokeStyle = '#ae6878'; ctx.stroke(); ctx.restore();
    }
    drawShip(time);
    if (mode !== 'paused') {
      for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
      particles = particles.filter(p => p.life > 0);
    }
    for (const p of particles) { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); }
    ctx.globalAlpha = 1; ctx.restore();
  }
  function frame(time) {
    const dt = Math.min((time - previous) / 1000 || 0, .035); previous = time;
    if (mode === 'running') tick(dt);
    render(time, dt); requestAnimationFrame(frame);
  }
  $('start').addEventListener('click', () => mode === 'paused' ? pause() : start());
  $('pause').addEventListener('click', pause);
  $('shield').addEventListener('click', activateShield);
  $('sound').addEventListener('click', async () => {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      await audio.resume(); soundOn = !soundOn;
      $('sound').textContent = soundOn ? 'SOUND ON' : 'SOUND OFF';
      $('sound').setAttribute('aria-pressed', String(soundOn));
      $('sound').setAttribute('aria-label', soundOn ? 'Disable sound' : 'Enable sound'); tone(660);
    } catch { $('sound').textContent = 'NO AUDIO'; }
  });
  window.addEventListener('keydown', event => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(key) && mode === 'running') {
      if (key === ' ' && event.target instanceof HTMLButtonElement) return;
      event.preventDefault(); keys.add(key); if (key === ' ' && !event.repeat) activateShield();
    }
    if ((key === 'p' || key === 'Escape') && !event.repeat) pause();
  });
  window.addEventListener('keyup', event => keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key));
  function setPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  canvas.addEventListener('pointerdown', event => { if (mode !== 'running') return; canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId); setPointer(event); });
  canvas.addEventListener('pointermove', event => { if (mode === 'running' && canvas.hasPointerCapture(event.pointerId)) setPointer(event); });
  canvas.addEventListener('pointerup', () => { pointer = null; });
  canvas.addEventListener('pointercancel', () => { pointer = null; });
  window.addEventListener('blur', () => { keys.clear(); if (mode === 'running') pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'running') pause(); });
  requestAnimationFrame(frame);
})();
