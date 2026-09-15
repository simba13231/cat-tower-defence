/* =========================================================================
   main.js — PlayCanvas app bootstrap: camera, lighting, and the map build.
   This is the PlayCanvas equivalent of the old renderer.js + map.js
   combined. mapData.js is unchanged from the Three.js version on purpose.
   ========================================================================= */

const canvas = document.getElementById('app-canvas');
const app = new pc.Application(canvas, {
  graphicsDeviceOptions: { antialias: true }
});
app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
window.addEventListener('resize', () => app.resizeCanvas());
app.start();

// Soft green-blue ambient so shadowed faces don't go pure black — the
// PlayCanvas equivalent of the old Three.js HemisphereLight fill.
app.scene.ambientLight = new pc.Color(0.55, 0.62, 0.5);

function hexColor(hex){
  return new pc.Color(((hex>>16)&255)/255, ((hex>>8)&255)/255, (hex&255)/255);
}

function boxEntity(name, sx, sy, sz, color, opts){
  opts = opts || {};
  const e = new pc.Entity(name);
  e.addComponent('model', {type:'box', castShadows: opts.castShadows !== false, receiveShadows: opts.receiveShadows !== false});
  e.setLocalScale(sx, sy, sz);
  const mat = new pc.StandardMaterial();
  mat.diffuse = color;
  if (opts.opacity !== undefined){ mat.opacity = opts.opacity; mat.blendType = pc.BLEND_NORMAL; }
  mat.update();
  e.model.material = mat;
  return e;
}

function coneEntity(name, radius, height, color){
  const e = new pc.Entity(name);
  e.addComponent('model', {type:'cone'});
  e.setLocalScale(radius*2, height, radius*2);
  const mat = new pc.StandardMaterial();
  mat.diffuse = color; mat.update();
  e.model.material = mat;
  return e;
}

function cylinderEntity(name, radius, height, color){
  const e = new pc.Entity(name);
  e.addComponent('model', {type:'cylinder'});
  e.setLocalScale(radius*2, height, radius*2);
  const mat = new pc.StandardMaterial();
  mat.diffuse = color; mat.update();
  e.model.material = mat;
  return e;
}

function sphereEntity(name, radius, color){
  const e = new pc.Entity(name);
  e.addComponent('model', {type:'sphere'});
  e.setLocalScale(radius*2, radius*2, radius*2);
  const mat = new pc.StandardMaterial();
  mat.diffuse = color; mat.update();
  e.model.material = mat;
  return e;
}

// ---- Camera: fixed isometric-style orthographic view, same angle as the
// old Three.js OrthographicCamera(14,15,14) looking at the origin. ----
const camera = new pc.Entity('camera');
camera.addComponent('camera', {
  projection: pc.PROJECTION_ORTHOGRAPHIC,
  orthoHeight: 11,
  clearColor: new pc.Color(0.42, 0.78, 0.93),
  farClip: 100
});
app.root.addChild(camera);
camera.setPosition(14, 15, 14);
camera.lookAt(0, 0, 0);

// ---- Lighting: warm directional "sun" casting shadows, plus a cool dim
// fill light from the opposite side. ----
const sun = new pc.Entity('sun');
sun.addComponent('light', {
  type: 'directional',
  color: new pc.Color(1, 0.94, 0.82),
  intensity: 1.15,
  castShadows: true,
  shadowResolution: 2048,
  shadowDistance: 40,
  shadowBias: 0.02,
  normalOffsetBias: 0.05
});
sun.setPosition(9, 15, 7);
sun.lookAt(0, 0, 0);
app.root.addChild(sun);

const fill = new pc.Entity('fill');
fill.addComponent('light', {
  type: 'directional',
  color: new pc.Color(0.81, 0.91, 1),
  intensity: 0.35
});
fill.setPosition(-8, 6, -8);
fill.lookAt(0, 0, 0);
app.root.addChild(fill);

// ---- Map build: solid soil base, grid tiles, decorations, border fence.
// Ported tile-for-tile from the Three.js buildMap(), just using PlayCanvas
// primitive entities instead of THREE.Mesh. ----
const mapRoot = new pc.Entity('mapRoot');
app.root.addChild(mapRoot);

const soil = boxEntity('soil', (GRID_W+2)*TILE, 0.08, (GRID_H+2)*TILE, hexColor(0x53412a));
soil.setPosition(0, -0.24, 0);
mapRoot.addChild(soil);

const grassShades = [0xffffff, 0xe9f6df, 0xd8ecc9].map(hexColor); // note: applied as flat tint per-tile, textures can come later
const tileEntities = {};

for (let c=0; c<GRID_W; c++){
  for (let r=0; r<GRID_H; r++){
    const key = c+','+r;
    const onPath = PATH_TILES.has(key);
    const onDecor = DECOR_SET.has(key);
    let color;
    if (onPath) color = hexColor(0xd9b06a);
    else if (onDecor) color = hexColor(0x5f9b52);
    else color = grassShades[(c*7+r*13) % grassShades.length];

    const tile = boxEntity('tile_'+key, TILE*0.96, 0.2, TILE*0.96, color);
    tile.setPosition(worldX(c), -0.1, worldZ(r));
    tile.tags.add(onPath ? 'path' : (isBuildable(c,r) ? 'buildable' : 'blocked'));
    tile.occupied = false;
    mapRoot.addChild(tile);
    tileEntities[key] = tile;
  }
}

// Low curb pebbles where path meets grass.
for (let c=0; c<GRID_W; c++){
  for (let r=0; r<GRID_H; r++){
    const key = c+','+r;
    if (!PATH_TILES.has(key)) continue;
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dc,dr])=>{
      const nc = c+dc, nr = r+dr, nkey = nc+','+nr;
      if (nc<0||nr<0||nc>=GRID_W||nr>=GRID_H) return;
      if (PATH_TILES.has(nkey)) return;
      const along = dc===0 ? 1 : 0, perp = dc===0 ? 0 : 1;
      for (let i=-1; i<=1; i++){
        const s = 0.11 + Math.random()*0.06;
        const pebble = sphereEntity('pebble', s/2, hexColor(0xb7ac96));
        const ox = worldX(c) + dc*TILE*0.46 + along*i*TILE*0.3;
        const oz = worldZ(r) + dr*TILE*0.46 + perp*i*TILE*0.3;
        pebble.setPosition(ox, 0.02, oz);
        mapRoot.addChild(pebble);
      }
    });
  }
}

// Decorations, per kind — simplified primitive versions of the Three.js
// tree/rock/bush/pond/stump/flowerpatch groups.
DECOR_TILES.forEach(d=>{
  const g = new pc.Entity('decor_'+d.kind);
  g.setPosition(worldX(d.c), 0, worldZ(d.r));
  mapRoot.addChild(g);

  if (d.kind === 'tree'){
    const trunk = cylinderEntity('trunk', 0.11, 0.5, hexColor(0x8a5a34));
    trunk.setLocalPosition(0, 0.25, 0);
    const leaves = coneEntity('leaves', 0.55, 1.15, hexColor(0x3f8f4f));
    leaves.setLocalPosition(0, 0.95, 0);
    const leaves2 = coneEntity('leaves2', 0.38, 0.75, hexColor(0x57ad63));
    leaves2.setLocalPosition(0, 1.15, 0);
    g.addChild(trunk); g.addChild(leaves); g.addChild(leaves2);
  } else if (d.kind === 'rock'){
    const rock = sphereEntity('rock', 0.28, hexColor(0x9a9a95));
    rock.setLocalPosition(0, 0.22, 0);
    const pebble = sphereEntity('rockPebble', 0.12, hexColor(0xacaca6));
    pebble.setLocalPosition(0.28, 0.1, 0.15);
    g.addChild(rock); g.addChild(pebble);
  } else if (d.kind === 'bush'){
    const bush = sphereEntity('bush', 0.34, hexColor(0x4c9a4c));
    bush.setLocalPosition(0, 0.22, 0);
    g.addChild(bush);
    for (let i=0;i<3;i++){
      const flower = sphereEntity('flower', 0.045, hexColor(i%2 ? 0xffe08a : 0xff9fc0));
      const ang = (i/3)*Math.PI*2;
      flower.setLocalPosition(Math.cos(ang)*0.28, 0.34, Math.sin(ang)*0.28);
      g.addChild(flower);
    }
  } else if (d.kind === 'stump'){
    const trunk = cylinderEntity('stumpTrunk', 0.17, 0.22, hexColor(0x9a6f42));
    trunk.setLocalPosition(0, 0.11, 0);
    const cap = sphereEntity('cap', 0.09, hexColor(0xd1585a));
    cap.setLocalPosition(0.14, 0.24, 0.05);
    g.addChild(trunk); g.addChild(cap);
  } else if (d.kind === 'flowerpatch'){
    const base = cylinderEntity('patchBase', 0.33, 0.05, hexColor(0x4c9a4c));
    base.setLocalPosition(0, 0.03, 0);
    g.addChild(base);
    const petalColors = [0xffe08a,0xff9fc0,0xffffff,0xc9a3ff];
    for (let i=0;i<7;i++){
      const flower = sphereEntity('petal', 0.05, hexColor(petalColors[i%4]));
      const ang = Math.random()*Math.PI*2, rad = Math.random()*0.24;
      flower.setLocalPosition(Math.cos(ang)*rad, 0.09, Math.sin(ang)*rad);
      g.addChild(flower);
    }
  } else if (d.kind === 'pond'){
    const water = cylinderEntity('water', 0.51, 0.04, hexColor(0x6bc2dd));
    water.model.material.opacity = 0.92;
    water.model.material.blendType = pc.BLEND_NORMAL;
    water.model.material.update();
    water.setLocalPosition(0, 0.02, 0);
    g.addChild(water);
    for (let i=0;i<5;i++){
      const rim = sphereEntity('rim', 0.06, hexColor(0xb7ac96));
      const ang = (i/5)*Math.PI*2 + Math.random()*0.3;
      rim.setLocalPosition(Math.cos(ang)*0.53, 0.03, Math.sin(ang)*0.53);
      g.addChild(rim);
    }
  }
});

// Border fence — posts along the north/south edges connected by rails.
[-1, GRID_H].forEach(r=>{
  let prevX = null;
  for (let c=-1; c<=GRID_W; c++){
    const post = boxEntity('post', 0.12, 0.5, 0.12, hexColor(0x7a5a3a));
    const x = worldX(c);
    post.setPosition(x, 0.15, worldZ(r));
    mapRoot.addChild(post);
    if (prevX !== null){
      [0.24, 0.06].forEach(y=>{
        const rail = boxEntity('rail', x-prevX, 0.05, 0.05, hexColor(0x8a6a48));
        rail.setPosition((x+prevX)/2, y, worldZ(r));
        mapRoot.addChild(rail);
      });
    }
    prevX = x;
  }
});
