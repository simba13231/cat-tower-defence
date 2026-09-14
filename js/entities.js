/* =========================================================================
   entities.js — builds the low-poly-but-cute cat & dog character meshes
   ========================================================================= */

let _furTex = null;
function furTex(){ if (!_furTex) _furTex = makeFurTexture(); return _furTex; }

function stdMat(color, opts){
  opts = opts || {};
  return new THREE.MeshStandardMaterial({
    color,
    map: opts.fur !== false ? furTex() : null,
    roughness: opts.roughness != null ? opts.roughness : 0.65,
    metalness: opts.metalness != null ? opts.metalness : 0.04,
    transparent: !!opts.opacity,
    opacity: opts.opacity != null ? opts.opacity : 1,
    emissive: opts.emissive != null ? opts.emissive : 0x000000,
    emissiveIntensity: opts.emissiveIntensity || 0,
  });
}

function eyeSet(headGroup, z, yBase, spread){
  const eyeGeo = new THREE.SphereGeometry(0.05,10,10);
  const eyeMat = new THREE.MeshStandardMaterial({color:0x211a14, roughness:0.3});
  const hiGeo = new THREE.SphereGeometry(0.017,6,6);
  const hiMat = new THREE.MeshBasicMaterial({color:0xffffff});
  [-1,1].forEach(side=>{
    const eye = new THREE.Mesh(eyeGeo,eyeMat);
    eye.position.set(side*spread, yBase, z);
    const hi = new THREE.Mesh(hiGeo,hiMat);
    hi.position.set(side*spread+0.018, yBase+0.02, z+0.035);
    headGroup.add(eye,hi);
  });
}

function makeLeg(color, sockColor){
  const g = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.048,0.05,0.2,8), stdMat(color));
  upper.position.y = -0.06; upper.castShadow = true;
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.052,0.09,8), stdMat(sockColor, {roughness:0.8}));
  sock.position.y = -0.19; sock.castShadow = true;
  g.add(upper, sock);
  g.position.y = 0.16;
  return g;
}

/* --------------------------------- CATS ----------------------------------- */
function createCatMesh(def){
  const g = new THREE.Group();
  const color = def.color;
  const light = lightenColor(color, 0.55);
  const dark = darkenColor(color, 0.22);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28,14,10), stdMat(color));
  body.scale.set(1.05,0.95,1.35);
  body.position.y = 0.4; body.castShadow = true;

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.19,10,8), stdMat(light,{roughness:0.75}));
  belly.scale.set(0.9,0.75,1.05);
  belly.position.set(0,0.28,0.12); belly.castShadow = true;

  const headGroup = new THREE.Group();
  headGroup.position.set(0,0.68,0.36);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23,16,12), stdMat(color));
  head.scale.set(1,0.92,0.95); head.castShadow = true;
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.11,10,8), stdMat(light,{roughness:0.7}));
  muzzle.scale.set(1,0.8,0.85);
  muzzle.position.set(0,-0.05,0.17); muzzle.castShadow = true;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03,8,8), new THREE.MeshStandardMaterial({color:0xe98fae, roughness:0.4}));
  nose.position.set(0,-0.01,0.27);
  headGroup.add(head, muzzle, nose);
  eyeSet(headGroup, 0.18, 0.05, 0.1);

  const earGeo = new THREE.ConeGeometry(0.095,0.16,4);
  const innerEarGeo = new THREE.ConeGeometry(0.055,0.1,4);
  [-1,1].forEach(side=>{
    const ear = new THREE.Mesh(earGeo, stdMat(color));
    ear.position.set(side*0.14,0.2,0.02); ear.rotation.z = side*-0.25; ear.rotation.y = side*0.5;
    ear.castShadow = true;
    const inner = new THREE.Mesh(innerEarGeo, stdMat(0xffc9d9,{roughness:0.7}));
    inner.position.set(0,0.01,0.04); inner.rotation.x = 0.15;
    ear.add(inner);
    headGroup.add(ear);
  });

  const tail = new THREE.Group();
  const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.07,0.5,8), stdMat(color));
  tailBase.position.y = 0.25; tailBase.castShadow = true;
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.06,8,8), stdMat(light,{roughness:0.75}));
  tailTip.position.y = 0.5; tailTip.castShadow = true;
  tail.add(tailBase, tailTip);
  tail.position.set(0,0.52,-0.42); tail.rotation.x = 0.95;

  const legFL = makeLeg(color, light); legFL.position.set(-0.15,0.16,0.22);
  const legFR = makeLeg(color, light); legFR.position.set(0.15,0.16,0.22);
  const legBL = makeLeg(color, light); legBL.position.set(-0.15,0.16,-0.2);
  const legBR = makeLeg(color, light); legBR.position.set(0.15,0.16,-0.2);

  g.add(body,belly,headGroup,tail,legFL,legFR,legBL,legBR);

  // Per-tower accessory flourishes for silhouette recognition.
  if (def.icon === '✨'){
    const hatGroup = new THREE.Group();
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.15,0.34,10), stdMat(0x4b2e83,{fur:false,roughness:0.5}));
    hat.position.y = 0.17;
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.03,6,6), new THREE.MeshStandardMaterial({color:0xffe08a, emissive:0xffb800, emissiveIntensity:0.6}));
    star.position.y = 0.35;
    hatGroup.add(hat,star);
    hatGroup.position.set(0,0.29,0.02);
    headGroup.add(hatGroup);
  } else if (def.icon === '🏴‍☠️'){
    const hat = new THREE.Mesh(new THREE.BoxGeometry(0.36,0.1,0.26), stdMat(0x2b2b2b,{fur:false,roughness:0.6}));
    hat.position.set(0,0.2,0); headGroup.add(hat);
    const patch = new THREE.Mesh(new THREE.CircleGeometry(0.045,10), new THREE.MeshBasicMaterial({color:0x111111}));
    patch.position.set(-0.1,0.07,0.21); headGroup.add(patch);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.035,0.008,6,12), new THREE.MeshStandardMaterial({color:0xffd24d, roughness:0.3, metalness:0.6}));
    hoop.position.set(0.16,0.0,0.05); hoop.rotation.y = Math.PI/2; headGroup.add(hoop);
  } else if (def.icon === '🤖'){
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.07,0.05), new THREE.MeshStandardMaterial({color:0x0ef0e0, emissive:0x0ef0e0, emissiveIntensity:0.7, roughness:0.3}));
    visor.position.set(0,0.06,0.24); headGroup.add(visor);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,0.18,6), stdMat(0x888888,{fur:false,metalness:0.6,roughness:0.3}));
    antenna.position.set(0,0.3,0); headGroup.add(antenna);
    const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.025,6,6), new THREE.MeshStandardMaterial({color:0xff5050, emissive:0xff2020, emissiveIntensity:0.8}));
    antTip.position.set(0,0.4,0); headGroup.add(antTip);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.05,10,10), new THREE.MeshStandardMaterial({color:0x40f7e5, emissive:0x30d8c8, emissiveIntensity:0.6}));
    core.position.set(0,0.42,0.25); body.add(core);
  } else if (def.icon === '🦁'){
    [0.34,0.28,0.22].forEach((r,i)=>{
      const mane = new THREE.Mesh(new THREE.SphereGeometry(r,10,8), stdMat(darkenColor(0xf6b93b, i*0.08),{roughness:0.85}));
      mane.scale.set(1,1,0.65);
      mane.position.set(0,0,-0.02-i*0.01);
      headGroup.add(mane);
    });
    body.scale.multiplyScalar(1.12);
  } else if (def.icon === '😾'){
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.03,0.04), stdMat(dark,{fur:false}));
    brow.position.set(0,0.16,0.24); brow.rotation.z = 0.05; headGroup.add(brow);
  } else if (def.icon === '🗡️'){
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.24,0.07,0.05), stdMat(0x2b2140,{fur:false,roughness:0.5}));
    mask.position.set(0,0.06,0.23); headGroup.add(mask);
  } else if (def.icon === '🧶'){
    const yarnBall = new THREE.Mesh(new THREE.SphereGeometry(0.09,10,10), stdMat(0xf5d16a,{roughness:0.8}));
    const wrap1 = new THREE.Mesh(new THREE.TorusGeometry(0.09,0.012,6,16), stdMat(0xe0a83f,{fur:false}));
    const wrap2 = wrap1.clone(); wrap2.rotation.x = Math.PI/2;
    yarnBall.add(wrap1, wrap2);
    yarnBall.position.set(0.24,0.05,0.18);
    g.add(yarnBall);
  } else if (def.icon === '🐾'){
    const bandana = new THREE.Mesh(new THREE.TorusGeometry(0.14,0.025,6,12), stdMat(0xe74c3c,{fur:false,roughness:0.6}));
    bandana.rotation.x = Math.PI/2; bandana.position.set(0,-0.12,0.02); headGroup.add(bandana);
  }

  g.userData.parts = {body,headGroup,head,tail,legFL,legFR,legBL,legBR};
  g.traverse(o=>{ if(o.isMesh) o.castShadow = true; });
  return g;
}

/* --------------------------------- DOGS ----------------------------------- */
function createDogMesh(def){
  const g = new THREE.Group();
  const color = def.color;
  const light = lightenColor(color, 0.5);
  const dark = darkenColor(color, 0.25);
  const opacity = def.opacity;

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.27,14,10), stdMat(color,{opacity}));
  body.scale.set(1.05,0.9,1.4);
  body.position.y = 0.38; body.castShadow = true;

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.18,10,8), stdMat(light,{roughness:0.75,opacity}));
  belly.scale.set(0.9,0.7,1.1);
  belly.position.set(0,0.24,0.1); belly.castShadow = true;

  const headGroup = new THREE.Group();
  headGroup.position.set(0,0.62,0.4);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2,14,12), stdMat(color,{opacity}));
  head.scale.set(1,0.9,0.95); head.castShadow = true;
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.09,0.22,10), stdMat(light,{roughness:0.7,opacity}));
  snout.rotation.x = Math.PI/2; snout.position.set(0,-0.04,0.22); snout.castShadow = true;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035,8,8), new THREE.MeshStandardMaterial({color:0x241a16, roughness:0.4}));
  nose.position.set(0,0.0,0.34);
  headGroup.add(head, snout, nose);
  eyeSet(headGroup, 0.15, 0.04, 0.09);

  // Floppy ears (regal pointed ears for the boss).
  [-1,1].forEach(side=>{
    let ear;
    if (def.boss){
      ear = new THREE.Mesh(new THREE.ConeGeometry(0.09,0.26,4), stdMat(dark));
      ear.position.set(side*0.16,0.18,0.02); ear.rotation.z = side*-0.3;
    } else {
      ear = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.2,0.05), stdMat(dark,{opacity}));
      ear.position.set(side*0.19,-0.02,0.02); ear.rotation.z = side*0.5;
    }
    ear.castShadow = true;
    headGroup.add(ear);
  });

  if (def.perky){
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,0.12), new THREE.MeshStandardMaterial({color:0xff8fa3, roughness:0.5}));
    tongue.position.set(0,-0.1,0.3); tongue.rotation.x = -0.3;
    headGroup.add(tongue);
  }

  const tail = new THREE.Group();
  const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.06,0.32,8), stdMat(color,{opacity}));
  tailBase.position.y = 0.16; tailBase.castShadow = true;
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8), stdMat(light,{roughness:0.75,opacity}));
  tailTip.position.y = 0.32; tailTip.castShadow = true;
  tail.add(tailBase, tailTip);
  tail.position.set(0,0.5,-0.44); tail.rotation.x = -0.7;

  const legFL = makeLeg(color, light); legFL.position.set(-0.14,0.15,0.24);
  const legFR = makeLeg(color, light); legFR.position.set(0.14,0.15,0.24);
  const legBL = makeLeg(color, light); legBL.position.set(-0.14,0.15,-0.24);
  const legBR = makeLeg(color, light); legBR.position.set(0.14,0.15,-0.24);

  g.add(body,belly,headGroup,tail,legFL,legFR,legBL,legBR);

  // Trait accessories.
  if (def.armor){
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.44,0.16,0.55), new THREE.MeshStandardMaterial({color:0x8a8f94, roughness:0.4, metalness:0.55}));
    plate.position.y = 0.5; plate.castShadow = true; g.add(plate);
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.025,6,6), new THREE.MeshStandardMaterial({color:0xd8dce0, metalness:0.7, roughness:0.3}));
    [[-0.15,0.05],[0.15,0.05],[0,-0.12]].forEach(([x,z])=>{ const r=rivet.clone(); r.position.set(x,0.55,z); g.add(r); });
  }
  if (def.disables){
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.16,0.025,6,16), new THREE.MeshStandardMaterial({color:0x1d5fa8, roughness:0.5}));
    collar.rotation.x = Math.PI/2; collar.position.set(0,0.48,0.32); g.add(collar);
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.05,10), new THREE.MeshStandardMaterial({color:0xffd700, metalness:0.6, roughness:0.3, side:THREE.DoubleSide}));
    badge.position.set(0,0.1,0.35); headGroup.add(badge);
  }
  if (def.heals){
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.14,0.1), new THREE.MeshStandardMaterial({color:0xf4f1ea, roughness:0.7}));
    bag.position.set(0,0.42,-0.1); g.add(bag);
    const crossMat = new THREE.MeshStandardMaterial({color:0xe74c3c, roughness:0.5});
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.025,0.01), crossMat);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.025,0.09,0.01), crossMat);
    cross1.position.set(0,0.42,-0.045); cross2.position.set(0,0.42,-0.045);
    g.add(cross1,cross2);
  }
  if (def.splits){
    body.material.emissive = new THREE.Color(0xff5500); body.material.emissiveIntensity = 0.18;
    head.material.emissive = new THREE.Color(0xff5500); head.material.emissiveIntensity = 0.18;
  }
  if (def.stealth){
    body.material.roughness = 0.35;
  }
  if (def.boss){
    const crownGroup = new THREE.Group();
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.17,0.09,8), new THREE.MeshStandardMaterial({color:0xffd700, metalness:0.75, roughness:0.25}));
    crownGroup.add(band);
    for (let i=0;i<5;i++){
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.03,0.09,4), new THREE.MeshStandardMaterial({color:0xffd700, metalness:0.75, roughness:0.25}));
      const ang = (i/5)*Math.PI*2;
      spike.position.set(Math.cos(ang)*0.13, 0.09, Math.sin(ang)*0.13);
      crownGroup.add(spike);
    }
    crownGroup.position.set(0,0.18,0.0);
    headGroup.add(crownGroup);
    const capeGeo = new THREE.PlaneGeometry(0.5,0.6,4,4);
    const cape = new THREE.Mesh(capeGeo, new THREE.MeshStandardMaterial({color:0x5b2d91, roughness:0.85, side:THREE.DoubleSide}));
    cape.position.set(0,0.35,-0.35); cape.rotation.x = -0.25;
    g.add(cape);
  }

  const scale = def.scale || 1;
  g.scale.set(scale,scale,scale);
  g.userData.parts = {body,headGroup,head,tail,legFL,legFR,legBL,legBR};
  g.traverse(o=>{ if(o.isMesh) o.castShadow = true; });
  return g;
}
