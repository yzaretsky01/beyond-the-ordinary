import { useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ROOMS } from '../../experiments/registry';
import { useProgress } from '../state/progressStore';
import { RoomGlyph } from './RoomGlyph';
import './hall.css';

const DISCOVERIES_PER_ROOM = 5;

/** The museum entrance: a route through five rooms, with each room's discovery progress. */
export default function Hall() {
  const found = useProgress((s) => s.discoveries);
  // fetch the rooms' code while the visitor reads, so entering one is instant
  useEffect(() => {
    const id = window.setTimeout(() => ROOMS.forEach((r) => void r.load?.()), 600);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <main className="hall">
      <header className="hall__intro">
        <p className="hall__kick mono">An interactive exploration of quantum physics</p>
        <h1 className="hall__title">
          Beyond the <span>Ordinary</span>
        </h1>
        <p className="hall__sub">
          Five rooms where you steer real quantum experiments, predict what happens, and find out why.
        </p>
        <div className="hall__key">
          <span className="hall__wheel" aria-hidden="true" />
          <p>
            In every room, <b>colour means phase</b> and <b>brightness means probability</b>.
          </p>
        </div>
      </header>

      <nav aria-label="Rooms">
        <ol className="route">
          {ROOMS.map((r) => {
            const n = (found[r.id] ?? []).length;
            const style = { '--room-accent': `var(--accent-${r.n})` } as CSSProperties;
            const inner = (
              <>
                <span className="route__node mono" aria-hidden="true">
                  {r.n}
                </span>
                <span className="route__glyph">
                  <RoomGlyph id={r.id} />
                </span>
                <span className="route__text">
                  <span className="route__name">{r.title}</span>
                  <span className="route__q">{r.question}</span>
                </span>
                <span className="route__meta">
                  <span
                    className="route__pips"
                    role="img"
                    aria-label={`${n} of ${DISCOVERIES_PER_ROOM} discoveries`}
                  >
                    {Array.from({ length: DISCOVERIES_PER_ROOM }, (_, i) => (
                      <i key={i} data-on={i < n} />
                    ))}
                  </span>
                  <span className="mono route__go">{n > 0 ? 'Continue' : 'Enter'} →</span>
                </span>
              </>
            );
            return (
              <li key={r.id} style={style}>
                <Link to={`/${r.id}`} className="route__room">
                  {inner}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </main>
  );
}
