/* =========================================================================
   main.js — wires up DOM buttons, boots the scene, runs the frame loop
   ========================================================================= */

function initUIBindings(){
  document.getElementById('playBtn').addEventListener('click', ()=>{ Audio2.click(); startGame(); });
  document.getElementById('startWaveBtn').addEventListener('click', ()=>{ startWave(); });
  document.getElementById('pauseBtn').addEventListener('click', ()=>{ Audio2.click(); togglePause(); });
  document.getElementById('resumeBtn').addEventListener('click', ()=>{ Audio2.click(); showScreen('playing'); });
  document.getElementById('restartBtn').addEventListener('click', ()=>{ Audio2.click(); startGame(); });
  document.getElementById('exitBtn').addEventListener('click', ()=>{ Audio2.click(); showScreen('menu'); });
  document.getElementById('speedBtn').addEventListener('click', (e)=>{
    state.speed = state.speed===1?2:1;
    e.target.textContent = state.speed+'x';
    Audio2.click();
  });
  document.getElementById('victoryMenuBtn').addEventListener('click', ()=> showScreen('menu'));
  document.getElementById('victoryRetryBtn').addEventListener('click', ()=> startGame());
  document.getElementById('defeatRetryBtn').addEventListener('click', ()=> startGame());
  document.getElementById('defeatMenuBtn').addEventListener('click', ()=> showScreen('menu'));
  document.getElementById('soundToggle').addEventListener('click', (e)=>{
    SETTINGS.sound = !SETTINGS.sound;
    saveSettings();
    e.target.textContent = SETTINGS.sound? '🔊 Sound On':'🔈 Sound Off';
  });
}

function animate(){
  requestAnimationFrame(animate);
  const rawDt = Math.min(clock.getDelta(), 0.05);
  updateClouds(rawDt);
  renderer.render(scene, camera);
  if (state.screen!=='playing') return;
  const dt = rawDt * state.speed;
  updateSpawning(dt);
  updateEnemies(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateEffects(dt);
  updateFloatingTexts(dt);
  checkWaveComplete();
}

function init(){
  initScene();
  buildMap();
  buildShopUI();
  initInput();
  initUIBindings();
  const best = loadBestStars();
  if (best){
    document.getElementById('bestStars').textContent = '⭐'.repeat(best)+'☆'.repeat(3-best)+' best';
  }
  document.getElementById('soundToggle').textContent = SETTINGS.sound? '🔊 Sound On':'🔈 Sound Off';
  showScreen('menu');
  animate();
}

window.addEventListener('DOMContentLoaded', init);
