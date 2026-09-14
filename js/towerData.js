/* =========================================================================
   towerData.js — pure data: every cat tower's stats & upgrade path
   ========================================================================= */

const TOWER_DEFS = {
  scout: {
    name:'Scout Cat', icon:'🐾', tagline:'Alert and energetic.', color:0xf2a65a,
    cost:50, range:3.0, damage:9, rate:0.55, projSpeed:16,
    levels:[
      {cost:0, label:'Balanced attack', mods:{}},
      {cost:60, label:'Rapid Paws — faster attacks', mods:{rate:0.75}},
      {cost:95, label:"Hunter's Focus — more damage & crits", mods:{damage:1.4, crit:0.18}},
    ],
  },
  angry: {
    name:'Angry Cat', icon:'😾', tagline:'HE HAS HAD ENOUGH.', color:0xe05252,
    cost:70, range:1.9, damage:30, rate:1.4, projSpeed:15,
    levels:[
      {cost:0, label:'Heavy swipe', mods:{}},
      {cost:90, label:'Bigger claws — more damage', mods:{damage:1.3}},
      {cost:140, label:'RAGE — every 4th hit is devastating', mods:{damage:1.15, rage:true}},
    ],
  },
  assassin: {
    name:'Assassin Cat', icon:'🗡️', tagline:'One strike is enough.', color:0x6c5ce7,
    cost:95, range:2.6, damage:20, rate:1.1, projSpeed:22, crit:0.25,
    levels:[
      {cost:0, label:'Precise strikes', mods:{}},
      {cost:110, label:'Sharper focus — higher crit chance', mods:{crit:0.35}},
      {cost:160, label:'EXECUTE — finishes weakened dogs', mods:{execute:true, damage:1.15}},
    ],
  },
  yarn: {
    name:'Yarn Cat', icon:'🧶', tagline:"Definitely not just playing.", color:0xf5d16a,
    cost:60, range:2.4, damage:4, rate:0.9, projSpeed:13, slow:0.3, slowTime:2,
    levels:[
      {cost:0, label:'Sticky yarn', mods:{}},
      {cost:70, label:'Thicker yarn — stronger slow', mods:{slow:0.45, slowTime:3}},
      {cost:110, label:'TANGLE — chance to fully bind a dog', mods:{tangle:0.18}},
    ],
  },
  wizard: {
    name:'Wizard Cat', icon:'✨', tagline:'Meow-gic incarnate.', color:0x9b59b6,
    cost:100, range:2.8, damage:14, rate:1.3, projSpeed:14, splash:1.2,
    levels:[
      {cost:0, label:'Arcane bolt', mods:{}},
      {cost:120, label:'Wider blast radius', mods:{splash:1.6, damage:1.2}},
      {cost:180, label:'Chain Lightning — arcs to nearby dogs', mods:{chain:true, damage:1.15}},
    ],
  },
  pirate: {
    name:'Pirate Cat', icon:'🏴‍☠️', tagline:'Fires a tiny cannon.', color:0x8b5e3c,
    cost:80, range:2.5, damage:18, rate:1.2, projSpeed:15, splash:1.0, knockback:0.35,
    levels:[
      {cost:0, label:'Cannon blast', mods:{}},
      {cost:100, label:'Bigger cannonballs — wider blast', mods:{splash:1.4}},
      {cost:150, label:'Double charge — heavier knockback', mods:{damage:1.3, knockback:0.6}},
    ],
  },
  robot: {
    name:'Robot Cat', icon:'🤖', tagline:'Beep. Boop. Zap.', color:0x4fd1c5,
    cost:120, range:3.2, damage:10, rate:0.5, projSpeed:30, pierce:2, ignoresArmor:true,
    levels:[
      {cost:0, label:'Laser beam', mods:{}},
      {cost:140, label:'Amplified laser', mods:{damage:1.3}},
      {cost:200, label:'Overheat core — periodic burst', mods:{pierce:4, overheat:true, damage:1.15}},
    ],
  },
  lion: {
    name:'Lion Cat', icon:'🦁', tagline:'The king holds the line.', color:0xf6b93b,
    cost:150, range:2.2, damage:25, rate:1.8, projSpeed:0, splash:1.8, stun:0.5, melee:true,
    levels:[
      {cost:0, label:'Roaring claw', mods:{}},
      {cost:170, label:'Bigger roar radius', mods:{splash:2.2, stun:0.8}},
      {cost:230, label:'Alpha Roar — also slows survivors', mods:{damage:1.35, slowSplash:0.2}},
    ],
  },
};

const TOWER_ORDER = ['scout','angry','assassin','yarn','wizard','pirate','robot','lion'];
