// Pure Web Audio API Sound Synthesizer
// Provides interactive sci-fi sound effects without network assets.

let audioCtx = null;
let isMuted = localStorage.getItem('roaster_muted') === 'true';
let podcastInterval = null;
let activeOscillators = [];

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
  },

  playDiscordPing() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [880, 680];
    const times = [0, 0.08];
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + times[idx]);
      gainNode.gain.setValueAtTime(0.06, now + times[idx]);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + times[idx] + 0.2);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + times[idx]);
      osc.stop(now + times[idx] + 0.25);
    });
  },

  playKeyboardSpam() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      const delay = Math.random() * 1.2;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now + delay);
      osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.04);
      gainNode.gain.setValueAtTime(0.04, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.05);
    }
  },

  playDeepSigh() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const duration = 1.5;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + duration);
    filter.Q.setValueAtTime(2.0, now);
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0, now);
    gainNode.gain.linearRampToValueAtTime(0.1, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + duration + 0.1);
  },

  playPodcastMusic() {
    const ctx = getAudioContext();
    if (!ctx) return { stop: () => {} };
    
    if (podcastInterval) {
      clearInterval(podcastInterval);
      podcastInterval = null;
    }
    
    const playChord = (chordNotes, startTime) => {
      chordNotes.forEach(freq => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gainNode.gain.setValueAtTime(0.0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.03, startTime + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 2.8);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 3.0);
        activeOscillators.push(osc);
      });
    };
    
    const chords = [
      [110.00, 130.81, 164.81, 196.00], // Am7
      [146.83, 185.00, 220.00, 261.63], // D7
      [98.00, 246.94, 293.66, 369.99],  // Gmaj7
      [130.81, 164.81, 196.00, 246.94]  // Cmaj7
    ];
    
    let chordIndex = 0;
    const intervalTime = 3000;
    const nextChord = () => {
      const now = ctx.currentTime;
      playChord(chords[chordIndex], now);
      chordIndex = (chordIndex + 1) % chords.length;
    };
    
    nextChord();
    podcastInterval = setInterval(nextChord, intervalTime);
    
    return {
      stop: () => {
        if (podcastInterval) {
          clearInterval(podcastInterval);
          podcastInterval = null;
        }
        activeOscillators.forEach(osc => {
          try { osc.stop(); } catch(e) {}
        });
        activeOscillators = [];
      }
    };
  }
};
