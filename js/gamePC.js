/* =========================================================================
   gamePC.js — mutable game state + the per-frame update loop.
   Movement math (pathPointAt) is a straight port of the Three.js
   enemies.js algorithm; targeting/firing math is ported from towers.js.
   Runs off app.on('update', ...) instead of a manual requestAnimationFrame
   loop, since PlayCanvas already drives one.
   ========================================================================= */

const state = {
  screen: 'menu', // menu, playing, defeat
  coins: START_COINS, lives: BASE_LIVES, waveIndex: 0, waveActive: false,
  waveSpawnQueue: [], spawnTimer: 0,
  towers: [], enemies: [], projectiles: [], effects: [],
  buildType: null, nextId: 1,
};

function dist2D(a, b){
  const dx = a.x - b.x, dz = a.z - b.z;
  return Math.sqrt(dx*dx + dz*dz);
}

function spawnPoof(pos, colorHex){
  const ent = createPoofEntity(colorHex);
  ent.setPosition(pos.x, pos.y + 0.3, pos.z);
  mapRoot.addChild(ent);
  state.effects.push({ ent, t:0, life:0.35, baseScale:0.12 });
}

function pathPointAt(distTravelled){
  let remaining = distTravelled;
  for (let i=0; i<PATH_SEG_LEN.length; i++){
    if (remaining <= PATH_SEG_LEN[i] || i === PATH_SEG_LEN.length-1){
      const segLen = PATH_SEG_LEN[i];
      const t = segLen > 0 ? Math.min(1, remaining/segLen) : 1;
      const a = PATH_WORLD[i], b = PATH_WORLD[i+1];
      return { x: a.x+(b.x-a.x)*t, z: a.z+(b.z-a.z)*t, segIndex:i, done: distTravelled >= PATH_TOTAL_LEN };
    }
    remaining -= PATH_SEG_LEN[i];
  }
  const last = PATH_WORLD[PATH_WORLD.length-1];
  return { x:last.x, z:last.z, segIndex:PATH_SEG_LEN.length-1, done:true };
}

function updateHud(){
  document.getElementById('hudCoins').textContent = state.coins;
  document.getElementById('hudLives').textContent = state.lives;
  document.getElementById('hudWave').textContent = state.waveIndex;
  document.querySelectorAll('.towerBtn').forEach(btn=>{
    const def = TOWER_DEFS[btn.dataset.type];
    btn.disabled = state.coins < def.cost || state.screen !== 'playing';
    btn.classList.toggle('selected', state.buildType === btn.dataset.type);
  });
}

let messageTimer = 0;
function flashMessage(text){
  const el = document.getElementById('message');
  el.textContent = text;
  el.style.opacity = 1;
  messageTimer = 2;
}

/* ---------------------------- placing towers ---------------------------- */
function placeTower(type, col, row){
  const def = TOWER_DEFS[type];
  if (state.coins < def.cost){ flashMessage('Not enough coins!'); return false; }
  if (!isBuildable(col,row)){ flashMessage("Can't build there."); return false; }
  const key = col+','+row;
  if (tileEntities[key].occupied){ flashMessage('Already occupied.'); return false; }

  state.coins -= def.cost;
  const ent = createTowerEntity(def);
  ent.setPosition(worldX(col), 0, worldZ(row));
  mapRoot.addChild(ent);
  const tower = { id: state.nextId++, type, def, ent, col, row, cooldown:0, target:null, animT: Math.random()*10, attackPulse:0 };
  tileEntities[key].occupied = true;
  state.towers.push(tower);
  updateHud();
  return true;
}

/* ------------------------------ enemy waves ------------------------------ */
function spawnEnemy(type){
  const def = ENEMY_DEFS[type];
  const ent = createEnemyEntity(def);
  ent.setPosition(PATH_WORLD[0].x, 0, PATH_WORLD[0].z);
  mapRoot.addChild(ent);
  const enemy = {
    id: state.nextId++, type, def, ent,
    hp: def.hp, maxHp: def.hp, distTravelled: 0,
    isBoss: !!def.boss, alive: true, reachedEnd: false, animT: Math.random()*10,
  };
  state.enemies.push(enemy);
  return enemy;
}

function startWave(){
  if (state.waveActive) return;
  state.waveIndex++;
  state.waveActive = true;
  state.waveSpawnQueue = buildWave(state.waveIndex);
  state.spawnTimer = 0;
  document.getElementById('startWaveBtn').disabled = true;
  updateHud();
}

function updateSpawning(dt){
  if (!state.waveActive) return;
  if (state.waveSpawnQueue.length === 0){
    if (state.enemies.length === 0){
      state.waveActive = false;
      const btn = document.getElementById('startWaveBtn');
      btn.disabled = false;
      btn.textContent = 'Start Wave ' + (state.waveIndex+1);
      flashMessage('Wave ' + state.waveIndex + ' cleared!');
    }
    return;
  }
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0){
    state.spawnTimer = 0.6;
    spawnEnemy(state.waveSpawnQueue.shift());
  }
}

function dealDamage(enemy, amount){
  enemy.hp -= amount;
  spawnPoof(enemy.ent.getPosition(), 0xffffff);
  if (enemy.hp <= 0 && enemy.alive) killEnemy(enemy, true);
}

function killEnemy(enemy, giveReward){
  enemy.alive = false;
  spawnPoof(enemy.ent.getPosition(), enemy.def.color);
  enemy.ent.destroy();
  if (giveReward){
    state.coins += enemy.def.reward;
    updateHud();
  }
  state.enemies = state.enemies.filter(e=>e!==enemy);
}

function triggerDefeat(){
  state.screen = 'defeat';
  document.getElementById('defeatOverlay').style.display = 'flex';
}

function updateEnemies(dt){
  state.enemies.forEach(e=>{
    e.animT += dt;
    e.distTravelled += e.def.speed * dt;
    const pp = pathPointAt(e.distTravelled);
    e.ent.setPosition(pp.x, Math.abs(Math.sin(e.animT*8))*0.03, pp.z);
    const nextIdx = Math.min(pp.segIndex+1, PATH_WORLD.length-1);
    const from = PATH_WORLD[pp.segIndex], to = PATH_WORLD[nextIdx];
    e.ent.setEulerAngles(0, Math.atan2(to.x-from.x, to.z-from.z) * (180/Math.PI), 0);

    const parts = e.ent.parts;
    if (parts){
      const swing = Math.sin(e.animT*10) * 32;
      parts.legFL.setLocalEulerAngles(swing, 0, 0);
      parts.legBR.setLocalEulerAngles(swing, 0, 0);
      parts.legFR.setLocalEulerAngles(-swing, 0, 0);
      parts.legBL.setLocalEulerAngles(-swing, 0, 0);
      parts.tail.setLocalEulerAngles(-40, 0, Math.sin(e.animT*6) * 16);
    }

    if (pp.done && !e.reachedEnd){
      e.reachedEnd = true;
      state.lives -= e.isBoss ? 5 : 1;
      killEnemy(e, false);
      updateHud();
      if (state.lives <= 0) triggerDefeat();
    }
  });
}

function pickTarget(tower){
  const towerPos = tower.ent.getPosition();
  let best = null, bestDist = -1;
  state.enemies.forEach(e=>{
    if (!e.alive) return;
    const enemyPos = e.ent.getPosition();
    if (dist2D(towerPos, enemyPos) > tower.def.range) return;
    if (e.distTravelled > bestDist){ bestDist = e.distTravelled; best = e; } // "first" target mode
  });
  return best;
}

function fireTower(tower){
  const target = tower.target;
  if (!target) return;
  const proj = createProjectileEntity(0xffffff);
  const start = tower.ent.getPosition();
  proj.setPosition(start.x, start.y + 0.6, start.z);
  mapRoot.addChild(proj);
  state.projectiles.push({ ent: proj, target, dmg: tower.def.damage, splash: tower.def.splash, speed: 16 });
  tower.attackPulse = 1;
}

function updateTowers(dt){
  state.towers.forEach(t=>{
    t.animT += dt;
    t.cooldown -= dt;
    if (!t.target || !t.target.alive || dist2D(t.ent.getPosition(), t.target.ent.getPosition()) > t.def.range){
      t.target = pickTarget(t);
    }
    if (t.target && t.cooldown <= 0){
      t.cooldown = t.def.rate;
      fireTower(t);
    }

    if (t.attackPulse > 0){
      t.attackPulse = Math.max(0, t.attackPulse - dt*5);
      const s = 1 + t.attackPulse*0.18;
      t.ent.setLocalScale(s, s, s);
    } else {
      const s = 1 + Math.sin(t.animT*2)*0.02;
      t.ent.setLocalScale(s, s, s);
    }
    if (t.ent.parts) t.ent.parts.tail.setLocalEulerAngles(54, 0, Math.sin(t.animT*2.4)*15);
  });
}

function applySplash(center, radius, dmg){
  state.enemies.forEach(e=>{
    if (!e.alive) return;
    if (dist2D(center, e.ent.getPosition()) <= radius) dealDamage(e, dmg);
  });
}

function updateProjectiles(dt){
  state.projectiles.forEach(p=>{
    if (!p.target.alive){ p.ent.destroy(); p.dead = true; return; }
    const targetPos = p.target.ent.getPosition();
    const aimPos = new pc.Vec3(targetPos.x, targetPos.y + 0.4, targetPos.z);
    const curPos = p.ent.getPosition();
    const dir = aimPos.clone().sub(curPos);
    const dist = dir.length();
    const step = p.speed * dt;
    if (step >= dist){
      if (p.splash) applySplash(targetPos, p.splash, p.dmg);
      else dealDamage(p.target, p.dmg);
      p.ent.destroy();
      p.dead = true;
    } else {
      dir.normalize();
      p.ent.setPosition(curPos.x + dir.x*step, curPos.y + dir.y*step, curPos.z + dir.z*step);
    }
  });
  state.projectiles = state.projectiles.filter(p=>!p.dead);
}

function updateEffects(dt){
  state.effects.forEach(fx=>{
    fx.t += dt;
    const p = Math.min(1, fx.t / fx.life);
    const s = fx.baseScale * (1 + p*1.8);
    fx.ent.setLocalScale(s, s, s);
    fx.ent.model.material.opacity = Math.max(0, 0.85*(1-p));
    fx.ent.model.material.update();
    if (p >= 1){ fx.ent.destroy(); fx.dead = true; }
  });
  state.effects = state.effects.filter(fx=>!fx.dead);
}

/* -------------------------------- run loop ------------------------------- */
function resetRunState(){
  state.coins = START_COINS; state.lives = BASE_LIVES; state.waveIndex = 0;
  state.waveActive = false; state.waveSpawnQueue = []; state.buildType = null;
  state.towers.forEach(t=>t.ent.destroy());
  state.enemies.forEach(e=>e.ent.destroy());
  state.projectiles.forEach(p=>p.ent.destroy());
  state.effects.forEach(fx=>fx.ent.destroy());
  Object.keys(tileEntities).forEach(k=> tileEntities[k].occupied = false);
  state.towers = []; state.enemies = []; state.projectiles = []; state.effects = [];
  state.screen = 'playing';
  document.getElementById('defeatOverlay').style.display = 'none';
  document.getElementById('startWaveBtn').disabled = false;
  document.getElementById('startWaveBtn').textContent = 'Start Wave 1';
  updateHud();
}

app.on('update', (dt)=>{
  if (state.screen !== 'playing') return;
  updateSpawning(dt);
  updateEnemies(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateEffects(dt);
  if (messageTimer > 0){
    messageTimer -= dt;
    if (messageTimer <= 0) document.getElementById('message').style.opacity = 0;
  }
});

resetRunState();
