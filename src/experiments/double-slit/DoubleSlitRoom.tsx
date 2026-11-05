import { useCallback, useEffect, useRef, useState } from 'react';
import { wavelengthToRgb } from '../../physics/core/colour';
import {
  DEFAULT_PARAMS,
  RANGES,
  SCREEN_HALF_WIDTH_MM,
  intensity,
  type DoubleSlitParams,
  type OpenSlits,
} from '../../physics/double-slit/fraunhofer';
import { useReducedMotion } from '../../engine/useMotionPreference';
import { useSimulationValue } from '../../engine/useSimulationValue';
import { useProgress } from '../../app/state/progressStore';
import { ParamSlider, Segmented, Toggle } from '../../ui/controls/Controls';
import { Term } from '../../ui/glossary/Term';
import {
  ChallengeList,
  ChoiceGroup,
  DiscoveryLog,
  KnowledgeCheck,
  ModelNote,
  Reveal,
} from '../../ui/learning/Learning';
import { LiveEquation } from '../../ui/math/LiveEquation';
import { MathTeaser, RealWorld, Story, WaitWhy, WonderPanel } from '../../ui/learning/Explain';
import { Rich } from '../../ui/learning/Rich';
import { shared } from '../../content/shared';
import { ExperimentRoom, type StepId } from '../../ui/room/ExperimentRoom';
import { content } from './content';
import { DoubleSlitStage } from './DoubleSlitStage';
import {
  challengeDone,
  choiceToProfile,
  countPredictedBands,
  describe,
  unlockedDiscoveries,
} from './learning';
import { MiniPattern } from './MiniPattern';
import { DoubleSlitSimulation, HISTOGRAM_BINS, RATE_RANGE, type DoubleSlitDerived } from './simulation';

const ROOM = 'double-slit';

const sameDerived = (a: DoubleSlitDerived, b: DoubleSlitDerived) =>
  a.arrivals === b.arrivals &&
  a.streaming === b.streaming &&
  a.rate === b.rate &&
  a.spacingMm === b.spacingMm &&
  a.stripes === b.stripes &&
  a.interference === b.interference &&
  a.full === b.full;

/** Model-computed profile for previews (index 0 = bottom of the screen). */
function modelProfile(p: Partial<DoubleSlitParams>): number[] {
  const q = { ...DEFAULT_PARAMS, ...p };
  return Array.from({ length: 160 }, (_, i) =>
    intensity(-SCREEN_HALF_WIDTH_MM + ((i + 0.5) / 160) * 2 * SCREEN_HALF_WIDTH_MM, q),
  );
}

const fmt = (n: number, d: number) => n.toFixed(d);

/** Which equation symbol each slider controls, for the control ↔ equation highlight. */
const SYMBOL_OF: Record<string, string> = { 'ds-lambda': 'lambda', 'ds-d': 'd', 'ds-a': 'a', 'ds-L': 'L' };

export default function DoubleSlitRoom() {
  const [sim] = useState(() => new DoubleSlitSimulation());
  const [params, setParams] = useState<DoubleSlitParams>(sim.params);
  const [step, setStep] = useState<StepId>('wonder');
  const [prediction, setPrediction] = useState<number[] | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [arrows, setArrows] = useState(false);
  const [theory, setTheory] = useState(false);
  const [hl, setHl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const [liveText, setLiveText] = useState('');
  const reducedMotion = useReducedMotion();
  const baseline = useRef({ startSpacingMm: sim.derived().spacingMm });

  const progress = useProgress();
  const found = progress.discoveries[ROOM] ?? [];
  const challengesDone = progress.challenges[ROOM] ?? [];

  useEffect(() => sim.on('params', () => setParams({ ...sim.params })), [sim]);
  useEffect(() => () => sim.setStreaming(false), [sim]);

  const readDerived = useCallback(() => sim.derived(), [sim]);
  const derived = useSimulationValue(readDerived, 8, sameDerived);

  const update = useCallback((p: Partial<DoubleSlitParams>) => sim.setParams(p), [sim]);

  // discoveries and challenges are evaluated from the live simulation state
  useEffect(() => {
    if (!locked) return;
    const ctx = { params, derived };
    for (const id of unlockedDiscoveries(ctx)) {
      if (useProgress.getState().addDiscovery(ROOM, id)) {
        const d = content.discoveries.find((x) => x.id === id)!;
        setToast({ title: d.title, body: d.body });
      }
    }
    for (const c of content.challenges)
      if (challengeDone(c.id, ctx, baseline.current)) useProgress.getState().completeChallenge(ROOM, c.id);
  }, [params, derived, locked]);

  // screen-reader description, at most every 4 s unless the settings change
  const lastSpoken = useRef(0);
  const lastParams = useRef(params);
  useEffect(() => {
    const now = performance.now();
    if (lastParams.current !== params || now - lastSpoken.current > 4000) {
      lastSpoken.current = now;
      lastParams.current = params;
      setLiveText(describe({ params, derived }));
    }
  }, [params, derived]);

  const lambdaRgb = `rgb(${wavelengthToRgb(params.wavelengthNm).join(',')})`;

  const lockPrediction = () => {
    const profile = prediction ?? (choice ? choiceToProfile(choice, HISTOGRAM_BINS) : null);
    if (!profile) return;
    setPrediction(profile);
    setLocked(true);
    sim.clear();
    setStep('experiment');
    // on stacked (phone/tablet) layouts the stage is above the panel: bring it back into view
    if (window.matchMedia?.('(max-width: 960px)').matches) {
      document
        .querySelector('.room__stage')
        ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const resetAll = () => {
    sim.reset();
    setArrows(false);
    setTheory(false);
    baseline.current = { startSpacingMm: sim.derived().spacingMm };
  };

  /* ---------------- shared control blocks ---------------- */
  const sliders = (
    <div
      className="panel__block"
      onFocus={(e) => setHl(SYMBOL_OF[(e.target as HTMLElement).id] ?? null)}
      onBlur={() => setHl(null)}
    >
      <ParamSlider
        id="ds-lambda"
        label={content.controls.wavelength.label}
        symbol="λ"
        accent={lambdaRgb}
        spectrum
        value={params.wavelengthNm}
        {...RANGES.wavelengthNm}
        display={`${params.wavelengthNm} nm`}
        valueText={`${params.wavelengthNm} nanometres`}
        onChange={(v) => update({ wavelengthNm: v })}
        tip={content.controls.wavelength.tip}
        highlighted={hl === 'lambda'}
      />
      <ParamSlider
        id="ds-d"
        label={content.controls.separation.label}
        symbol="d"
        accent="var(--c-link-d)"
        value={params.separationMm}
        {...RANGES.separationMm}
        display={`${fmt(params.separationMm, 2)} mm`}
        valueText={`${fmt(params.separationMm, 2)} millimetres`}
        onChange={(v) => update({ separationMm: v })}
        tip={content.controls.separation.tip}
        highlighted={hl === 'd'}
      />
      <ParamSlider
        id="ds-a"
        label={content.controls.width.label}
        symbol="a"
        accent="var(--c-link-a)"
        value={params.slitWidthMm}
        {...RANGES.slitWidthMm}
        display={`${fmt(params.slitWidthMm, 3)} mm`}
        valueText={`${fmt(params.slitWidthMm, 3)} millimetres`}
        onChange={(v) => update({ slitWidthMm: v })}
        tip={content.controls.width.tip}
        highlighted={hl === 'a'}
      />
      <ParamSlider
        id="ds-L"
        label={content.controls.distance.label}
        symbol="L"
        accent="var(--c-link-l)"
        value={params.screenDistanceM}
        {...RANGES.screenDistanceM}
        display={`${fmt(params.screenDistanceM, 2)} m`}
        valueText={`${fmt(params.screenDistanceM, 2)} metres`}
        onChange={(v) => update({ screenDistanceM: v })}
        tip={content.controls.distance.tip}
        highlighted={hl === 'L'}
      />
    </div>
  );

  const pathControls = (
    <div className="panel__block">
      <Segmented<OpenSlits>
        name="ds-slits"
        legend={content.controls.slits.legend}
        value={params.openSlits}
        options={[
          { value: 'both', label: content.controls.slits.both },
          { value: 'upper', label: content.controls.slits.upper },
          { value: 'lower', label: content.controls.slits.lower },
        ]}
        onChange={(v) => update({ openSlits: v })}
      />
      <Toggle
        id="ds-detector"
        label={content.controls.detector.label}
        checked={params.detector}
        onChange={(v) => update({ detector: v })}
        tip={content.controls.detector.tip}
        tipLabel={content.controls.detector.label}
      />
    </div>
  );

  const firing = (
    <div className="panel__block">
      <div className="panel__row">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => sim.fire(1)}
          disabled={derived.full || !locked}
        >
          {content.experiment.fireOne}
        </button>
        <button
          type="button"
          className="btn"
          aria-pressed={derived.streaming}
          disabled={!locked}
          onClick={() => sim.setStreaming(!derived.streaming)}
        >
          {derived.streaming ? 'Stop' : content.experiment.stream}
        </button>
      </div>
      <ParamSlider
        id="ds-rate"
        label={content.controls.rate.label}
        value={derived.rate}
        {...RATE_RANGE}
        display={`${derived.rate}/s`}
        onChange={(v) => {
          sim.setRate(v);
        }}
        tip={content.controls.rate.tip}
      />
      <div className="panel__stat">
        <span>Photons landed</span>
        <b data-testid="arrivals">{derived.arrivals.toLocaleString('en-GB')}</b>
      </div>
      <div className="panel__stat">
        <span>
          Bright <Term id="stripe">stripes</Term> on screen
        </span>
        <b>{derived.interference ? derived.stripes : 'none'}</b>
      </div>
      <div className="panel__stat">
        <span>Stripe spacing</span>
        <b>{derived.interference ? `${fmt(derived.spacingMm, 2)} mm` : '—'}</b>
      </div>
      {derived.full && <p className="panel__lede">{content.experiment.full}</p>}
      <div className="panel__row">
        <button type="button" className="btn" onClick={() => sim.clear()}>
          {content.experiment.clear}
        </button>
        <button type="button" className="btn" onClick={resetAll}>
          {content.experiment.reset}
        </button>
      </div>
    </div>
  );

  const viewToggles = (
    <div className="panel__block">
      <Toggle
        id="ds-arrows"
        label={content.controls.arrows.label}
        checked={arrows}
        onChange={setArrows}
        tip={content.controls.arrows.tip}
        tipLabel="phase arrows"
      />
      <Toggle
        id="ds-theory"
        label={content.controls.theory.label}
        checked={theory}
        onChange={setTheory}
        tip={content.controls.theory.tip}
        tipLabel="the theory curve"
      />
    </div>
  );

  /* ---------------- panels per step ---------------- */
  let panel: React.ReactNode;
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
        <ChoiceGroup
          legend={content.predict.orPick}
          choices={content.predict.choices.map((c) => ({
            ...c,
            preview: <MiniPattern profile={choiceToProfile(c.id, 120)} label={c.label} />,
          }))}
          value={choice}
          onChange={(id) => {
            setChoice(id);
            setPrediction(choiceToProfile(id, HISTOGRAM_BINS));
          }}
        />
        <div className="panel__row">
          <button
            type="button"
            className="btn btn--predict"
            disabled={!prediction && !choice}
            onClick={lockPrediction}
          >
            {content.predict.lock}
          </button>
          {prediction && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setPrediction(null);
                setChoice(null);
              }}
            >
              {content.predict.redo}
            </button>
          )}
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
            The screen is hidden until you predict.{' '}
            <button type="button" className="btn btn--predict" onClick={() => setStep('predict')}>
              Make a prediction
            </button>
          </p>
        )}
        {firing}
        {locked && (
          <div className="panel__block">
            <p className="panel__lbl">{shared.beforeYouTry}</p>
            <KnowledgeCheck
              spec={{
                ...content.experiment.beforeYouTry,
                choices: content.experiment.beforeYouTry.choices.map((c) => ({
                  ...c,
                  preview: (
                    <MiniPattern
                      label={c.label}
                      profile={
                        c.id === 'squeeze'
                          ? modelProfile({ separationMm: 0.4 })
                          : c.id === 'spread'
                            ? modelProfile({ separationMm: 0.15 })
                            : modelProfile({ openSlits: 'lower' })
                      }
                    />
                  ),
                })),
              }}
              onTry={() => {
                update({ separationMm: 0.15 });
                sim.setStreaming(true);
              }}
            />
          </div>
        )}
        {sliders}
        {pathControls}
        {viewToggles}
        <div className="panel__block">
          <p className="panel__lbl">{shared.tryThis}</p>
          <ChallengeList
            items={content.challenges.map((c) => ({ ...c, done: challengesDone.includes(c.id) }))}
          />
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
    const predicted = prediction ? countPredictedBands(prediction) : null;
    const cmp = content.explain.compare;
    panel = (
      <div className="panel">
        <p className="panel__lbl">Explain</p>
        <p className="panel__lede" style={{ color: 'var(--c-text)' }}>
          <Rich text={content.explain.summary} />
        </p>
        <p className="panel__lede">{shared.explainIntro}</p>
        <div className="panel__block">
          <p className="panel__lbl">{shared.compare}</p>
          {predicted === null ? (
            <p className="panel__lede">{shared.noPrediction}</p>
          ) : (
            <p className="panel__lede">
              You predicted <b style={{ color: 'var(--c-predict)' }}>{cmp.predicted(predicted)}</b>.{' '}
              {derived.interference ? cmp.stripes(derived.stripes) : cmp.noStripes} {cmp.sketch}
            </p>
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
                  <MiniPattern
                    label={c.label}
                    profile={
                      c.id === 'stripes'
                        ? modelProfile({})
                        : c.id === 'glow'
                          ? modelProfile({ openSlits: 'lower' })
                          : choiceToProfile('two', 160)
                    }
                  />
                ),
              })),
            }}
            onTry={() => {
              update({ ...DEFAULT_PARAMS, openSlits: 'lower' });
              sim.setStreaming(true);
            }}
          />
          <KnowledgeCheck
            spec={{
              ...content.checks[1],
              choices: content.checks[1].choices.map((c) => ({
                ...c,
                preview: (
                  <MiniPattern
                    label={c.label}
                    profile={modelProfile({
                      wavelengthNm: c.id === 'closer' ? 420 : c.id === 'apart' ? 650 : 532,
                    })}
                  />
                ),
              })),
            }}
            onTry={() => {
              update({ ...DEFAULT_PARAMS, wavelengthNm: 650 });
              sim.setStreaming(true);
            }}
          />
        </div>
        <RealWorld items={content.explain.realWorld} />
        <MathTeaser
          tex={String.raw`\Delta y \approx \frac{\lambda L}{d} = \frac{${params.wavelengthNm}\,\text{nm} \times ${fmt(params.screenDistanceM, 2)}\,\text{m}}{${fmt(params.separationMm, 2)}\,\text{mm}} = ${fmt(derived.spacingMm, 2)}\,\text{mm}`}
          label={`Stripe spacing approximately lambda L over d, equals ${fmt(derived.spacingMm, 2)} millimetres`}
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
    const L = params.screenDistanceM;
    const tex = {
      path: String.raw`\htmlClass{sym-d}{d}\,\sin\theta = m\,\htmlClass{sym-lambda}{\lambda} \qquad \htmlClass{sym-d}{d}\,\sin\theta = \left(m+\tfrac12\right)\htmlClass{sym-lambda}{\lambda}`,
      spacing: String.raw`\Delta y \approx \frac{\htmlClass{sym-lambda}{\lambda}\,\htmlClass{sym-L}{L}}{\htmlClass{sym-d}{d}} = \frac{\htmlClass{sym-lambda}{${params.wavelengthNm}\,\text{nm}} \times \htmlClass{sym-L}{${fmt(L, 2)}\,\text{m}}}{\htmlClass{sym-d}{${fmt(params.separationMm, 2)}\,\text{mm}}} = ${fmt(derived.spacingMm, 2)}\,\text{mm}`,
      intensity: String.raw`I(\theta) = I_0\,\operatorname{sinc}^2\!\left(\frac{\pi \htmlClass{sym-a}{a} \sin\theta}{\htmlClass{sym-lambda}{\lambda}}\right)\cos^2\!\left(\frac{\pi \htmlClass{sym-d}{d}\sin\theta}{\htmlClass{sym-lambda}{\lambda}}\right),\quad \htmlClass{sym-a}{a} = ${fmt(params.slitWidthMm, 3)}\,\text{mm}`,
      born: params.detector
        ? String.raw`P(y) \propto |\psi_1+\psi_2|^2 \qquad \boxed{P(y) \propto |\psi_1|^2 + |\psi_2|^2}`
        : String.raw`\boxed{P(y) \propto |\psi_1+\psi_2|^2} \qquad P(y) \propto |\psi_1|^2 + |\psi_2|^2`,
    };
    panel = (
      <div className="panel" style={{ ['--eq-lambda' as string]: lambdaRgb }}>
        <p className="panel__lbl">Go deeper</p>
        <h2 className="panel__prompt">{shared.mathTitle}</h2>
        <p className="panel__lede">{content.deeper.intro}</p>
        <div>
          <LiveEquation
            tex={tex.path}
            label="d sine theta equals m lambda for bright stripes; m plus one half lambda for dark stripes"
            reading={<Rich text={content.deeper.equations.path} />}
            highlight={hl}
            onSymbol={setHl}
          />
          <LiveEquation
            tex={tex.spacing}
            label={`Stripe spacing approximately lambda L over d, equals ${fmt(derived.spacingMm, 2)} millimetres`}
            reading={<Rich text={content.deeper.equations.spacing} />}
            highlight={hl}
            onSymbol={setHl}
          />
          <LiveEquation
            tex={tex.intensity}
            label="Intensity equals sinc squared of pi a sine theta over lambda, times cos squared of pi d sine theta over lambda"
            reading={<Rich text={content.deeper.equations.intensity} />}
            highlight={hl}
            onSymbol={setHl}
          />
          <LiveEquation
            tex={tex.born}
            label={
              params.detector
                ? 'With a detector: probability is psi one squared plus psi two squared'
                : 'Without a detector: probability is the square of psi one plus psi two'
            }
            reading={
              <>
                {content.deeper.equations.born} (<Term id="amplitude">amplitude</Term>)
              </>
            }
            highlight={hl}
            onSymbol={setHl}
          />
        </div>
        {sliders}
        {pathControls}
        <div className="panel__stat">
          <span>{content.deeper.validity}</span>
          <b>{fmt(derived.fresnel, 3)}</b>
        </div>
        {viewToggles}
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

  // the theory curve is part of explaining; it appears automatically from Explain onward
  const showTheory = theory || step === 'explain';

  return (
    <ExperimentRoom
      number={content.number}
      title={content.title}
      step={step}
      onStep={setStep}
      liveText={liveText}
      toast={toast}
      stage={
        <DoubleSlitStage
          sim={sim}
          params={params}
          mode={step}
          showResults={locked}
          showTheory={showTheory && locked}
          phaseArrows={arrows}
          reducedMotion={reducedMotion}
          prediction={locked || step === 'predict' ? prediction : null}
          onSketch={(p) => {
            setChoice(null);
            setPrediction(p);
          }}
          onParams={update}
        />
      }
      panel={panel}
    />
  );
}
