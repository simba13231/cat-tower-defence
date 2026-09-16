// ============================================================
// INPUT
// ============================================================

window.hoverTile = null;

function getMousePosition(event) {
  const rect =
    canvas.getBoundingClientRect();

  return {
    x:
      event.clientX -
      rect.left,

    y:
      event.clientY -
      rect.top
  };
}

canvas.addEventListener(
  "mousemove",
  event => {
    const mouse =
      getMousePosition(
        event
      );

    window.hoverTile =
      screenToTile(
        mouse.x,
        mouse.y
      );
  }
);

canvas.addEventListener(
  "mouseleave",
  () => {
    window.hoverTile = null;
  }
);

canvas.addEventListener(
  "click",
  event => {
    if (
      state.screen !==
      "playing"
    ) {
      return;
    }

    const mouse =
      getMousePosition(
        event
      );

    const tile =
      screenToTile(
        mouse.x,
        mouse.y
      );

    if (!tile) return;

    // Building

    if (state.buildType) {
      const placed =
        placeTower(
          state.buildType,
          tile.col,
          tile.row
        );

      if (placed) {
        sfxUiClick();
      }

      return;
    }

    // Select tower

    const tower =
      state.towers.find(
        t =>
          distance(
            t,
            tile
          ) <
          30
      );

    if (tower) {
      state.selectedTower =
        tower;

      updateHUD();

      sfxUiClick();

      return;
    }

    state.selectedTower = null;

    updateHUD();
  }
);


// ============================================================
// TOWER BUTTONS
// ============================================================

document
  .querySelectorAll(
    ".tower-card"
  )
  .forEach(card => {
    card.addEventListener(
      "click",
      () => {
        const type =
          card.dataset.type;

        if (
          state.screen !==
          "playing"
        ) {
          return;
        }

        if (
          state.coins <
          TOWER_DEFS[type].cost
        ) {
          flashMessage(
            "Not enough coins!"
          );

          return;
        }

        state.buildType =
          state.buildType === type
            ? null
            : type;

        state.selectedTower =
          null;

        updateHUD();

        sfxUiClick();
      }
    );
  });


// ============================================================
// START WAVE
// ============================================================

document
  .getElementById(
    "startWaveBtn"
  )
  .addEventListener(
    "click",
    () => {
      startWave();
    }
  );


// ============================================================
// PLAY
// ============================================================

document
  .getElementById(
    "playBtn"
  )
  .addEventListener(
    "click",
    () => {
      startGame();
    }
  );


// ============================================================
// RETRY
// ============================================================

document
  .getElementById(
    "retryBtn"
  )
  .addEventListener(
    "click",
    () => {
      startGame();
    }
  );


// ============================================================
// UPGRADE
// ============================================================

document
  .getElementById(
    "upgradeBtn"
  )
  .addEventListener(
    "click",
    () => {
      if (
        state.selectedTower
      ) {
        upgradeTower(
          state.selectedTower
        );
      }
    }
  );


// ============================================================
// SELL
// ============================================================

document
  .getElementById(
    "sellBtn"
  )
  .addEventListener(
    "click",
    () => {
      if (
        state.selectedTower
      ) {
        sellTower(
          state.selectedTower
        );
      }
    }
  );


// ============================================================
// ESCAPE
// ============================================================

window.addEventListener(
  "keydown",
  event => {
    if (
      event.key ===
      "Escape"
    ) {
      state.buildType = null;
      state.selectedTower = null;

      updateHUD();
    }
  }
);


// ============================================================
// GAME LOOP
// ============================================================

let lastTime =
  performance.now();

function gameLoop(now) {
  const dt =
    Math.min(
      0.05,
      (now - lastTime) /
        1000
    );

  lastTime = now;

  updateGame(dt);

  requestAnimationFrame(
    gameLoop
  );
}

requestAnimationFrame(
  gameLoop
);
