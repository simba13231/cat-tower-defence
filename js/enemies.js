/* =========================================================================
   enemies.js — spawning, path movement, status effects, taking damage,
                death handling (splits/rewards), and the boss health bar
   ========================================================================= */

function pathPointAt(distTravelled){
  let remaining = distTravelled;
  for (let i=0;i<PATH_SEG_LEN.length;i++){
    if (remaining <= PATH_SEG_LEN[i] || i===PATH_SEG_LEN.length-1){
      const t = PATH_SEG_LEN[i]>0 ? Math.min(1,remaining/PATH_SEG_LEN[i]) : 1;
      const a = PATH_WORLD[i], b = PATH_WORLD[i+1];
      return { pos: a.clone().lerp(b,t), segIndex:i, done: distTravelled >= PATH_TOTAL_LEN };
    }
    remaining -= PATH_SEG_LEN[i];
  }
  return { pos: PATH_WORLD[PATH_WORLD.length-1].clone(), segIndex: PATH_SEG_LEN.length-1, done:true };
}

function spawnEnemy(type, opts){
  opts = opts || {};
  const def = ENEMY_DEFS[type];
  const wave = WAVES[state.waveIndex];
  const hpMult = ((wave && wave.hpMult) || 1) * (opts.hpMult||1);
  const mesh = createDogMesh(def);
  mesh.position.copy(PATH_WORLD[0]);
  scene.add(mesh);
  const enemy = {
    id: state.nextId++, type, def, mesh,
    hp: def.hp*hpMult, maxHp: def.hp*hpMult,
    speed: def.speed, baseSpeed: def.speed,
    wpIndex:0, distTravelled:0,
    slowTimer:0, slowFactor:1, stunTimer:0, tangleTimer:0,
    disableTimer:0, healAuraCd:0, summonCd: def.boss?8:0, howlCd: def.boss?12:0, howlBuff:0,
    isBoss: !!def.boss, animT: Math.random()*10,
    alive:true, reachedEnd:false,
  };
  if (def.boss) makeBossBar(enemy);
  state.enemies.push(enemy);
  return enemy;
}

function dealDamage(enemy, amount, opts){
  opts = opts || {};
  let dmg = amount;
  if (enemy.def.armor && !opts.ignoresArmor) dmg *= (1-enemy.def.armor);
  enemy.hp -= dmg;
  spawnFloatingText(enemy.mesh.position, Math.round(dmg).toString(), opts.crit?'#ff5050':'#fff6d8');
  Audio2.hit();
  if (enemy.hp <= 0 && enemy.alive) killEnemy(enemy, true);
}

function killEnemy(enemy, giveReward){
  enemy.alive = false;
  Audio2.death();
  spawnPoof(enemy.mesh.position, 0xffffff);
  scene.remove(enemy.mesh);
  if (giveReward){
    const wave = WAVES[state.waveIndex];
    const reward = Math.round(enemy.def.reward * ((wave && wave.rewardMult) || 1));
    state.coins += reward;
    state.coinsEarnedRun += reward;
    state.dogsDefeated++;
    Audio2.coin();
  }
  if (enemy.def.splits){
    for (let i=0;i<2;i++){
      const pup = spawnEnemy('puppy',{hpMult:0.5});
      pup.distTravelled = Math.max(0, enemy.distTravelled - 0.3);
      const pp = pathPointAt(pup.distTravelled);
      pup.mesh.position.copy(pp.pos);
    }
  }
  state.enemies = state.enemies.filter(e=>e!==enemy);
  updateHud();
}

function makeBossBar(enemy){
  document.getElementById('bossBarWrap').style.display = 'block';
  document.getElementById('bossName').textContent = enemy.def.name;
}
function updateBossBar(){
  const boss = state.enemies.find(e=>e.isBoss);
  if (boss){
    document.getElementById('bossBarWrap').style.display = 'block';
    document.getElementById('bossFill').style.width = Math.max(0,(boss.hp/boss.maxHp*100))+'%';
  } else {
    document.getElementById('bossBarWrap').style.display = 'none';
  }
}

function updateEnemies(dt){
  state.enemies.forEach(e=>{
    e.animT += dt;
    if (e.stunTimer>0){ e.stunTimer -= dt; return; }
    if (e.disableTimer>0) e.disableTimer -= dt;
    if (e.tangleTimer>0){ e.tangleTimer -= dt; return; }
    if (e.slowTimer>0){ e.slowTimer -= dt; if (e.slowTimer<=0) e.slowFactor=1; }

    if (e.def.heals){
      e.healAuraCd -= dt;
      if (e.healAuraCd<=0){
        e.healAuraCd = 1;
        state.enemies.forEach(o=>{ if(o!==e && o.alive && distTo(o,e.mesh.position)<2.0) o.hp = Math.min(o.maxHp, o.hp+5); });
      }
    }
    if (e.def.disables){
      state.towers.forEach(t=>{ if (distTo(e,t.mesh.position)<1.6) t.disableTimer = 1.0; });
    }
    if (e.isBoss){
      e.summonCd -= dt; e.howlCd -= dt;
      if (e.summonCd<=0){
        e.summonCd=8;
        for(let i=0;i<3;i++){ const p=spawnEnemy('puppy',{hpMult:0.6}); p.distTravelled = Math.max(0,e.distTravelled-1-i*0.3); }
        flashMessage('The Dog King summons reinforcements!');
      }
      if (e.howlCd<=0){
        e.howlCd=12;
        state.enemies.forEach(o=>{ if(o!==e && distTo(o,e.mesh.position)<3.5) o.howlBuff=4; });
        flashMessage('The Dog King howls — nearby dogs speed up!');
      }
    }
    if (e.howlBuff>0) e.howlBuff -= dt;

    const speedMul = (e.slowFactor||1) * (e.howlBuff>0?1.3:1);
    e.distTravelled += e.baseSpeed * speedMul * dt;
    const pp = pathPointAt(e.distTravelled);
    e.mesh.position.copy(pp.pos);
    e.mesh.position.y = Math.abs(Math.sin(e.animT*8))*0.03;
    const nextIdx = Math.min(pp.segIndex+1, PATH_WORLD.length-1);
    e.mesh.rotation.y = Math.atan2(
      (PATH_WORLD[nextIdx].x - PATH_WORLD[pp.segIndex].x),
      (PATH_WORLD[nextIdx].z - PATH_WORLD[pp.segIndex].z)
    );
    const parts = e.mesh.userData.parts;
    const swing = Math.sin(e.animT*10)*0.5;
    parts.legFL.rotation.x = swing; parts.legBR.rotation.x = swing;
    parts.legFR.rotation.x = -swing; parts.legBL.rotation.x = -swing;
    parts.tail.rotation.z = Math.sin(e.animT*6)*0.25;

    if (pp.done && !e.reachedEnd){
      e.reachedEnd = true;
      state.lives -= e.isBoss? 5 : 1;
      Audio2.bark();
      killEnemy(e, false);
      updateHud();
      if (state.lives <= 0) triggerDefeat();
    }
  });
  updateBossBar();
}
