import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_PARAMS,
  RANGES,
  detectorProbabilities,
  type SuperpositionParams,
} from '../../physics/superposition/interferometer';
import { useReducedMotion } from '../../engine/useMotionPreference';
import { useSimulationValue } from '../../engine/useSimulationValue';
import { useProgress } from '../../app/state/progressStore';
import { ParamSlider, Toggle } from '../../ui/controls/Controls';
import { ChallengeList, DiscoveryLog, KnowledgeCheck, ModelNote, Reveal } from '../../ui/learning/Learning';
import { LiveEquation } from '../../ui/math/LiveEquation';
import { MathTeaser, RealWorld, Story, WaitWhy, WonderPanel } from '../../ui/learning/Explain';
import { Rich } from '../../ui/learning/Rich';
import { shared } from '../../content/shared';
import { ExperimentRoom, type StepId } from '../../ui/room/ExperimentRoom';
import { content } from './content';
import { challengeDone, describe, unlockedDiscoveries } from './learning';
import { RATE_RANGE, SuperpositionSimulation, type SuperpositionDerived } from './simulation';
import { SuperpositionStage } from './SuperpositionStage';

const ROOM = 'superposition';
const same = (a: SuperpositionDerived, b: SuperpositionDerived) =>
  a.d1 === b.d1 && a.d2 === b.d2 && a.streaming === b.streaming && a.rate === b.rate && a.pD1 === b.pD1;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const upperShare = (thetaDeg: number) => Math.cos((thetaDeg * Math.PI) / 360) ** 2;

/** Two little bars showing the model's detector probabilities for a hypothetical setting. */
function MiniBars({ d1, label }: { d1: number; label: string }) {
  return (
    <svg viewBox="0 0 80 44" role="img" aria-label={label}>
      <rect x="14" y={4 + 36 * (1 - d1)} width="20" height={36 * d1} fill="#fff" />
      <rect x="46" y={4 + 36 * d1} width="20" height={36 * (1 - d1)} fill="#fff" />
      <rect x="14" y="4" width="20" height="36" fill="none" stroke="rgba(233,234,255,0.35)" />
      <rect x="46" y="4" width="20" height="36" fill="none" stroke="rgba(233,234,255,0.35)" />
    </svg>
  );
}

export default function SuperpositionRoom() {
  const [sim] = useState(() => new SuperpositionSimulation());
  const [params, setParams] = useState<SuperpositionParams>(sim.params);
  const [step, setStep] = useState<StepId>('wonder');
  const [guess, setGuess] = useState(50);
  const [locked, setLocked] = useState(false);
  const [arrows, setArrows] = useState(false);
  const [theory, setTheory] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const [liveText, setLiveText] = useState('');
  const phaseTurnedWhileOut = useRef(false);
  const reducedMotion = useReducedMotion();
  const progress = useProgress();
  const found = progress.discoveries[ROOM] ?? [];
  const done = progress.challenges[ROOM] ?? [];

  useEffect(
    () =>
      sim.on('params', () => {
        setParams((prev) => {
          if (!sim.params.secondSplitter && !prev.secondSplitter && prev.phiDeg !== sim.params.phiDeg)
            phaseTurnedWhileOut.current = true;
          if (sim.params.secondSplitter) phaseTurnedWhileOut.current = false;
          return { ...sim.params };
        });
      }),
    [sim],
  );
  useEffect(() => () => sim.setStreaming(false), [sim]);
  const read = useCallback(() => sim.derived(), [sim]);
  const derived = useSimulationValue(read, 8, same);
  const update = useCallback((p: Partial<SuperpositionParams>) => sim.setParams(p), [sim]);

  useEffect(() => {
    if (!locked) return;
    const ctx = { params, derived, phaseTurnedWhileOut: phaseTurnedWhileOut.current };
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
      setLiveText(describe({ params, derived, phaseTurnedWhileOut: phaseTurnedWhileOut.current }));
    }
  }, [params, derived]);

  const lock = () => {
    setLocked(true);
    sim.reset();
    setStep('experiment');
    if (window.matchMedia?.('(max-width: 960px)').matches)
      document.querySelector('.room__stage')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const sliders = (
    <div className="panel__block">
      <ParamSlider
        id="sp-theta"
        label={content.controls.theta.label}
        symbol="θ"
        value={params.thetaDeg}
        {...RANGES.thetaDeg}
        display={`${pct(upperShare(params.thetaDeg))} upper`}
        valueText={`${pct(upperShare(params.thetaDeg))} to the upper path`}
        onChange={(v) => update({ thetaDeg: v })}
        tip={content.controls.theta.tip}
      />
      <ParamSlider
        id="sp-phi"
        label={content.controls.phi.label}
        symbol="φ"
        accent="var(--c-link-d)"
        value={params.phiDeg}
        {...RANGES.phiDeg}
        display={`${params.phiDeg}°`}
        valueText={`${params.phiDeg} degrees`}
        onChange={(v) => update({ phiDeg: v })}
        tip={content.controls.phi.tip}
      />
      <Toggle
        id="sp-second"
        label={content.controls.second.label}
        checked={params.secondSplitter}
        onChange={(v) => update({ secondSplitter: v })}
        tip={content.controls.second.tip}
        tipLabel={content.controls.second.label}
      />
    </div>
  );

  const views = (
    <div className="panel__block">
      <Toggle
        id="sp-arrows"
        label={content.controls.arrows.label}
        checked={arrows}
        onChange={setArrows}
        tip={content.controls.arrows.tip}
        tipLabel="phase arrows"
      />
      <Toggle
        id="sp-theory"
        label={content.controls.theory.label}
        checked={theory}
        onChange={setTheory}
        tip={content.controls.theory.tip}
        tipLabel="the theory lines"
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
            id="sp-guess"
            label={content.predict.label}
            value={guess}
            min={0}
            max={100}
            step={1}
            display={`${guess} of 100`}
            accent="var(--c-predict)"
            onChange={setGuess}
            tip="Your guess appears as a dashed amber line on the detector bars."
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
        <h2 className="panel__prompt">{content.experiment.prompt}</h2>
        {!locked && (
          <p className="panel__lede">
            The counts are hidden until you predict.{' '}
            <button type="button" className="btn btn--predict" onClick={() => setStep('predict')}>
              Make a prediction
            </button>
          </p>
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
            id="sp-rate"
            label={content.controls.rate.label}
            value={derived.rate}
            {...RATE_RANGE}
            display={`${derived.rate}/s`}
            onChange={(v) => sim.setRate(v)}
            tip={content.controls.rate.tip}
          />
          <div className="panel__stat">
            <span>Detector D1</span>
            <b data-testid="d1">{derived.d1}</b>
          </div>
          <div className="panel__stat">
            <span>Detector D2</span>
            <b data-testid="d2">{derived.d2}</b>
          </div>
          <div className="panel__stat">
            <span>Model predicts at D1</span>
            <b>{pct(derived.pD1)}</b>
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
                setArrows(false);
                setTheory(false);
              }}
            >
              {content.experiment.reset}
            </button>
          </div>
        </div>
        {locked && (
          <div className="panel__block">
            <p className="panel__lbl">{shared.beforeYouTry}</p>
            <KnowledgeCheck
              spec={{
                ...content.experiment.beforeYouTry,
                choices: [...content.experiment.beforeYouTry.choices],
              }}
              onTry={() => {
                update({ phiDeg: 90 });
                sim.setStreaming(true);
              }}
            />
          </div>
        )}
        {sliders}
        {views}
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
              You predicted <b style={{ color: 'var(--c-predict)' }}>{guess} of 100</b> at D1.{' '}
              {content.explain.compare.result}
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
                    d1={
                      c.id === 'stop'
                        ? 0
                        : detectorProbabilities({
                            thetaDeg: 90,
                            phiDeg: c.id === 'change' ? 120 : 0,
                            secondSplitter: c.id === 'change',
                          }).d1
                    }
                  />
                ),
              })),
            }}
            onTry={() => {
              update({ ...DEFAULT_PARAMS, secondSplitter: false, phiDeg: 120 });
              phaseTurnedWhileOut.current = true;
              sim.setStreaming(true);
            }}
          />
          <KnowledgeCheck
            spec={{
              ...content.checks[1],
              choices: content.checks[1].choices.map((c) => ({
                ...c,
                preview: <MiniBars label={c.label} d1={c.id === 'd1' ? 1 : c.id === 'd2' ? 0 : 0.5} />,
              })),
            }}
            onTry={() => {
              update({ ...DEFAULT_PARAMS, phiDeg: 180 });
              sim.setStreaming(true);
            }}
          />
        </div>
        <RealWorld items={content.explain.realWorld} />
        <MathTeaser
          tex={String.raw`P(\text{D1}) = \tfrac12\left(1 + \sin\theta\cos\varphi\right) = ${pct(detectorProbabilities({ ...params, secondSplitter: true }).d1).replace('%', '\\%')}`}
          label={`With both splitters in, probability of D1 equals one half times one plus sin theta cos phi, here ${pct(detectorProbabilities({ ...params, secondSplitter: true }).d1)}`}
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
    const th = params.thetaDeg;
    const ph = params.phiDeg;
    const c = Math.cos((th * Math.PI) / 360).toFixed(3);
    const s = Math.sin((th * Math.PI) / 360).toFixed(3);
    const x = Math.sin((th * Math.PI) / 180) * Math.cos((ph * Math.PI) / 180);
    const y = Math.sin((th * Math.PI) / 180) * Math.sin((ph * Math.PI) / 180);
    const z = Math.cos((th * Math.PI) / 180);
    const tex = {
      state: String.raw`|\psi\rangle = \cos\tfrac{\theta}{2}\,|\text{upper}\rangle + e^{i\htmlClass{sym-d}{\varphi}}\sin\tfrac{\theta}{2}\,|\text{lower}\rangle = ${c}\,|\text{upper}\rangle + e^{i\,${ph}^\circ}\,${s}\,|\text{lower}\rangle`,
      path: String.raw`P(\text{D1}) = \cos^2\tfrac{\theta}{2} = ${pct(upperShare(th)).replace('%', '\\%')}`,
      interfere: String.raw`P(\text{D1}) = \tfrac12\left|\cos\tfrac{\theta}{2} + e^{i\htmlClass{sym-d}{\varphi}}\sin\tfrac{\theta}{2}\right|^2 = \tfrac12\left(1 + \sin\theta\cos\htmlClass{sym-d}{\varphi}\right) = ${pct((1 + x) / 2).replace('%', '\\%')}`,
      bloch: String.raw`\vec r = (\sin\theta\cos\htmlClass{sym-d}{\varphi},\ \sin\theta\sin\htmlClass{sym-d}{\varphi},\ \cos\theta) = (${x.toFixed(2)},\ ${y.toFixed(2)},\ ${z.toFixed(2)})`,
    };
    panel = (
      <div className="panel">
        <p className="panel__lbl">Go deeper</p>
        <h2 className="panel__prompt">{shared.mathTitle}</h2>
        <p className="panel__lede">{content.deeper.intro}</p>
        <div>
          <LiveEquation
            tex={tex.state}
            label="The state is cos theta over 2 times upper, plus e to the i phi times sin theta over 2 times lower"
            reading={<Rich text={content.deeper.equations.state} />}
          />
          <LiveEquation
            tex={params.secondSplitter ? tex.interfere : tex.path}
            label={
              params.secondSplitter
                ? 'Probability of D1 equals one half times one plus sin theta cos phi'
                : 'Probability of D1 equals cos squared theta over 2'
            }
            reading={
              <Rich
                text={
                  params.secondSplitter ? content.deeper.equations.interfere : content.deeper.equations.path
                }
              />
            }
          />
          <LiveEquation
            tex={tex.bloch}
            label="Bloch vector: sin theta cos phi, sin theta sin phi, cos theta"
            reading={<Rich text={content.deeper.equations.bloch} />}
          />
        </div>
        {sliders}
        {views}
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
        <SuperpositionStage
          sim={sim}
          params={params}
          mode={step}
          showResults={locked}
          showTheory={locked && (theory || step === 'explain')}
          phaseArrows={arrows}
          reducedMotion={reducedMotion}
          predictionD1={locked || step === 'predict' ? guess / 100 : null}
          onParams={update}
        />
      }
      panel={panel}
    />
  );
}
