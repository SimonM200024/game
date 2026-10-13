import * as THREE from 'three';

// This renderer is deliberately separate from combat rules and save data.
(() => {
  const arena = document.getElementById('arena');
  const canvas = document.createElement('canvas');
  canvas.id = 'arena-3d'; canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!context) return; // The existing illustrated arena remains playable without WebGL.
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true }); }
  catch { return; }
  arena.prepend(canvas); arena.classList.add('has-3d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.18;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#e7c89a');
  scene.fog = new THREE.Fog('#e7c89a', 22, 67);
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 110);
  const light = new THREE.DirectionalLight('#fff0d0', 3.4);
  light.position.set(-7, 15, 8); light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: .5, far: 50 });
  light.shadow.normalBias = .035; light.shadow.bias = -.00015;
  scene.add(light, new THREE.HemisphereLight('#fff1d5', '#695348', 2.2));
  const rim = new THREE.DirectionalLight('#ffba74', 2); rim.position.set(3, 7, -9); scene.add(rim);
  const materials = new Map();
  const material = (color, metalness = 0, roughness = .85) => {
    const key = `${color}/${metalness}/${roughness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness, flatShading: true }));
    return materials.get(key);
  };
  let seed = 817;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  function mesh(parent, geometry, color, position, scale, metalness = 0) {
    const object = new THREE.Mesh(geometry, material(color, metalness, metalness ? .35 : .85));
    if (position) object.position.set(...position); if (scale) object.scale.set(...scale);
    object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  }
  const box = (parent, size, color, pos, metal = 0) => mesh(parent, new THREE.BoxGeometry(...size), color, pos, null, metal);
  const sphere = (parent, size, color, pos, metal = 0) => mesh(parent, new THREE.SphereGeometry(1, 10, 8), color, pos, size, metal);
  const cylinder = (parent, top, bottom, height, color, pos, metal = 0, sides = 12) => mesh(parent, new THREE.CylinderGeometry(top, bottom, height, sides), color, pos, null, metal);

  // A locally generated sand texture, with no image downloads or runtime CDN.
  const textureCanvas = document.createElement('canvas'); textureCanvas.width = textureCanvas.height = 512;
  const paint = textureCanvas.getContext('2d'); paint.fillStyle = '#b99868'; paint.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14000; i++) {
    paint.fillStyle = random() > .5 ? '#dcc093' : '#997c54'; paint.globalAlpha = random() * .3;
    paint.fillRect(random() * 512, random() * 512, random() * 3 + .5, random() * 2 + .5);
  }
  const sandMap = new THREE.CanvasTexture(textureCanvas); sandMap.wrapS = sandMap.wrapT = THREE.RepeatWrapping; sandMap.repeat.set(7, 7); sandMap.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(43, 96), new THREE.MeshStandardMaterial({ map: sandMap, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const ring = new THREE.Mesh(new THREE.RingGeometry(6.9, 7, 90), material('#a2865c')); ring.rotation.x = -Math.PI / 2; ring.position.y = .015; scene.add(ring);
  const inner = new THREE.Mesh(new THREE.RingGeometry(3.5, 3.54, 90), material('#b39669')); inner.rotation.x = -Math.PI / 2; inner.position.y = .016; scene.add(inner);

  // Open-front colosseum: stepped seating, stone archways, banners and a crowd.
  for (let i = 0; i < 25; i++) {
    const angle = Math.PI * .47 + i / 24 * Math.PI * 1.06;
    const wall = new THREE.Group(); wall.position.set(Math.sin(angle) * 12, 0, Math.cos(angle) * 12); wall.rotation.y = angle; scene.add(wall);
    box(wall, [1.8, 1.15, 1], '#aa865e', [0, .57, 0]);
    box(wall, [1.96, .18, 1.16], '#d6b382', [0, 1.24, 0]);
    for (let row = 0; row < 3; row++) {
      box(wall, [1.95, .58, .95], row % 2 ? '#b49a75' : '#bd9f76', [0, 1.45 + row * .55, .7 + row * .75]);
    }
    box(wall, [.26, 3.5, .5], '#d4b385', [-.9, 2.8, 2.7]);
    box(wall, [.26, 3.5, .5], '#c5a175', [.9, 2.8, 2.7]);
    const arch = mesh(wall, new THREE.TorusGeometry(.75, .19, 5, 12, Math.PI), '#d7b98b', [0, 3.8, 2.7]);
    box(wall, [1.99, .24, .7], '#d5b486', [0, 4.65, 2.7]);
    if (i % 4 === 1) {
      box(wall, [.7, 1.7, .035], '#8e3327', [0, 2.7, -.6]);
      const crest = mesh(wall, new THREE.OctahedronGeometry(.2), '#d2aa55', [0, 2.9, -.635]); crest.scale.z = .1;
      box(wall, [1, .08, .12], '#503f2c', [0, 3.6, -.62]);
    }
  }
  const crowdColors = ['#633d2c', '#7b6954', '#7b3531', '#556359', '#a37b51'];
  for (const color of crowdColors) {
    const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(.11, 5, 4), material('#b6885f'), 48);
    const bodies = new THREE.InstancedMesh(new THREE.ConeGeometry(.16, .35, 5), material(color), 48);
    const transform = new THREE.Object3D();
    for (let i = 0; i < 48; i++) {
      const a = Math.PI * .49 + random() * Math.PI * 1.02, row = Math.floor(random() * 3), radius = 12.7 + row * .75;
      transform.position.set(Math.sin(a) * radius, 1.95 + row * .55, Math.cos(a) * radius); transform.updateMatrix(); heads.setMatrixAt(i, transform.matrix);
      transform.position.y -= .22; transform.updateMatrix(); bodies.setMatrixAt(i, transform.matrix);
    }
    scene.add(heads, bodies);
  }
  // Monumental entrance behind the combatants.
  box(scene, [3.6, 3.6, .6], '#a77e55', [0, 1.8, -12.2]);
  box(scene, [2.1, 2.7, .64], '#40362b', [0, 1.35, -11.8]);
  for (let i = -3; i <= 3; i++) box(scene, [.065, 2.7, .08], '#807154', [i * .27, 1.35, -11.42]);
  mesh(scene, new THREE.TorusGeometry(1.13, .24, 6, 16, Math.PI), '#d7b785', [0, 2.35, -11.4]);
  for (let i = 0; i < 30; i++) {
    const a = random() * Math.PI * 2, radius = 8 + random() * 3;
    const stone = mesh(scene, new THREE.DodecahedronGeometry(.06 + random() * .12, 0), '#997d58', [Math.sin(a) * radius, .04, Math.cos(a) * radius]); stone.scale.y = .4;
  }
  for (let i = 0; i < 9; i++) {
    const mountain = mesh(scene, new THREE.ConeGeometry(6 + random() * 4, 5 + random() * 5, 5), '#ae9270', [(i - 4) * 9, 1, -38 - random() * 8]); mountain.rotation.y = random(); mountain.castShadow = false;
  }

  function makeFighter(data, enemy = false) {
    const root = new THREE.Group(); scene.add(root);
    const rig = new THREE.Group(); root.add(rig);
    const skin = enemy ? '#bd885b' : '#d3a073', cloth = data.color, bronze = data.armor > 1 ? '#b4bab7' : '#a98542';
    const leather = '#513c2b', blade = data.weapon > 1 ? '#e2d196' : '#c4cece';
    const legs = [];
    for (const sign of [-1, 1]) {
      const leg = new THREE.Group(); leg.position.set(sign * .25, .99, 0); rig.add(leg); legs.push(leg);
      cylinder(leg, .17, .14, .55, skin, [0, -.22, 0]);
      sphere(leg, [.19, .19, .19], bronze, [0, -.46, .09], .55);
      cylinder(leg, .15, .12, .43, leather, [0, -.69, 0]);
      box(leg, [.32, .19, .48], leather, [0, -.92, .11]);
      box(leg, [.34, .055, .38], '#b79859', [0, -.78, .045], .5);
      box(leg, [.3, .055, .38], '#b79859', [0, -.89, .05], .5);
    }
    cylinder(rig, .45, .4, .45, cloth, [0, 1.05, 0]);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2;
      const strip = box(rig, [.19, .47, .08], leather, [Math.sin(a) * .41, .98, Math.cos(a) * .41]); strip.rotation.y = a; strip.rotation.z = Math.sin(a) * -.12;
      sphere(rig, [.038, .038, .018], '#c9a558', [Math.sin(a) * .43, 1.17, Math.cos(a) * .43], .65);
    }
    cylinder(rig, .43, .4, .13, '#9c7840', [0, 1.28, 0], .65);
    box(rig, [.2, .16, .08], '#e0bd65', [0, 1.28, .43], .7);
    cylinder(rig, .47, .37, .78, data.armor ? bronze : cloth, [0, 1.72, 0], data.armor ? .45 : 0);
    for (const sign of [-1, 1]) sphere(rig, [.25, .24, .14], data.armor ? bronze : cloth, [sign * .22, 1.91, .31], data.armor ? .45 : 0);
    for (let i = 0; i < 3; i++) box(rig, [.44, .035, .05], '#c4a362', [0, 1.5 + i * .13, .38], .4);
    cylinder(rig, .15, .17, .23, skin, [0, 2.19, 0]);
    const head = new THREE.Group(); head.position.y = 2.5; rig.add(head);
    sphere(head, [.31, .36, .29], skin, [0, 0, 0]);
    sphere(head, [.08, .13, .1], skin, [0, -.025, .29]);
    for (const sign of [-1, 1]) {
      box(head, [.09, .048, .03], '#28201a', [sign * .13, .065, .263]);
      const brow = box(head, [.12, .045, .05], '#4b3322', [sign * .13, .125, .255]); brow.rotation.z = sign * .18;
      sphere(head, [.095, .12, .07], skin, [sign * .3, -.03, .01]);
    }
    box(head, [.12, .027, .025], '#75422d', [0, -.16, .262]);
    mesh(head, new THREE.SphereGeometry(.37, 12, 8, 0, Math.PI * 2, 0, Math.PI * .55), bronze, [0, .075, -.035], [1, 1, 1], .65);
    cylinder(head, .37, .37, .095, '#d7b46b', [0, .1, -.035], .65);
    for (const sign of [-1, 1]) {
      const cheek = box(head, [.105, .33, .22], bronze, [sign * .275, -.10, .10], .55); cheek.rotation.z = sign * -.2;
    }
    box(head, [.075, .32, .10], '#d0aa5b', [0, .08, .3], .65);
    for (let i = 0; i < 9; i++) {
      const angle = -.9 + i / 8 * 1.8;
      const plume = box(head, [.14, .25, .085], cloth, [0, .35 + Math.cos(angle) * .15, Math.sin(angle) * .32 - .06]); plume.rotation.x = angle * .7;
    }
    const arms = [];
    for (const sign of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(sign * .53, 2, 0); rig.add(arm); arms.push(arm);
      sphere(arm, [.26, .2, .28], bronze, [0, 0, 0], .55);
      cylinder(arm, .145, .12, .47, skin, [0, -.3, 0]);
      cylinder(arm, .13, .16, .25, leather, [0, -.61, .05]);
      sphere(arm, [.14, .14, .15], skin, [0, -.78, .09]);
      arm.rotation.z = sign * .13;
    }
    const shield = new THREE.Group(); shield.position.set(0, -.48, .2); arms[0].add(shield);
    const disc = cylinder(shield, .46, .46, .12, bronze, [0, 0, 0], .6, 16); disc.rotation.x = Math.PI / 2;
    const paint = cylinder(shield, .39, .39, .135, cloth, [0, 0, .025], .1, 16); paint.rotation.x = Math.PI / 2;
    sphere(shield, [.14, .14, .09], '#dec180', [0, 0, .13], .75);
    for (let i = 0; i < 8; i++) sphere(shield, [.03, .03, .03], '#e0c38b', [Math.sin(i * Math.PI / 4) * .34, Math.cos(i * Math.PI / 4) * .34, .11], .6);
    const sword = new THREE.Group(); sword.position.set(.12, -.77, .22); arms[1].add(sword); sword.rotation.x = .15; sword.rotation.z = -.5;
    cylinder(sword, .055, .055, .3, leather, [0, .08, 0]);
    box(sword, [.34, .065, .1], '#d0a65b', [0, .26, 0], .75);
    const edge = box(sword, [.12, .86 + data.weapon * .09, .045], blade, [0, .74 + data.weapon * .045, 0], .8);
    mesh(sword, new THREE.ConeGeometry(.085, .2, 4), blade, [0, 1.27 + data.weapon * .09, 0], [.7, 1, .4], .8);
    const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d'), gradient = sctx.createRadialGradient(32, 32, 1, 32, 32, 30); gradient.addColorStop(0, '#32251fb0'); gradient.addColorStop(1, '#32251f00'); sctx.fillStyle = gradient; sctx.fillRect(0, 0, 64, 64);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.6), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .025; root.add(shadow);
    const size = data.style === 'brute' ? 1.1 : data.style === 'duelist' ? .94 : 1;
    rig.scale.set(size, data.style === 'brute' ? 1.05 : 1, size);
    return { root, rig, arms, legs, head, sword, shield, enemy, event: null, hitAt: -10, shadowTexture, shadow, size };
  }
  const fighters = { player: null, enemy: null };
  let graphicsTime = 0, visible = true, lastRender = 0;
  function disposeFighter(fighter) {
    if (!fighter) return;
    scene.remove(fighter.root);
    fighter.root.traverse(object => { if (object.geometry) object.geometry.dispose(); });
    fighter.shadowTexture.dispose(); fighter.shadow.material.dispose();
  }
  function setFighters(player, enemy) {
    for (const [side, data] of [['player', player], ['enemy', enemy]]) {
      disposeFighter(fighters[side]); fighters[side] = data ? makeFighter(data, side === 'enemy') : null;
    }
  }
  function animate(side, action) {
    const fighter = fighters[side]; if (!fighter || reduced) return;
    if (action === 'lunge') fighter.event = { start: graphicsTime, action };
    if (action === 'hit') fighter.hitAt = graphicsTime;
  }
  function resize() {
    const w = arena.clientWidth, h = arena.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(arena); resize();
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); arena.classList.remove('has-3d'); visible = false;
    document.getElementById('graphics-status').textContent = 'Illustrated mode';
  });
  canvas.addEventListener('webglcontextrestored', () => {
    arena.classList.add('has-3d'); visible = !document.hidden; document.getElementById('graphics-status').textContent = '3D ARENA';
  });
  function frame(timestamp) {
    requestAnimationFrame(frame);
    if (!visible || timestamp - lastRender < 1000 / 30) return;
    graphicsTime += Math.min((timestamp - lastRender) / 1000 || 0, .06); lastRender = timestamp;
    const creating = arena.classList.contains('creating'), mobile = arena.clientWidth < 700;
    const target = new THREE.Vector3(creating && !mobile ? -.1 : 0, creating ? 1.25 : .75, 0);
    // Keep the combat above the command panel, including on short displays.
    camera.position.set(creating ? 5 : 4.5, mobile ? 7 : 5.1, mobile ? 16 : 12.8);
    camera.fov = mobile ? 44 : 38; camera.lookAt(target); camera.clearViewOffset(); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const panel = document.getElementById(document.body.dataset.screen === 'creator' ? 'creator' : 'game-panel');
    const panelBox = panel.getBoundingClientRect(), arenaBox = arena.getBoundingClientRect();
    if (panelBox.width > arena.clientWidth * .7) {
      const foot = new THREE.Vector3(creating ? (mobile ? 0 : 2.4) : 2.15, 0, 0).project(camera);
      const screenY = (-foot.y * .5 + .5) * arena.clientHeight;
      const shift = Math.max(0, screenY - (panelBox.top - arenaBox.top) + 30);
      if (shift > 0) camera.setViewOffset(arena.clientWidth, arena.clientHeight, 0, shift, arena.clientWidth, arena.clientHeight);
    } else if (arena.clientHeight < 470 && arena.clientWidth > 600 && document.body.dataset.screen !== 'creator') {
      camera.setViewOffset(arena.clientWidth, arena.clientHeight, arena.clientWidth * .23, 0, arena.clientWidth, arena.clientHeight);
    }
    for (const [side, fighter] of Object.entries(fighters)) {
      if (!fighter) continue;
      const enemy = side === 'enemy', element = document.getElementById(`${side}-figure`);
      fighter.root.visible = !enemy || !creating;
      const baseX = creating ? (mobile ? 0 : 2.4) : enemy ? 2.15 : -2.15;
      fighter.root.position.set(baseX, 0, 0);
      fighter.rig.position.y = reduced ? 0 : Math.sin(graphicsTime * 2.2 + (enemy ? 2 : 0)) * .024;
      fighter.rig.rotation.set(0, creating ? -.25 : enemy ? -.72 : .72, 0);
      fighter.arms[0].rotation.x = element.classList.contains('guarding') ? -1.1 : -.18;
      fighter.arms[1].rotation.x = -.32;
      fighter.legs[0].rotation.x = 0; fighter.legs[1].rotation.x = 0;
      if (fighter.event) {
        const progress = (graphicsTime - fighter.event.start) / .53;
        if (progress < 1) {
          const motion = Math.sin(progress * Math.PI);
          fighter.root.position.x += (enemy ? -1 : 1) * motion * 2.5;
          fighter.arms[1].rotation.x = -1.4 + Math.sin(progress * Math.PI * 1.5) * 1.7;
          fighter.rig.rotation.z = (enemy ? 1 : -1) * motion * .12;
          fighter.legs[0].rotation.x = motion * .55; fighter.legs[1].rotation.x = -motion * .5;
        } else fighter.event = null;
      }
      if (graphicsTime - fighter.hitAt < .28) fighter.rig.rotation.z += Math.sin((graphicsTime - fighter.hitAt) * 35) * .12;
      if (element.classList.contains('fallen')) { fighter.rig.rotation.z = enemy ? -1.2 : 1.2; fighter.rig.position.y = .15; }
      // Project damage labels from the actual 3D positions instead of fixed percentages.
      const point = new THREE.Vector3(fighter.root.position.x, 3.1, 0).project(camera);
      const label = document.getElementById(`${side}-float`); label.style.left = `${(point.x * .5 + .5) * arena.clientWidth}px`; label.style.top = `${(-point.y * .5 + .5) * arena.clientHeight}px`; label.style.right = 'auto';
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  document.getElementById('graphics-status').textContent = '3D ARENA';
  window.arena3d = { setFighters, animate };
})();
