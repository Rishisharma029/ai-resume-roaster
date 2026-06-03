// Pure Web Audio API Sound Synthesizer
// Provides interactive sci-fi sound effects without network assets.

let audioCtx = null;
let isMuted = localStorage.getItem('roaster_muted') === 'true';

// Helper to initialize or resume audio context
function getAudioContext() {
  if (isMuted) return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const soundSynthesizer = {
  setMuted(muted) {
    isMuted = muted;
    localStorage.setItem('roaster_muted', muted ? 'true' : 'false');
    if (muted && audioCtx) {
      audioCtx.close().then(() => {
        audioCtx = null;
      });
    }
  },

  getMuted() {
    return isMuted;
  },

  // Mechanical keyboard click
  playKeyClick() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    // pitch decay
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  },

  // Soft futuristic UI hover tick
  playHover() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  },

  // Laser scanner sweep (0.8 seconds duration)
  playScanSweep() {
    const ctx = getAudioContext();
    if (!ctx) return null;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.8);
    filter.Q.setValueAtTime(8, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.85);

    return {
      stop: () => {
        try {
          osc.stop();
        } catch (e) {
          // already stopped
        }
      }
    };
  },

  // Heavy sub-bass drop impact
  playBassDrop() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.2);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.3);
  },

  // Short sci-fi glitch sound
  playGlitch() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = 0.3;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'square';
    
    // Play multiple random frequency bursts
    for (let i = 0; i < 6; i++) {
      const time = now + (i * 0.05);
      const freq = 400 + Math.random() * 2000;
      osc.frequency.setValueAtTime(freq, time);
    }

    gainNode.gain.setValueAtTime(0.04, now);
    gainNode.gain.setValueAtTime(0.04, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(now + duration + 0.05);
  },

  // Achievement unlock chime
  playUnlock() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (ascending major chord)
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gainNode.gain.setValueAtTime(0.0, now);
      gainNode.gain.linearRampToValueAtTime(0.08, now + index * 0.08 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.4);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.55);
    });
  }
};
