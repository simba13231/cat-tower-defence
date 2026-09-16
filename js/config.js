/* =========================================================================
   config.js — pure data: tower & enemy stats for the playable core.
   A trimmed-down subset of the original towerData.js/enemyData.js (no
   per-level upgrades yet) — enough to have real placement, targeting,
   and waves working. More towers/enemies/upgrades can be layered back in
   the same shape as the original once this loop feels good.
   ========================================================================= */

const TOWER_DEFS = {
  scout:  { name:'Scout Cat',  icon:'🐾', color:0xf2a65a, cost:50,  range:3.0, damage:9,  rate:0.55 },
  angry:  { name:'Angry Cat',  icon:'😾', color:0xe05252, cost:70,  range:1.9, damage:30, rate:1.4  },
  wizard: { name:'Wizard Cat', icon:'✨', color:0x9b59b6, cost:100, range:2.8, damage:14, rate:1.3, splash:1.2 },
  robot:  { name:'Robot Cat',  icon:'🤖', color:0x4fd1c5, cost:120, range:3.2, damage:10, rate:0.5  },
};
const TOWER_ORDER = ['scout','angry','wizard','robot'];

const ENEMY_DEFS = {
  puppy:   { name:'Puppy',    hp:30,  speed:1.6,  reward:5,   color:0xe8c39e, scale:0.85 },
  fastdog: { name:'Fast Dog', hp:22,  speed:2.9,  reward:6,   color:0xf4d03f, scale:0.85 },
  bulldog: { name:'Bulldog',  hp:150, speed:0.85, reward:15,  color:0x7f8c8d, scale:1.15 },
  dogking: { name:'Dog King', hp:450, speed:0.9,  reward:220, color:0x8e44ad, scale:1.6, boss:true },
};

// Wave n's spawn list — grows in size and toughness, with a boss every 5th
// wave. Deliberately simple; swap for the original waves.js pacing later.
function buildWave(n){
  const list = [];
  const count = 5 + n*2;
  for (let i=0;i<count;i++){
    let pool = ['puppy'];
    if (n>=2) pool.push('fastdog');
    if (n>=4) pool.push('bulldog');
    list.push(pool[Math.floor(Math.random()*pool.length)]);
  }
  if (n % 5 === 0) list.push('dogking');
  return list;
}
