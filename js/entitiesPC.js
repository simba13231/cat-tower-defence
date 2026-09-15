/* =========================================================================
   entitiesPC.js — detailed low-poly cat/dog character builds, ported from
   the Three.js version's entities.js (createCatMesh/createDogMesh) into
   PlayCanvas primitive entities. Each character is body+belly+head(with
   muzzle/nose/eyes/ears)+tail+4 legs, plus per-tower/per-trait accessories.
   Everything else in the game only touches entity.setPosition/getPosition
   and the .parts lookup below, so this file can keep evolving without
   touching game logic.
   ========================================================================= */

function clamp255(v){ return Math.max(0, Math.min(255, Math.round(v))); }
function lightenHex(hex, amt){
  const r=(hex>>16)&255, g=(hex>>8)&255, b=hex&255;
  return (clamp255(r+(255-r)*amt)<<16) | (clamp255(g+(255-g)*amt)<<8) | clamp255(b+(255-b)*amt);
}
function darkenHex(hex, amt){
  const r=(hex>>16)&255, g=(hex>>8)&255, b=hex&255;
  return (clamp255(r*(1-amt))<<16) | (clamp255(g*(1-amt))<<8) | clamp255(b*(1-amt));
}

// Generic primitive builder used by the character code below. Takes a RAW
// hex int (not a pc.Color) so the character-building code below can stay
// terse — it converts internally.
function prim(type, sx, sy, sz, colorHex, opts){
  opts = opts || {};
  const e = new pc.Entity(type);
  e.addComponent('model', {type, castShadows: opts.castShadows !== false, receiveShadows:false});
  e.setLocalScale(sx, sy, sz);
  const mat = new pc.StandardMaterial();
  mat.diffuse = hexColor(colorHex);
  if (opts.emissive !== undefined){ mat.emissive = hexColor(opts.emissive); mat.emissiveIntensity = opts.emissiveIntensity || 1; }
  if (opts.opacity !== undefined){ mat.opacity = opts.opacity; mat.blendType = pc.BLEND_NORMAL; }
  if (opts.metalness !== undefined){ mat.useMetalness = true; mat.metalness = opts.metalness; }
  if (opts.gloss !== undefined) mat.gloss = opts.gloss;
  mat.update();
  e.model.material = mat;
  return e;
}

function torusPrim(name, colorHex, sx, sy, sz){
  const e = new pc.Entity(name);
  e.addComponent('model', {type:'torus', castShadows:false, receiveShadows:false});
  e.setLocalScale(sx, sy, sz);
  const mat = new pc.StandardMaterial();
  mat.diffuse = hexColor(colorHex);
  mat.update();
  e.model.material = mat;
  return e;
}

function makeLegPC(colorHex, lightHex){
  const g = new pc.Entity('leg');
  const upper = prim('cylinder', 0.1, 0.2, 0.1, colorHex);
  upper.setLocalPosition(0, -0.06, 0);
  g.addChild(upper);
  const sock = prim('cylinder', 0.104, 0.09, 0.104, lightHex, {gloss:0.1});
  sock.setLocalPosition(0, -0.19, 0);
  g.addChild(sock);
  g.setLocalPosition(0, 0.16, 0);
  return g;
}

/* --------------------------------- CATS (towers) --------------------------------- */
function createCatMeshPC(def){
  const root = new pc.Entity('cat_'+def.name);
  const color = def.color, light = lightenHex(color,0.55), dark = darkenHex(color,0.22);

  const body = prim('sphere', 0.588, 0.532, 0.756, color);
  body.setLocalPosition(0, 0.4, 0);
  root.addChild(body);

  const belly = prim('sphere', 0.342, 0.285, 0.399, light, {gloss:0.15});
  belly.setLocalPosition(0, 0.28, 0.12);
  root.addChild(belly);

  const headGroup = new pc.Entity('headGroup');
  headGroup.setLocalPosition(0, 0.68, 0.36);
  root.addChild(headGroup);

  const head = prim('sphere', 0.46, 0.423, 0.437, color);
  headGroup.addChild(head);
  const muzzle = prim('sphere', 0.22, 0.176, 0.187, light, {gloss:0.2});
  muzzle.setLocalPosition(0, -0.05, 0.17);
  headGroup.addChild(muzzle);
  const nose = prim('sphere', 0.06, 0.06, 0.06, 0xe98fae, {gloss:0.5});
  nose.setLocalPosition(0, -0.01, 0.27);
  headGroup.addChild(nose);

  [-1,1].forEach(side=>{
    const eye = prim('sphere', 0.1, 0.1, 0.1, 0x211a14, {gloss:0.6});
    eye.setLocalPosition(side*0.1, 0.05, 0.18);
    headGroup.addChild(eye);
    const hi = prim('sphere', 0.034, 0.034, 0.034, 0xffffff, {emissive:0xffffff, emissiveIntensity:0.3, castShadows:false});
    hi.setLocalPosition(side*0.1+0.018, 0.07, 0.215);
    headGroup.addChild(hi);
  });

  [-1,1].forEach(side=>{
    const ear = prim('cone', 0.19, 0.16, 0.19, color);
    ear.setLocalPosition(side*0.14, 0.2, 0.02);
    ear.setLocalEulerAngles(0, 0, side*-14);
    headGroup.addChild(ear);
    const inner = prim('cone', 0.11, 0.1, 0.11, 0xffc9d9, {gloss:0.2});
    inner.setLocalPosition(0, 0.01, 0.02);
    ear.addChild(inner);
  });

  const tail = new pc.Entity('tail');
  tail.setLocalPosition(0, 0.52, -0.42);
  tail.setLocalEulerAngles(54, 0, 0);
  root.addChild(tail);
  const tailBase = prim('cylinder', 0.11, 0.5, 0.11, color);
  tailBase.setLocalPosition(0, 0.25, 0);
  tail.addChild(tailBase);
  const tailTip = prim('sphere', 0.12, 0.12, 0.12, light, {gloss:0.15});
  tailTip.setLocalPosition(0, 0.5, 0);
  tail.addChild(tailTip);

  const legFL = makeLegPC(color,light); legFL.setLocalPosition(-0.15,0.16,0.22); root.addChild(legFL);
  const legFR = makeLegPC(color,light); legFR.setLocalPosition(0.15,0.16,0.22); root.addChild(legFR);
  const legBL = makeLegPC(color,light); legBL.setLocalPosition(-0.15,0.16,-0.2); root.addChild(legBL);
  const legBR = makeLegPC(color,light); legBR.setLocalPosition(0.15,0.16,-0.2); root.addChild(legBR);

  // Per-tower accessory so each cat reads distinctly at a glance.
  if (def.icon === '✨'){
    const hat = prim('cone', 0.3, 0.34, 0.3, 0x4b2e83, {gloss:0.3});
    hat.setLocalPosition(0, 0.46, 0.02);
    headGroup.addChild(hat);
    const star = prim('sphere', 0.06, 0.06, 0.06, 0xffe08a, {emissive:0xffb800, emissiveIntensity:0.6});
    star.setLocalPosition(0, 0.64, 0.02);
    headGroup.addChild(star);
  } else if (def.icon === '😾'){
    const brow = prim('box', 0.2, 0.03, 0.04, dark);
    brow.setLocalPosition(0, 0.16, 0.24);
    brow.setLocalEulerAngles(0, 0, 3);
    headGroup.addChild(brow);
  } else if (def.icon === '🤖'){
    const visor = prim('box', 0.28, 0.07, 0.05, 0x0ef0e0, {emissive:0x0ef0e0, emissiveIntensity:0.7});
    visor.setLocalPosition(0, 0.06, 0.24);
    headGroup.addChild(visor);
    const antenna = prim('cylinder', 0.02, 0.18, 0.02, 0x888888, {metalness:0.6, gloss:0.6});
    antenna.setLocalPosition(0, 0.3, 0);
    headGroup.addChild(antenna);
    const antTip = prim('sphere', 0.05, 0.05, 0.05, 0xff5050, {emissive:0xff2020, emissiveIntensity:0.8});
    antTip.setLocalPosition(0, 0.4, 0);
    headGroup.addChild(antTip);
  } else if (def.icon === '🐾'){
    const band = torusPrim('bandana', 0xe74c3c, 0.28, 0.28, 0.05);
    band.setLocalPosition(0, -0.12, 0.02);
    band.setLocalEulerAngles(90, 0, 0);
    headGroup.addChild(band);
  }

  root.parts = {headGroup, tail, legFL, legFR, legBL, legBR, body};
  return root;
}

/* --------------------------------- DOGS (enemies) --------------------------------- */
function createDogMeshPC(def){
  const root = new pc.Entity('dog_'+def.name);
  const color = def.color, light = lightenHex(color,0.5), dark = darkenHex(color,0.25);

  const body = prim('sphere', 0.567, 0.486, 0.756, color);
  body.setLocalPosition(0, 0.38, 0);
  root.addChild(body);

  const belly = prim('sphere', 0.324, 0.252, 0.396, light, {gloss:0.15});
  belly.setLocalPosition(0, 0.24, 0.1);
  root.addChild(belly);

  const headGroup = new pc.Entity('headGroup');
  headGroup.setLocalPosition(0, 0.62, 0.4);
  root.addChild(headGroup);

  const head = prim('sphere', 0.4, 0.36, 0.38, color);
  headGroup.addChild(head);
  const snout = prim('cylinder', 0.15, 0.22, 0.18, light, {gloss:0.2});
  snout.setLocalEulerAngles(90, 0, 0);
  snout.setLocalPosition(0, -0.04, 0.22);
  headGroup.addChild(snout);
  const nose = prim('sphere', 0.07, 0.07, 0.07, 0x241a16, {gloss:0.5});
  nose.setLocalPosition(0, 0.0, 0.34);
  headGroup.addChild(nose);

  [-1,1].forEach(side=>{
    const eye = prim('sphere', 0.09, 0.09, 0.09, 0x211a14, {gloss:0.6});
    eye.setLocalPosition(side*0.09, 0.04, 0.15);
    headGroup.addChild(eye);
    const hi = prim('sphere', 0.03, 0.03, 0.03, 0xffffff, {emissive:0xffffff, emissiveIntensity:0.3, castShadows:false});
    hi.setLocalPosition(side*0.09+0.018, 0.06, 0.185);
    headGroup.addChild(hi);
  });

  [-1,1].forEach(side=>{
    let ear;
    if (def.boss){
      ear = prim('cone', 0.18, 0.26, 0.18, dark);
      ear.setLocalPosition(side*0.16, 0.18, 0.02);
      ear.setLocalEulerAngles(0, 0, side*-17);
    } else {
      ear = prim('box', 0.09, 0.2, 0.05, dark);
      ear.setLocalPosition(side*0.19, -0.02, 0.02);
      ear.setLocalEulerAngles(0, 0, side*29);
    }
    headGroup.addChild(ear);
  });

  if (def.perky){
    const tongue = prim('box', 0.05, 0.02, 0.12, 0xff8fa3, {gloss:0.3});
    tongue.setLocalPosition(0, -0.1, 0.3);
    tongue.setLocalEulerAngles(-17, 0, 0);
    headGroup.addChild(tongue);
  }

  const tail = new pc.Entity('tail');
  tail.setLocalPosition(0, 0.5, -0.44);
  tail.setLocalEulerAngles(-40, 0, 0);
  root.addChild(tail);
  const tailBase = prim('cylinder', 0.09, 0.32, 0.09, color);
  tailBase.setLocalPosition(0, 0.16, 0);
  tail.addChild(tailBase);
  const tailTip = prim('sphere', 0.1, 0.1, 0.1, light, {gloss:0.15});
  tailTip.setLocalPosition(0, 0.32, 0);
  tail.addChild(tailTip);

  const legFL = makeLegPC(color,light); legFL.setLocalPosition(-0.14,0.15,0.24); root.addChild(legFL);
  const legFR = makeLegPC(color,light); legFR.setLocalPosition(0.14,0.15,0.24); root.addChild(legFR);
  const legBL = makeLegPC(color,light); legBL.setLocalPosition(-0.14,0.15,-0.24); root.addChild(legBL);
  const legBR = makeLegPC(color,light); legBR.setLocalPosition(0.14,0.15,-0.24); root.addChild(legBR);

  if (def.boss){
    const crownGroup = new pc.Entity('crown');
    const band = prim('cylinder', 0.3, 0.09, 0.3, 0xffd700, {metalness:0.75, gloss:0.75});
    crownGroup.addChild(band);
    for (let i=0;i<5;i++){
      const spike = prim('cone', 0.06, 0.09, 0.06, 0xffd700, {metalness:0.75, gloss:0.75});
      const ang = (i/5)*Math.PI*2;
      spike.setLocalPosition(Math.cos(ang)*0.13, 0.09, Math.sin(ang)*0.13);
      crownGroup.addChild(spike);
    }
    crownGroup.setLocalPosition(0, 0.18, 0);
    headGroup.addChild(crownGroup);

    const cape = prim('box', 0.5, 0.6, 0.02, 0x5b2d91, {gloss:0.15});
    cape.setLocalPosition(0, 0.35, -0.35);
    cape.setLocalEulerAngles(-14, 0, 0);
    root.addChild(cape);
  }

  const scale = def.scale || 1;
  root.setLocalScale(scale, scale, scale);
  root.parts = {headGroup, tail, legFL, legFR, legBL, legBR, body};
  return root;
}

function createTowerEntity(def){ return createCatMeshPC(def); }
function createEnemyEntity(def){ return createDogMeshPC(def); }

// A small moving sphere fired from a tower toward its target.
function createProjectileEntity(color){
  const e = sphereEntity('proj', 0.07, hexColor(color));
  e.model.castShadows = false;
  e.model.receiveShadows = false;
  return e;
}

// Quick expanding/fading poof for hits and deaths — cheap "juice" so
// combat doesn't feel silent and instant. Just builds the entity; gamePC.js
// tracks it in state.effects so it actually animates and gets cleaned up.
function createPoofEntity(colorHex){
  const e = sphereEntity('poof', 0.12, hexColor(colorHex || 0xffffff));
  e.model.castShadows = false; e.model.receiveShadows = false;
  e.model.material.opacity = 0.85; e.model.material.blendType = pc.BLEND_NORMAL; e.model.material.update();
  return e;
}
