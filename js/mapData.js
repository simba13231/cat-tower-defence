/* =========================================================================
   mapData.js — grid/path layout & decoration placement, as plain data.
   Ported from the Three.js version's map.js: same grid math, same waypoint
   path, same rules for what's buildable. Nothing engine-specific lives
   here on purpose, so this file doesn't change if the renderer changes.
   ========================================================================= */

const GRID_W = 13, GRID_H = 8, TILE = 1.6;
const BASE_LIVES = 20;
const START_COINS = 220;

function worldX(col){ return (col - (GRID_W - 1) / 2) * TILE; }
function worldZ(row){ return (row - (GRID_H - 1) / 2) * TILE; }

// Path defined as turning waypoints in grid space (col,row). First/last are
// off-map so dogs walk on/off screen.
const PATH_WP = [
  {c:-1.5, r:4}, {c:2, r:4}, {c:2, r:1}, {c:7, r:1},
  {c:7, r:6}, {c:10, r:6}, {c:10, r:3}, {c:14.5, r:3}
];
const PATH_WORLD = PATH_WP.map(p => ({x: worldX(p.c), z: worldZ(p.r)}));

const PATH_SEG_LEN = [];
let PATH_TOTAL_LEN = 0;
for (let i = 0; i < PATH_WORLD.length - 1; i++){
  const dx = PATH_WORLD[i+1].x - PATH_WORLD[i].x;
  const dz = PATH_WORLD[i+1].z - PATH_WORLD[i].z;
  const d = Math.sqrt(dx*dx + dz*dz);
  PATH_SEG_LEN.push(d);
  PATH_TOTAL_LEN += d;
}

const PATH_TILES = new Set();
{
  const intWps = PATH_WP.map(p => ({c: Math.round(p.c), r: Math.round(p.r)}));
  for (let i = 0; i < intWps.length - 1; i++){
    const a = intWps[i], b = intWps[i+1];
    if (a.r === b.r){
      const lo = Math.min(a.c,b.c), hi = Math.max(a.c,b.c);
      for (let c = lo; c <= hi; c++) if (c>=0 && c<GRID_W) PATH_TILES.add(c+','+a.r);
    } else if (a.c === b.c){
      const lo = Math.min(a.r,b.r), hi = Math.max(a.r,b.r);
      for (let r = lo; r <= hi; r++) if (r>=0 && r<GRID_H) PATH_TILES.add(a.c+','+r);
    }
  }
}

const DECOR_TILES = [];
(function pickDecor(){
  const candidates = [
    [0,0],[1,0],[11,0],[12,0],[0,7],[1,7],[11,7],[12,7],
    [4,4],[5,4],[9,1],[9,0],[2,6],[3,6],[5,5],[12,5],[0,3],[8,7]
  ];
  const kinds = ['tree','tree','rock','bush','bush','flowerpatch','stump'];
  let pondPlaced = false;
  for (const [c,r] of candidates){
    const key = c+','+r;
    if (PATH_TILES.has(key)) continue;
    if (!pondPlaced && Math.random()<0.2){
      DECOR_TILES.push({c,r,kind:'pond'});
      pondPlaced = true;
      continue;
    }
    DECOR_TILES.push({c,r,kind: kinds[Math.floor(Math.random()*kinds.length)]});
  }
})();
const DECOR_SET = new Set(DECOR_TILES.map(d => d.c+','+d.r));

function isBuildable(c,r){
  if (c<0||r<0||c>=GRID_W||r>=GRID_H) return false;
  const key = c+','+r;
  return !PATH_TILES.has(key) && !DECOR_SET.has(key);
}
