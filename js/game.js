/* =========================================================================
   game.js — mutable state + all gameplay logic. Towers/enemies/projectiles
   here are plain {x,y,...} objects, not engine entities — there's no
   scene graph to manage, so "removing" something is just filtering it out
   of an array. render.js reads this state each frame; it never writes it.
   ========================================================================= */

const state = {
  screen: 'menu', // menu, playing, defeat
  coins: START_COINS, lives: BASE_LIVES, waveIndex: 0, waveActive: false,
  waveSpawnQueue: [], spawnTimer: 0, gameTime: 0,
  towers: [], enemies: [], projectiles: [], effects: [],
  buildType: null, selectedTower: null, nextId: 1,
  hoverX: null, hoverY: null, hoverValid: false,
};

function dist2D(ax, ay, bx, by){
  const dx = ax-bx, dy = ay-by;
  return Math.sqrt(dx*dx + dy*dy);
}

const MIN_TOWER_SPACING = 44;
const EDGE_MARGIN = 40;

function isBuildable(x, y){
  if (x < EDGE_MARGIN || x > WORLD_W-EDGE_MARGIN || y < EDGE_MARGIN || y > WORLD_H-EDGE_MARGIN) return false;
  if (distanceToPath(x, y) < PATH_WIDTH/2 + 16) return false;
  if (distanceToDecor(x, y) < 24) return false;
  for (const t of state.towers) if (dist2D(x, y, t.x, t.y) < MIN_TOWER_SPACING) return false;
  return true;
}

function towerAt(x, y){
  return state.towers.find(t => dist2D(x, y, t.x, t.y) < 16) || null;
}

/* ------------------------------- UI helpers ------------------------------- */
function updateHud(){
  document.getElementById('hudCoins').textContent = state.coins;
  document.getElementById('hudLives').textContent = state.lives;
  document.getElementById('hudWave').textContent = state.waveIndex;
  document.querySelectorAll('.towerBtn').forEach(btn=>{
    const def = TOWER_DEFS[btn.dataset.type];
    btn.disabled = state.coins < def.cost || state.screen !== 'playing';
    btn.classList.toggle('selected', state.buildType === btn.dataset.type);
  });
  if (state.selectedTower) refreshTowerPanel(state.selectedTower);
}

let messageTimer = 0;
function flashMessage(text){
  const el = document.getElementById('message');
  el.textContent = text;
  el.style.opacity = 1;
  messageTimer = 2;
}
function pulse(el, cls){
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
function showWaveBanner(text){
  const el = document.getElementById('waveBanner');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(()=> el.classList.remove('show'), 1400);
}

/* ---------------------------- placing towers ---------------------------- */
function placeTower(type, x, y){
  const def = TOWER_DEFS[type];
  if (state.coins < def.cost){ flashMessage('Not enough coins!'); return false; }
  if (!isBuildable(x, y)){ flashMessage("Can't build there."); return false; }

  state.coins -= def.cost;
  const tower = {
    id: state.nextId++, type, def, stats: Object.assign({}, def), x, y,
    cooldown:0, target:null, animT: Math.random()*10, attackPulse:0,
    level:1, totalSpent: def.cost,
  };
  state.towers.push(tower);
  sfxPlace();
  updateHud();
  return true;
}

function upgradeCost(tower){ return Math.round(tower.def.cost * (0.55 + 0.35*tower.level)); }

function upgradeTower(tower){
  if (tower.level >= 3) return;
  const cost = upgradeCost(tower);
  if (state.coins < cost){ flashMessage('Not enough coins!'); return; }
  state.coins -= cost;
  tower.totalSpent += cost;
  tower.level++;
  tower.stats.damage *= 1.35;
  tower.stats.range *= 1.08;
  tower.stats.rate *= 0.88;
  if (tower.stats.splash) tower.stats.splash *= 1.1;
  sfxUpgrade();
  updateHud();
}

function sellTower(tower){
  const refund = Math.round(tower.totalSpent * 0.55);
  state.coins += refund;
  state.towers = state.towers.filter(t=>t!==tower);
  sfxSell();
  closeTowerPanel();
  updateHud();
}

function openTowerPanel(tower){
  state.selectedTower = tower;
  document.getElementById('towerPanel').style.display = 'flex';
  sfxUiClick();
  refreshTowerPanel(tower);
}
function closeTowerPanel(){
  state.selectedTower = null;
  document.getElementById('towerPanel').style.display = 'none';
}
function refreshTowerPanel(tower){
  document.getElementById('towerPanelIcon').textContent = tower.def.icon;
  document.getElementById('towerPanelIcon').style.background =
    'radial-gradient(circle at 35% 30%, #fff6d8, ' + tower.def.color + ' 60%, ' + tower.def.color + ' 100%)';
  document.getElementById('towerPanelName').textContent = tower.def.name;
  document.getElementById('towerPanelLevel').textContent = 'Level ' + tower.level + (tower.level>=3 ? ' (max)' : '');
  const upgradeBtn = document.getElementById('towerUpgradeBtn');
  if (tower.level >= 3){
    upgradeBtn.textContent = 'Max level';
    upgradeBtn.disabled = true;
  } else {
    const cost = upgradeCost(tower);
    upgradeBtn.textContent = 'Upgrade (' + cost + ')';
    upgradeBtn.disabled = state.coins < cost;
  }
  document.getElementById('towerSellBtn').textContent = 'Sell (+' + Math.round(tower.totalSpent*0.55) + ')';
}

/* ------------------------------ enemy waves ------------------------------ */
function spawnEnemy(type){
  const def = ENEMY_DEFS[type];
  const start = getPointAtDistance(0);
  const enemy = {
    id: state.nextId++, type, def, x: start.x, y: start.y, angle: start.angle,
    hp: def.hp, maxHp: def.hp, distTravelled: 0,
    isBoss: !!def.boss, alive: true, reachedEnd: false, animT: Math.random()*10,
    slowMult: 1, slowUntil: 0, burnDps: 0, burnUntil: 0, burnTickTimer: 0,
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
  sfxWaveStart();
  showWaveBanner('Wave ' + state.waveIndex);
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
      showWaveBanner('Wave ' + state.waveIndex + ' cleared!');
      sfxWaveClear();
    }
    return;
  }
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0){
    state.spawnTimer = 0.5;
    spawnEnemy(state.waveSpawnQueue.shift());
  }
}

function spawnPoof(x, y, color){
  state.effects.push({ x, y, t:0, life:0.35, baseRadius:6, radius:6, opacity:0.85, color });
}

function dealDamage(enemy, amount){
  if (enemy.def.armor) amount = Math.max(1, amount - enemy.def.armor);
  enemy.hp -= amount;
  spawnPoof(enemy.x, enemy.y, '#ffffff');
  sfxHit();
  if (enemy.hp <= 0 && enemy.alive) killEnemy(enemy, true);
}

function applyEffect(enemy, effect){
  if (!effect || !enemy.alive) return;
  if (effect.type === 'slow'){
    enemy.slowMult = effect.mult;
    enemy.slowUntil = state.gameTime + effect.dur;
  } else if (effect.type === 'burn'){
    enemy.burnDps = effect.dps;
    enemy.burnUntil = state.gameTime + effect.dur;
  }
}

function killEnemy(enemy, giveReward){
  enemy.alive = false;
  spawnPoof(enemy.x, enemy.y, enemy.def.color);
  if (giveReward){
    state.coins += enemy.def.reward;
    sfxDeath();
    updateHud();
    pulse(document.getElementById('coinsBadge'), 'pop');
    if (enemy.def.splitsInto){
      const count = enemy.def.splitCount || 2;
      for (let i=0;i<count;i++){
        const child = spawnEnemy(enemy.def.splitsInto);
        child.distTravelled = Math.max(0, enemy.distTravelled - i*10);
        const p = getPointAtDistance(child.distTravelled);
        child.x = p.x; child.y = p.y; child.angle = p.angle;
      }
    }
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

    if (e.def.regen && e.hp < e.def.hp) e.hp = Math.min(e.def.hp, e.hp + e.def.regen*dt);

    if (e.burnUntil > state.gameTime){
      e.burnTickTimer -= dt;
      if (e.burnTickTimer <= 0){
        e.burnTickTimer = 0.5;
        dealDamage(e, e.burnDps*0.5);
        if (!e.alive) return;
      }
    }

    const speedMult = (e.slowUntil > state.gameTime) ? e.slowMult : 1;
    e.distTravelled += e.def.speed * speedMult * dt;
    const p = getPointAtDistance(e.distTravelled);
    e.x = p.x; e.y = p.y; e.angle = p.angle;

    if (e.distTravelled >= PATH_TOTAL_LEN && !e.reachedEnd){
      e.reachedEnd = true;
      state.lives -= e.isBoss ? 5 : 1;
      killEnemy(e, false);
      sfxLifeLost();
      updateHud();
      pulse(document.getElementById('livesBadge'), 'shake');
      if (state.lives <= 0){ triggerDefeat(); sfxDefeat(); }
    }
  });
}

function pickTarget(tower){
  let best = null, bestDist = -1;
  state.enemies.forEach(e=>{
    if (!e.alive) return;
    if (dist2D(tower.x, tower.y, e.x, e.y) > tower.stats.range) return;
    if (e.distTravelled > bestDist){ bestDist = e.distTravelled; best = e; } // "first" target mode
  });
  return best;
}

function fireTower(tower){
  const target = tower.target;
  if (!target) return;
  state.projectiles.push({
    x: tower.x, y: tower.y, target,
    dmg: tower.stats.damage, splash: tower.stats.splash,
    effect: tower.def.effect, speed: 260,
  });
  tower.attackPulse = 1;
  sfxFire();
}

function updateTowers(dt){
  state.towers.forEach(t=>{
    t.animT += dt;
    t.cooldown -= dt;
    if (!t.target || !t.target.alive || dist2D(t.x, t.y, t.target.x, t.target.y) > t.stats.range){
      t.target = pickTarget(t);
    }
    if (t.target && t.cooldown <= 0){
      t.cooldown = t.stats.rate;
      fireTower(t);
    }
    t.attackPulse = Math.max(0, t.attackPulse - dt*5);
  });
}

function applySplash(cx, cy, radius, dmg){
  state.enemies.forEach(e=>{
    if (!e.alive) return;
    if (dist2D(cx, cy, e.x, e.y) <= radius) dealDamage(e, dmg);
  });
}

function updateProjectiles(dt){
  state.projectiles.forEach(p=>{
    if (!p.target.alive){ p.dead = true; return; }
    const dx = p.target.x-p.x, dy = p.target.y-p.y;
    const dist = Math.sqrt(dx*dx+dy*dy);
    const step = p.speed*dt;
    if (step >= dist){
      if (p.splash) applySplash(p.target.x, p.target.y, p.splash, p.dmg);
      else dealDamage(p.target, p.dmg);
      applyEffect(p.target, p.effect);
      p.dead = true;
    } else {
      p.x += (dx/dist)*step; p.y += (dy/dist)*step;
    }
  });
  state.projectiles = state.projectiles.filter(p=>!p.dead);
}

function updateEffects(dt){
  state.effects.forEach(fx=>{
    fx.t += dt;
    const t = Math.min(1, fx.t/fx.life);
    fx.radius = fx.baseRadius * (1 + t*1.8);
    fx.opacity = Math.max(0, 0.85*(1-t));
    if (t >= 1) fx.dead = true;
  });
  state.effects = state.effects.filter(fx=>!fx.dead);
}

/* -------------------------------- run loop ------------------------------- */
function resetRunState(){
  state.coins = START_COINS; state.lives = BASE_LIVES; state.waveIndex = 0;
  state.waveActive = false; state.waveSpawnQueue = []; state.buildType = null; state.gameTime = 0;
  state.towers = []; state.enemies = []; state.projectiles = []; state.effects = [];
  state.screen = 'playing';
  closeTowerPanel();
  document.getElementById('defeatOverlay').style.display = 'none';
  document.getElementById('waveBanner').classList.remove('show');
  document.getElementById('startWaveBtn').disabled = false;
  document.getElementById('startWaveBtn').textContent = 'Start Wave 1';
  updateHud();
}

function updateGame(dt){
  if (state.screen !== 'playing') return;
  state.gameTime += dt;
  updateSpawning(dt);
  updateEnemies(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateEffects(dt);
  if (messageTimer > 0){
    messageTimer -= dt;
    if (messageTimer <= 0) document.getElementById('message').style.opacity = 0;
  }
}
