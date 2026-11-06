import { groundOf } from '../../engine/ground';
import { useEffect, useRef } from 'react';

/**
 * A tiny picture of a screen: brightness along its height from a profile (index 0 = bottom).
 * Drawn horizontally so it fits in a choice button.
 */
export function MiniPattern({ profile, label }: { profile: number[]; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const w = (c.width = 160);
    const h = (c.height = 44);
    const max = Math.max(...profile, 1e-9);
    ctx.fillStyle = groundOf(c);
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x++) {
      const v = profile[Math.min(profile.length - 1, Math.floor((x / w) * profile.length))] / max;
      ctx.fillStyle = `rgba(255,255,255,${Math.pow(v, 0.8).toFixed(3)})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }, [profile]);
  return <canvas ref={ref} role="img" aria-label={label} />;
}
