/* =========================================================================
   shop.js — the bottom cat-shopping tray and the tower info/upgrade panel
   ========================================================================= */

function buildShopUI(){
  const tray = document.getElementById('shopTray');
  tray.innerHTML = '';
  TOWER_ORDER.forEach(type=>{
    const def = TOWER_DEFS[type];
    const btn = document.createElement('button');
    btn.className = 'shopBtn'; btn.dataset.type = type;
    btn.innerHTML = `<span class="shopIcon" style="background:${hexToCss(def.color)}">${def.icon}</span>
      <span class="shopName">${def.name}</span><span class="shopCost">${def.cost}c</span>`;
    btn.title = def.tagline;
    btn.addEventListener('click', ()=>{
      Audio2.click();
      if (state.buildType===type){ state.buildType=null; placePreviewGroup.visible=false; }
      else { state.buildType = type; closeTowerPanel(); selectRing.visible=false; state.selectedTower=null; }
      refreshShopSelection();
    });
    tray.appendChild(btn);
  });
}

function refreshShopSelection(){
  document.querySelectorAll('.shopBtn').forEach(b=> b.classList.toggle('selected', b.dataset.type===state.buildType));
}

function renderTowerPanel(tower){
  const panel = document.getElementById('towerPanel');
  panel.style.display = 'block';
  const def = TOWER_DEFS[tower.type];
  const lvl = tower.level;
  const nextLvl = def.levels[lvl+1];
  const stats = towerStats(tower);
  panel.innerHTML = `
    <div class="tpHeader"><span class="tpIcon" style="background:${hexToCss(def.color)}">${def.icon}</span>
      <div><div class="tpName">${def.name}</div><div class="tpTag">${def.tagline}</div></div></div>
    <div class="tpStats">DMG ${Math.round(stats.damage)} &nbsp;•&nbsp; Range ${stats.range.toFixed(1)} &nbsp;•&nbsp; Rate ${stats.rate.toFixed(2)}s</div>
    <div class="tpLevel">Level ${lvl+1} / ${def.levels.length}: ${def.levels[lvl].label}</div>
    <div class="tpRow">
      <button id="tpUpgrade" ${nextLvl?'':'disabled'}>${nextLvl? ('Upgrade ('+nextLvl.cost+'c)') : 'Max Level'}</button>
      <button id="tpSell">Sell (+${Math.floor(tower.invested*0.6)}c)</button>
    </div>
    <div class="tpTargetLabel">Targeting:</div>
    <div class="tpTargets">
      ${['first','last','closest','strongest','weakest'].map(m=>`<button class="tmBtn ${tower.targetMode===m?'active':''}" data-mode="${m}">${m}</button>`).join('')}
    </div>
  `;
  panel.querySelector('#tpUpgrade').addEventListener('click', ()=>{ upgradeTower(tower); });
  panel.querySelector('#tpSell').addEventListener('click', ()=>{ sellTower(tower); });
  panel.querySelectorAll('.tmBtn').forEach(b=> b.addEventListener('click', ()=>{ tower.targetMode=b.dataset.mode; renderTowerPanel(tower); }));
}

function closeTowerPanel(){ document.getElementById('towerPanel').style.display='none'; }
