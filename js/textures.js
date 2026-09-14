/* =========================================================================
   textures.js — procedural canvas textures (no external image assets needed)
   All functions are lazy (called during setup), never at parse time.
   ========================================================================= */

function makeGrassTexture(){
  const size = 128;
  const cvs = document.createElement('canvas'); cvs.width = size; cvs.height = size;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#6cb254'; ctx.fillRect(0,0,size,size);
  for (let i=0;i<420;i++){
    const x = Math.random()*size, y = Math.random()*size;
    const shade = Math.random();
    ctx.strokeStyle = shade<0.5 ? 'rgba(70,140,60,0.5)' : 'rgba(150,210,110,0.45)';
    ctx.lineWidth = 1 + Math.random();
    const len = 2 + Math.random()*4;
    const ang = Math.random()*Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+Math.cos(ang)*len, y+Math.sin(ang)*len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1,1);
  return tex;
}

function makeDirtTexture(){
  const size = 128;
  const cvs = document.createElement('canvas'); cvs.width = size; cvs.height = size;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#c99a5c'; ctx.fillRect(0,0,size,size);
  for (let i=0;i<300;i++){
    const x = Math.random()*size, y = Math.random()*size;
    const r = 1+Math.random()*2.4;
    ctx.fillStyle = Math.random()<0.5 ? 'rgba(150,105,55,0.35)' : 'rgba(230,190,130,0.35)';
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Soft neutral-gray speckle used as a subtle "fur" modulation map — the
// material's own color still supplies the hue, this just breaks up flatness.
function makeFurTexture(){
  const size = 64;
  const cvs = document.createElement('canvas'); cvs.width = size; cvs.height = size;
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#c8c8c8'; ctx.fillRect(0,0,size,size);
  for (let i=0;i<900;i++){
    const x = Math.random()*size, y = Math.random()*size;
    const v = 170 + Math.floor(Math.random()*85);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x,y,1,1);
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2,2);
  return tex;
}

function makeCloudTexture(){
  const size = 128;
  const cvs = document.createElement('canvas'); cvs.width = size; cvs.height = size;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createRadialGradient(size/2,size/2,4,size/2,size/2,size/2);
  grad.addColorStop(0,'rgba(255,255,255,0.95)');
  grad.addColorStop(0.6,'rgba(255,255,255,0.55)');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = grad; ctx.fillRect(0,0,size,size);
  return new THREE.CanvasTexture(cvs);
}

function makeSkyTexture(){
  const w = 8, h = 128;
  const cvs = document.createElement('canvas'); cvs.width = w; cvs.height = h;
  const ctx = cvs.getContext('2d');
  const grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'#6bc6e8');
  grad.addColorStop(0.55,'#a9e2ee');
  grad.addColorStop(1,'#eaf8ea');
  ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
  const tex = new THREE.CanvasTexture(cvs);
  return tex;
}
