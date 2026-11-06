/**
 * The room's ground colour (the CSS token --room-ground), read once per canvas.
 * Stages paint it under the physics so each room keeps its own ground behind the data.
 */
const cache = new WeakMap<Element, string>();

export function groundOf(el: Element): string {
  let c = cache.get(el);
  if (!c) {
    c = getComputedStyle(el).getPropertyValue('--room-ground').trim() || '#0d0c0b';
    cache.set(el, c);
  }
  return c;
}
