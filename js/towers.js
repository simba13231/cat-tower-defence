/* =========================================================================
   towers.js — placing/selling/upgrading cats, targeting, firing, projectiles
   ========================================================================= */

function placeTower(type, col, row){
  const def = TOWER_DEFS[type];
  if (state.coins < def.cost) { flashMessage("Not enough coins!"); return false; }
  if (!isBuildable(col,row)) return false;
  const key = col+','+row;
  if (tileMeshes[key].userData.occupied) return false;

  state.coins -= def.cost;
  state.buildType = null;
  const mesh = createCatMesh(def);
  mesh.position.set(worldX(col), 0, worldZ(row));
  scene.add(mesh);
  const tower = {
    id: state.nextId++, type, def, mesh, col, row, level:0,
    invested: def.cost, cooldown:0, animT: Math.random()*10,
    targetMode:'first', target:null, shotsFired:0, disableTimer:0, _attackPulse:0,
  };
  tileMeshes[key].userData.occupied = true;
  state.towers.push(tower);
  Audio2.place();
  spawnPoof(mesh.position);
  updateHud();
  return true;
}

function towerStats(tower){
  const def = tower.def;
  let stats = {damage:def.damage, rate:def.rate, range:def.range, crit:def.crit||0, slow:def.slow, slowTime:def.slowTime,
    splash:def.splash, knockback:def.knockback, stun:def.stun, pierce:def.pierce, tangle:0, chain:false, execute:false,
    rage:false, overheat:false, ignoresArmor:def.ignoresArmor, slowSplash:0, melee:def.melee, projSpeed:def.projSpeed};
  for (let l=0;l<=tower.level;l++){
    const mods = TOWER_DEFS[tower.type].levels[l].mods;
    Object.keys(mods).forEach(k=>{
      if (k==='damage') stats.damage *= mods[k];
      else if (k==='rate') stats.rate *= mods[k];
      else if (k==='splash') stats.splash = mods[k];
      else if (k==='crit') stats.crit = mods[k];
      else if (k==='slow') stats.slow = mods[k];
      else if (k==='slowTime') stats.slowTime = mods[k];
      else if (k==='knockback') stats.knockback = mods[k];
      else if (k==='stun') stats.stun = mods[k];
      else if (k==='pierce') stats.pierce = mods[k];
      else if (k==='tangle') stats.tangle = mods[k];
      else if (k==='chain') stats.chain = true;
      else if (k==='execute') stats.execute = true;
      else if (k==='rage') stats.rage = true;
      else if (k==='overheat') stats.overheat = true;
      else if (k==='slowSplash') stats.slowSplash = mods[k];
    });
  }
  return stats;
}

function upgradeTower(tower){
  if (tower.level >= TOWER_DEFS[tower.type].levels.length-1) return;
  const nextLevel = TOWER_DEFS[tower.type].levels[tower.level+1];
  if (state.coins < nextLevel.cost) { flashMessage("Not enough coins!"); return; }
  state.coins -= nextLevel.cost;
  tower.invested += nextLevel.cost;
  tower.level++;
  Audio2.upgrade();
  spawnPoof(tower.mesh.position);
  updateHud();
  renderTowerPanel(tower);
}

function sellTower(tower){
  const refund = Math.floor(tower.invested*0.6);
  state.coins += refund;
  scene.remove(tower.mesh);
  tileMeshes[tower.col+','+tower.row].userData.occupied = false;
  state.towers = state.towers.filter(t=>t!==tower);
  state.selectedTower = null;
  selectRing.visible = false;
  closeTowerPanel();
  updateHud();
}

function pickTarget(tower, stats){
  const candidates = state.enemies.filter(e=>{
    if (!e.alive) return false;
    if (e.def.stealth && !( tower.type==='wizard' || tower.type==='robot')) return false;
    return distTo(e, tower.mesh.position) <= stats.range;
  });
  if (candidates.length===0) return null;
  switch(tower.targetMode){
    case 'closest': return candidates.reduce((a,b)=> distTo(a,tower.mesh.position)<distTo(b,tower.mesh.position)?a:b);
    case 'strongest': return candidates.reduce((a,b)=> a.hp>b.hp?a:b);
    case 'weakest': return candidates.reduce((a,b)=> a.hp<b.hp?a:b);
    case 'last': return candidates.reduce((a,b)=> a.distTravelled<b.distTravelled?a:b);
    case 'first':
    default: return candidates.reduce((a,b)=> a.distTravelled>b.distTravelled?a:b);
  }
}

function applySplash(tower, center, stats, dmg, crit){
  const radius = stats.splash || 0;
  const hitAny = [];
  state.enemies.forEach(e=>{
    if (!e.alive) return;
    const d = distTo(e, center);
    if (radius>0 ? d<=radius : e===tower.target){
      dealDamage(e, dmg, {crit, ignoresArmor: stats.ignoresArmor});
      hitAny.push(e);
      if (stats.stun) e.stunTimer = Math.max(e.stunTimer, stats.stun);
      if (stats.knockback) e.distTravelled = Math.max(0, e.distTravelled - stats.knockback);
      if (stats.slowSplash){ e.slowFactor = Math.min(e.slowFactor, 1-stats.slowSplash); e.slowTimer = Math.max(e.slowTimer,2); }
    }
  });
  if (radius>0 && hitAny.length) spawnPoof(center, 0xffaa55, radius);
}

function applyOnHitEffects(tower, enemy, stats){
  if (stats.slow && enemy.hp>0){
    const resist = enemy.def.slowResist||0;
    const effectiveSlow = stats.slow * (1-resist);
    enemy.slowFactor = Math.min(enemy.slowFactor, 1-effectiveSlow);
    enemy.slowTimer = Math.max(enemy.slowTimer, stats.slowTime||2);
  }
  if (stats.tangle && Math.random()<stats.tangle){
    enemy.tangleTimer = Math.max(enemy.tangleTimer, 1.5);
  }
}

function fireTower(tower, stats){
  const target = tower.target;
  if (!target) return;
  tower.shotsFired++;
  let dmg = stats.damage;
  let crit = false;
  if (Math.random() < stats.crit){ dmg *= 2; crit = true; }
  if (stats.rage && tower.shotsFired % 4 === 0) dmg *= 2.2;
  if (stats.execute && target.hp/target.maxHp < 0.3) dmg *= 4;

  if (stats.melee){
    Audio2.attack(200);
    applySplash(tower, target.mesh.position, stats, dmg, crit);
    animateAttack(tower);
    return;
  }

  const projColor = tower.type==='robot' ? 0x40f7e5 : (tower.type==='wizard'?0xcd6bff:(tower.type==='yarn'?0xf5d16a:0xffffff));
  const proj = {
    id: state.nextId++, tower, stats, dmg, crit,
    mesh: new THREE.Mesh(new THREE.SphereGeometry(0.08,8,8), new THREE.MeshBasicMaterial({color:projColor})),
    target, speed: stats.projSpeed || 16,
  };
  proj.mesh.position.copy(tower.mesh.position).add(new THREE.Vector3(0,0.6,0));
  scene.add(proj.mesh);
  state.projectiles.push(proj);
  Audio2.attack(tower.type==='robot'?900:(tower.type==='angry'?150:400));
  animateAttack(tower);
}

function projectileHit(proj){
  const target = proj.target;
  if (target && target.alive){
    const stats = proj.stats;
    if (stats.splash){
      applySplash(proj.tower, target.mesh.position, stats, proj.dmg, proj.crit);
    } else {
      dealDamage(target, proj.dmg, {crit:proj.crit, ignoresArmor: stats.ignoresArmor});
      applyOnHitEffects(proj.tower, target, stats);
      if (stats.chain){
        const nearby = state.enemies.filter(e=>e.alive && e!==target && distTo(e,target.mesh.position)<1.8).slice(0,2);
        nearby.forEach(e=> dealDamage(e, proj.dmg*0.5, {}));
      }
    }
  }
  spawnPoof(proj.mesh.position, 0xffffff, 0.25);
  scene.remove(proj.mesh);
}

function animateAttack(tower){ tower._attackPulse = 1; }

function updateTowers(dt){
  state.towers.forEach(t=>{
    t.animT += dt;
    const parts = t.mesh.userData.parts;
    parts.tail.rotation.z = Math.sin(t.animT*3)*0.3;
    if (t._attackPulse>0){
      t._attackPulse -= dt*4;
      t.mesh.scale.setScalar(1+Math.max(0,t._attackPulse)*0.12);
    } else {
      t.mesh.scale.setScalar(1+Math.sin(t.animT*2)*0.015);
    }
    if (t.disableTimer>0){ t.disableTimer -= dt; return; }

    const stats = towerStats(t);
    t.cooldown -= dt;
    if (!t.target || !t.target.alive || distTo(t.target,t.mesh.position)>stats.range){
      t.target = pickTarget(t, stats);
    }
    if (t.target){
      const targetY = parts.headGroup.getWorldPosition(new THREE.Vector3()).y;
      parts.headGroup.lookAt(t.target.mesh.position.x, targetY, t.target.mesh.position.z);
    }
    if (t.target && t.cooldown<=0){
      t.cooldown = stats.rate;
      fireTower(t, stats);
    }
  });
}

function updateProjectiles(dt){
  state.projectiles.forEach(p=>{
    if (!p.target || !p.target.alive){ scene.remove(p.mesh); p.dead=true; return; }
    const targetPos = p.target.mesh.position.clone().add(new THREE.Vector3(0,0.4,0));
    const dir = targetPos.clone().sub(p.mesh.position);
    const dist = dir.length();
    const step = p.speed*dt;
    if (step >= dist){
      p.mesh.position.copy(targetPos);
      projectileHit(p);
      p.dead = true;
    } else {
      dir.normalize();
      p.mesh.position.addScaledVector(dir, step);
    }
  });
  state.projectiles = state.projectiles.filter(p=>!p.dead);
}
