import { useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { hall } from '../../content/hall';
import { shared } from '../../content/shared';
import { ROOMS } from '../../experiments/registry';
import { useProgress } from '../state/progressStore';
import { Vignette } from '../../ui/viz/Vignette';
import './hall.css';

const DISCOVERIES_PER_ROOM = 5;

/**
 * Where each room sits in the dark, by hand: [left %, top %] on wide screens.
 * The path between them is drawn through the same points, so it reads as one wandering route.
 */
const PLACE: [number, number][] = [
  [5, 10],
  [27, 54],
  [47, 6],
  [61, 60],
  [80, 24],
];

/** A loose, hand-drawn route through the rooms (viewBox 0–100 in both directions). */
const ROUTE = 'M 9 22 C 14 40, 22 62, 32 66 S 42 30, 51 18 S 60 58, 66 70 S 80 46, 84 32';

/** The museum entrance: five rooms placed along a path in a dark space. */
export default function Hall() {
  const found = useProgress((s) => s.discoveries);
  // fetch the rooms' code while the visitor looks around, so entering one is instant
  useEffect(() => {
    const id = window.setTimeout(() => ROOMS.forEach((r) => void r.load?.()), 600);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <main className="hall">
      <header className="hall__intro">
        <h1 className="hall__title">{hall.title}</h1>
        {hall.intro.map((p) => (
          <p className="hall__line" key={p}>
            {p}
          </p>
        ))}
      </header>

      <nav className="hall__field" aria-label={hall.roomsLabel}>
        <svg className="hall__route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={ROUTE} vectorEffect="non-scaling-stroke" />
        </svg>
        <ol>
          {ROOMS.map((r, i) => {
            const n = (found[r.id] ?? []).length;
            const [x, y] = PLACE[i];
            const style = {
              '--room-accent': `var(--accent-${r.n})`,
              '--x': `${x}%`,
              '--y': `${y}%`,
            } as CSSProperties;
            return (
              <li key={r.id} style={style} className="exhibit">
                <Link to={`/${r.id}`} className="exhibit__link">
                  <Vignette id={r.id} />
                  <span className="exhibit__name">
                    <span className="exhibit__n" aria-hidden="true">
                      {i + 1}
                    </span>
                    {r.title}
                  </span>
                  <span className="exhibit__q">{r.question}</span>
                  <span className="exhibit__def">{hall.definitions[r.id]}</span>
                  {n > 0 && (
                    <span className="exhibit__found">
                      {hall.found.replace('{n}', String(n)).replace('{total}', String(DISCOVERIES_PER_ROOM))}
                    </span>
                  )}
                </Link>
                <Link
                  to={`/${r.id}/about`}
                  className="exhibit__about caps"
                  aria-label={`${shared.about}: ${r.title}`}
                >
                  {shared.about} <span aria-hidden="true">→</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </main>
  );
}
