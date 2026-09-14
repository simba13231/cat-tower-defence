/* =========================================================================
   ui.js — HUD refresh, screen switching, and win/lose screen population
   ========================================================================= */

function updateHud(){
  document.getElementById('hudCoins').textContent = state.coins;
  document.getElementById('hudLives').textContent = Math.max(0,state.lives);
  document.getElementById('hudWave').textContent = (Math.min(state.waveIndex+1,WAVES.length))+' / '+WAVES.length;
  TOWER_ORDER.forEach(type=>{
    const btn = document.querySelector(`.shopBtn[data-type="${type}"]`);
    if (btn) btn.classList.toggle('disabled', state.coins < TOWER_DEFS[type].cost);
  });
}

function renderWaveBanner(){
  const wave = WAVES[state.waveIndex];
  const label = document.getElementById('waveLabel');
  if (wave) label.textContent = wave.label + (wave.special?(' — '+wave.special):'');
}

function showScreen(name){
  state.screen = name;
  ['menu','victory','defeat'].forEach(s=>{
    document.getElementById('screen-'+s).style.display = (s===name)? 'flex':'none';
  });
  const isPlayingLike = (name==='playing'||name==='paused');
  document.getElementById('hudRoot').style.display = isPlayingLike?'flex':'none';
  document.getElementById('pauseOverlay').style.display = name==='paused'?'flex':'none';
}

function triggerVictory(){
  showScreen('victory');
  Audio2.win();
  const livesLeft = Math.max(0,state.lives);
  let stars = 1;
  if (livesLeft >= BASE_LIVES*0.8) stars = 3; else if (livesLeft >= BASE_LIVES*0.4) stars = 2;
  document.getElementById('victoryStars').textContent = '⭐'.repeat(stars)+'☆'.repeat(3-stars);
  document.getElementById('vDogs').textContent = state.dogsDefeated;
  document.getElementById('vCoins').textContent = state.coinsEarnedRun;
  document.getElementById('vLives').textContent = livesLeft;
  saveProgress(stars);
}

function triggerDefeat(){
  state.waveActive = false;
  showScreen('defeat');
  Audio2.lose();
  document.getElementById('dDogs').textContent = state.dogsDefeated;
  document.getElementById('dCoins').textContent = state.coinsEarnedRun;
  document.getElementById('dWave').textContent = state.waveIndex+1;
}
