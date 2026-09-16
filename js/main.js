// ============================================================
// 2D CANVAS RENDERER
// ============================================================

const canvas =
  document.getElementById(
    "app-canvas"
  );

const ctx =
  canvas.getContext("2d");

let canvasWidth = 0;
let canvasHeight = 0;
let dpr = 1;

let camera = {
  x: 0,
  y: 0,
  scale: 1
};

function resizeCanvas() {
  dpr =
    Math.min(
      2,
      window.devicePixelRatio || 1
    );

  canvasWidth =
    window.innerWidth;

  canvasHeight =
    window.innerHeight;

  canvas.width =
    canvasWidth * dpr;

  canvas.height =
    canvasHeight * dpr;

  canvas.style.width =
    canvasWidth + "px";

  canvas.style.height =
    canvasHeight + "px";

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  const mapWidth =
    GRID_W * TILE_SIZE;

  const mapHeight =
    GRID_H * TILE_SIZE;

  const availableWidth =
    canvasWidth - 40;

  const availableHeight =
    canvasHeight - 170;

  camera.scale =
    Math.min(
      availableWidth / mapWidth,
      availableHeight / mapHeight
    );

  camera.scale =
    Math.max(
      0.55,
      Math.min(
        1.15,
        camera.scale
      )
    );

  camera.x =
    (canvasWidth -
      mapWidth *
        camera.scale) / 2;

  camera.y =
    90 +
    (availableHeight -
      mapHeight *
        camera.scale) / 2;
}

window.addEventListener(
  "resize",
  resizeCanvas
);

resizeCanvas();

function worldToScreen(x, y) {
  return {
    x:
      camera.x +
      x * camera.scale,

    y:
      camera.y +
      y * camera.scale
  };
}

function screenToWorld(x, y) {
  return {
    x:
      (x - camera.x) /
      camera.scale,

    y:
      (y - camera.y) /
      camera.scale
  };
}

function screenToTile(x, y) {
  const world =
    screenToWorld(x, y);

  const col =
    Math.floor(
      world.x / TILE_SIZE
    );

  const row =
    Math.floor(
      world.y / TILE_SIZE
    );

  if (
    col < 0 ||
    row < 0 ||
    col >= GRID_W ||
    row >= GRID_H
  ) {
    return null;
  }

  const pos =
    tileToWorld(
      col,
      row
    );

  return {
    col,
    row,
    x: pos.x,
    y: pos.y
  };
}


// ============================================================
// DRAWING HELPERS
// ============================================================

function roundedRect(
  x,
  y,
  w,
  h,
  r
) {
  const radius =
    Math.min(
      r,
      w / 2,
      h / 2
    );

  ctx.beginPath();

  ctx.moveTo(
    x + radius,
    y
  );

  ctx.arcTo(
    x + w,
    y,
    x + w,
    y + h,
    radius
  );

  ctx.arcTo(
    x + w,
    y + h,
    x,
    y + h,
    radius
  );

  ctx.arcTo(
    x,
    y + h,
    x,
    y,
    radius
  );

  ctx.arcTo(
    x,
    y,
    x + w,
    y,
    radius
  );

  ctx.closePath();
}

function circle(
  x,
  y,
  radius
) {
  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );
}

function shadow(
  x,
  y,
  rx,
  ry
) {
  ctx.save();

  ctx.fillStyle =
    "rgba(32,55,38,.18)";

  ctx.beginPath();

  ctx.ellipse(
    x,
    y,
    rx,
    ry,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.restore();
}


// ============================================================
// BACKGROUND
// ============================================================

function drawBackground() {
  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      canvasHeight
    );

  gradient.addColorStop(
    0,
    "#8BD7F7"
  );

  gradient.addColorStop(
    1,
    "#D8F0C9"
  );

  ctx.fillStyle =
    gradient;

  ctx.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  // clouds

  ctx.save();

  ctx.globalAlpha = 0.35;

  ctx.fillStyle = "#FFFFFF";

  const clouds = [
    [110, 145, 42],
    [canvasWidth - 150, 170, 55],
    [canvasWidth * 0.5, 95, 35]
  ];

  for (
    const [x, y, size]
    of clouds
  ) {
    circle(
      x,
      y,
      size
    );

    ctx.fill();

    circle(
      x + size * 0.8,
      y + 5,
      size * 0.7
    );

    ctx.fill();

    circle(
      x - size * 0.7,
      y + 8,
      size * 0.65
    );

    ctx.fill();
  }

  ctx.restore();
}


// ============================================================
// MAP
// ============================================================

function drawMap() {
  const width =
    GRID_W *
    TILE_SIZE *
    camera.scale;

  const height =
    GRID_H *
    TILE_SIZE *
    camera.scale;

  ctx.save();

  // map shadow

  ctx.fillStyle =
    "rgba(30,65,35,.18)";

  roundedRect(
    camera.x + 8,
    camera.y + 10,
    width,
    height,
    22
  );

  ctx.fill();

  // grass

  ctx.fillStyle =
    "#63B957";

  roundedRect(
    camera.x,
    camera.y,
    width,
    height,
    22
  );

  ctx.fill();

  // tiles

  for (
    let row = 0;
    row < GRID_H;
    row++
  ) {
    for (
      let col = 0;
      col < GRID_W;
      col++
    ) {
      const x =
        camera.x +
        col *
          TILE_SIZE *
          camera.scale;

      const y =
        camera.y +
        row *
          TILE_SIZE *
          camera.scale;

      const size =
        TILE_SIZE *
        camera.scale;

      if (
        isPathTile(
          col,
          row
        )
      ) {
        continue;
      }

      ctx.fillStyle =
        (row + col) % 2 === 0
          ? "#6AC45C"
          : "#62B855";

      ctx.globalAlpha = 0.4;

      ctx.fillRect(
        x,
        y,
        size,
        size
      );

      ctx.globalAlpha = 1;
    }
  }

  // path

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle =
    "#80502F";

  ctx.lineWidth =
    46 *
    camera.scale;

  ctx.beginPath();

  PATH_WORLD.forEach(
    (point, index) => {
      const p =
        worldToScreen(
          point.x,
          point.y
        );

      if (index === 0) {
        ctx.moveTo(
          p.x,
          p.y
        );
      } else {
        ctx.lineTo(
          p.x,
          p.y
        );
      }
    }
  );

  ctx.stroke();

  ctx.strokeStyle =
    "#C68B50";

  ctx.lineWidth =
    38 *
    camera.scale;

  ctx.stroke();

  // path dots

  ctx.fillStyle =
    "rgba(100,65,40,.28)";

  for (
    let i = 0;
    i < 100;
    i++
  ) {
    const p =
      pathPointAt(
        (i / 100) *
        PATH_TOTAL_LENGTH
      );

    const screen =
      worldToScreen(
        p.x,
        p.y
      );

    circle(
      screen.x +
        Math.sin(i * 8) * 5,
      screen.y +
        Math.cos(i * 5) * 4,
      1.5
    );

    ctx.fill();
  }

  drawDecorations();

  ctx.restore();
}


// ============================================================
// DECORATIONS
// ============================================================

function drawDecorations() {
  const decorations = [
    [1, 1, "tree"],
    [4, 0, "tree"],
    [7, 1, "bush"],
    [11, 1, "tree"],
    [13, 2, "bush"],
    [1, 7, "tree"],
    [4, 7, "rock"],
    [12, 7, "tree"],
    [14, 7, "bush"],
    [6, 7, "rock"]
  ];

  for (
    const [col, row, type]
    of decorations
  ) {
    if (
      isPathTile(
        col,
        row
      )
    ) {
      continue;
    }

    const pos =
      tileToWorld(
        col,
        row
      );

    const p =
      worldToScreen(
        pos.x,
        pos.y
      );

    const s =
      camera.scale;

    shadow(
      p.x,
      p.y + 15 * s,
      18 * s,
      7 * s
    );

    if (type === "tree") {
      ctx.fillStyle =
        "#815331";

      ctx.fillRect(
        p.x - 4 * s,
        p.y - 5 * s,
        8 * s,
        23 * s
      );

      ctx.fillStyle =
        "#398F48";

      circle(
        p.x,
        p.y - 15 * s,
        18 * s
      );

      ctx.fill();

      circle(
        p.x - 12 * s,
        p.y - 5 * s,
        12 * s
      );

      ctx.fill();

      circle(
        p.x + 12 * s,
        p.y - 5 * s,
        12 * s
      );

      ctx.fill();
    }

    if (type === "bush") {
      ctx.fillStyle =
        "#398F48";

      circle(
        p.x,
        p.y,
        15 * s
      );

      ctx.fill();

      circle(
        p.x - 10 * s,
        p.y + 3 * s,
        10 * s
      );

      ctx.fill();

      circle(
        p.x + 10 * s,
        p.y + 3 * s,
        10 * s
      );

      ctx.fill();
    }

    if (type === "rock") {
      ctx.fillStyle =
        "#87948D";

      ctx.beginPath();

      ctx.ellipse(
        p.x,
        p.y,
        13 * s,
        9 * s,
        -0.2,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }
}


// ============================================================
// TOWERS
// ============================================================

function drawTower(tower) {
  const p =
    worldToScreen(
      tower.x,
      tower.y
    );

  const s =
    camera.scale;

  const bounce =
    Math.sin(
      tower.anim * 3
    ) * 1.5;

  shadow(
    p.x,
    p.y + 20 * s,
    22 * s,
    8 * s
  );

  // range when selected

  if (
    state.selectedTower === tower
  ) {
    ctx.fillStyle =
      "rgba(255,255,255,.13)";

    circle(
      p.x,
      p.y,
      tower.def.range * s
    );

    ctx.fill();

    ctx.strokeStyle =
      "rgba(255,255,255,.7)";

    ctx.lineWidth = 2;

    ctx.stroke();
  }

  ctx.save();

  ctx.translate(
    p.x,
    p.y + bounce
  );

  // body

  ctx.fillStyle =
    tower.def.color;

  ctx.beginPath();

  ctx.ellipse(
    0,
    5 * s,
    25 * s,
    22 * s,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // head

  ctx.fillStyle =
    tower.def.color;

  circle(
    0,
    -14 * s,
    21 * s
  );

  ctx.fill();

  // ears

  ctx.beginPath();

  ctx.moveTo(
    -17 * s,
    -28 * s
  );

  ctx.lineTo(
    -9 * s,
    -45 * s
  );

  ctx.lineTo(
    -1 * s,
    -28 * s
  );

  ctx.closePath();

  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(
    17 * s,
    -28 * s
  );

  ctx.lineTo(
    9 * s,
    -45 * s
  );

  ctx.lineTo(
    1 * s,
    -28 * s
  );

  ctx.closePath();

  ctx.fill();

  // eyes

  ctx.fillStyle =
    "#FFFFFF";

  circle(
    -7 * s,
    -16 * s,
    4 * s
  );

  ctx.fill();

  circle(
    7 * s,
    -16 * s,
    4 * s
  );

  ctx.fill();

  ctx.fillStyle =
    "#222";

  circle(
    -7 * s,
    -16 * s,
    2 * s
  );

  ctx.fill();

  circle(
    7 * s,
    -16 * s,
    2 * s
  );

  ctx.fill();

  // nose

  ctx.fillStyle =
    "#E88999";

  circle(
    0,
    -7 * s,
    3 * s
  );

  ctx.fill();

  // tower type details

  if (
    tower.type === "wizard"
  ) {
    ctx.fillStyle =
      "#553C9A";

    ctx.beginPath();

    ctx.moveTo(
      -15 * s,
      -32 * s
    );

    ctx.lineTo(
      0,
      -60 * s
    );

    ctx.lineTo(
      15 * s,
      -32 * s
    );

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle =
      "#FFD65A";

    circle(
      0,
      -53 * s,
      4 * s
    );

    ctx.fill();
  }

  if (
    tower.type === "robot"
  ) {
    ctx.fillStyle =
      "#365C65";

    roundedRect(
      -15 * s,
      -30 * s,
      30 * s,
      17 * s,
      5 * s
    );

    ctx.fill();

    ctx.fillStyle =
      "#78F0E4";

    ctx.fillRect(
      -8 * s,
      -24 * s,
      16 * s,
      4 * s
    );
  }

  if (
    tower.type === "angry"
  ) {
    ctx.strokeStyle =
      "#632C2C";

    ctx.lineWidth =
      3 * s;

    ctx.beginPath();

    ctx.moveTo(
      -13 * s,
      -22 * s
    );

    ctx.lineTo(
      -4 * s,
      -18 * s
    );

    ctx.moveTo(
      13 * s,
      -22 * s
    );

    ctx.lineTo(
      4 * s,
      -18 * s
    );

    ctx.stroke();
  }

  ctx.restore();

  // level badge

  if (tower.level > 1) {
    ctx.fillStyle =
      "#FFD34E";

    circle(
      p.x + 22 * s,
      p.y - 27 * s,
      10 * s
    );

    ctx.fill();

    ctx.fillStyle =
      "#684D00";

    ctx.font =
      `900 ${10 * s}px Nunito`;

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.fillText(
      tower.level,
      p.x + 22 * s,
      p.y - 27 * s
    );
  }
}


// ============================================================
// DOGS
// ============================================================

function drawEnemy(enemy) {
  const p =
    worldToScreen(
      enemy.x,
      enemy.y
    );

  const s =
    camera.scale;

  const size =
    enemy.def.size *
    s;

  const bounce =
    Math.sin(
      enemy.anim * 9
    ) * 2 * s;

  shadow(
    p.x,
    p.y + size * .75,
    size * .7,
    size * .25
  );

  ctx.save();

  ctx.translate(
    p.x,
    p.y + bounce
  );

  // body

  ctx.fillStyle =
    enemy.def.color;

  ctx.beginPath();

  ctx.ellipse(
    0,
    5 * s,
    size * .65,
    size * .5,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  // head

  circle(
    0,
    -size * .35,
    size * .55
  );

  ctx.fill();

  // ears

  ctx.fillStyle =
    "#5B4030";

  ctx.beginPath();

  ctx.moveTo(
    -size * .35,
    -size * .6
  );

  ctx.lineTo(
    -size * .65,
    -size
  );

  ctx.lineTo(
    -size * .55,
    -size * .25
  );

  ctx.closePath();

  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(
    size * .35,
    -size * .6
  );

  ctx.lineTo(
    size * .65,
    -size
  );

  ctx.lineTo(
    size * .55,
    -size * .25
  );

  ctx.closePath();

  ctx.fill();

  // eyes

  ctx.fillStyle =
    "#FFFFFF";

  circle(
    -size * .18,
    -size * .4,
    size * .10
  );

  ctx.fill();

  circle(
    size * .18,
    -size * .4,
    size * .10
  );

  ctx.fill();

  ctx.fillStyle =
    "#222";

  circle(
    -size * .18,
    -size * .4,
    size * .045
  );

  ctx.fill();

  circle(
    size * .18,
    -size * .4,
    size * .045
  );

  ctx.fill();

  // nose

  ctx.fillStyle =
    "#38251D";

  circle(
    0,
    -size * .22,
    size * .11
  );

  ctx.fill();

  ctx.restore();

  // health bar

  if (
    enemy.hp <
    enemy.maxHp
  ) {
    const barWidth =
      size * 1.5;

    const barX =
      p.x -
      barWidth / 2;

    const barY =
      p.y -
      size * 1.2;

    ctx.fillStyle =
      "rgba(0,0,0,.3)";

    roundedRect(
      barX,
      barY,
      barWidth,
      6 * s,
      3 * s
    );

    ctx.fill();

    ctx.fillStyle =
      "#55C75B";

    roundedRect(
      barX,
      barY,
      barWidth *
        Math.max(
          0,
          enemy.hp /
            enemy.maxHp
        ),
      6 * s,
      3 * s
    );

    ctx.fill();
  }

  if (enemy.def.boss) {
    ctx.fillStyle =
      "#FFD84A";

    ctx.font =
      `900 ${12 * s}px Nunito`;

    ctx.textAlign =
      "center";

    ctx.fillText(
      "BOSS",
      p.x,
      p.y - size * 1.45
    );
  }
}


// ============================================================
// PROJECTILES
// ============================================================

function drawProjectiles() {
  for (
    const projectile
    of state.projectiles
  ) {
    const p =
      worldToScreen(
        projectile.x,
        projectile.y
      );

    ctx.save();

    ctx.fillStyle =
      projectile.color;

    ctx.shadowColor =
      projectile.color;

    ctx.shadowBlur = 8;

    circle(
      p.x,
      p.y,
      5 * camera.scale
    );

    ctx.fill();

    ctx.restore();
  }
}


// ============================================================
// EFFECTS
// ============================================================

function drawEffects() {
  for (
    const effect
    of state.effects
  ) {
    const p =
      worldToScreen(
        effect.x,
        effect.y
      );

    const alpha =
      Math.max(
        0,
        effect.life /
          effect.maxLife
      );

    ctx.save();

    ctx.globalAlpha =
      alpha;

    ctx.strokeStyle =
      effect.color;

    ctx.lineWidth =
      3 * camera.scale;

    circle(
      p.x,
      p.y,
      effect.radius *
        camera.scale
    );

    ctx.stroke();

    ctx.restore();
  }
}


// ============================================================
// BUILD PREVIEW
// ============================================================

function drawBuildPreview() {
  if (
    state.screen !== "playing" ||
    !state.buildType ||
    !window.hoverTile
  ) {
    return;
  }

  const tile =
    window.hoverTile;

  const valid =
    isBuildable(
      tile.col,
      tile.row
    ) &&
    !state.towers.some(
      tower =>
        tower.col === tile.col &&
        tower.row === tile.row
    );

  const p =
    worldToScreen(
      tile.x,
      tile.y
    );

  ctx.save();

  ctx.fillStyle =
    valid
      ? "rgba(75,210,90,.28)"
      : "rgba(240,70,70,.30)";

  circle(
    p.x,
    p.y,
    28 * camera.scale
  );

  ctx.fill();

  ctx.strokeStyle =
    valid
      ? "#55D45C"
      : "#EF5E5E";

  ctx.lineWidth = 3;

  ctx.stroke();

  ctx.restore();
}


// ============================================================
// RENDER LOOP
// ============================================================

function render() {
  drawBackground();

  drawMap();

  drawBuildPreview();

  for (
    const tower
    of state.towers
  ) {
    drawTower(tower);
  }

  for (
    const enemy
    of state.enemies
  ) {
    drawEnemy(enemy);
  }

  drawProjectiles();

  drawEffects();

  requestAnimationFrame(
    render
  );
}

render();
