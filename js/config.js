// ============================================================
// CAT TOWER DEFENCE
// Game configuration
// ============================================================

const START_COINS = 220;
const BASE_LIVES = 20;

const TILE_SIZE = 64;

const TOWER_DEFS = {
  scout: {
    name: "Scout",
    cost: 50,
    damage: 8,
    range: 190,
    rate: 0.55,
    projectileSpeed: 520,
    color: "#F2A65A",
    icon: "🐱",
    description: "Fast attacks"
  },

  angry: {
    name: "Angry",
    cost: 70,
    damage: 20,
    range: 155,
    rate: 1.15,
    projectileSpeed: 440,
    color: "#E96B6B",
    icon: "😾",
    description: "Heavy damage"
  },

  wizard: {
    name: "Wizard",
    cost: 100,
    damage: 14,
    range: 180,
    rate: 1.25,
    projectileSpeed: 380,
    splash: 58,
    color: "#9B73D3",
    icon: "🧙",
    description: "Splash attacks"
  },

  robot: {
    name: "Robot",
    cost: 120,
    damage: 11,
    range: 230,
    rate: 0.30,
    projectileSpeed: 650,
    color: "#4FA8A0",
    icon: "🤖",
    description: "Very fast"
  }
};

const ENEMY_DEFS = {
  normal: {
    name: "Dog",
    hp: 35,
    speed: 52,
    reward: 8,
    color: "#C98D5A",
    size: 19
  },

  fast: {
    name: "Fast Dog",
    hp: 22,
    speed: 82,
    reward: 10,
    color: "#E7B35C",
    size: 17
  },

  tank: {
    name: "Big Dog",
    hp: 120,
    speed: 30,
    reward: 18,
    color: "#7B6250",
    size: 25
  },

  boss: {
    name: "DOG BOSS",
    hp: 600,
    speed: 22,
    reward: 100,
    color: "#713D35",
    size: 34,
    boss: true
  }
};
