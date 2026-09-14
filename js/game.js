/* =========================================================================
   game.js — the mutable game state object and run lifecycle
   ========================================================================= */

const state = {
  screen:'menu', // menu, playing, paused, victory, defeat
  coins:START_COINS, lives:BASE_LIVES, waveIndex:0, waveActive:false,
  waveSpawnQueue:[], speed:1,
  towers:[], enemies:[], projectiles:[], effects:[], texts:[],
  buildType:null, selectedTower:null,
  dogsDefeated:0, coinsEarnedRun:0, nextId:1,
};

function resetRunState(){
  state.coins = START_COINS; state.lives = BASE_LIVES; state.waveIndex = 0;
  state.waveActive = false; state.waveSpawnQueue = [];
  state.speed = 1; state.dogsDefeated = 0; state.coinsEarnedRun = 0;
  state.buildType = null; state.selectedTower = null;

  state.towers.forEach(t=>scene.remove(t.mesh));
  state.enemies.forEach(e=>scene.remove(e.mesh));
  state.projectiles.forEach(p=>scene.remove(p.mesh));
  state.effects.forEach(fx=>scene.remove(fx.mesh));
  Object.keys(tileMeshes).forEach(k=> tileMeshes[k].userData.occupied = false);
  state.towers = []; state.enemies = []; state.projectiles = []; state.effects = [];
  clearFloatingTexts();
  selectRing.visible = false;
  closeTowerPanel();
}

function startGame(){
  resetRunState();
  showScreen('playing');
  updateHud();
  renderWaveBanner();
  const btn = document.getElementById('startWaveBtn');
  btn.disabled = false; btn.textContent = 'Start Wave 1';
  document.getElementById('bossBarWrap').style.display='none';
}

function togglePause(){
  if (state.screen==='playing'){ showScreen('paused'); }
  else if (state.screen==='paused'){ showScreen('playing'); }
}
