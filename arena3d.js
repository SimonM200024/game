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
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#e7c89a');
  scene.fog = new THREE.Fog('#e7c89a', 22, 67);
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 110);
  let townLocation = false, storyChapter = 0;
  // Painted environments replace the block geometry, retaining camera and combat placement.
  const worldArt = {};
  for (const name of ['town','arena']) {
    const texture = new THREE.TextureLoader().load(`assets/world/${name}.png`);
    texture.colorSpace = THREE.SRGBColorSpace; worldArt[name] = texture;
  }
  const characterTextures = new Map();
  function characterTexture(path) {
    if (!characterTextures.has(path)) {
      const texture = new THREE.TextureLoader().load(path);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      characterTextures.set(path, texture);
    }
    return characterTextures.get(path);
  }
  // Painted character cutouts stay readable against the 3D environment.
  function makeFighter(data, enemy = false) {
    const root = new THREE.Group(), rig = new THREE.Group(); root.add(rig); scene.add(root);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.6, 24, 36), new THREE.MeshBasicMaterial({
      map: characterTexture(data.art || 'assets/characters/hero.png'), transparent: true,
      alphaTest: .08, depthWrite: false, side: THREE.DoubleSide, toneMapped: false
    }));
    art.position.y = 1.8; art.scale.x = enemy ? -1 : 1; rig.add(art);
    const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 64;
    const brush = shadowCanvas.getContext('2d'), fade = brush.createRadialGradient(32,32,1,32,32,30);
    fade.addColorStop(0,'#1a1619a0'); fade.addColorStop(1,'#1a161900'); brush.fillStyle = fade; brush.fillRect(0,0,64,64);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.2), new THREE.MeshBasicMaterial({ map:shadowTexture, transparent:true, depthWrite:false }));
    shadow.rotation.x = -Math.PI/2; shadow.position.y = .025; root.add(shadow);
    const banner = new THREE.Mesh(new THREE.RingGeometry(.66,.69,48), new THREE.MeshBasicMaterial({ color:data.color, transparent:true, opacity:.7, side:THREE.DoubleSide }));
    banner.rotation.x = -Math.PI/2; banner.position.y = .03; root.add(banner);
    const slash = new THREE.Mesh(new THREE.RingGeometry(.72,.77,40,1,-.7,Math.PI*1.2), new THREE.MeshBasicMaterial({color:'#fff2bd',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    slash.position.set(enemy ? -.5 : .5,1.8,.15); rig.add(slash);
    const rest = new Float32Array(art.geometry.attributes.position.array);
    const size = data.style === 'brute' ? 1.06 : data.style === 'duelist' ? .96 : 1;
    rig.scale.set(size,size,1);
    return { root, rig, art, banner, slash, rest, sway:0, velocity:0, enemy, event:null, hitAt:-10, shadowTexture, shadow, size };
  }
  const fighters = { player: null, enemy: null };
  let graphicsTime = 0, visible = true, lastRender = 0;
  function disposeFighter(fighter) {
    if (!fighter) return;
    scene.remove(fighter.root);
    fighter.root.traverse(object => { if (object.geometry) object.geometry.dispose(); });
    fighter.shadowTexture.dispose(); fighter.shadow.material.dispose(); fighter.art.material.dispose(); fighter.banner.material.dispose(); fighter.slash.material.dispose();
  }
  function setFighters(player, enemy) {
    for (const [side, data] of [['player', player], ['enemy', enemy]]) {
      disposeFighter(fighters[side]); fighters[side] = data ? makeFighter(data, side === 'enemy') : null;
    }
  }
  function animate(side, action) {
    const fighter = fighters[side]; if (!fighter || reduced) return;
    if (action === 'lunge') { fighter.event = { start: graphicsTime, action }; fighter.velocity += fighter.enemy ? -1.4 : 1.4; }
    if (action === 'hit') { fighter.hitAt = graphicsTime; fighter.velocity += fighter.enemy ? 1.8 : -1.8; }
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
    arena.classList.add('has-3d'); visible = !document.hidden; document.getElementById('graphics-status').textContent = 'ANIME WORLD';
  });
  function frame(timestamp) {
    requestAnimationFrame(frame);
    if (!visible || timestamp - lastRender < 1000 / 30) return;
    const dt = Math.min((timestamp - lastRender) / 1000 || 0, .06);
    graphicsTime += dt; lastRender = timestamp;
    const creating = arena.classList.contains('creating'), mobile = arena.clientWidth < 700;
    const target = new THREE.Vector3(creating && !mobile ? -.1 : 0, creating ? 1.25 : .75, 0);
    // Keep the combat above the command panel, including on short displays.
    camera.position.set(creating ? 5 : 0, mobile ? 7 : 5.1, mobile ? 16 : 12.8);
    camera.fov = mobile ? 44 : 38; camera.lookAt(target); camera.clearViewOffset(); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const panel = document.getElementById(document.body.dataset.screen === 'creator' ? 'creator' : 'game-panel');
    const panelBox = panel.getBoundingClientRect(), arenaBox = arena.getBoundingClientRect();
    const background = townLocation ? worldArt.town : worldArt.arena;
    if (background.image) {
      scene.background = background;
      const visibleHeight = panelBox.width > arena.clientWidth * .7 ? Math.max(180, Math.min(arena.clientHeight,panelBox.top-arenaBox.top+20)) : arena.clientHeight;
      const imageAspect = background.image.width / background.image.height;
      const viewAspect = arena.clientWidth / visibleHeight;
      const cropY = 1; // Preserve the complete painted skyline above the control dock.
      background.repeat.set(Math.min(1,viewAspect/imageAspect),cropY*arena.clientHeight/visibleHeight);
      background.offset.set((1-background.repeat.x)/2,cropY-background.repeat.y);
    }

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
      // Billboard the artwork toward the camera; the opposing sprite is mirrored.
      fighter.rig.rotation.set(0, Math.atan2(camera.position.x - baseX, camera.position.z), 0);
      fighter.slash.material.opacity = 0;
      fighter.art.material.color.set(element.classList.contains('guarding') ? '#c6e9ff' : '#ffffff');
      if (fighter.event) {
        const progress = (graphicsTime - fighter.event.start) / .53;
        if (progress < 1) {
          const motion = Math.sin(progress * Math.PI);
          fighter.root.position.x += (enemy ? -1 : 1) * motion * 2.5;
          fighter.rig.rotation.z = (enemy ? 1 : -1) * motion * .10;
          fighter.rig.rotation.y += (enemy ? -1 : 1) * motion * .25;
          fighter.slash.material.opacity = Math.sin(progress * Math.PI) * .8;
          fighter.slash.rotation.z = (enemy ? -1 : 1) * progress * 2;
        } else fighter.event = null;
      }
      if (graphicsTime - fighter.hitAt < .28) { fighter.rig.rotation.z += Math.sin((graphicsTime - fighter.hitAt) * 35) * .08; fighter.art.material.color.set('#ffb6a5'); }
      if (element.classList.contains('fallen')) { fighter.rig.rotation.z = enemy ? -1.2 : 1.2; fighter.rig.position.y = .15; }
      // Damped spring: attacks and hits pull the illustration, then cloth settles.
      if (!reduced) {
        fighter.velocity += (-38 * fighter.sway - 9 * fighter.velocity + Math.sin(graphicsTime * 1.8) * .24) * dt;
        fighter.sway = THREE.MathUtils.clamp(fighter.sway + fighter.velocity * dt, -.13, .13);
        const positions = fighter.art.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const x = fighter.rest[i*3], y = fighter.rest[i*3+1];
          const anchor = THREE.MathUtils.smoothstep(y,-1.7,1.4);
          const cloth = Math.exp(-Math.pow((y+.55)*2.7,2)) * Math.min(1,Math.abs(x)*2);
          const hair = THREE.MathUtils.smoothstep(y,1.15,1.65);
          const breeze = Math.sin(graphicsTime*2.3+y*3+x*2)*.012;
          positions.setX(i,x + fighter.sway*anchor + (breeze+fighter.sway*.45)*(cloth+hair));
          positions.setY(i,y + Math.sin(graphicsTime*2.2)*.007*anchor);
        }
        positions.needsUpdate = true;
      }
      // Project damage labels from the actual 3D positions instead of fixed percentages.
      const point = new THREE.Vector3(fighter.root.position.x, 3.85, 0).project(camera);
      const nameplate = document.getElementById(`${side}-nameplate`);
      if (nameplate) {
        nameplate.hidden = (creating && !townLocation) || (enemy && townLocation);
        nameplate.style.left = `${(point.x * .5 + .5) * arena.clientWidth}px`;
        nameplate.style.top = `${(-point.y * .5 + .5) * arena.clientHeight - 20}px`;
      }
      const label = document.getElementById(`${side}-float`); label.style.left = `${(point.x * .5 + .5) * arena.clientWidth}px`; label.style.top = `${(-point.y * .5 + .5) * arena.clientHeight}px`; label.style.right = 'auto';
    }
    renderer.render(scene, camera);

  }
  requestAnimationFrame(frame);
  document.getElementById('graphics-status').textContent = 'ANIME WORLD';
  function setLocation(town, chapter) {
    townLocation = town; storyChapter = chapter;
    const sky = ['#e7c89a', '#e1ccb0', '#c5aa9c', '#e4c9a3'][storyChapter] || '#e7c89a';
    if (scene.background.isColor) scene.background.set(sky); scene.fog.color.set(sky);
  }
  window.arena3d = { setFighters, animate, setLocation };
})();
