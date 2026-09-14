/* =========================================================================
   audio.js — tiny WebAudio SFX synth (no external audio files needed)
   ========================================================================= */

const SETTINGS = JSON.parse(localStorage.getItem('cvd_settings')||'null') || {sound:true};

function saveSettings(){
  localStorage.setItem('cvd_settings', JSON.stringify(SETTINGS));
}

const Audio2 = {
  ctx: null,
  ensure(){ if (!this.ctx){ try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){} } },
  tone(freq, dur, type, gain){
    if (!SETTINGS.sound) return;
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain!=null?gain:0.15, t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t0); osc.stop(t0+dur+0.02);
  },
  place(){ this.tone(520,0.12,'triangle'); },
  attack(freq){ this.tone(freq||300,0.06,'square',0.06); },
  hit(){ this.tone(180,0.08,'sawtooth',0.08); },
  death(){ this.tone(110,0.25,'sawtooth',0.1); },
  coin(){ this.tone(880,0.08,'sine',0.08); this.tone(1180,0.09,'sine',0.06); },
  upgrade(){ this.tone(440,0.1,'triangle'); this.tone(660,0.14,'triangle'); },
  waveStart(){ this.tone(300,0.15,'square'); this.tone(500,0.2,'square'); },
  win(){ [523,659,784,1046].forEach((f,i)=> setTimeout(()=>this.tone(f,0.3,'triangle',0.12), i*110)); },
  lose(){ [400,340,280,220].forEach((f,i)=> setTimeout(()=>this.tone(f,0.35,'sawtooth',0.1), i*140)); },
  click(){ this.tone(700,0.05,'square',0.05); },
  bark(){ this.tone(160,0.09,'square',0.07); },
};
