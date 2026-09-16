// ============================================================
// MAP
// ============================================================

const GRID_W = 15;
const GRID_H = 9;

const PATH_TILES = new Set([
  "0,4",
  "1,4",
  "2,4",
  "2,3",
  "2,2",
  "3,2",
  "4,2",
  "5,2",
  "5,3",
  "5,4",
  "6,4",
  "7,4",
  "8,4",
  "8,5",
  "8,6",
  "9,6",
  "10,6",
  "10,5",
  "10,4",
  "11,4",
  "12,4",
  "13,4",
  "14,4"
]);

const PATH = [
  [0, 4],
  [2, 4],
  [2, 2],
  [5, 2],
  [5, 4],
  [8, 4],
  [8, 6],
  [10, 6],
  [10, 4],
  [14, 4]
];

function tileToWorld(col, row) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2
  };
}

const PATH_WORLD = PATH.map(([c, r]) => tileToWorld(c, r));

const PATH_SEGMENTS = [];

let PATH_TOTAL_LENGTH = 0;

for (let i = 0; i < PATH_WORLD.length - 1; i++) {
  const a = PATH_WORLD[i];
  const b = PATH_WORLD[i + 1];

  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const length = Math.sqrt(dx * dx + dy * dy);

  PATH_SEGMENTS.push({
    a,
    b,
    length,
    start: PATH_TOTAL_LENGTH,
    end: PATH_TOTAL_LENGTH + length
  });

  PATH_TOTAL_LENGTH += length;
}

function pathPointAt(distance) {
  distance = Math.max(0, distance);

  for (let i = 0; i < PATH_SEGMENTS.length; i++) {
    const seg = PATH_SEGMENTS[i];

    if (distance <= seg.end || i === PATH_SEGMENTS.length - 1) {
      const t = Math.min(
        1,
        Math.max(
          0,
          (distance - seg.start) / seg.length
        )
      );

      return {
        x: seg.a.x + (seg.b.x - seg.a.x) * t,
        y: seg.a.y + (seg.b.y - seg.a.y) * t,
        segment: i,
        done: distance >= PATH_TOTAL_LENGTH
      };
    }
  }

  const last = PATH_WORLD[PATH_WORLD.length - 1];

  return {
    x: last.x,
    y: last.y,
    segment: PATH_SEGMENTS.length - 1,
    done: true
  };
}

function isPathTile(col, row) {
  return PATH_TILES.has(`${col},${row}`);
}

function isBuildable(col, row) {
  if (col < 0 || row < 0) return false;
  if (col >= GRID_W || row >= GRID_H) return false;

  return !isPathTile(col, row);
}
