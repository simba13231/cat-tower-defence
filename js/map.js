/* =========================================================================
   map.js — grid/path layout, tile mesh construction, decorations,
            and the placement-preview / selection-range ring visuals
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
const PATH_WORLD = PATH_WP.map(p => new THREE.Vector3(worldX(p.c), 0, worldZ(p.r)));

const PATH_SEG_LEN = [];
let PATH_TOTAL_LEN = 0;
for (let i = 0; i < PATH_WORLD.length - 1; i++){
  const d = PATH_WORLD[i].distanceTo(PATH_WORLD[i+1]);
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
    [4,4],[5,4],[9,1],[9,0],[2,6],[3,6],[5,5]
  ];
  for (const [c,r] of candidates){
    const key = c+','+r;
    if (!PATH_TILES.has(key)) DECOR_TILES.push({c,r,kind: Math.random()<0.5?'tree':(Math.random()<0.5?'rock':'bush')});
  }
})();
const DECOR_SET = new Set(DECOR_TILES.map(d => d.c+','+d.r));

function isBuildable(c,r){
  if (c<0||r<0||c>=GRID_W||r>=GRID_H) return false;
  const key = c+','+r;
  return !PATH_TILES.has(key) && !DECOR_SET.has(key);
}

const tileMeshes = {};
let selectRing, placePreviewGroup;

function buildMap(){
  const mapGroup = new THREE.Group();
  const grassTex = makeGrassTexture();
  const dirtTex = makeDirtTexture();
  const grassShades = [0xffffff, 0xe9f6df, 0xd8ecc9]; // subtle per-tile tint multiplier on top of texture

  for (let c=0;c<GRID_W;c++){
    for (let r=0;r<GRID_H;r++){
      const key = c+','+r;
      const onPath = PATH_TILES.has(key);
      const onDecor = DECOR_SET.has(key);
      let color, map;
      if (onPath){ color = 0xd9b06a; map = dirtTex; }
      else if (onDecor){ color = 0x5f9b52; map = grassTex; }
      else { color = grassShades[(c*7+r*13)%grassShades.length]; map = grassTex; }
      const geo = new THREE.BoxGeometry(TILE*0.96, 0.2, TILE*0.96);
      const mat = new THREE.MeshStandardMaterial({color, map, roughness:0.92, metalness:0.02});
      const mesh = new THREE.Mesh(geo,mat);
      mesh.position.set(worldX(c), -0.1, worldZ(r));
      mesh.receiveShadow = true;
      mesh.userData = {c,r,buildable:isBuildable(c,r)};
      mapGroup.add(mesh);
      tileMeshes[key] = mesh;
    }
  }

  DECOR_TILES.forEach(d=>{
    const g = new THREE.Group();
    if (d.kind === 'tree'){
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.13,0.5,8), new THREE.MeshStandardMaterial({color:0x8a5a34, roughness:0.85}));
      trunk.position.y = 0.25; trunk.castShadow = true;
      const leavesOuter = new THREE.Mesh(new THREE.ConeGeometry(0.55,1.15,9), new THREE.MeshStandardMaterial({color:0x3f8f4f, roughness:0.8}));
      leavesOuter.position.y = 0.95; leavesOuter.castShadow = true;
      const leavesInner = new THREE.Mesh(new THREE.ConeGeometry(0.38,0.75,9), new THREE.MeshStandardMaterial({color:0x57ad63, roughness:0.8}));
      leavesInner.position.y = 1.15; leavesInner.castShadow = true;
      g.add(trunk, leavesOuter, leavesInner);
    } else if (d.kind === 'rock'){
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32,0), new THREE.MeshStandardMaterial({color:0x9a9a95, roughness:0.9}));
      rock.position.y = 0.22; rock.rotation.set(0.3,0.4,0.1); rock.castShadow = true;
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14,0), new THREE.MeshStandardMaterial({color:0xacaca6, roughness:0.9}));
      pebble.position.set(0.28,0.1,0.15); pebble.castShadow = true;
      g.add(rock,pebble);
    } else {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.34,10,8), new THREE.MeshStandardMaterial({color:0x4c9a4c, roughness:0.85}));
      bush.position.y = 0.22; bush.castShadow = true;
      g.add(bush);
      for (let i=0;i<3;i++){
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.045,6,6), new THREE.MeshStandardMaterial({color: i%2? 0xffe08a:0xff9fc0, roughness:0.6}));
        const ang = (i/3)*Math.PI*2;
        flower.position.set(Math.cos(ang)*0.28, 0.34, Math.sin(ang)*0.28);
        g.add(flower);
      }
    }
    g.position.set(worldX(d.c), 0, worldZ(d.r));
    mapGroup.add(g);
  });

  for (let c=-1;c<=GRID_W;c++){
    [ -1, GRID_H ].forEach(r=>{
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.5,0.12), new THREE.MeshStandardMaterial({color:0x7a5a3a, roughness:0.8}));
      post.position.set(worldX(c),0.15,worldZ(r));
      post.castShadow = true;
      mapGroup.add(post);
    });
  }

  scene.add(mapGroup);

  selectRing = new THREE.Mesh(
    new THREE.RingGeometry(0.9,1.0,32),
    new THREE.MeshBasicMaterial({color:0xffe08a, transparent:true, opacity:0.9, side:THREE.DoubleSide})
  );
  selectRing.rotation.x = -Math.PI/2;
  selectRing.visible = false;
  scene.add(selectRing);

  placePreviewGroup = new THREE.Group();
  const cellHi = new THREE.Mesh(new THREE.BoxGeometry(TILE*0.9,0.06,TILE*0.9), new THREE.MeshBasicMaterial({color:0x66ff88, transparent:true, opacity:0.55}));
  cellHi.position.y = 0.05;
  const rangeRing = new THREE.Mesh(new THREE.RingGeometry(0,1,48), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.18, side:THREE.DoubleSide}));
  rangeRing.rotation.x = -Math.PI/2;
  rangeRing.position.y = 0.03;
  placePreviewGroup.add(cellHi, rangeRing);
  placePreviewGroup.userData = {cellHi, rangeRing};
  placePreviewGroup.visible = false;
  scene.add(placePreviewGroup);
}
