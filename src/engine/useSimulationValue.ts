import { useEffect, useState } from 'react';

/**
 * Reads a value from a simulation at most `hz` times per second. Keeps per-frame data out of
 * React while letting the interface show live numbers.
 */
export function useSimulationValue<T>(read: () => T, hz = 8, equal: (a: T, b: T) => boolean = Object.is): T {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = read();
      setValue((prev) => (equal(prev, next) ? prev : next));
    }, 1000 / hz);
    return () => window.clearInterval(id);
  }, [read, hz, equal]);
  return value;
}
