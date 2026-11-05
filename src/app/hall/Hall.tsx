import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROOMS } from '../../experiments/registry';
import { useProgress } from '../state/progressStore';
import './hall.css';

/** Minimal hall for now; the full living homepage is a later phase. */
export default function Hall() {
  const found = useProgress((s) => s.discoveries);
  // fetch the open rooms' code while the visitor reads, so entering one is instant
  useEffect(() => {
    const id = window.setTimeout(() => ROOMS.forEach((r) => void r.load?.()), 600);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <main className="hall">
      <p className="hall__kick mono">An interactive exploration of quantum physics</p>
      <h1 className="hall__title">Beyond the Ordinary</h1>
      <p className="hall__sub">
        Five rooms where you steer real quantum experiments, predict what happens, and find out why.
      </p>
      <div className="hall__key">
        <span className="hall__wheel" aria-hidden="true" />
        <p>
          In every room, <b>colour means phase</b> and <b>brightness means probability</b>.
        </p>
      </div>
      <ol className="hall__rooms">
        {ROOMS.map((r) => {
          const n = (found[r.id] ?? []).length;
          const inner = (
            <>
              <span className="mono hall__n">{r.n}</span>
              <span className="hall__name">{r.title}</span>
              <span className="hall__q">{r.question}</span>
              <span className="hall__meta mono">
                {r.load ? (n > 0 ? `${n} of 5 discoveries` : 'Enter →') : 'Opening soon'}
              </span>
            </>
          );
          return (
            <li key={r.id}>
              {r.load ? (
                <Link to={`/${r.id}`} className="hall__room">
                  {inner}
                </Link>
              ) : (
                <div className="hall__room" aria-disabled="true">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
