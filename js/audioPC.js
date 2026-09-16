// ============================================================
// SIMPLE GAME AUDIO
// ============================================================

let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  return audioCtx;
}

function tone(
  frequency,
  duration,
  type = "sine",
  volume = 0.04,
  endFrequency = null
) {
  const ctx = ensureAudio();

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;

  oscillator.frequency.setValueAtTime(
    frequency,
    ctx.currentTime
  );

  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, endFrequency),
      ctx.currentTime + duration
    );
  }

  gain.gain.setValueAtTime(
    0.0001,
    ctx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    ctx.currentTime + 0.01
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();

  oscillator.stop(
    ctx.currentTime + duration + 0.02
  );
}

function sfxFire() {
  tone(650, 0.06, "square", 0.025, 420);
}

function sfxHit() {
  tone(180, 0.05, "square", 0.025, 120);
}

function sfxDeath() {
  tone(280, 0.10, "sine", 0.035, 100);
}

function sfxPlace() {
  tone(500, 0.08, "triangle", 0.04, 700);
}

function sfxCoin() {
  tone(800, 0.07, "sine", 0.035);
  setTimeout(() => {
    tone(1100, 0.08, "sine", 0.035);
  }, 70);
}

function sfxWaveStart() {
  tone(220, 0.18, "triangle", 0.04, 440);
}

function sfxWaveClear() {
  tone(600, 0.10, "sine", 0.04);
  setTimeout(() => tone(800, 0.10, "sine", 0.04), 90);
  setTimeout(() => tone(1000, 0.14, "sine", 0.04), 180);
}

function sfxLifeLost() {
  tone(150, 0.18, "square", 0.04, 80);
}

function sfxDefeat() {
  tone(260, 0.6, "sawtooth", 0.035, 55);
}

function sfxUiClick() {
  tone(480, 0.035, "triangle", 0.025);
}
