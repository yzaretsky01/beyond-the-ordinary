import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { pSame, type Source } from '../../physics/entanglement/bell';
import { useSimulationValue } from '../../engine/useSimulationValue';
import { useProgress } from '../../app/state/progressStore';
import { ParamSlider, Segmented } from '../../ui/controls/Controls';
import { InfoTip } from '../../ui/glossary/Popover';
import { ChallengeList, DiscoveryLog, KnowledgeCheck, ModelNote, Reveal } from '../../ui/learning/Learning';
import { LiveEquation } from '../../ui/math/LiveEquation';
import { MathTeaser, RealWorld, Story, WaitWhy, WonderPanel } from '../../ui/learning/Explain';
import { Rich } from '../../ui/learning/Rich';
import { shared } from '../../content/shared';
import { ExperimentRoom, type StepId } from '../../ui/room/ExperimentRoom';
import { content } from './content';
import { EntanglementStage } from './EntanglementStage';
import { challengeDone, describe, unlockedDiscoveries } from './learning';
import {
  ANGLE_RANGE,
  DEFAULT_PARAMS,
  EntanglementSimulation,
  RATE_RANGE,
  type EntanglementDerived,
  type EntanglementParams,
  type Mode,
} from './simulation';

const ROOM = 'entanglement';
const same = (a: EntanglementDerived, b: EntanglementDerived) =>
  a.pairs === b.pairs &&
  a.streaming === b.streaming &&
  a.rate === b.rate &&
  a.pSameTheory === b.pSameTheory &&
  a.STheory === b.STheory;
const pct = (x: number) => `${Math.round(x * 100)}%`;

function MiniBars({ values, label }: { values: number[]; label: string }) {
  const w = 80 / values.length;
  return (
    <svg viewBox="0 0 80 44" role="img" aria-label={label}>
      {values.map((v, i) => (
        <g key={i}>
          <rect x={i * w + 6} y={4 + 36 * (1 - v)} width={w - 12} height={36 * v} fill="#fff" />
          <rect x={i * w + 6} y={4} width={w - 12} height={36} fill="none" stroke="rgba(233,234,255,0.35)" />
        </g>
      ))}
    </svg>
  );
}

export default function EntanglementRoom() {
  const [sim] = useState(() => new EntanglementSimulation());
  const [params, setParams] = useState<EntanglementParams>(sim.params);
  const [step, setStep] = useState<StepId>('wonder');
  const [guess, setGuess] = useState(50);
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const [liveText, setLiveText] = useState('');
  const bobTurned = useRef(false);
  const progress = useProgress();
  const found = progress.discoveries[ROOM] ?? [];
  const done = progress.challenges[ROOM] ?? [];

  useEffect(() => sim.on('params', () => setParams({ ...sim.params })), [sim]);
  useEffect(() => () => sim.setStreaming(false), [sim]);
  const read = useCallback(() => sim.derived(), [sim]);
  const derived = useSimulationValue(read, 8, same);
  // only the visitor's own changes count as "Bob turned his dial"
  const update = useCallback(
    (p: Partial<EntanglementParams>) => {
      if (p.bDeg !== undefined && p.bDeg !== sim.params.bDeg) bobTurned.current = true;
      sim.setParams(p);
    },
    [sim],
  );

  useEffect(() => {
    if (!locked) return;
    const ctx = { params, derived, bobTurned: bobTurned.current };
    for (const id of unlockedDiscoveries(ctx))
      if (useProgress.getState().addDiscovery(ROOM, id)) {
        const d = content.discoveries.find((x) => x.id === id)!;
        setToast({ title: d.title, body: d.body });
      }
    for (const c of content.challenges)
      if (challengeDone(c.id, ctx)) useProgress.getState().completeChallenge(ROOM, c.id);
  }, [params, derived, locked]);

  const lastSpoken = useRef(0);
  const lastParams = useRef(params);
  useEffect(() => {
    const now = performance.now();
    if (lastParams.current !== params || now - lastSpoken.current > 4000) {
      lastSpoken.current = now;
      lastParams.current = params;
      setLiveText(describe({ params, derived, bobTurned: bobTurned.current }));
    }
  }, [params, derived]);

  const lock = () => {
    setLocked(true);
    sim.reset();
    sim.setParams({ bDeg: 30 });
    bobTurned.current = false;
    setStep('experiment');
    if (window.matchMedia?.('(max-width: 960px)').matches)
      document.querySelector('.room__stage')?.scrollIntoView({ block: 'start' });
  };

  const controls = (
    <div className="panel__block">
      <ParamSlider
        id="en-a"
        label={content.controls.a.label}
        symbol="a"
        value={params.aDeg}
        {...ANGLE_RANGE}
        display={`${params.aDeg}°`}
        valueText={`${params.aDeg} degrees`}
        onChange={(v) => update({ aDeg: v })}
        tip={content.controls.a.tip}
      />
      <ParamSlider
        id="en-b"
        label={content.controls.b.label}
        symbol="b"
        accent="var(--c-link-d)"
        value={params.bDeg}
        {...ANGLE_RANGE}
        display={`${params.bDeg}°`}
        valueText={`${params.bDeg} degrees`}
        onChange={(v) => update({ bDeg: v })}
        tip={content.controls.b.tip}
      />
      <Segmented<Source>
        name="en-source"
        legend={
          <span className="ctl__head">
            {content.controls.source.legend}{' '}
            <InfoTip label={content.controls.source.legend}>{content.controls.source.tip}</InfoTip>
          </span>
        }
        value={params.source}
        options={[
          { value: 'quantum', label: content.controls.source.quantum },
          { value: 'hidden', label: content.controls.source.hidden },
        ]}
        onChange={(v) => update({ source: v })}
      />
      <Segmented<Mode>
        name="en-mode"
        legend={
          <span className="ctl__head">
            {content.controls.mode.legend}{' '}
            <InfoTip label={content.controls.mode.legend}>{content.controls.mode.tip}</InfoTip>
          </span>
        }
        value={params.mode}
        options={[
          { value: 'explore', label: content.controls.mode.explore },
          { value: 'bell', label: content.controls.mode.bell },
        ]}
        onChange={(v) => update({ mode: v })}
      />
    </div>
  );

  let panel: ReactNode;
  if (step === 'wonder') {
    panel = (
      <WonderPanel
        question={content.wonder.question}
        ledes={content.wonder.ledes}
        buildsOn={content.wonder.buildsOn}
        onStart={() => setStep('predict')}
      />
    );
  } else if (step === 'predict') {
    panel = (
      <div className="panel">
        <p className="panel__lbl">Predict</p>
        <h2 className="panel__big">{content.predict.prompt}</h2>
        <p className="panel__lede">{content.predict.hint}</p>
        <div className="panel__block">
          <ParamSlider
            id="en-guess"
            label={content.predict.label}
            value={guess}
            min={0}
            max={100}
            step={1}
            display={`${guess}%`}
            accent="var(--c-predict)"
            onChange={setGuess}
            tip="Your guess appears as a dashed amber mark on the chart, at 30°."
          />
        </div>
        <div className="panel__row">
          <button type="button" className="btn btn--predict" onClick={lock}>
            {content.predict.lock}
          </button>
        </div>
        {locked && <p className="panel__lede">{content.predict.locked}</p>}
      </div>
    );
  } else if (step === 'experiment') {
    panel = (
      <div className="panel">
        <p className="panel__lbl">Experiment</p>
        <h2 className="panel__big" style={{ fontSize: 'var(--t-xl)' }}>
          {content.experiment.prompt}
        </h2>
        {!locked && (
          <p className="panel__lede">
            Results are hidden until you predict.{' '}
            <button type="button" className="btn btn--predict" onClick={() => setStep('predict')}>
              Make a prediction
            </button>
          </p>
        )}
        {locked && (
          <div className="panel__block">
            <p className="panel__lbl">{shared.beforeYouTry}</p>
            <KnowledgeCheck
              spec={{
                ...content.experiment.beforeYouTry,
                choices: [...content.experiment.beforeYouTry.choices],
              }}
              onTry={() => {
                update({ bDeg: (params.aDeg + 90) % 180 });
                sim.setStreaming(true);
              }}
            />
          </div>
        )}
        <div className="panel__block">
          <div className="panel__row">
            <button type="button" className="btn btn--primary" disabled={!locked} onClick={() => sim.fire(1)}>
              {content.experiment.fireOne}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!locked}
              aria-pressed={derived.streaming}
              onClick={() => sim.setStreaming(!derived.streaming)}
            >
              {derived.streaming ? 'Stop' : content.experiment.stream}
            </button>
          </div>
          <ParamSlider
            id="en-rate"
            label={content.controls.rate.label}
            value={derived.rate}
            {...RATE_RANGE}
            display={`${derived.rate}/s`}
            onChange={(v) => sim.setRate(v)}
            tip={content.controls.rate.tip}
          />
          <div className="panel__stat">
            <span>Pairs</span>
            <b data-testid="pairs">{derived.pairs}</b>
          </div>
          {params.mode === 'explore' ? (
            <>
              <div className="panel__stat">
                <span>Results matched</span>
                <b data-testid="match">{derived.pairs ? pct(derived.matchRate) : '—'}</b>
              </div>
              <div className="panel__stat">
                <span>Model predicts</span>
                <b>{pct(derived.pSameTheory)}</b>
              </div>
            </>
          ) : (
            <>
              <div className="panel__stat">
                <span>Bell score S</span>
                <b data-testid="s">
                  {derived.pairs ? `${derived.S.toFixed(2)} ± ${derived.SSE.toFixed(2)}` : '—'}
                </b>
              </div>
              <div className="panel__stat">
                <span>Model predicts</span>
                <b>{derived.STheory.toFixed(2)}</b>
              </div>
            </>
          )}
          <div className="panel__stat">
            <span>Alice’s own + results</span>
            <b>{derived.pairs ? pct(derived.alicePlus) : '—'}</b>
          </div>
          <div className="panel__row">
            <button type="button" className="btn" onClick={() => sim.clear()}>
              {content.experiment.clear}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                sim.reset();
                bobTurned.current = false;
              }}
            >
              {content.experiment.reset}
            </button>
          </div>
        </div>
        {controls}
        <div className="panel__block">
          <p className="panel__lbl">{shared.tryThis}</p>
          <ChallengeList items={content.challenges.map((c) => ({ ...c, done: done.includes(c.id) }))} />
        </div>
        <div className="panel__block">
          <p className="panel__lbl">
            {shared.discoveries} {found.length}/{content.discoveries.length}
          </p>
          <DiscoveryLog all={[...content.discoveries]} found={found} />
        </div>
        <div className="panel__row">
          <button type="button" className="btn btn--primary" onClick={() => setStep('explain')}>
            {shared.whyNext} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    );
  } else if (step === 'explain') {
    panel = (
      <div className="panel">
        <p className="panel__lbl">Explain</p>
        <p className="panel__lede" style={{ color: 'var(--c-text)' }}>
          <Rich text={content.explain.summary} />
        </p>
        <p className="panel__lede">{shared.explainIntro}</p>
        <div className="panel__block">
          <p className="panel__lbl">{shared.compare}</p>
          {locked ? (
            <p className="panel__lede">
              {content.explain.compare.result(
                guess,
                pct(pSame('quantum', 0, 30)),
                pct(pSame('hidden', 0, 30)),
              )}
            </p>
          ) : (
            <p className="panel__lede">{shared.noPrediction}</p>
          )}
        </div>
        <WaitWhy items={content.explain.waitWhy} />
        <Story {...content.explain.story} />
        <div className="panel__block">
          <p className="panel__lbl">{shared.puzzles}</p>
          <KnowledgeCheck
            spec={{
              ...content.checks[0],
              choices: content.checks[0].choices.map((c) => ({
                ...c,
                preview: (
                  <MiniBars
                    label={c.label}
                    values={c.id === 'same' ? [0.5, 0.5] : c.id === 'change' ? [0.8, 0.3] : [0, 0]}
                  />
                ),
              })),
            }}
            onTry={() => {
              update({ ...DEFAULT_PARAMS, bDeg: 60 });
              bobTurned.current = true;
              sim.setStreaming(true);
            }}
          />
          <KnowledgeCheck
            spec={{
              ...content.checks[1],
              choices: content.checks[1].choices.map((c) => ({ ...c })),
            }}
            onTry={() => {
              update({ ...DEFAULT_PARAMS, bDeg: 22, source: 'hidden', mode: 'bell' });
              sim.setRate(200);
              sim.setStreaming(true);
            }}
          />
        </div>
        <RealWorld items={content.explain.realWorld} />
        <MathTeaser
          tex={String.raw`P(\text{same}) = \cos^2(a - b) = \cos^2(${params.aDeg}^\circ - ${params.bDeg}^\circ) = ${pct(pSame('quantum', params.aDeg, params.bDeg)).replace('%', '\\%')}`}
          label={`Probability the results match equals cos squared of a minus b, here ${pct(pSame('quantum', params.aDeg, params.bDeg))}`}
          reading={content.explain.mathTeaser.reading}
        />
        <div className="panel__row">
          <button type="button" className="btn btn--primary" onClick={() => setStep('deeper')}>
            {shared.allMath} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    );
  } else {
    const a = params.aDeg;
    const b = params.bDeg;
    const tex = {
      state: String.raw`|\Phi^+\rangle = \tfrac{1}{\sqrt2}\big(|H\rangle_A|H\rangle_B + |V\rangle_A|V\rangle_B\big)`,
      match: String.raw`P(\text{same}) = \cos^2(a - \htmlClass{sym-d}{b}) = \cos^2(${a}^\circ - ${b}^\circ) = ${pct(pSame('quantum', a, b)).replace('%', '\\%')}`,
      chsh: String.raw`S = E(a,b) - E(a,b') + E(a',b) + E(a',b'),\quad |S|_{\text{hidden}} \le 2`,
      quantum: String.raw`E(a,b) = \cos 2(a-b) \;\Rightarrow\; S_{\text{quantum}}(a=${a}^\circ,\ b=${b}^\circ) = ${derived.STheory.toFixed(2)} \le 2\sqrt2 \approx 2.83`,
    };
    panel = (
      <div className="panel">
        <p className="panel__lbl">Go deeper</p>
        <h2 className="panel__big" style={{ fontSize: 'var(--t-xl)' }}>
          {shared.mathTitle}
        </h2>
        <p className="panel__lede">{content.deeper.intro}</p>
        <div>
          <LiveEquation
            tex={tex.state}
            label="Phi plus equals one over root two times H H plus V V"
            reading={<Rich text={content.deeper.equations.state} />}
          />
          <LiveEquation
            tex={tex.match}
            label="Probability the results match equals cos squared of a minus b"
            reading={<Rich text={content.deeper.equations.match} />}
          />
          <LiveEquation
            tex={tex.chsh}
            label="S equals E a b minus E a b prime plus E a prime b plus E a prime b prime; hidden variables keep S at most 2"
            reading={<Rich text={content.deeper.equations.chsh} />}
          />
          <LiveEquation
            tex={tex.quantum}
            label={`Quantum S for these settings equals ${derived.STheory.toFixed(2)}, at most 2 root 2`}
            reading={<Rich text={content.deeper.equations.quantum} />}
          />
        </div>
        {controls}
        <div className="panel__block">
          <p className="panel__lbl">{shared.misconceptions}</p>
          {content.deeper.misconceptions.map((m) => (
            <Reveal key={m.myth} title={`“${m.myth}”`}>
              <Rich text={m.fact} />
            </Reveal>
          ))}
        </div>
        <div className="panel__block">
          <ModelNote
            summary={content.deeper.modelTitle}
            items={content.deeper.model.map((g) => ({ label: g.label, points: [...g.points] }))}
          />
        </div>
        <div className="panel__block">
          <p className="panel__lbl">{content.deeper.historyTitle}</p>
          <ol className="history">
            {content.deeper.history.map((h) => (
              <li key={h.year}>
                <span className="mono">{h.year}</span> {h.text}
                <cite>{h.ref}</cite>
              </li>
            ))}
          </ol>
          <p className="panel__lede">{content.deeper.further}</p>
        </div>
      </div>
    );
  }

  return (
    <ExperimentRoom
      number={content.number}
      title={content.title}
      step={step}
      onStep={setStep}
      liveText={liveText}
      toast={toast}
      stage={
        <EntanglementStage
          sim={sim}
          params={params}
          mode={step}
          showResults={locked}
          prediction={locked || step === 'predict' ? guess / 100 : null}
          onParams={update}
        />
      }
      panel={panel}
    />
  );
}
