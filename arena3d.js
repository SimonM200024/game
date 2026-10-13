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
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness, flatShading: false }));
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
  const sphere = (parent, size, color, pos, metal = 0) => mesh(parent, new THREE.SphereGeometry(1, 24, 16), color, pos, size, metal);
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
  const arenaSet = new THREE.Group(); scene.add(arenaSet);
  const ring = new THREE.Mesh(new THREE.RingGeometry(6.9, 7, 90), material('#a2865c')); ring.rotation.x = -Math.PI / 2; ring.position.y = .015; arenaSet.add(ring);
  const inner = new THREE.Mesh(new THREE.RingGeometry(3.5, 3.54, 90), material('#b39669')); inner.rotation.x = -Math.PI / 2; inner.position.y = .016; arenaSet.add(inner);

  // Open-front colosseum: stepped seating, stone archways, banners and a crowd.
  for (let i = 0; i < 25; i++) {
    const angle = Math.PI * .47 + i / 24 * Math.PI * 1.06;
    const wall = new THREE.Group(); wall.position.set(Math.sin(angle) * 12, 0, Math.cos(angle) * 12); wall.rotation.y = angle; arenaSet.add(wall);
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
  // Human-scale seated spectators, placed in rows rather than scattered tiny cones.
  // Instancing keeps the more detailed crowd to a handful of draw calls.
  const crowdColors = ['#633d2c', '#647267', '#963f36', '#52697d', '#b18349'];
  const crowdCount = 144;
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(.23, 8, 6), material('#bf936d'), crowdCount);
  const hair = new THREE.InstancedMesh(new THREE.SphereGeometry(.235, 8, 5, 0, Math.PI * 2, 0, Math.PI * .47), material('#4c392b'), crowdCount);
  const arms = new THREE.InstancedMesh(new THREE.CylinderGeometry(.075, .085, 1, 6), material('#bf936d'), crowdCount * 2);
  const hands = new THREE.InstancedMesh(new THREE.SphereGeometry(.095, 6, 5), material('#bf936d'), crowdCount * 2);
  const legs = new THREE.InstancedMesh(new THREE.CylinderGeometry(.115, .10, .43, 6), material('#655543'), crowdCount * 2);
  const bodies = crowdColors.map(color => new THREE.InstancedMesh(new THREE.CylinderGeometry(.26, .28, .64, 8), material(color), crowdCount));
  const bodyCounts = crowdColors.map(() => 0);
  const seat = new THREE.Object3D(), part = new THREE.Object3D(), matrix = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  function placeCrowdPart(object, index, position, rotationX = 0) {
    part.position.set(...position); part.rotation.set(rotationX, 0, 0); part.scale.set(1, 1, 1); part.updateMatrix();
    matrix.multiplyMatrices(seat.matrix, part.matrix); object.setMatrixAt(index, matrix);
  }
  for (let i = 0; i < crowdCount; i++) {
    const row = Math.floor(i / 48), column = i % 48;
    const angle = Math.PI * .49 + (column + .5 + (row % 2) * .23) / 48 * Math.PI * 1.02;
    const radius = 12.7 + row * .75;
    seat.position.set(Math.sin(angle) * radius, 1.74 + row * .55, Math.cos(angle) * radius);
    seat.rotation.y = angle + Math.PI; seat.updateMatrix();
    const color = (column * 3 + row * 2) % crowdColors.length;
    placeCrowdPart(bodies[color], bodyCounts[color]++, [0, .4, 0]);
    placeCrowdPart(heads, i, [0, .94, 0]);
    placeCrowdPart(hair, i, [0, .96, 0]);
    for (const [limb, sign] of [[0, -1], [1, 1]]) {
      const index = i * 2 + limb, cheering = (column + row * 3) % 5 === 1;
      const shoulder = new THREE.Vector3(sign * .28, .65, 0);
      const hand = new THREE.Vector3(sign * (cheering ? .46 : .36), cheering ? 1.28 : .17, .12);
      const direction = hand.clone().sub(shoulder);
      part.position.copy(shoulder).add(hand).multiplyScalar(.5);
      part.quaternion.setFromUnitVectors(up, direction.clone().normalize()); part.scale.set(1, direction.length(), 1); part.updateMatrix();
      matrix.multiplyMatrices(seat.matrix, part.matrix); arms.setMatrixAt(index, matrix);
      placeCrowdPart(hands, index, hand.toArray());
      placeCrowdPart(legs, index, [sign * .14, .03, .24], Math.PI / 2);
    }
  }
  bodies.forEach((body, index) => { body.count = bodyCounts[index]; arenaSet.add(body); });
  arenaSet.add(heads, hair, arms, hands, legs);
  // Monumental entrance behind the combatants.
  box(arenaSet, [3.6, 3.6, .6], '#a77e55', [0, 1.8, -12.2]);
  box(arenaSet, [2.1, 2.7, .64], '#40362b', [0, 1.35, -11.8]);
  for (let i = -3; i <= 3; i++) box(arenaSet, [.065, 2.7, .08], '#807154', [i * .27, 1.35, -11.42]);
  mesh(arenaSet, new THREE.TorusGeometry(1.13, .24, 6, 16, Math.PI), '#d7b785', [0, 2.35, -11.4]);
  for (let i = 0; i < 30; i++) {
    const a = random() * Math.PI * 2, radius = 8 + random() * 3;
    const stone = mesh(arenaSet, new THREE.DodecahedronGeometry(.06 + random() * .12, 0), '#997d58', [Math.sin(a) * radius, .04, Math.cos(a) * radius]); stone.scale.y = .4;
  }
  for (let i = 0; i < 9; i++) {
    const mountain = mesh(scene, new THREE.ConeGeometry(6 + random() * 4, 5 + random() * 5, 5), '#ae9270', [(i - 4) * 9, 1, -38 - random() * 8]); mountain.rotation.y = random(); mountain.castShadow = false;
  }

  // A separate town set gives the forge and tavern a physical home between bouts.
  const townSet = new THREE.Group(); townSet.visible = false; scene.add(townSet);
  let townLocation = false, storyChapter = 0;
  function sign(parent, words, position, width = 2.8) {
    const surface = document.createElement('canvas'); surface.width = 512; surface.height = 128;
    const brush = surface.getContext('2d'); brush.fillStyle = '#34251a'; brush.fillRect(0, 0, 512, 128);
    brush.strokeStyle = '#d6ad65'; brush.lineWidth = 8; brush.strokeRect(6, 6, 500, 116);
    brush.fillStyle = '#f4d8a0'; brush.font = 'bold 38px Georgia'; brush.textAlign = 'center'; brush.textBaseline = 'middle'; brush.fillText(words, 256, 66, 460);
    const map = new THREE.CanvasTexture(surface); map.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 4), new THREE.MeshStandardMaterial({ map, roughness: 1 })); board.position.set(...position); parent.add(board);
  }
  function house(x, z, name, roofColor) {
    const house = new THREE.Group(); house.position.set(x, 0, z); townSet.add(house);
    box(house, [3.8, 3.1, 2.8], '#c09b6b', [0, 1.55, 0]);
    for (const side of [-1, 1]) box(house, [.18, 3.2, 2.95], '#644b32', [side * 1.8, 1.6, 0]);
    box(house, [3.85, .15, 2.96], '#725035', [0, 2.35, 0]);
    const roof = mesh(house, new THREE.ConeGeometry(3.25, 1.45, 4), roofColor, [0, 3.8, 0]); roof.rotation.y = Math.PI / 4; roof.scale.z = .82;
    box(house, [1, 1.9, .08], '#423326', [0, .96, 1.43]);
    for (const side of [-1, 1]) {
      box(house, [.66, .75, .1], '#513d29', [side * 1.18, 1.6, 1.45]);
      box(house, [.045, .75, .12], '#b99354', [side * 1.18, 1.6, 1.51]);
    }
    sign(house, name, [0, 2.65, 1.52], 3.1); return house;
  }
  house(-5.6, -6.5, 'THE BENT COIN', '#925341');
  const forge = house(.1, -5, 'BRANN’S FORGE', '#715e48');
  house(5.7, -7.5, 'CASSIAN’S YARD', '#526665');
  // Open furnace, chimney and a broad anvil in front of the blacksmith.
  box(forge, [1.15, 1.4, .95], '#69594b', [-2.15, .7, 1]);
  box(forge, [.84, .63, .08], '#241d18', [-2.15, .6, 1.5]);
  const fire = new THREE.Mesh(new THREE.IcosahedronGeometry(.29, 0), new THREE.MeshStandardMaterial({ color: '#ff9a26', emissive: '#ff6118', emissiveIntensity: 2 })); fire.position.set(-2.15, .5, 1.52); fire.scale.y = 1.3; forge.add(fire);
  box(forge, [.65, 2.9, .65], '#746350', [-2.15, 2.3, 1]);
  const fireLight = new THREE.PointLight('#ff973d', 7, 5); fireLight.position.set(-2.05, .9, 1.9); forge.add(fireLight);
  cylinder(townSet, .45, .52, .65, '#614632', [-.8, .33, -1.6]);
  box(townSet, [1.05, .23, .52], '#54565a', [-.8, .78, -1.6], .7);
  box(townSet, [.43, .4, .38], '#55514b', [-.8, .56, -1.6], .6);
  const horn = mesh(townSet, new THREE.ConeGeometry(.23, .55, 6), '#777a79', [-.03, .79, -1.6], null, .7); horn.rotation.z = -Math.PI / 2;
  for (const [x, z] of [[-4, -2.4], [4.7, -3.8], [5.4, -4.1]]) {
    cylinder(townSet, .35, .35, .85, '#7c5934', [x, .43, z]);
    for (const y of [.17, .67]) cylinder(townSet, .365, .365, .07, '#464647', [x, y, z], .6);
  }
  // Brann is a shopkeeper in an apron, not another armored opponent.
  const smith = new THREE.Group(); smith.position.set(-.8, 0, -2.8); townSet.add(smith);
  for (const side of [-1, 1]) { cylinder(smith, .16, .14, .9, '#594735', [side * .24, .45, 0]); box(smith, [.34, .2, .48], '#3e3329', [side * .24, .12, .1]); }
  cylinder(smith, .5, .4, .85, '#be9368', [0, 1.35, 0]);
  box(smith, [.75, .85, .08], '#684431', [0, 1.22, .4]);
  sphere(smith, [.3, .36, .29], '#c79870', [0, 2.03, 0]);
  sphere(smith, [.23, .21, .12], '#574031', [0, 1.87, .21]);
  sphere(smith, [.065, .09, .075], '#c79870', [0, 2.02, .29]);
  for (const side of [-1, 1]) {
    sphere(smith, [.05, .027, .018], '#302820', [side * .12, 2.12, .26]);
    sphere(smith, [.11, .13, .1], '#bd8d62', [side * .57, .94, .03]);
  }
  mesh(smith, new THREE.SphereGeometry(.305, 20, 12, 0, Math.PI * 2, 0, Math.PI * .45), '#574031', [0, 2.11, -.035]);
  for (const side of [-1, 1]) cylinder(smith, .14, .12, .73, '#bd8d62', [side * .57, 1.35, 0]);
  box(smith, [.07, .48, .07], '#715036', [.6, 1.12, .15]); box(smith, [.35, .18, .2], '#606062', [.6, 1.4, .15], .7);

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
    sphere(rig, [.46, .47, .34], data.armor ? bronze : cloth, [0, 1.72, 0], data.armor ? .45 : 0);
    for (const sign of [-1, 1]) sphere(rig, [.23, .16, .055], data.armor ? bronze : cloth, [sign * .20, 1.91, .28], data.armor ? .45 : 0);
    for (let i = 0; i < 3; i++) box(rig, [.44, .035, .05], '#c4a362', [0, 1.5 + i * .13, .38], .4);
    cylinder(rig, .15, .17, .23, skin, [0, 2.19, 0]);
    const head = new THREE.Group(); head.position.y = 2.5; rig.add(head);
    // Smaller skull, tapered jaw, cheekbones and inset eyes instead of a toy face.
    head.scale.set(.78, .86, .85);
    sphere(head, [.29, .34, .265], skin, [0, .025, -.02]);
    sphere(head, [.235, .19, .235], skin, [0, -.16, .025]);
    sphere(head, [.16, .095, .15], skin, [0, -.275, .075]);
    sphere(head, [.047, .115, .065], skin, [0, -.015, .245]);
    sphere(head, [.066, .044, .07], skin, [0, -.087, .277]);
    for (const sign of [-1, 1]) {
      sphere(head, [.09, .047, .036], '#855c43', [sign * .12, .045, .237]);
      sphere(head, [.065, .028, .024], '#e6dac8', [sign * .12, .047, .264]);
      sphere(head, [.025, .028, .014], '#493b2b', [sign * .116, .048, .285]);
      sphere(head, [.011, .019, .009], '#211b18', [sign * .116, .048, .296]);
      const brow = sphere(head, [.09, .02, .025], '#483329', [sign * .12, .107, .249]); brow.rotation.z = sign * .12;
      sphere(head, [.066, .10, .047], skin, [sign * .29, -.045, -.01]);
      sphere(head, [.09, .07, .04], skin, [sign * .17, -.08, .218]);
    }
    sphere(head, [.085, .017, .016], '#915d4b', [0, -.193, .235]);
    sphere(head, [.075, .013, .015], '#bd8770', [0, -.215, .235]);
    // Open helmets leave the face visible. Unarmored recruits wear short hair.
    mesh(head, new THREE.SphereGeometry(.305, 24, 16, 0, Math.PI * 2, 0, Math.PI * .48), data.armor ? bronze : '#423028', [0, .1, -.035], [1, 1, 1], data.armor ? .5 : 0);
    if (data.armor) {
      cylinder(head, .31, .31, .05, '#d7b46b', [0, .13, -.035], .6, 24);
      for (const side of [-1, 1]) {
        const cheek = box(head, [.055, .25, .15], bronze, [side * .28, -.09, .02], .5); cheek.rotation.z = side * -.15;
      }
      if (data.armor > 1) for (let i = 0; i < 9; i++) {
        const angle = -.9 + i / 8 * 1.8;
        const plume = box(head, [.10, .18, .075], cloth, [0, .35 + Math.cos(angle) * .1, Math.sin(angle) * .27 - .06]); plume.rotation.x = angle * .7;
      }
    }
    const arms = [];
    for (const sign of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(sign * .53, 2, 0); rig.add(arm); arms.push(arm);
      sphere(arm, [.19, .22, .20], data.armor ? bronze : skin, [0, -.035, 0], data.armor ? .45 : 0);
      sphere(arm, [.135, .25, .14], skin, [0, -.27, 0]);
      sphere(arm, [.115, .11, .115], skin, [0, -.47, .02]);
      cylinder(arm, .13, .16, .25, leather, [0, -.61, .05]);
      sphere(arm, [.095, .135, .10], skin, [0, -.78, .09]);
      sphere(arm, [.045, .085, .05], skin, [-sign * .085, -.76, .13]);
      arm.rotation.z = sign * .13;
    }
    const shield = new THREE.Group(); shield.scale.setScalar(1 + Math.min(data.shield || 0, 3) * .07); shield.position.set(0, -.48, .2); arms[0].add(shield);
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
    rig.scale.set(size * .82, data.style === 'brute' ? 1.14 : 1.1, size * .88);
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
    arenaSet.visible = !townLocation; townSet.visible = townLocation;
    const target = new THREE.Vector3(creating && !mobile ? -.1 : 0, creating ? 1.25 : .75, 0);
    // Keep the combat above the command panel, including on short displays.
    camera.position.set(creating ? 5 : 0, mobile ? 7 : 5.1, mobile ? 16 : 12.8);
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
      // Model forward is +Z. Face exactly along the arena's X axis toward the opponent.
      fighter.rig.rotation.set(0, creating || townLocation ? -.25 : enemy ? -Math.PI / 2 : Math.PI / 2, 0);
      fighter.arms[0].rotation.x = element.classList.contains('guarding') ? -1.1 : -.18;
      fighter.arms[1].rotation.x = creating ? -.32 : .1;
      fighter.sword.rotation.x = creating ? .15 : .9;
      fighter.sword.rotation.z = creating ? -.5 : -.1;
      fighter.legs[0].rotation.x = creating || townLocation ? .04 : .12; fighter.legs[1].rotation.x = creating || townLocation ? -.04 : -.12;
      fighter.head.rotation.y = reduced ? 0 : Math.sin(graphicsTime * .7) * .035;
      if (fighter.event) {
        const progress = (graphicsTime - fighter.event.start) / .53;
        if (progress < 1) {
          const motion = Math.sin(progress * Math.PI);
          fighter.root.position.x += (enemy ? -1 : 1) * motion * 2.5;
          fighter.arms[1].rotation.x = -1.4 + Math.sin(progress * Math.PI * 1.5) * 1.7;
          fighter.rig.rotation.x = motion * .12;
          fighter.legs[0].rotation.x = motion * .55; fighter.legs[1].rotation.x = -motion * .5;
        } else fighter.event = null;
      }
      if (graphicsTime - fighter.hitAt < .28) fighter.rig.rotation.x -= Math.sin((graphicsTime - fighter.hitAt) * 35) * .12;
      if (element.classList.contains('fallen')) { fighter.rig.rotation.z = enemy ? -1.2 : 1.2; fighter.rig.position.y = .15; }
      // Project damage labels from the actual 3D positions instead of fixed percentages.
      const point = new THREE.Vector3(fighter.root.position.x, 3.1, 0).project(camera);
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
  document.getElementById('graphics-status').textContent = '3D ARENA';
  function setLocation(town, chapter) {
    townLocation = town; storyChapter = chapter;
    const sky = ['#e7c89a', '#e1ccb0', '#c5aa9c', '#e4c9a3'][storyChapter] || '#e7c89a';
    scene.background.set(sky); scene.fog.color.set(sky);
  }
  window.arena3d = { setFighters, animate, setLocation };
})();
