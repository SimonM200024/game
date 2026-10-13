import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

const MODEL_URL = 'assets/models/anime-fighter.vrm';
let modelBytes;
function bytes() {
  if (!modelBytes) modelBytes = fetch(MODEL_URL).then(response => {
    if (!response.ok) throw new Error('Character model could not load');
    return response.arrayBuffer();
  }).catch(error => { modelBytes = null; throw error; });
  return modelBytes;
}
const euler = new THREE.Euler(), target = new THREE.Quaternion();

export function studioLights(scene) {
  scene.add(new THREE.HemisphereLight('#dceaff', '#746a69', 1.1));
  const key = new THREE.DirectionalLight('#fff0df', 1.4); key.position.set(-3,6,5); scene.add(key);
  const rim = new THREE.DirectionalLight('#b4d8ff', .8); rim.position.set(3,4,-4); scene.add(rim);
}

export async function loadActor(data = {}, enemy = false) {
  const loader = new GLTFLoader(); loader.register(parser => new VRMLoaderPlugin(parser));
  const gltf = await loader.parseAsync((await bytes()).slice(0), '');
  const vrm = gltf.userData.vrm;
  VRMUtils.rotateVRM0(vrm);
  const root = new THREE.Group(); root.add(vrm.scene);
  const bounds = new THREE.Box3().setFromObject(vrm.scene);
  const height = bounds.max.y - bounds.min.y;
  vrm.scene.scale.setScalar(3.25 / height);
  vrm.scene.position.y = -bounds.min.y * 3.25 / height;
  vrm.scene.traverse(object => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (/Tops|Bottoms/.test(material.name) && material.color) {
        material.color.set(enemy ? '#50748c' : data.color || '#aa4b48');
        material.shadeColorFactor?.copy(material.color).multiplyScalar(.65);
      }
      if (enemy && /HAIR/.test(material.name) && material.color) material.color.set('#737582');
    }
  });
  for (const joint of vrm.springBoneManager?.joints || []) {
    joint.center = vrm.scene;
    joint.settings.dragForce = .65;
    joint.settings.stiffness = Math.max(1.2,joint.settings.stiffness);
    joint.settings.gravityPower = Math.min(.25,joint.settings.gravityPower);
  }
  const fingers = [];
  for (const side of ['left','right']) for (const finger of ['Index','Middle','Ring','Little']) for (const segment of ['Proximal','Intermediate','Distal']) {
    const bone = vrm.humanoid.getNormalizedBoneNode(side+finger+segment);
    if(bone) fingers.push({bone,sign:side==='left'?-1:1});
  }
  const bones = {};
  for (const name of ['hips','spine','chest','neck','head','leftUpperArm','rightUpperArm','leftLowerArm','rightLowerArm','leftHand','rightHand','leftUpperLeg','rightUpperLeg','leftLowerLeg','rightLowerLeg','leftFoot','rightFoot']) {
    bones[name] = vrm.humanoid.getNormalizedBoneNode(name);
  }
  const origin = bones.hips.position.clone();
  const metal = new THREE.MeshStandardMaterial({color: data.weapon > 1 ? '#e7d69c' : '#b8c9d2', metalness:.7, roughness:.3});
  const leather = new THREE.MeshStandardMaterial({color:'#473329', roughness:.85});
  const gold = new THREE.MeshStandardMaterial({color:'#c6a166', metalness:.6, roughness:.4});
  const sword = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(.042,.53+(data.weapon||0)*.025,.016), metal); blade.position.y = .29; sword.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.03,.08,4),metal); tip.position.y = .59+(data.weapon||0)*.025; sword.add(tip);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.12,8),leather); grip.position.y = -.03; sword.add(grip);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(.16,.035,.045),gold); cross.position.y = .045; sword.add(cross);
  sword.rotation.z = Math.PI/2; sword.position.set(-.055,-.015,.015);
  vrm.humanoid.getRawBoneNode('rightHand').add(sword);
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.035,24),gold);
  shield.rotation.x = Math.PI/2; shield.position.set(.02,0,.08);
  vrm.humanoid.getRawBoneNode('leftLowerArm').add(shield);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),metal); boss.scale.z=.4; boss.position.set(0,.03,0); shield.add(boss);
  let phase = 0;
  function update(dt, time, {walk=0, attack=0, guard=false, hit=0, fallen=false, reduced=false} = {}) {
    phase += reduced ? 0 : dt;
    const breathe = reduced ? 0 : Math.sin(phase*2.3);
    const stride = Math.sin(time*15)*walk;
    const pose = {
      hips:[0,0,0], spine:[.025+breathe*.012,0,-stride*.025], chest:[0,breathe*.015,0],
      neck:[0,0,0], head:[0,reduced ? 0 : Math.sin(phase*.7)*.06,0],
      leftUpperArm:[-.2-stride*.2,0,-1.28], rightUpperArm:[-.12+stride*.3,0,1.28],
      leftLowerArm:[0,-.35,0], rightLowerArm:[0,.35,0],
      leftHand:[0,0,0], rightHand:[0,0,0],
      leftUpperLeg:[stride*.65,0,0], rightUpperLeg:[-stride*.65,0,0],
      leftLowerLeg:[Math.max(0,-stride)*.95,0,0], rightLowerLeg:[Math.max(0,stride)*.95,0,0],
      leftFoot:[-Math.max(0,-stride)*.25,0,0], rightFoot:[-Math.max(0,stride)*.25,0,0]
    };
    if (guard) {
      pose.leftUpperArm = [-.9,0,-.7]; pose.leftLowerArm = [0,-1.35,0]; pose.spine[0] = .12;
    }
    if (attack > 0) {
      const wind = Math.sin(attack*Math.PI);
      pose.rightUpperArm = [-1.9*wind, -.35*wind, 1.28-.85*wind];
      pose.rightLowerArm = [0,.35+Math.sin(attack*Math.PI*2)*.8,0];
      pose.chest = [.18*wind,-.65*Math.sin(attack*Math.PI*2),0];
      pose.leftUpperArm = [-.5,0,-1];
      pose.head[1] = .1*wind;
    }
    if (hit > 0) { pose.spine[0] = -.3*hit; pose.head[0] = -.2*hit; }
    const blend = reduced ? 1 : 1-Math.exp(-18*dt);
    for (const [name, angles] of Object.entries(pose)) {
      if (!bones[name]) continue;
      target.setFromEuler(euler.set(...angles)); bones[name].quaternion.slerp(target,blend);
    }
    for(const {bone,sign} of fingers) bone.rotation.z = sign*.7;
    bones.hips.position.copy(origin);
    if (!reduced) bones.hips.position.y += Math.abs(stride)*.014 + breathe*.002;
    if (fallen) { root.rotation.z = -1.35; root.position.y = .28; }
    else { root.rotation.z = 0; root.position.y = 0; }
    const blink = reduced ? 0 : Math.max(0,1-Math.abs((phase%4.2)-.12)/.08);
    vrm.expressionManager?.setValue('blink',blink);
    vrm.update(reduced ? 0 : Math.min(dt,.04));
  }
  update(1/30,0,{reduced:true});
  function resetSpring() { root.updateMatrixWorld(true); vrm.springBoneManager?.reset(); }
  resetSpring();
  return {root,vrm,bones,update,resetSpring,dispose(){VRMUtils.deepDispose(root);}};
}
