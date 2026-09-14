/* =========================================================================
   enemyData.js — pure data: every dog enemy's stats & special traits
   ========================================================================= */

const ENEMY_DEFS = {
  puppy:   {name:'Puppy', hp:30, speed:1.6, reward:5, color:0xe8c39e, scale:0.85, perky:true, desc:'Excited and playful.'},
  fastdog: {name:'Fast Dog', hp:22, speed:2.9, reward:6, color:0xf4d03f, scale:0.85, perky:true, desc:'Zips right past you.'},
  bulldog: {name:'Bulldog', hp:150, speed:0.85, reward:15, color:0x7f8c8d, scale:1.15, desc:'Slow and angry.'},
  armored: {name:'Armored Dog', hp:95, speed:1.25, reward:13, color:0x4a6572, scale:1.0, armor:0.4, desc:'Wearing thick plates.'},
  husky:   {name:'Husky', hp:65, speed:2.0, reward:10, color:0xc7dcf0, scale:0.95, slowResist:0.7, desc:'Chaotic and energetic.'},
  police:  {name:'Police Dog', hp:75, speed:1.5, reward:14, color:0x2e6da8, scale:1.0, disables:true, desc:'Serious about the law.'},
  sneaky:  {name:'Sneaky Dog', hp:48, speed:1.85, reward:12, color:0x3b4a54, scale:0.95, stealth:true, opacity:0.55, desc:'Looks suspicious.'},
  splitter:{name:'Splitter Dog', hp:85, speed:1.4, reward:11, color:0xd35400, scale:1.05, splits:true, desc:'Looks... unstable.'},
  healer:  {name:'Healer Dog', hp:58, speed:1.4, reward:14, color:0xec7063, scale:1.0, heals:true, desc:'Carries medical supplies.'},
  dogking: {name:'The Dog King', hp:1500, speed:0.95, reward:220, color:0x8e44ad, scale:2.0, boss:true, desc:'Ruler of the invading horde.'},
};
