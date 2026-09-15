/* =========================================================================
   inputPC.js — turns a screen click into a grid tile and places a tower.
   The camera is a fixed orthographic view, so every screen pixel's ray
   through the scene points in the same direction (the camera's forward
   vector) — only the ray's origin differs per pixel. That makes the
   ground-plane intersection just a couple lines of algebra instead of a
   full raycast.
   ========================================================================= */

const canvasEl = document.getElementById('app-canvas');

const hoverHighlight = boxEntity('hoverHighlight', TILE*0.9, 0.05, TILE*0.9, hexColor(0x66ff88), {opacity:0.5, castShadows:false, receiveShadows:false});
hoverHighlight.enabled = false;
mapRoot.addChild(hoverHighlight);

function screenToTile(clientX, clientY){
  const rect = canvasEl.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const camComp = camera.camera;
  const forward = camera.forward;
  const nearPoint = camComp.screenToWorld(x, y, camComp.nearClip);
  if (Math.abs(forward.y) < 1e-6) return null;
  const t = -nearPoint.y / forward.y;
  const worldXPos = nearPoint.x + forward.x * t;
  const worldZPos = nearPoint.z + forward.z * t;
  const col = Math.round(worldXPos / TILE + (GRID_W - 1) / 2);
  const row = Math.round(worldZPos / TILE + (GRID_H - 1) / 2);
  return { col, row, x: worldXPos, z: worldZPos };
}

canvasEl.addEventListener('mousemove', (ev)=>{
  if (!state.buildType){ hoverHighlight.enabled = false; return; }
  const tile = screenToTile(ev.clientX, ev.clientY);
  if (!tile || tile.col<0 || tile.row<0 || tile.col>=GRID_W || tile.row>=GRID_H){
    hoverHighlight.enabled = false;
    return;
  }
  const key = tile.col+','+tile.row;
  const valid = isBuildable(tile.col, tile.row) && !tileEntities[key].occupied;
  hoverHighlight.enabled = true;
  hoverHighlight.setPosition(worldX(tile.col), 0.03, worldZ(tile.row));
  hoverHighlight.model.material.diffuse = valid ? hexColor(0x66ff88) : hexColor(0xff6666);
  hoverHighlight.model.material.update();
});

canvasEl.addEventListener('click', (ev)=>{
  if (state.screen !== 'playing' || !state.buildType) return;
  const tile = screenToTile(ev.clientX, ev.clientY);
  if (!tile) return;
  placeTower(state.buildType, tile.col, tile.row);
});

// Build-mode buttons: click selects a tower type; clicking the same one
// again cancels build mode.
document.querySelectorAll('.towerBtn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const type = btn.dataset.type;
    state.buildType = (state.buildType === type) ? null : type;
    updateHud();
  });
});

document.getElementById('startWaveBtn').addEventListener('click', startWave);
document.getElementById('retryBtn').addEventListener('click', resetRunState);

window.addEventListener('keydown', (ev)=>{
  if (ev.key === 'Escape'){ state.buildType = null; updateHud(); }
});
