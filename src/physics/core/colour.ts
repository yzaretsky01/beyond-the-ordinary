/**
 * Colour maps with scientific meaning.
 * - wavelengthToRgb: approximate perceived colour of monochromatic visible light.
 * - phase colour map: a smooth cyclic map so equal phase steps look like equal hue steps.
 */
export type Rgb = [number, number, number];

/** Approximate sRGB colour of light of the given wavelength (380–780 nm), brightened for a dark background. */
export function wavelengthToRgb(nm: number): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm < 440) {
    r = (440 - nm) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = (510 - nm) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = (645 - nm) / 65;
  } else {
    r = 1;
  }
  const fade = nm > 700 ? Math.max(0, 1 - (nm - 700) / 80) : nm < 420 ? 0.4 + (0.6 * (nm - 380)) / 40 : 1;
  return [r, g, b].map((c) => Math.round(255 * (0.1 + 0.9 * Math.pow(Math.max(0, c) * fade, 0.8)))) as Rgb;
}

export const PHASE_LUT_SIZE = 256;

/** Cyclic "sinebow" lookup table: index 0..255 ↔ phase 0..2π. Stored as r,g,b triples. */
export const PHASE_LUT: Uint8Array = (() => {
  const lut = new Uint8Array(PHASE_LUT_SIZE * 3);
  for (let i = 0; i < PHASE_LUT_SIZE; i++) {
    const t = 0.5 - i / PHASE_LUT_SIZE;
    lut[i * 3] = Math.round(255 * (0.08 + 0.92 * Math.sin(Math.PI * t) ** 2));
    lut[i * 3 + 1] = Math.round(255 * (0.08 + 0.92 * Math.sin(Math.PI * (t + 1 / 3)) ** 2));
    lut[i * 3 + 2] = Math.round(255 * (0.08 + 0.92 * Math.sin(Math.PI * (t + 2 / 3)) ** 2));
  }
  return lut;
})();

/** LUT index for a phase angle in radians (any real value). */
export function phaseIndex(phase: number): number {
  const turns = phase / (2 * Math.PI);
  return Math.floor((turns - Math.floor(turns)) * PHASE_LUT_SIZE) % PHASE_LUT_SIZE;
}

export function phaseToRgb(phase: number): Rgb {
  const i = phaseIndex(phase) * 3;
  return [PHASE_LUT[i], PHASE_LUT[i + 1], PHASE_LUT[i + 2]];
}
