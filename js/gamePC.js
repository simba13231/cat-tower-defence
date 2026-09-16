// ============================================================
// 2D GAME LOGIC
// ============================================================

const state = {
  screen: "menu",

  coins: START_COINS,
  lives: BASE_LIVES,
  wave: 0,

  waveActive: false,
  spawnQueue: [],
  spawnTimer: 0,

  towers: [],
  enemies: [],
  projectiles: [],
  effects: [],

  selectedTower: null,
  buildType: null,

  nextId: 1
};

let messageTimer = 0;

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}


// ============================================================
// WAVES
// ============================================================

function createWave(wave) {
  const enemies = [];

  const amount = 5 + wave * 2;

  for (let i = 0; i < amount; i++) {
    let type = "normal";

    if (wave >= 3 && i % 5 === 0) {
      type = "fast";
    }

    if (wave >= 5 && i % 8 === 0) {
      type = "tank";
    }

    enemies.push(type);
  }

  if (wave % 10 === 0) {
    enemies.push("boss");
  }

  return enemies;
}

function startWave() {
  if (state.waveActive) return;
  if (state.screen !== "playing") return;

  state.wave++;

  state.waveActive = true;

  state.spawnQueue = createWave(state.wave);

  state.spawnTimer = 0;

  sfxWaveStart();

  showBanner(
    state.wave % 10 === 0
      ? "BOSS ROUND!"
      : `ROUND ${state.wave}`
  );

  updateHUD();
}

function spawnEnemy(type) {
  const def = ENEMY_DEFS[type];

  const start = PATH_WORLD[0];

  state.enemies.push({
    id: state.nextId++,

    type,
    def,

    x: start.x,
    y: start.y,

    distance: 0,

    hp: def.hp,
    maxHp: def.hp,

    alive: true,

    anim: Math.random() * 10
  });
}


// ============================================================
// TOWERS
// ============================================================

function placeTower(type, col, row) {
  const def = TOWER_DEFS[type];

  if (!def) return false;

  if (state.coins < def.cost) {
    flashMessage("Not enough coins!");
    return false;
  }

  if (!isBuildable(col, row)) {
    flashMessage("You can't build there!");
    return false;
  }

  const existing = state.towers.find(
    tower =>
      tower.col === col &&
      tower.row === row
  );

  if (existing) {
    flashMessage("That spot is occupied!");
    return false;
  }

  const pos = tileToWorld(col, row);

  state.coins -= def.cost;

  state.towers.push({
    id: state.nextId++,

    type,
    def,

    col,
    row,

    x: pos.x,
    y: pos.y,

    cooldown: 0,

    level: 1,

    target: null,

    anim: Math.random() * 10,

    attackAnim: 0
  });

  state.buildType = null;

  sfxPlace();

  updateHUD();

  return true;
}

function upgradeTower(tower) {
  const cost = Math.floor(
    tower.def.cost * 0.75 * tower.level
  );

  if (state.coins < cost) {
    flashMessage("Not enough coins!");
    return;
  }

  if (tower.level >= 5) {
    flashMessage("MAX LEVEL!");
    return;
  }

  state.coins -= cost;

  tower.level++;

  tower.def = {
    ...tower.def,

    damage: tower.def.damage * 1.28,
    range: tower.def.range * 1.08,
    rate: tower.def.rate * 0.92
  };

  sfxCoin();

  updateHUD();
}

function sellTower(tower) {
  const refund = Math.floor(
    tower.def.cost * 0.65
  );

  state.coins += refund;

  state.towers =
    state.towers.filter(
      t => t !== tower
    );

  state.selectedTower = null;

  sfxCoin();

  updateHUD();
}


// ============================================================
// TARGETING
// ============================================================

function findTarget(tower) {
  let best = null;
  let bestProgress = -Infinity;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    const d = distance(
      tower,
      enemy
    );

    if (d > tower.def.range) {
      continue;
    }

    if (enemy.distance > bestProgress) {
      bestProgress = enemy.distance;
      best = enemy;
    }
  }

  return best;
}


// ============================================================
// ATTACKING
// ============================================================

function fireTower(tower) {
  if (!tower.target) return;

  state.projectiles.push({
    x: tower.x,
    y: tower.y - 10,

    target: tower.target,

    damage: tower.def.damage,

    splash: tower.def.splash || 0,

    speed:
      tower.def.projectileSpeed,

    color:
      tower.def.color,

    dead: false
  });

  tower.attackAnim = 1;

  sfxFire();
}


// ============================================================
// DAMAGE
// ============================================================

function damageEnemy(enemy, damage) {
  if (!enemy.alive) return;

  enemy.hp -= damage;

  createHitEffect(
    enemy.x,
    enemy.y,
    "#ffffff"
  );

  sfxHit();

  if (enemy.hp <= 0) {
    killEnemy(enemy);
  }
}

function killEnemy(enemy) {
  if (!enemy.alive) return;

  enemy.alive = false;

  createHitEffect(
    enemy.x,
    enemy.y,
    enemy.def.color
  );

  state.coins += enemy.def.reward;

  sfxDeath();

  updateHUD();
}


// ============================================================
// UPDATE ENEMIES
// ============================================================

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    enemy.anim += dt;

    enemy.distance +=
      enemy.def.speed * dt;

    const pos =
      pathPointAt(enemy.distance);

    enemy.x = pos.x;
    enemy.y = pos.y;

    if (pos.done) {
      enemy.alive = false;

      state.lives -=
        enemy.def.boss ? 5 : 1;

      sfxLifeLost();

      flashMessage(
        enemy.def.boss
          ? "THE BOSS GOT THROUGH!"
          : "A dog got through!"
      );

      updateHUD();

      if (state.lives <= 0) {
        defeatGame();
      }
    }
  }

  state.enemies =
    state.enemies.filter(
      enemy => enemy.alive
    );
}


// ============================================================
// UPDATE TOWERS
// ============================================================

function updateTowers(dt) {
  for (const tower of state.towers) {
    tower.anim += dt;

    tower.cooldown -= dt;

    tower.attackAnim =
      Math.max(
        0,
        tower.attackAnim - dt * 5
      );

    if (
      !tower.target ||
      !tower.target.alive ||
      distance(
        tower,
        tower.target
      ) > tower.def.range
    ) {
      tower.target =
        findTarget(tower);
    }

    if (
      tower.target &&
      tower.cooldown <= 0
    ) {
      tower.cooldown =
        tower.def.rate;

      fireTower(tower);
    }
  }
}


// ============================================================
// PROJECTILES
// ============================================================

function updateProjectiles(dt) {
  for (const projectile of state.projectiles) {
    if (projectile.dead) continue;

    const target =
      projectile.target;

    if (!target || !target.alive) {
      projectile.dead = true;
      continue;
    }

    const dx =
      target.x - projectile.x;

    const dy =
      target.y - projectile.y;

    const dist =
      Math.sqrt(dx * dx + dy * dy);

    const step =
      projectile.speed * dt;

    if (dist <= step + 5) {
      projectile.x = target.x;
      projectile.y = target.y;

      if (projectile.splash > 0) {
        for (const enemy of state.enemies) {
          if (!enemy.alive) continue;

          if (
            distance(
              target,
              enemy
            ) <= projectile.splash
          ) {
            damageEnemy(
              enemy,
              projectile.damage
            );
          }
        }
      } else {
        damageEnemy(
          target,
          projectile.damage
        );
      }

      createHitEffect(
        target.x,
        target.y,
        projectile.color
      );

      projectile.dead = true;

      continue;
    }

    projectile.x +=
      dx / dist * step;

    projectile.y +=
      dy / dist * step;
  }

  state.projectiles =
    state.projectiles.filter(
      p => !p.dead
    );
}


// ============================================================
// SPAWNING
// ============================================================

function updateSpawning(dt) {
  if (!state.waveActive) return;

  if (
    state.spawnQueue.length === 0
  ) {
    if (state.enemies.length === 0) {
      state.waveActive = false;

      const bonus =
        25 + state.wave * 3;

      state.coins += bonus;

      sfxWaveClear();

      showBanner(
        `ROUND ${state.wave} CLEAR!`
      );

      updateHUD();
    }

    return;
  }

  state.spawnTimer -= dt;

  if (state.spawnTimer <= 0) {
    state.spawnTimer = 0.65;

    spawnEnemy(
      state.spawnQueue.shift()
    );
  }
}


// ============================================================
// EFFECTS
// ============================================================

function createHitEffect(x, y, color) {
  state.effects.push({
    x,
    y,

    color,

    life: 0.28,

    maxLife: 0.28,

    radius: 5
  });
}

function updateEffects(dt) {
  for (const effect of state.effects) {
    effect.life -= dt;

    effect.radius +=
      dt * 90;
  }

  state.effects =
    state.effects.filter(
      effect =>
        effect.life > 0
    );
}


// ============================================================
// UI
// ============================================================

function flashMessage(text) {
  const element =
    document.getElementById(
      "message"
    );

  if (!element) return;

  element.textContent = text;

  element.classList.add("show");

  clearTimeout(
    window.messageTimeout
  );

  window.messageTimeout =
    setTimeout(() => {
      element.classList.remove(
        "show"
      );
    }, 1400);
}

function showBanner(text) {
  const banner =
    document.getElementById(
      "banner"
    );

  if (!banner) return;

  banner.innerHTML = text;

  banner.style.opacity = "1";
  banner.style.transform =
    "translate(-50%,-50%) scale(1)";

  clearTimeout(
    window.bannerTimeout
  );

  window.bannerTimeout =
    setTimeout(() => {
      banner.style.opacity = "0";
      banner.style.transform =
        "translate(-50%,-50%) scale(.8)";
    }, 1300);
}

function updateHUD() {
  const coins =
    document.getElementById(
      "hudCoins"
    );

  const lives =
    document.getElementById(
      "hudLives"
    );

  const wave =
    document.getElementById(
      "hudWave"
    );

  if (coins)
    coins.textContent =
      Math.floor(state.coins);

  if (lives)
    lives.textContent =
      state.lives;

  if (wave)
    wave.textContent =
      state.wave;

  document
    .querySelectorAll(
      ".tower-card"
    )
    .forEach(card => {
      const type =
        card.dataset.type;

      const def =
        TOWER_DEFS[type];

      card.disabled =
        state.screen !== "playing" ||
        state.coins < def.cost;

      card.classList.toggle(
        "selected",
        state.buildType === type
      );
    });

  const start =
    document.getElementById(
      "startWaveBtn"
    );

  if (start) {
    start.disabled =
      state.waveActive;

    start.textContent =
      state.waveActive
        ? `Round ${state.wave}`
        : `Start Round ${state.wave + 1}`;
  }

  updateSelectionPanel();
}

function updateSelectionPanel() {
  const panel =
    document.getElementById(
      "selection"
    );

  if (!panel) return;

  const tower =
    state.selectedTower;

  if (!tower) {
    panel.style.display =
      "none";

    return;
  }

  panel.style.display =
    "block";

  document.getElementById(
    "selName"
  ).textContent =
    tower.def.name;

  document.getElementById(
    "selType"
  ).textContent =
    `Level ${tower.level}`;

  document.getElementById(
    "selDamage"
  ).textContent =
    Math.round(tower.def.damage);

  document.getElementById(
    "selRange"
  ).textContent =
    Math.round(tower.def.range);

  document.getElementById(
    "selRate"
  ).textContent =
    tower.def.rate.toFixed(2);

  const upgrade =
    document.getElementById(
      "upgradeBtn"
    );

  if (tower.level >= 5) {
    upgrade.textContent =
      "MAX LEVEL";
    upgrade.disabled = true;
  } else {
    const cost =
      Math.floor(
        tower.def.cost *
        0.75 *
        tower.level
      );

    upgrade.textContent =
      `Upgrade $${cost}`;

    upgrade.disabled =
      state.coins < cost;
  }
}


// ============================================================
// GAME START / DEFEAT
// ============================================================

function startGame() {
  state.screen = "playing";

  state.coins =
    START_COINS;

  state.lives =
    BASE_LIVES;

  state.wave = 0;

  state.waveActive = false;

  state.spawnQueue = [];

  state.towers = [];
  state.enemies = [];
  state.projectiles = [];
  state.effects = [];

  state.selectedTower = null;
  state.buildType = null;

  document.getElementById(
    "titleScreen"
  ).style.display = "none";

  document.getElementById(
    "defeatOverlay"
  ).style.display = "none";

  document.getElementById(
    "hud"
  ).style.display = "flex";

  document.getElementById(
    "towerBar"
  ).style.display = "flex";

  updateHUD();

  sfxUiClick();
}

function defeatGame() {
  state.screen = "defeat";

  state.waveActive = false;

  const overlay =
    document.getElementById(
      "defeatOverlay"
    );

  const result =
    document.getElementById(
      "resultText"
    );

  if (result) {
    result.textContent =
      `You reached Round ${state.wave}.`;
  }

  if (overlay) {
    overlay.style.display =
      "flex";
  }

  sfxDefeat();
}


// ============================================================
// RESET
// ============================================================

function resetGame() {
  startGame();
}


// ============================================================
// MAIN UPDATE LOOP
// ============================================================

function updateGame(dt) {
  if (
    state.screen !== "playing"
  ) {
    return;
  }

  updateSpawning(dt);
  updateEnemies(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateEffects(dt);
}
