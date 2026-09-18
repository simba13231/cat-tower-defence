/* =========================================================================
   config.js — pure data: tower & enemy stats. Identical in spirit to the
   PlayCanvas version's config.js — this file never cared which renderer
   was drawing it, so it carries over almost untouched.
   ========================================================================= */

const START_COINS = 220;
const BASE_LIVES = 20;

const TOWER_DEFS = {
  scout:  { name:'Scout Cat',  icon:'🐾', color:'#f2a65a', cost:50,  range:95,  damage:9,  rate:0.55 },
  angry:  { name:'Angry Cat',  icon:'😾', color:'#e05252', cost:70,  range:62,  damage:30, rate:1.4  },
  wizard: { name:'Wizard Cat', icon:'✨', color:'#9b59b6', cost:100, range:88,  damage:14, rate:1.3, splash:38 },
  robot:  { name:'Robot Cat',  icon:'🤖', color:'#4fd1c5', cost:120, range:100, damage:10, rate:0.5  },
  sniper: { name:'Sniper Cat', icon:'🎯', color:'#34495e', cost:140, range:160, damage:55, rate:2.2  },
  ice:    { name:'Ice Cat',    icon:'❄️', color:'#5dade2', cost:90,  range:70,  damage:4,  rate:0.7,
            effect:{ type:'slow', mult:0.45, dur:1.5 } },
  fire:   { name:'Fire Cat',   icon:'🔥', color:'#e67e22', cost:95,  range:76,  damage:6,  rate:0.9,
            effect:{ type:'burn', dps:9, dur:3 } },
};
const TOWER_ORDER = ['scout','angry','wizard','robot','sniper','ice','fire'];

const ENEMY_DEFS = {
  puppy:    { name:'Puppy',     hp:30,  speed:52,  reward:5,   color:'#e8c39e', scale:0.85, perky:true },
  fastdog:  { name:'Fast Dog',  hp:22,  speed:96,  reward:6,   color:'#f4d03f', scale:0.85, perky:true },
  bulldog:  { name:'Bulldog',   hp:150, speed:28,  reward:15,  color:'#7f8c8d', scale:1.15 },
  shieldog: { name:'Shieldog',  hp:60,  speed:40,  reward:14,  color:'#8e9aab', scale:1.0,  armor:4 },
  puppack:  { name:'Pup Pack',  hp:70,  speed:43,  reward:8,   color:'#b08968', scale:1.0,
              splitsInto:'puplet', splitCount:2 },
  puplet:   { name:'Puplet',    hp:15,  speed:60,  reward:3,   color:'#c9a688', scale:0.6 },
  regenrex: { name:'Regen Rex', hp:100, speed:36,  reward:12,  color:'#6a8f5c', scale:1.05, regen:3 },
  dogking:  { name:'Dog King',  hp:450, speed:30,  reward:220, color:'#8e44ad', scale:1.6,  boss:true },
};

// Wave n's spawn list — same shape as before: grows in size and toughness,
// new types unlock on a schedule, boss every 5th wave. 'puplet' stays out
// of the pool since it only ever appears via splitting.
function buildWave(n){
  const list = [];
  const count = 5 + n*2;
  for (let i=0;i<count;i++){
    let pool = ['puppy'];
    if (n>=2) pool.push('fastdog');
    if (n>=3) pool.push('shieldog');
    if (n>=4) pool.push('bulldog');
    if (n>=5) pool.push('puppack');
    if (n>=6) pool.push('regenrex');
    list.push(pool[Math.floor(Math.random()*pool.length)]);
  }
  if (n % 5 === 0) list.push('dogking');
  return list;
}
