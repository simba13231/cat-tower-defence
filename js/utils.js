/* =========================================================================
   utils.js — small shared helpers (no dependencies on other game files)
   ========================================================================= */

function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

function distTo(entity, worldPos){
  return Math.hypot(entity.mesh.position.x - worldPos.x, entity.mesh.position.z - worldPos.z);
}

// Mixes a hex color toward white (amount 0..1) — used for belly/paw/ear patches.
function lightenColor(hex, amount){
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(0xffffff), amount);
  return c.getHex();
}

// Mixes a hex color toward black (amount 0..1) — used for shading accents.
function darkenColor(hex, amount){
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(0x000000), amount);
  return c.getHex();
}

function hexToCss(hex){
  return '#' + hex.toString(16).padStart(6,'0');
}
