/**
 * Inverse-CDF sampling from a tabulated probability density.
 * Used to draw individual particle arrivals from the Born-rule distribution.
 */
export interface SamplingTable {
  /** Bin edges' lower values, length n */
  xs: Float64Array;
  /** Bin width */
  dx: number;
  /** Cumulative probability at the END of each bin, length n, last value = 1 */
  cdf: Float64Array;
  /** Integral of the (unnormalised) density over the range */
  total: number;
}

/** Build a table on [min, max] with n bins using the midpoint value of `density` in each bin. */
export function buildSamplingTable(
  density: (x: number) => number,
  min: number,
  max: number,
  n: number,
): SamplingTable {
  const xs = new Float64Array(n);
  const cdf = new Float64Array(n);
  const dx = (max - min) / n;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    xs[i] = min + i * dx;
    const v = density(min + (i + 0.5) * dx);
    if (!(v >= 0)) throw new Error(`density must be non-negative, got ${v}`);
    acc += v * dx;
    cdf[i] = acc;
  }
  if (acc <= 0) throw new Error('density integrates to zero');
  for (let i = 0; i < n; i++) cdf[i] /= acc;
  cdf[n - 1] = 1;
  return { xs, dx, cdf, total: acc };
}

/** Draw one sample. `u1` picks the bin, `u2` places the sample uniformly inside it. */
export function sampleTable(t: SamplingTable, u1: number, u2: number): number {
  let lo = 0;
  let hi = t.cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (t.cdf[mid] < u1) lo = mid + 1;
    else hi = mid;
  }
  return t.xs[lo] + u2 * t.dx;
}
