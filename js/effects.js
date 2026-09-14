/* =========================================================================
   effects.js — poof particles, floating damage numbers, toast messages
   ========================================================================= */

function spawnPoof(pos, color, size){
  const fx = {
    mesh: new THREE.Mesh(new THREE.SphereGeometry(size||0.2,8,8), new THREE.MeshBasicMaterial({color:color||0xffe08a, transparent:true, opacity:0.7})),
    t:0, life:0.35,
  };
  fx.mesh.position.copy(pos); fx.mesh.position.y += 0.3;
  scene.add(fx.mesh);
  state.effects.push(fx);
}

function spawnFloatingText(pos, text, color){
  const div = document.createElement('div');
  div.className = 'floatText';
  div.textContent = text;
  div.style.color = color || '#fff';
  document.getElementById('floatLayer').appendChild(div);
  state.texts.push({div, pos: pos.clone(), t:0, life:0.9});
}

function clearFloatingTexts(){
  state.texts.forEach(ft=>ft.div.remove());
  state.texts = [];
}

function flashMessage(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

function updateEffects(dt){
  state.effects.forEach(fx=>{
    fx.t += dt;
    const k = fx.t/fx.life;
    fx.mesh.scale.setScalar(1+k*1.5);
    fx.mesh.material.opacity = 0.7*(1-k);
    if (fx.t>=fx.life){ scene.remove(fx.mesh); fx.dead=true; }
  });
  state.effects = state.effects.filter(fx=>!fx.dead);
}

function updateFloatingTexts(dt){
  state.texts.forEach(ft=>{
    ft.t += dt;
    const p = ft.pos.clone(); p.y += 1.0 + ft.t*0.8;
    const proj = p.clone().project(camera);
    const x = (proj.x*0.5+0.5)*window.innerWidth;
    const y = (1-(proj.y*0.5+0.5))*window.innerHeight;
    ft.div.style.transform = `translate(${x}px, ${y}px)`;
    ft.div.style.opacity = Math.max(0, 1-ft.t/ft.life);
    if (ft.t>=ft.life){ ft.div.remove(); ft.dead=true; }
  });
  state.texts = state.texts.filter(ft=>!ft.dead);
}
