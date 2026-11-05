import { useEffect, useRef } from 'react';

/**
 * Calls `onFrame(dt, t)` every animation frame while `active` is true and the tab is visible.
 * dt is clamped so a long pause (tab switch, breakpoint) does not cause a jump.
 */
export function useFrameLoop(onFrame: (dt: number, t: number) => void, active = true): void {
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) {
        t += dt;
        cb.current(dt, t);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
