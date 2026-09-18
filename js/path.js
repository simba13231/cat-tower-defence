/* =========================================================================
   path.js — the enemy path as an actual smooth curve, not a grid of tiles.

   Waypoints below trace the same overall route shape as the old grid
   version (in, right, up, right, down-long, right, up, out) but as free
   x/y points in a 1000x600 world instead of grid cells. tracePathContext()
   rounds every corner into a quadratic curve using the classic
   "midpoint smoothing" trick: each original waypoint becomes a curve's
   CONTROL point, and the curve actually passes through the midpoints of
   each pair of consecutive waypoints. That keeps the curve close to the
   original route and — importantly — never loops or self-intersects on a
   sharp turn, the way a Catmull-Rom spline can.

   Movement needs constant speed along the curve, and a bezier's parameter
   t is NOT linear with distance — so buildSmoothPath() samples the exact
   same curve tracePathContext() draws, densely, and builds a
   distance -> {x,y,angle} lookup table once up front. Drawing and movement
   can never drift apart, because they both come from one trace.
   ========================================================================= */

const WORLD_W = 1000, WORLD_H = 600;

const PATH_WAYPOINTS = [
  { x: -40,  y: 334 },
  { x: 207,  y: 334 },
  { x: 207,  y: 129 },
  { x: 573,  y: 129 },
  { x: 573,  y: 472 },
  { x: 793,  y: 472 },
  { x: 793,  y: 266 },
  { x: 1040, y: 266 },
];

const PATH_WIDTH = 46;

function midpoint(a, b){ return { x:(a.x+b.x)/2, y:(a.y+b.y)/2 }; }

// Traces the smoothed path onto any 2D context — used both to draw it and
// (in buildSmoothPath, via a throwaway canvas-free re-implementation below)
// to sample it. Kept as the single source of truth for the curve's shape.
function tracePathContext(ctx){
  const pts = PATH_WAYPOINTS;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  ctx.lineTo(midpoint(pts[0], pts[1]).x, midpoint(pts[0], pts[1]).y);
  for (let i=1; i<pts.length-1; i++){
    const end = midpoint(pts[i], pts[i+1]);
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, end.x, end.y);
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
}

let PATH_SAMPLES = [];   // [{x,y,dist,angle}, ...] dense, roughly every ~3px
let PATH_TOTAL_LEN = 0;

function buildSmoothPath(){
  const pts = PATH_WAYPOINTS;
  const segments = []; // mirrors tracePathContext's commands exactly
  segments.push({ type:'line', p0: pts[0], p1: midpoint(pts[0], pts[1]) });
  for (let i=1; i<pts.length-1; i++){
    segments.push({ type:'quad', p0: midpoint(pts[i-1], pts[i]), cp: pts[i], p1: midpoint(pts[i], pts[i+1]) });
  }
  segments.push({ type:'line', p0: midpoint(pts[pts.length-2], pts[pts.length-1]), p1: pts[pts.length-1] });

  const samples = [];
  let cumDist = 0;
  let prev = null;
  segments.forEach(seg=>{
    const steps = seg.type === 'line' ? 8 : 40;
    for (let s=0; s<=steps; s++){
      const t = s/steps;
      let x, y;
      if (seg.type === 'line'){
        x = seg.p0.x + (seg.p1.x-seg.p0.x)*t;
        y = seg.p0.y + (seg.p1.y-seg.p0.y)*t;
      } else {
        const it = 1-t;
        x = it*it*seg.p0.x + 2*it*t*seg.cp.x + t*t*seg.p1.x;
        y = it*it*seg.p0.y + 2*it*t*seg.cp.y + t*t*seg.p1.y;
      }
      if (prev){
        const dx = x-prev.x, dy = y-prev.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < 0.01) return; // skip duplicate point at a segment seam
        cumDist += d;
      }
      samples.push({ x, y, dist: cumDist });
      prev = {x,y};
    }
  });

  for (let i=0; i<samples.length; i++){
    const a = samples[i], b = samples[Math.min(i+1, samples.length-1)];
    a.angle = Math.atan2(b.y-a.y, b.x-a.x);
  }

  PATH_SAMPLES = samples;
  PATH_TOTAL_LEN = samples[samples.length-1].dist;
}
buildSmoothPath();

// Binary-search the sample table and lerp between the two nearest points.
function getPointAtDistance(dist){
  if (dist <= 0) return PATH_SAMPLES[0];
  if (dist >= PATH_TOTAL_LEN) return PATH_SAMPLES[PATH_SAMPLES.length-1];
  let lo = 0, hi = PATH_SAMPLES.length-1;
  while (lo < hi-1){
    const mid = (lo+hi) >> 1;
    if (PATH_SAMPLES[mid].dist < dist) lo = mid; else hi = mid;
  }
  const a = PATH_SAMPLES[lo], b = PATH_SAMPLES[hi];
  const span = b.dist - a.dist;
  const t = span > 0 ? (dist - a.dist) / span : 0;
  return {
    x: a.x + (b.x-a.x)*t,
    y: a.y + (b.y-a.y)*t,
    angle: a.angle + (b.angle-a.angle)*t,
  };
}

// Distance from (x,y) to the nearest sampled path point — used for both
// "is this a valid place to build" and the build-mode hover ring.
function distanceToPath(x, y){
  let best = Infinity;
  for (let i=0; i<PATH_SAMPLES.length; i+=2){
    const s = PATH_SAMPLES[i];
    const dx = s.x-x, dy = s.y-y;
    const d = dx*dx + dy*dy;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}
