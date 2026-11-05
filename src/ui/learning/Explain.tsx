import { Link } from 'react-router-dom';
import { shared } from '../../content/shared';
import { LiveEquation } from '../math/LiveEquation';
import { Reveal } from './Learning';
import { Rich } from './Rich';

export interface WaitWhyItem {
  q: string;
  body: string;
  /** For analogies: where the picture stops being true */
  limits?: string;
}

/** Expandable "Wait, why…?" answers to the questions a newcomer is likely to have. */
export function WaitWhy({ items }: { items: readonly WaitWhyItem[] }) {
  return (
    <div className="panel__block">
      <p className="panel__lbl">{shared.waitWhy}</p>
      {items.map((w) => (
        <Reveal key={w.q} title={w.q}>
          <p className="ww__body">
            <Rich text={w.body} />
          </p>
          {w.limits && (
            <p className="ww__limits">
              <strong>{shared.analogyLimit}</strong> <Rich text={w.limits} />
            </p>
          )}
        </Reveal>
      ))}
    </div>
  );
}

/** A short historical story that makes the idea feel human. */
export function Story({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel__block">
      <p className="panel__lbl">{shared.story}</p>
      <div className="story">
        <strong>{title}</strong>
        <p>
          <Rich text={body} />
        </p>
      </div>
    </div>
  );
}

/** Optional one-equation peek; the panel's "See all the math" button leads to Go deeper. */
export function MathTeaser({ tex, label, reading }: { tex: string; label: string; reading: string }) {
  return (
    <div className="panel__block">
      <Reveal title={shared.showMath}>
        <LiveEquation tex={tex} label={label} reading={<Rich text={reading} />} />
      </Reveal>
    </div>
  );
}

export function RealWorld({ items }: { items: readonly { id: string; title: string; body: string }[] }) {
  return (
    <div className="panel__block">
      <p className="panel__lbl">{shared.world}</p>
      {items.map((r) => (
        <Reveal key={r.id} title={r.title}>
          <Rich text={r.body} />
        </Reveal>
      ))}
    </div>
  );
}

/** The opening panel every room shares. */
export function WonderPanel({
  question,
  ledes,
  buildsOn,
  onStart,
}: {
  question: string;
  ledes: readonly string[];
  buildsOn: { text: string; room?: { to: string; label: string } };
  onStart: () => void;
}) {
  return (
    <div className="panel">
      <p className="panel__lbl">Wonder</p>
      <h2 className="panel__big">{question}</h2>
      {ledes.map((l) => (
        <p className="panel__lede" key={l}>
          <Rich text={l} />
        </p>
      ))}
      <p className="builds-on">
        <span className="panel__lbl">{buildsOn.room ? shared.buildsOn : shared.startHere}</span>{' '}
        <Rich text={buildsOn.text} />
        {buildsOn.room && (
          <>
            {' '}
            <Link to={buildsOn.room.to}>{buildsOn.room.label}</Link>
          </>
        )}
      </p>
      <div className="panel__row">
        <button type="button" className="btn btn--primary" onClick={onStart}>
          {shared.makePrediction} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
