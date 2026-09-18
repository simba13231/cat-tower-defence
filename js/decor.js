/* =========================================================================
   decor.js — scattered trees/rocks/bushes/pond, kept off the path.
   Candidates are filtered against the real path (distanceToPath from
   path.js) rather than hand-measured against the waypoint geometry, so
   this stays correct even if the path shape changes later.
   ========================================================================= */

const DECOR = (function build(){
  const candidates = [];
  for (let x = 70; x <= WORLD_W-70; x += 90){
    for (let y = 70; y <= WORLD_H-70; y += 90){
      candidates.push({ x: x + (Math.random()-0.5)*30, y: y + (Math.random()-0.5)*30 });
    }
  }
  const kinds = ['tree','tree','rock','bush','bush','flowerpatch','stump'];
  const list = [];
  let pondPlaced = false;
  candidates.forEach(c=>{
    if (distanceToPath(c.x, c.y) < PATH_WIDTH/2 + 34) return; // too close to the road
    if (Math.random() < 0.55) return; // keep it sparse, not a solid grid of clutter
    if (!pondPlaced && Math.random() < 0.2){
      list.push({ x:c.x, y:c.y, kind:'pond', radius: 30 });
      pondPlaced = true;
      return;
    }
    list.push({ x:c.x, y:c.y, kind: kinds[Math.floor(Math.random()*kinds.length)], radius: 22 });
  });
  return list;
})();

function distanceToDecor(x, y){
  let best = Infinity;
  DECOR.forEach(d=>{
    const dx = d.x-x, dy = d.y-y;
    const dist = Math.sqrt(dx*dx+dy*dy) - d.radius;
    if (dist < best) best = dist;
  });
  return best === Infinity ? 999 : best;
}
