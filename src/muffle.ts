import { useEffect } from "react";

// Howler eksponerer ikke sine Web Audio-noder i typerne, så vi beskriver kun det, vi rører.
type HowlerGlobal = { ctx?: AudioContext; masterGain?: GainNode };
type HowlInternals = { _webAudio?: boolean; _sounds?: { _node?: AudioNode }[] };

// Frekvensen, diskanten skæres ved, når musikken skal lyde som bag en dør.
const MUFFLED_HZ = 700;
// Tidskonstant for glidningen mellem åben og dæmpet (sekunder).
const GLIDE = 0.12;

const filters = new WeakMap<object, BiquadFilterNode>();
const routed = new WeakSet<AudioNode>();

const filterFor = (howl: HowlInternals): BiquadFilterNode | null => {
  const howler = (globalThis as { Howler?: HowlerGlobal }).Howler;
  const ctx = howler?.ctx;
  const master = howler?.masterGain;
  if (!howl._webAudio || !ctx || !master) return null;

  let filter = filters.get(howl);
  if (!filter) {
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.7;
    filter.frequency.value = ctx.sampleRate / 2;
    filter.connect(master);
    filters.set(howl, filter);
  }

  // Hver lyd i Howls pulje har sin egen gain-node, som Howler forbinder direkte til
  // masterGain. Den flyttes ind gennem filteret; nye lyde kommer med ved næste kald.
  for (const sound of howl._sounds ?? []) {
    const node = sound._node;
    if (!node || routed.has(node)) continue;
    node.disconnect();
    node.connect(filter);
    routed.add(node);
  }
  return filter;
};

/** Skærer diskanten af en Howl (lavpas), mens `muffled` er sand, som hørt gennem en dør. */
export const useMuffle = (sound: unknown, muffled: boolean): void => {
  useEffect(() => {
    if (!sound) return;
    const filter = filterFor(sound as HowlInternals);
    if (!filter) return;
    const ctx = filter.context;
    const target = muffled ? MUFFLED_HZ : ctx.sampleRate / 2;
    filter.frequency.cancelScheduledValues(ctx.currentTime);
    filter.frequency.setTargetAtTime(target, ctx.currentTime, GLIDE);
  }, [sound, muffled]);
};
