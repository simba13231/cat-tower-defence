/* =========================================================================
   renderer.js — WebGL renderer, camera, lighting rig, sky & drifting clouds
   ========================================================================= */

let renderer, scene, camera, raycaster, groundPlane;
const clock = new THREE.Clock();
let clouds = [];

function initScene(){
  const canvas = document.getElementById('gameCanvas');
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputEncoding' in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  scene = new THREE.Scene();
  scene.background = makeSkyTexture();
  scene.fog = new THREE.Fog(0xbfe9ec, 22, 40);

  const viewSize = 11;
  camera = new THREE.OrthographicCamera(-viewSize,viewSize,viewSize,-viewSize,0.1,100);
  camera.position.set(14, 15, 14);
  camera.lookAt(0,0,0);

  // Warm key light (sun) casting the main shadows.
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.05);
  sun.position.set(9, 15, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left = -13; sun.shadow.camera.right = 13;
  sun.shadow.camera.top = 13; sun.shadow.camera.bottom = -13;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0015;
  scene.add(sun);
  scene.add(sun.target);

  // Cool sky/ground bounce light for soft ambient fill.
  const hemi = new THREE.HemisphereLight(0xeaf6ff, 0x6b8f5a, 0.75);
  scene.add(hemi);

  // Gentle rim/fill light from the opposite side so shadowed faces still read.
  const fill = new THREE.DirectionalLight(0xcfe8ff, 0.28);
  fill.position.set(-8, 6, -8);
  scene.add(fill);

  raycaster = new THREE.Raycaster();

  groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(200,200),
    new THREE.MeshBasicMaterial({visible:false})
  );
  groundPlane.rotation.x = -Math.PI/2;
  scene.add(groundPlane);

  buildClouds();

  window.addEventListener('resize', onResize);
  onResize();
}

function buildClouds(){
  const cloudTex = makeCloudTexture();
  const mat = new THREE.SpriteMaterial({map:cloudTex, transparent:true, depthWrite:false, opacity:0.85});
  for (let i=0;i<6;i++){
    const s = new THREE.Sprite(mat.clone());
    const scale = 3 + Math.random()*3;
    s.scale.set(scale*1.8, scale, 1);
    s.position.set((Math.random()-0.5)*40, 10+Math.random()*4, -18-Math.random()*10);
    scene.add(s);
    clouds.push({sprite:s, speed:0.15+Math.random()*0.25});
  }
}

function updateClouds(dt){
  clouds.forEach(c=>{
    c.sprite.position.x += c.speed*dt;
    if (c.sprite.position.x > 40) c.sprite.position.x = -40;
  });
}

function onResize(){
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w,h,false);
  const aspect = w/h;
  const viewSize = 11;
  camera.left = -viewSize*aspect; camera.right = viewSize*aspect;
  camera.top = viewSize; camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}
