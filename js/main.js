/* =========================================================================
   main.js — boots the game. Declares the canvas/context once (input.js
   and render.js both use these as shared globals), sizes the canvas for
   crisp high-DPI rendering while keeping all drawing code in fixed
   WORLD_W x WORLD_H units, builds the static background once, and runs
   the render loop — clamping large deltas and resyncing after the tab
   was hidden, the same robustness Icebreaker Run's GameLoop.js uses.
   ========================================================================= */

const canvasEl = document.getElementById('gameCanvas');
const ctx = canvasEl.getContext('2d');

function setupCanvasResolution(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvasEl.width = WORLD_W * dpr;
  canvasEl.height = WORLD_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function resizeCanvasCSS(){
  const availW = window.innerWidth, availH = window.innerHeight;
  const scale = Math.min(availW / WORLD_W, availH / WORLD_H);
  canvasEl.style.width = Math.floor(WORLD_W * scale) + 'px';
  canvasEl.style.height = Math.floor(WORLD_H * scale) + 'px';
}

setupCanvasResolution();
resizeCanvasCSS();
window.addEventListener('resize', resizeCanvasCSS);
window.addEventListener('orientationchange', resizeCanvasCSS);

const staticBackground = buildStaticBackground();

function renderFrame(){
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);
  ctx.drawImage(staticBackground, 0, 0);

  state.towers.forEach(t => drawTower(ctx, t));
  state.enemies.forEach(e => drawEnemy(ctx, e));
  state.projectiles.forEach(p => drawProjectile(ctx, p));
  state.effects.forEach(fx => drawEffect(ctx, fx));

  if (state.buildType && state.hoverX !== null){
    drawRangeCircle(ctx, state.hoverX, state.hoverY, TOWER_DEFS[state.buildType].range, state.hoverValid);
  }
  if (state.selectedTower){
    drawRangeCircle(ctx, state.selectedTower.x, state.selectedTower.y, state.selectedTower.stats.range, true);
  }
}

let lastTime = performance.now();
function frame(now){
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  dt = Math.min(dt, 0.1); // clamp big deltas (e.g. after switching tabs) so nothing jumps
  updateGame(dt);
  renderFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Resync the clock when the tab becomes visible again, so the huge gap
// while it was hidden doesn't register as one giant dt (still clamped
// above anyway, but this avoids a stale lastTime entirely).
document.addEventListener('visibilitychange', ()=>{
  if (!document.hidden) lastTime = performance.now();
});
