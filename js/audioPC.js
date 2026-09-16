/* =========================================================================
   audioPC.js — tiny synthesized sound effects (oscillator + gain envelope).
   No audio files to load, no network dependency, no licensing to worry
   about — every sound here is generated on the fly. The AudioContext is
   created lazily on first use, since browsers require a user gesture
   before audio can start, and the first tone always plays inside a click
   handler (Play button, tower placement, etc.) so this satisfies that
   automatically.
   ========================================================================= */

let audioCtx = null;
function ensureAudio(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, type, vol, sweepTo){
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), ctx.currentTime + dur);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.02);
}

function sfxFire(){ tone(680, 0.09, 'square', 0.05, 420); }
function sfxHit(){ tone(180, 0.06, 'sine', 0.05); }
function sfxDeath(){ tone(320, 0.16, 'sawtooth', 0.06, 60); }
function sfxPlace(){ tone(520, 0.08, 'triangle', 0.06, 700); }
function sfxCoin(){ tone(880, 0.07, 'sine', 0.05); setTimeout(()=>tone(1180, 0.09, 'sine', 0.05), 70); }
function sfxWaveStart(){ tone(220, 0.3, 'sawtooth', 0.07, 440); }
function sfxWaveClear(){ [660,880,1100].forEach((f,i)=> setTimeout(()=>tone(f,0.12,'sine',0.06), i*100)); }
function sfxLifeLost(){ tone(140, 0.22, 'square', 0.07, 90); }
function sfxDefeat(){ tone(300, 1.0, 'sawtooth', 0.07, 50); }
function sfxUiClick(){ tone(500, 0.04, 'triangle', 0.04); }
