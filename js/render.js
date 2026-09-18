/* =========================================================================
   render.js — everything that touches the 2D canvas context.
   Static art (grass, the path, decorations, the fence) never changes
   frame-to-frame, so buildStaticBackground() draws it ONCE onto an
   offscreen canvas; every frame we just blit that image, then draw the
   moving stuff (towers, enemies, projectiles, effects) on top of it.
   ========================================================================= */

function lighten(hex, amt){
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const f = (c)=> Math.round(c + (255-c)*amt);
  return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
}
function darken(hex, amt){
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const f = (c)=> Math.round(c * (1-amt));
  return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
}

function buildStaticBackground(){
  const cvs = document.createElement('canvas');
  cvs.width = WORLD_W; cvs.height = WORLD_H;
  const ctx = cvs.getContext('2d');

  // Grass base + soft irregular blotches so it doesn't read as one flat tile.
  ctx.fillStyle = '#6cb254';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let i=0; i<70; i++){
    const x = Math.random()*WORLD_W, y = Math.random()*WORLD_H;
    const r = 20 + Math.random()*40;
    const grad = ctx.createRadialGradient(x,y,0,x,y,r);
    const darker = Math.random() < 0.5;
    grad.addColorStop(0, darker ? 'rgba(58,120,50,0.25)' : 'rgba(150,205,110,0.22)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  for (let i=0; i<160; i++){
    const x = Math.random()*WORLD_W, y = Math.random()*WORLD_H;
    ctx.fillStyle = Math.random()<0.6 ? 'rgba(255,255,255,0.5)' : 'rgba(255,224,138,0.55)';
    ctx.beginPath(); ctx.arc(x, y, 1+Math.random(), 0, Math.PI*2); ctx.fill();
  }

  drawPathVisual(ctx);
  DECOR.forEach(d => drawDecorPiece(ctx, d));
  drawFence(ctx);

  return cvs;
}

function drawPathVisual(ctx){
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  tracePathContext(ctx); ctx.strokeStyle = '#5c4326'; ctx.lineWidth = PATH_WIDTH+8; ctx.stroke();
  tracePathContext(ctx); ctx.strokeStyle = '#c99a5c'; ctx.lineWidth = PATH_WIDTH; ctx.stroke();
  tracePathContext(ctx); ctx.strokeStyle = 'rgba(224,188,132,0.4)'; ctx.lineWidth = PATH_WIDTH*0.45; ctx.stroke();
  // A couple of faint cross-hatches for texture, evenly spaced by distance.
  ctx.strokeStyle = 'rgba(120,80,40,0.25)'; ctx.lineWidth = 2;
  for (let d=20; d<PATH_TOTAL_LEN; d+=34){
    const p = getPointAtDistance(d);
    const nx = Math.cos(p.angle+Math.PI/2), ny = Math.sin(p.angle+Math.PI/2);
    const w = PATH_WIDTH*0.32;
    ctx.beginPath();
    ctx.moveTo(p.x-nx*w, p.y-ny*w);
    ctx.lineTo(p.x+nx*w, p.y+ny*w);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFence(ctx){
  ctx.save();
  const postColor = '#7a5a3a', railColor = '#8a6a48';
  [16, WORLD_H-16].forEach(y=>{
    ctx.strokeStyle = railColor; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0,y-5); ctx.lineTo(WORLD_W,y-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,y+5); ctx.lineTo(WORLD_W,y+5); ctx.stroke();
    for (let x=10; x<=WORLD_W; x+=42){
      ctx.fillStyle = postColor;
      ctx.fillRect(x-3, y-14, 6, 28);
    }
  });
  ctx.restore();
}

function drawDecorPiece(ctx, d){
  ctx.save();
  ctx.translate(d.x, d.y);
  if (d.kind === 'tree'){
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(-4, 2, 8, 14);
    ctx.fillStyle = '#3f8f4f';
    ctx.beginPath(); ctx.arc(0, -6, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#57ad63';
    ctx.beginPath(); ctx.arc(-4, -12, 10, 0, Math.PI*2); ctx.fill();
  } else if (d.kind === 'rock'){
    ctx.fillStyle = '#9a9a95';
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 9, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#b3b3ac';
    ctx.beginPath(); ctx.ellipse(-4, -3, 5, 3.5, 0.4, 0, Math.PI*2); ctx.fill();
  } else if (d.kind === 'bush'){
    ctx.fillStyle = '#4c9a4c';
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI*2); ctx.fill();
    const petals = ['#ffe08a','#ff9fc0','#ffe08a'];
    for (let i=0;i<3;i++){
      ctx.fillStyle = petals[i];
      const ang = (i/3)*Math.PI*2;
      ctx.beginPath(); ctx.arc(Math.cos(ang)*9, Math.sin(ang)*9, 2.2, 0, Math.PI*2); ctx.fill();
    }
  } else if (d.kind === 'stump'){
    ctx.fillStyle = '#9a6f42';
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#c8a06a';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#d1585a';
    ctx.beginPath(); ctx.arc(5, -6, 4, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#e8e0cf'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(5,-6); ctx.lineTo(5,-1); ctx.stroke();
  } else if (d.kind === 'flowerpatch'){
    ctx.fillStyle = '#4c9a4c';
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill();
    const petalColors = ['#ffe08a','#ff9fc0','#ffffff','#c9a3ff'];
    for (let i=0;i<7;i++){
      ctx.fillStyle = petalColors[i%4];
      const ang = Math.random()*Math.PI*2, rad = Math.random()*10;
      ctx.beginPath(); ctx.arc(Math.cos(ang)*rad, Math.sin(ang)*rad, 2, 0, Math.PI*2); ctx.fill();
    }
  } else if (d.kind === 'pond'){
    ctx.fillStyle = '#b7ac96';
    ctx.beginPath(); ctx.arc(0, 0, d.radius+4, 0, Math.PI*2); ctx.fill();
    const grad = ctx.createRadialGradient(-6,-6,2,0,0,d.radius);
    grad.addColorStop(0, '#8fd6e8'); grad.addColorStop(1, '#2f7f9e');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, d.radius, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#3f8f4f';
    ctx.beginPath(); ctx.ellipse(8, 6, 7, 4, 0.3, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

/* ------------------------- dynamic, per-frame draws ------------------------- */
function drawCritterBase(ctx, colorHex, bodyR){
  ctx.fillStyle = colorHex;
  ctx.beginPath(); ctx.ellipse(0, 2, bodyR, bodyR*0.86, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = lighten(colorHex, 0.55);
  ctx.beginPath(); ctx.ellipse(bodyR*0.15, 4, bodyR*0.55, bodyR*0.42, 0, 0, Math.PI*2); ctx.fill();

  const headR = bodyR*0.62;
  const hx = bodyR*0.55, hy = -bodyR*0.1;
  ctx.fillStyle = colorHex;
  ctx.beginPath(); ctx.arc(hx, hy, headR, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = lighten(colorHex, 0.5);
  ctx.beginPath(); ctx.ellipse(hx+headR*0.35, hy+headR*0.15, headR*0.42, headR*0.32, 0, 0, Math.PI*2); ctx.fill();
  // nose
  ctx.fillStyle = darken(colorHex, 0.6);
  ctx.beginPath(); ctx.arc(hx+headR*0.85, hy+headR*0.12, headR*0.14, 0, Math.PI*2); ctx.fill();
  // eye
  ctx.fillStyle = '#211a14';
  ctx.beginPath(); ctx.arc(hx+headR*0.3, hy-headR*0.15, headR*0.16, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.arc(hx+headR*0.35, hy-headR*0.22, headR*0.06, 0, Math.PI*2); ctx.fill();
  return { hx, hy, headR };
}

function drawEarTriangle(ctx, x, y, size, angle, colorHex){
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.moveTo(-size*0.5, 0); ctx.lineTo(size*0.5, 0); ctx.lineTo(0, -size); ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTower(ctx, tower){
  ctx.save();
  ctx.translate(tower.x, tower.y);
  const bump = 1 + tower.attackPulse*0.16;
  ctx.scale(bump, bump);
  const bodyR = 15;
  const { hx, hy, headR } = drawCritterBase(ctx, tower.def.color, bodyR);
  const dark = darken(tower.def.color, 0.25);
  drawEarTriangle(ctx, hx-headR*0.5, hy-headR*0.55, headR*0.7, -0.3, tower.def.color);
  drawEarTriangle(ctx, hx+headR*0.35, hy-headR*0.85, headR*0.7, 0.3, tower.def.color);

  const icon = tower.def.icon;
  if (icon === '✨'){
    ctx.fillStyle = '#4b2e83';
    ctx.beginPath(); ctx.moveTo(hx-6,hy-headR*0.7); ctx.lineTo(hx+6,hy-headR*0.7); ctx.lineTo(hx,hy-headR*1.5); ctx.closePath(); ctx.fill();
  } else if (icon === '😾'){
    ctx.strokeStyle = dark; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(hx+headR*0.08,hy-headR*0.42); ctx.lineTo(hx+headR*0.5,hy-headR*0.5); ctx.stroke();
  } else if (icon === '🤖'){
    ctx.fillStyle = '#0ef0e0';
    ctx.fillRect(hx-headR*0.5, hy-headR*0.05, headR*1.1, headR*0.22);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(hx,hy-headR*0.9); ctx.lineTo(hx,hy-headR*1.35); ctx.stroke();
    ctx.fillStyle = '#ff5050';
    ctx.beginPath(); ctx.arc(hx,hy-headR*1.4,2.6,0,Math.PI*2); ctx.fill();
  } else if (icon === '🐾'){
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(hx-headR*0.7, hy+headR*0.25, headR*1.4, headR*0.22);
  } else if (icon === '🎯'){
    ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(hx+headR*0.3,hy-headR*0.4); ctx.lineTo(hx+headR*1.3,hy-headR*0.9); ctx.stroke();
  } else if (icon === '❄️'){
    ctx.fillStyle = '#aee9f7';
    ctx.beginPath(); ctx.moveTo(hx-5,hy-headR*0.75); ctx.lineTo(hx+5,hy-headR*0.75); ctx.lineTo(hx,hy-headR*1.5); ctx.closePath(); ctx.fill();
  } else if (icon === '🔥'){
    ctx.fillStyle = '#ff8c2b';
    ctx.beginPath(); ctx.moveTo(hx-4,hy-headR*0.7); ctx.lineTo(hx+4,hy-headR*0.7); ctx.lineTo(hx,hy-headR*1.45); ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  if (tower.level > 1){
    ctx.save();
    ctx.translate(tower.x, tower.y - bodyR - 14);
    for (let i=0;i<tower.level-1;i++){
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc((i-(tower.level-2)/2)*8, 0, 2.6, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

function drawEnemy(ctx, enemy){
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.angle);
  const scale = enemy.def.scale || 1;
  ctx.scale(scale, scale);
  const bodyR = 13;
  const { hx, hy, headR } = drawCritterBase(ctx, enemy.def.color, bodyR);
  const dark = darken(enemy.def.color, 0.3);

  if (enemy.def.boss){
    drawEarTriangle(ctx, hx-headR*0.5, hy-headR*0.6, headR*0.85, -0.35, dark);
    drawEarTriangle(ctx, hx+headR*0.4, hy-headR*0.95, headR*0.85, 0.35, dark);
    ctx.fillStyle = '#ffd700';
    for (let i=-1;i<=1;i++){
      ctx.beginPath(); ctx.arc(hx+i*5, hy-headR*1.05, 2.6, 0, Math.PI*2); ctx.fill();
    }
  } else {
    ctx.save(); ctx.translate(hx-headR*0.55, hy-headR*0.1); ctx.rotate(0.5);
    ctx.fillStyle = dark; ctx.fillRect(-2, -6, 4, 10); ctx.restore();
    ctx.save(); ctx.translate(hx+headR*0.55, hy-headR*0.1); ctx.rotate(-0.5);
    ctx.fillStyle = dark; ctx.fillRect(-2, -6, 4, 10); ctx.restore();
  }
  if (enemy.def.perky){
    ctx.fillStyle = '#ff8fa3';
    ctx.beginPath(); ctx.ellipse(hx+headR*1.05, hy+headR*0.35, 4, 2.3, 0.3, 0, Math.PI*2); ctx.fill();
  }
  if (enemy.def.armor){
    ctx.fillStyle = '#b0b8c4';
    ctx.fillRect(-bodyR*0.55, -bodyR*0.35, bodyR*0.9, bodyR*0.7);
  }
  ctx.restore();

  // HP bar, drawn axis-aligned (not rotated with the body) so it stays readable
  if (enemy.hp < enemy.maxHp){
    const w = 24, h = 3.5;
    ctx.save();
    ctx.translate(enemy.x, enemy.y - bodyR*scale - 9);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-w/2, 0, w, h);
    ctx.fillStyle = enemy.hp/enemy.maxHp > 0.4 ? '#5cd65c' : '#e05252';
    ctx.fillRect(-w/2, 0, w*Math.max(0,enemy.hp/enemy.maxHp), h);
    ctx.restore();
  }
}

function drawProjectile(ctx, p){
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawEffect(ctx, fx){
  ctx.save();
  ctx.globalAlpha = Math.max(0, fx.opacity);
  ctx.fillStyle = fx.color;
  ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.radius, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawRangeCircle(ctx, x, y, r, ok){
  ctx.save();
  ctx.strokeStyle = ok ? 'rgba(124,252,154,0.9)' : 'rgba(255,102,102,0.9)';
  ctx.fillStyle = ok ? 'rgba(124,252,154,0.12)' : 'rgba(255,102,102,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
