import { useState, type ReactNode } from 'react';
import './learning.css';
import { Rich } from './Rich';
import { shared } from '../../content/shared';

export interface Choice {
  id: string;
  label: string;
  preview?: ReactNode;
}

/** A set of visual options; used for predictions and knowledge checks. */
export function ChoiceGroup({
  legend,
  choices,
  value,
  onChange,
  state,
}: {
  legend: ReactNode;
  choices: Choice[];
  value: string | null;
  onChange: (id: string) => void;
  /** After answering, mark the right/wrong choice */
  state?: { correct: string; answered: boolean };
}) {
  return (
    <fieldset className="choices">
      <legend>{legend}</legend>
      <div className="choices__grid">
        {choices.map((c) => {
          const mark = state?.answered
            ? c.id === state.correct
              ? 'right'
              : c.id === value
                ? 'wrong'
                : ''
            : '';
          return (
            <label key={c.id} className="choice" data-picked={value === c.id} data-mark={mark}>
              <input
                type="radio"
                name={String(legend)}
                checked={value === c.id}
                onChange={() => onChange(c.id)}
              />
              {c.preview && <span className="choice__preview">{c.preview}</span>}
              <span>{c.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export interface CheckSpec {
  id: string;
  question: string;
  choices: Choice[];
  correct: string;
  right: string;
  wrong: string;
  tryLabel: string;
}

/** A quick question answered on the spot, then shown on the stage. */
export function KnowledgeCheck({
  spec,
  onTry,
  onAnswer,
}: {
  spec: CheckSpec;
  onTry: () => void;
  onAnswer?: (ok: boolean) => void;
}) {
  const [value, setValue] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const ok = value === spec.correct;
  return (
    <div className="check">
      <ChoiceGroup
        legend={spec.question}
        choices={spec.choices}
        value={value}
        onChange={(v) => {
          if (answered) return;
          setValue(v);
        }}
        state={{ correct: spec.correct, answered }}
      />
      {!answered ? (
        <button
          type="button"
          className="btn"
          disabled={!value}
          onClick={() => {
            setAnswered(true);
            onAnswer?.(ok);
          }}
        >
          Check my answer
        </button>
      ) : (
        <div className="check__feedback" role="status" data-ok={ok}>
          <p>{ok ? spec.right : spec.wrong}</p>
          <div className="panel__row">
            <button type="button" className="btn btn--primary" onClick={onTry}>
              {spec.tryLabel}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAnswered(false);
                setValue(null);
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export interface ChallengeView {
  id: string;
  text: string;
  done: boolean;
}

export function ChallengeList({ items }: { items: ChallengeView[] }) {
  return (
    <ul className="challenges">
      {items.map((c) => (
        <li key={c.id} data-done={c.done}>
          <span className="challenges__mark" aria-hidden="true">
            {c.done ? '✓' : '–'}
          </span>
          <span>
            {c.text}
            <span className="visually-hidden">{c.done ? ' (done)' : ' (not yet)'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Found discoveries by name; the rest stay unnamed, so there is something left to look for. */
export function DiscoveryLog({ all, found }: { all: { id: string; title: string }[]; found: string[] }) {
  const named = all.filter((d) => found.includes(d.id));
  const left = all.length - named.length;
  return (
    <p className="discoveries">
      {named.map((d) => (
        <em key={d.id}>{d.title}</em>
      ))}
      {left > 0 && (
        <span className="discoveries__left">
          {(named.length ? shared.discoveriesMore : shared.discoveriesNone).replace('{n}', String(left))}
        </span>
      )}
    </p>
  );
}

/** Expandable "what this model simplifies" note. */
export function ModelNote({
  summary,
  items,
}: {
  summary: string;
  items: { label: string; points: string[] }[];
}) {
  return (
    <details className="model-note">
      <summary>{summary}</summary>
      {items.map((g) => (
        <div key={g.label}>
          <p className="panel__lbl">{g.label}</p>
          <ul>
            {g.points.map((pt) => (
              <li key={pt}>
                <Rich text={pt} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </details>
  );
}

/** A row that reveals a short text when opened. */
export function Reveal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="reveal">
      <summary>{title}</summary>
      <div className="reveal__body">{children}</div>
    </details>
  );
}
