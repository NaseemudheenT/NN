"use client";

/**
 * The engine that actually makes the sound.
 *
 * One AudioContext for the life of the page, one convolution reverb standing
 * in for the room, one looping bed of air, and a scheduler that touches a tone
 * every eight to thirty seconds. Changing soundscape cross-fades the tonal bed
 * and re-tunes the air filter; it never stops and restarts, because a room
 * whose sound stops is a room you have left.
 *
 * Browsers will not let audio start without a gesture, and they are right to.
 * Nothing here starts on its own: `resume()` is called from the first real
 * interaction, and until then the engine simply sits armed.
 */

import {
  buildAirBuffer,
  buildRoomImpulse,
  soundscapeById,
  type SoundscapeDef,
  type SoundscapeId,
} from "./soundscape";

export type EngineState = "idle" | "armed" | "playing" | "suspended" | "unsupported";

const FADE = 2.5;

export class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private airGain: GainNode | null = null;
  private airFilter: BiquadFilterNode | null = null;
  private airSource: AudioBufferSourceNode | null = null;
  private toneBus: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private current: SoundscapeDef | null = null;
  private targetVolume = 0.75;

  state: EngineState = "idle";

  /** Build the graph. Safe to call more than once. */
  init(): boolean {
    if (this.ctx) return true;
    const Ctor =
      typeof window !== "undefined"
        ? window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctor) {
      this.state = "unsupported";
      return false;
    }

    const ctx = new Ctor();
    this.ctx = ctx;

    // master → analyser → destination
    const master = ctx.createGain();
    master.gain.value = 0;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    master.connect(analyser);
    analyser.connect(ctx.destination);
    this.master = master;
    this.analyser = analyser;

    // the room: a convolver fed by a send, so the dry signal survives
    const convolver = ctx.createConvolver();
    convolver.buffer = buildRoomImpulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.85;
    wet.connect(convolver);
    convolver.connect(master);
    this.wet = wet;

    // the air: a looping pink-noise bed through a gentle low-pass
    const air = ctx.createBufferSource();
    air.buffer = buildAirBuffer(ctx);
    air.loop = true;
    const airFilter = ctx.createBiquadFilter();
    airFilter.type = "lowpass";
    airFilter.frequency.value = 700;
    airFilter.Q.value = 0.5;
    const airGain = ctx.createGain();
    airGain.gain.value = 0;
    air.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(master);
    airGain.connect(wet);
    air.start();
    this.airSource = air;
    this.airFilter = airFilter;
    this.airGain = airGain;

    // the tones
    const toneBus = ctx.createGain();
    toneBus.gain.value = 1;
    toneBus.connect(master);
    toneBus.connect(wet);
    this.toneBus = toneBus;

    this.state = ctx.state === "running" ? "playing" : "armed";
    return true;
  }

  /** Called from a user gesture. Returns true once sound is actually running. */
  async resume(): Promise<boolean> {
    if (!this.init() || !this.ctx || !this.master) return false;
    if (this.ctx.state === "suspended") {
      try {
        await this.ctx.resume();
      } catch {
        return false;
      }
    }
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    // A long fade in. Sound that arrives is atmosphere; sound that starts is
    // an advertisement.
    this.master.gain.linearRampToValueAtTime(this.targetVolume, now + FADE * 2);
    this.state = "playing";
    if (this.current) this.schedule();
    return true;
  }

  /** Fade out and stop scheduling, keeping the graph alive. */
  async suspend(): Promise<void> {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.0001, now + 1.2);
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.state = "suspended";
  }

  setVolume(v: number) {
    this.targetVolume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.master && this.state === "playing") {
      const now = this.ctx.currentTime;
      this.master.gain.linearRampToValueAtTime(this.targetVolume, now + 0.4);
    }
  }

  /** Move to another soundscape without a gap. */
  select(id: SoundscapeId) {
    if (!this.init() || !this.ctx || !this.airGain || !this.airFilter) return;
    const def = soundscapeById(id);
    if (this.current?.id === def.id) return;
    this.current = def;

    const now = this.ctx.currentTime;
    this.airGain.gain.cancelScheduledValues(now);
    this.airGain.gain.setValueAtTime(this.airGain.gain.value, now);
    this.airGain.gain.linearRampToValueAtTime(def.airLevel, now + FADE);

    this.airFilter.frequency.cancelScheduledValues(now);
    this.airFilter.frequency.setValueAtTime(this.airFilter.frequency.value, now);
    this.airFilter.frequency.linearRampToValueAtTime(def.airCutoff, now + FADE);

    if (this.state === "playing") this.schedule();
  }

  /** Bars for the wave indicator: 0–1, low frequencies first. */
  levels(into: Uint8Array): number {
    if (!this.analyser || this.state !== "playing") return 0;
    const bins = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(bins);
    let peak = 0;
    for (let i = 0; i < into.length; i++) {
      // The interesting energy is all in the bottom eighth of the spectrum.
      const from = Math.floor((i / into.length) * (bins.length / 8));
      const to = Math.floor(((i + 1) / into.length) * (bins.length / 8));
      let sum = 0;
      let n = 0;
      for (let j = from; j <= to && j < bins.length; j++) {
        sum += bins[j];
        n++;
      }
      const v = n ? sum / n : 0;
      into[i] = v;
      if (v > peak) peak = v;
    }
    return peak / 255;
  }

  /**
   * A knock.
   *
   * Not a click — a soft wooden knock, which is what a hand on a hanger or
   * a door in a stone hall actually sounds like. Two partials a fifth
   * apart, struck and damped in forty milliseconds, through the same
   * convolver as everything else so it lands in THIS room rather than in
   * the listener's headphones.
   *
   * ── when it is silent ───────────────────────────────────────────────
   * Whenever the room tone is. There is one decision on this site about
   * whether Nero Noren makes a noise, the customer made it, and a button
   * that beeps at someone who turned the sound off is that decision being
   * overruled by a detail.
   */
  knock(strength = 1) {
    if (this.state !== "playing" || !this.ctx || !this.toneBus) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    for (const [ratio, level] of [[1, 1], [1.5, 0.42]] as const) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880 * ratio, now);
      osc.frequency.exponentialRampToValueAtTime(420 * ratio, now + 0.05);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045 * level * strength, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.toneBus);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    try {
      this.airSource?.stop();
    } catch {
      /* already stopped */
    }
    void this.ctx?.close();
    this.ctx = null;
    this.state = "idle";
  }

  /* ── the scheduler ────────────────────────────────────────────── */

  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    const def = this.current;
    if (!def || this.state !== "playing") return;

    const [lo, hi] = def.restSeconds;
    const wait = (lo + Math.random() * (hi - lo)) * 1000;
    this.timer = setTimeout(() => {
      this.touch(def);
      this.schedule();
    }, wait);
  }

  /** One note, allowed to ring out into the room. */
  private touch(def: SoundscapeDef) {
    const ctx = this.ctx;
    const bus = this.toneBus;
    if (!ctx || !bus) return;

    const ratio = def.voicing[Math.floor(Math.random() * def.voicing.length)];
    const freq = def.root * ratio;
    const now = ctx.currentTime;
    const length = def.struck ? 7 : 12;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(bus);

    // Three partials at the natural harmonic ratios, each quieter and shorter
    // than the last — which is, roughly, what a string does.
    [1, 2, 3].forEach((partial, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = freq * partial;
      // a few cents of detune, so two touches never phase identically
      osc.detune.value = (Math.random() - 0.5) * 6;

      const partialGain = ctx.createGain();
      partialGain.gain.value = 1 / (partial * partial * 1.6);
      osc.connect(partialGain);
      partialGain.connect(gain);

      osc.start(now);
      osc.stop(now + length + 0.4);
    });

    const peak = def.gain * (0.7 + Math.random() * 0.3);
    if (def.struck) {
      // a hammer: fast attack, long exponential tail
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
    } else {
      // a bow: it arrives rather than starts
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + length * 0.34);
      gain.gain.linearRampToValueAtTime(0.0001, now + length);
    }

    setTimeout(() => gain.disconnect(), (length + 1) * 1000);
  }
}

/** One engine per page. */
let shared: SoundscapeEngine | null = null;

export function getSoundscapeEngine(): SoundscapeEngine {
  if (!shared) shared = new SoundscapeEngine();
  return shared;
}
