/**
 * Page-turn sound using the real audio file at /page-turn.mp3.
 * Falls back to WebAudio synthesis if the file fails to load.
 */

let _audio: HTMLAudioElement | null = null;
let _loaded = false;
let _loadFailed = false;

// Preload the audio file
function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (_audio) return _audio;
  try {
    _audio = new Audio("/page-turn.mp3");
    _audio.preload = "auto";
    _audio.addEventListener("canplaythrough", () => { _loaded = true; });
    _audio.addEventListener("error", () => { _loadFailed = true; });
    _audio.load();
    return _audio;
  } catch {
    _loadFailed = true;
    return null;
  }
}

// ── WebAudio fallback (synthesized page turn) ──
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return _ctx;
}

function noiseBuffer(ctx: AudioContext, dur: number): AudioBuffer {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  return buf;
}

function playFallback(volume: number) {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);

    // Snap
    {
      const dur = 0.04;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, dur);
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 4000;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.7, now);
      env.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(hp).connect(env).connect(master);
      src.start(now);
      src.stop(now + dur);
    }
    // Swish
    {
      const dur = 0.35;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, dur);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.setValueAtTime(5000, now + 0.02);
      bp.frequency.exponentialRampToValueAtTime(1200, now + dur * 0.8);
      bp.Q.value = 1.2;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, now);
      env.gain.linearRampToValueAtTime(0.55, now + 0.06);
      env.gain.setValueAtTime(0.55, now + 0.10);
      env.gain.exponentialRampToValueAtTime(0.001, now + dur);
      src.connect(bp).connect(env).connect(master);
      src.start(now + 0.015);
      src.stop(now + dur + 0.015);
    }
    // Land
    {
      const dur = 0.15;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, dur);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 800;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, now + 0.25);
      env.gain.linearRampToValueAtTime(0.4, now + 0.28);
      env.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + dur);
      src.connect(lp).connect(env).connect(master);
      src.start(now + 0.25);
      src.stop(now + 0.25 + dur);
    }
  } catch {
    /* silent */
  }
}

export function playPageTurn(volume = 0.6) {
  if (typeof window === "undefined") return;

  const audio = getAudio();

  // Try playing the real audio file
  if (audio && !_loadFailed) {
    try {
      // Clone for overlapping playback (rapid page flips)
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = Math.min(volume, 1);
      clone.playbackRate = 1.8; // fast, snappy page turn
      clone.currentTime = 0;
      clone.play().catch(() => {
        // Autoplay blocked or file not ready — try fallback
        playFallback(volume);
      });
      // Stop after 0.8 seconds for a quick page-turn burst
      setTimeout(() => {
        try { clone.pause(); clone.currentTime = 0; } catch {}
      }, 800);
      return;
    } catch {
      // Fall through to synthesis
    }
  }

  // Fallback to synthesized sound
  playFallback(volume);
}

/**
 * React hook that returns a play function gated by `enabled`.
 */
export function usePageTurnSound(enabled: boolean, volume = 0.6) {
  // Eagerly preload on hook init
  if (enabled) getAudio();

  return () => {
    if (!enabled) return;
    playPageTurn(volume);
  };
}
