import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import './room.css';

export const STEPS = ['wonder', 'predict', 'experiment', 'explain', 'deeper'] as const;
export type StepId = (typeof STEPS)[number];
export const STEP_LABELS: Record<StepId, string> = {
  wonder: 'Wonder',
  predict: 'Predict',
  experiment: 'Experiment',
  explain: 'Explain',
  deeper: 'Go deeper',
};

interface RoomProps {
  number: string;
  title: string;
  step: StepId;
  onStep: (s: StepId) => void;
  stage: ReactNode;
  panel: ReactNode;
  /** Text read out politely to screen readers when the result changes */
  liveText: string;
  toast: { title: string; body: string } | null;
}

/** The shell every room uses: header with step rail, a full-height stage, and a side panel. */
export function ExperimentRoom({ number, title, step, onStep, stage, panel, liveText, toast }: RoomProps) {
  const panelRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  // When a step change removes the control that had focus (e.g. "Make a prediction"), focus would
  // fall to the page body and keyboard users would lose their place. Move it to the new panel instead.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const active = document.activeElement;
    if (!active || active === document.body) panelRef.current?.focus({ preventScroll: true });
  }, [step]);
  return (
    <div className="room" data-room={number}>
      <header className="room__head">
        <Link to="/" className="room__back">
          <span aria-hidden="true">←</span> Hall
        </Link>
        <div className="room__title">
          <span className="room__num mono">{number}</span>
          <h1>{title}</h1>
        </div>
        <nav className="rail" aria-label="Steps">
          <ol>
            {STEPS.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  aria-current={s === step ? 'step' : undefined}
                  data-done={STEPS.indexOf(step) > i}
                  onClick={() => onStep(s)}
                >
                  {STEP_LABELS[s]}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      <main className="room__body">
        <section className="room__stage" aria-label="Experiment stage">
          {stage}
        </section>
        <aside ref={panelRef} tabIndex={-1} className="room__panel" aria-label={`${STEP_LABELS[step]} panel`}>
          {panel}
        </aside>
      </main>
      <Toast toast={toast} />
      <p className="visually-hidden" aria-live="polite">
        {liveText}
      </p>
    </div>
  );
}

function Toast({ toast }: { toast: { title: string; body: string } | null }) {
  const [shown, setShown] = useState(toast);
  useEffect(() => {
    if (!toast) return;
    setShown(toast);
    const id = window.setTimeout(() => setShown(null), 6000);
    return () => window.clearTimeout(id);
  }, [toast]);
  return (
    <div className="toast" role="status">
      {shown && (
        <div className="toast__card" key={shown.title}>
          <span className="toast__kicker mono">Discovery</span>
          <strong>{shown.title}</strong>
          <span>{shown.body}</span>
        </div>
      )}
    </div>
  );
}
