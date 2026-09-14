/* =========================================================================
   input.js — mouse/touch raycasting for placement + tower selection
   ========================================================================= */

function screenToGrid(clientX, clientY){
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((clientX-rect.left)/rect.width)*2-1,
    -((clientY-rect.top)/rect.height)*2+1
  );
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(groundPlane);
  if (!hits.length) return null;
  const p = hits[0].point;
  const col = Math.round(p.x/TILE + (GRID_W-1)/2);
  const row = Math.round(p.z/TILE + (GRID_H-1)/2);
  return {col,row, point:p};
}

function pickTowerAt(clientX, clientY){
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((clientX-rect.left)/rect.width)*2-1,
    -((clientY-rect.top)/rect.height)*2+1
  );
  raycaster.setFromCamera(mouse, camera);
  const meshes = state.towers.map(t=>t.mesh);
  const hits = raycaster.intersectObjects(meshes, true);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj.parent && !state.towers.find(t=>t.mesh===obj)) obj = obj.parent;
  return state.towers.find(t=>t.mesh===obj) || null;
}

function initInput(){
  const canvas = renderer.domElement;
  canvas.addEventListener('mousemove', e=>{
    if (state.screen!=='playing') return;
    if (state.buildType){
      const g = screenToGrid(e.clientX,e.clientY);
      if (g && isBuildable(g.col,g.row)){
        placePreviewGroup.visible = true;
        placePreviewGroup.position.set(worldX(g.col),0,worldZ(g.row));
        const occupied = tileMeshes[g.col+','+g.row].userData.occupied;
        placePreviewGroup.userData.cellHi.material.color.set(occupied?0xff5555:0x66ff88);
        const range = TOWER_DEFS[state.buildType].range;
        placePreviewGroup.userData.rangeRing.geometry.dispose();
        placePreviewGroup.userData.rangeRing.geometry = new THREE.RingGeometry(range-0.03,range,48);
      } else {
        placePreviewGroup.visible = false;
      }
    }
  });
  canvas.addEventListener('click', e=>{
    if (state.screen!=='playing') return;
    if (state.buildType){
      const g = screenToGrid(e.clientX,e.clientY);
      if (g) placeTower(state.buildType, g.col, g.row);
      refreshShopSelection();
      return;
    }
    const tower = pickTowerAt(e.clientX,e.clientY);
    if (tower){
      state.selectedTower = tower;
      selectRing.visible = true;
      selectRing.position.set(tower.mesh.position.x,0.02,tower.mesh.position.z);
      const stats = towerStats(tower);
      selectRing.geometry.dispose();
      selectRing.geometry = new THREE.RingGeometry(stats.range-0.03,stats.range,48);
      renderTowerPanel(tower);
      Audio2.click();
    } else {
      state.selectedTower = null;
      selectRing.visible = false;
      closeTowerPanel();
    }
  });
  window.addEventListener('keydown', e=>{
    if (e.key==='Escape'){ state.buildType=null; placePreviewGroup.visible=false; refreshShopSelection(); }
    if (e.key===' '){ togglePause(); }
  });
}
