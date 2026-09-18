/* =========================================================================
   input.js — turns clicks/taps into world coordinates and game actions.
   The canvas has a fixed WORLD_W x WORLD_H internal resolution but is
   CSS-scaled (letterboxed) to fit the screen — so converting a click is
   just: where did it land in the canvas's on-screen box, as a fraction,
   times the world size. Works the same regardless of devicePixelRatio.
   canvasEl itself is declared once in main.js (loaded before this file)
   and used here as a shared global — declaring it again here would
   collide, since both files run as classic scripts in one page scope.
   ========================================================================= */

function screenToWorld(clientX, clientY){
  const rect = canvasEl.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width * WORLD_W,
    y: (clientY - rect.top) / rect.height * WORLD_H,
  };
}

function handleMove(clientX, clientY){
  if (!state.buildType){ state.hoverX = null; return; }
  const p = screenToWorld(clientX, clientY);
  state.hoverX = p.x; state.hoverY = p.y;
  state.hoverValid = isBuildable(p.x, p.y);
}

function handleTap(clientX, clientY){
  if (state.screen !== 'playing') return;
  const p = screenToWorld(clientX, clientY);
  if (state.buildType){
    placeTower(state.buildType, p.x, p.y);
    return;
  }
  const tower = towerAt(p.x, p.y);
  if (tower) openTowerPanel(tower);
  else closeTowerPanel();
}

canvasEl.addEventListener('mousemove', (ev)=> handleMove(ev.clientX, ev.clientY));
canvasEl.addEventListener('click', (ev)=> handleTap(ev.clientX, ev.clientY));
canvasEl.addEventListener('touchstart', (ev)=>{
  if (ev.touches.length !== 1) return;
  const t = ev.touches[0];
  handleMove(t.clientX, t.clientY);
  handleTap(t.clientX, t.clientY);
  ev.preventDefault();
}, { passive:false });

document.querySelectorAll('.towerBtn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const type = btn.dataset.type;
    state.buildType = (state.buildType === type) ? null : type;
    sfxUiClick();
    updateHud();
  });
});

document.getElementById('startWaveBtn').addEventListener('click', startWave);
document.getElementById('retryBtn').addEventListener('click', resetRunState);
document.getElementById('towerUpgradeBtn').addEventListener('click', ()=>{
  if (state.selectedTower) upgradeTower(state.selectedTower);
});
document.getElementById('towerSellBtn').addEventListener('click', ()=>{
  if (state.selectedTower) sellTower(state.selectedTower);
});
document.getElementById('towerPanelClose').addEventListener('click', closeTowerPanel);

document.getElementById('playBtn').addEventListener('click', ()=>{
  document.getElementById('titleScreen').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('buildBar').style.display = 'flex';
  sfxUiClick();
  resetRunState();
});

window.addEventListener('keydown', (ev)=>{
  if (ev.key === 'Escape'){ state.buildType = null; closeTowerPanel(); updateHud(); }
});
