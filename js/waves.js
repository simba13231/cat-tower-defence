/* =========================================================================
   waves.js — the 12 wave definitions plus the spawn-queue engine
   ========================================================================= */

const WAVES = [
  {label:'Wave 1', groups:[{type:'puppy',count:8,interval:0.9}]},
  {label:'Wave 2', groups:[{type:'puppy',count:6,interval:0.8},{type:'fastdog',count:4,interval:0.7,delay:2}]},
  {label:'Puppy Rush!', special:'Puppy Rush', groups:[{type:'puppy',count:18,interval:0.4}]},
  {label:'Wave 4', groups:[{type:'bulldog',count:3,interval:1.6},{type:'fastdog',count:6,interval:0.6,delay:1}]},
  {label:'Wave 5', groups:[{type:'armored',count:5,interval:1.1},{type:'puppy',count:8,interval:0.5,delay:1}]},
  {label:'Golden Bone Wave', special:'+50% coins', rewardMult:1.5, groups:[{type:'fastdog',count:10,interval:0.5},{type:'husky',count:4,interval:0.9,delay:2}]},
  {label:'Wave 7', groups:[{type:'police',count:4,interval:1.3},{type:'armored',count:6,interval:1.0,delay:1},{type:'sneaky',count:3,interval:1.4,delay:3}]},
  {label:'BOSS: The Dog King', boss:'dogking', groups:[{type:'puppy',count:6,interval:0.6}]},
  {label:'Wave 9', groups:[{type:'splitter',count:6,interval:1.3},{type:'husky',count:5,interval:0.8,delay:1}]},
  {label:'Wave 10', groups:[{type:'healer',count:4,interval:1.5},{type:'armored',count:8,interval:0.9,delay:1},{type:'sneaky',count:5,interval:1.1,delay:2}]},
  {label:'Dangerous Stretch', hpMult:1.2, rewardMult:1.3, groups:[{type:'bulldog',count:6,interval:1.2},{type:'police',count:5,interval:1.0,delay:1},{type:'splitter',count:4,interval:1.3,delay:2},{type:'healer',count:3,interval:1.5,delay:3}]},
  {label:'FINAL BOSS: The Dog King', boss:'dogking', bossHpMult:2.0, groups:[{type:'armored',count:6,interval:0.9},{type:'sneaky',count:6,interval:0.9,delay:2},{type:'fastdog',count:8,interval:0.5,delay:4}]},
];

let waveTimer = 0;

function buildSpawnQueue(wave){
  const q = [];
  (wave.groups||[]).forEach(grp=>{
    for (let i=0;i<grp.count;i++){
      q.push({type:grp.type, time:(grp.delay||0) + i*grp.interval});
    }
  });
  if (wave.boss){
    q.push({type:wave.boss, time: 0.5, boss:true, hpMult: wave.bossHpMult||1});
  }
  q.sort((a,b)=>a.time-b.time);
  return q;
}

function startWave(){
  if (state.waveActive || state.waveIndex >= WAVES.length) return;
  const wave = WAVES[state.waveIndex];
  state.waveSpawnQueue = buildSpawnQueue(wave);
  state.waveActive = true;
  waveTimer = 0;
  Audio2.waveStart();
  updateHud();
  const btn = document.getElementById('startWaveBtn');
  btn.disabled = true;
  btn.textContent = 'Wave in progress...';
}

function updateSpawning(dt){
  if (!state.waveActive) return;
  waveTimer += dt;
  while (state.waveSpawnQueue.length && state.waveSpawnQueue[0].time <= waveTimer){
    const s = state.waveSpawnQueue.shift();
    spawnEnemy(s.type, {hpMult: s.hpMult||1});
  }
}

function checkWaveComplete(){
  if (state.waveActive && state.waveSpawnQueue.length===0 && state.enemies.length===0){
    state.waveActive = false;
    const wasLast = state.waveIndex >= WAVES.length-1;
    state.waveIndex++;
    const bonus = 20 + state.waveIndex*5;
    state.coins += bonus;
    state.coinsEarnedRun += bonus;
    flashMessage(`Wave complete! +${bonus} bonus coins`);
    updateHud();
    if (wasLast){
      triggerVictory();
    } else {
      const btn = document.getElementById('startWaveBtn');
      btn.disabled = false;
      btn.textContent = 'Start Wave '+(state.waveIndex+1);
      renderWaveBanner();
    }
  }
}
