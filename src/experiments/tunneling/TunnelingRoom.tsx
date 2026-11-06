import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_PARAMS,
  ENERGY_UNIT_EV,
  LENGTH_UNIT_NM,
  RANGES,
  predictions,
  type TunnelParams,
} from '../../physics/tunneling/schrodinger1d';
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
import { TunnelingSimulation, type TunnelDerived } from './simulation';
import { TunnelingStage } from './TunnelingStage';

const ROOM = 'tunneling';
const same = (a: TunnelDerived, b: TunnelDerived) =>
  a.running === b.running &&
  a.done === b.done &&
  a.launched === b.launched &&
  a.packet === b.packet &&
  Math.abs(a.transmitted - b.transmitted) < 5e-4 &&
  Math.abs(a.reflected - b.reflected) < 5e-4;
const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;

function MiniBar({ v, label }: { v: number; label: string }) {
  return (
    <svg viewBox="0 0 80 44" role="img" aria-label={label}>
      <rect x="28" y={4 + 36 * (1 - v)} width="24" height={36 * v} fill="#fff" />
      <rect x="28" y="4" width="24" height="36" fill="none" stroke="rgba(233,234,255,0.35)" />
    </svg>
  );
}

export default function TunnelingRoom() {
  const [sim] = useState(() => new TunnelingSimulation());
  const [params, setParams] = useState<TunnelParams>(sim.params);
  const [step, setStep] = useState<StepId>('wonder');
  const [guess, setGuess] = useState(50);
  const [locked, setLocked] = useState(false);
  const [arrows, setArrows] = useState(false);
  const [classical, setClassical] = useState(true);
  const [theory, setTheory] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const [liveText, setLiveText] = useState('');
  const progress = useProgress();
  const found = progress.discoveries[ROOM] ?? [];
  const done = progress.challenges[ROOM] ?? [];

  useEffect(() => sim.on('params', () => setParams({ ...sim.params })), [sim]);
  const read = useCallback(() => sim.derived(), [sim]);
  const derived = useSimulationValue(read, 10, same);
  const update = useCallback((p: Partial<TunnelParams>) => sim.setParams(p), [sim]);

  useEffect(() => {
    if (!locked) return;
    const ctx = { params, derived };
    for (const id of unlockedDiscoveries(ctx))
      if (useProgress.getState().addDiscovery(ROOM, id)) {
        const d = content.discoveries.find((x) => x.id === id)!;
        setToast({ title: d.title, body: d.body });
      }
    for (const c of content.challenges)
      if (challengeDone(c.id, ctx)) useProgress.getState().completeChallenge(ROOM, c.id);
  }, [params, derived, locked]);

  const lastSpoken = useRef(0);
  const lastKey = useRef('');
  useEffect(() => {
    const key = `${JSON.stringify(params)}|${derived.done}|${derived.launched}`;
    const now = performance.now();
    if (key !== lastKey.current || now - lastSpoken.current > 4000) {
      lastKey.current = key;
      lastSpoken.current = now;
      setLiveText(describe({ params, derived }));
    }
  }, [params, derived]);

  const lock = () => {
    setLocked(true);
    sim.reset();
    setStep('experiment');
    if (window.matchMedia?.('(max-width: 960px)').matches)
      document.querySelector('.room__stage')?.scrollIntoView({ block: 'start' });
  };

  const sliders = (
    <div className="panel__block">
      <ParamSlider
        id="tu-energy"
        label={content.controls.energy.label}
        symbol="E"
        value={params.energyEv}
        {...RANGES.energyEv}
        display={`${params.energyEv.toFixed(1)} eV`}
        valueText={`${params.energyEv.toFixed(1)} electronvolts`}
        onChange={(v) => update({ energyEv: v })}
        tip={content.controls.energy.tip}
      />
      <ParamSlider
        id="tu-barrier"
        label={content.controls.barrier.label}
        symbol="V₀"
        value={params.barrierEv}
        {...RANGES.barrierEv}
        display={`${params.barrierEv.toFixed(1)} eV`}
        valueText={`${params.barrierEv.toFixed(1)} electronvolts`}
        onChange={(v) => update({ barrierEv: v })}
        tip={content.controls.barrier.tip}
      />
      <ParamSlider
        id="tu-width"
        label={content.controls.width.label}
        symbol="a"
        accent="var(--c-link-d)"
        value={params.widthNm}
        {...RANGES.widthNm}
        display={`${params.widthNm.toFixed(3)} nm`}
        valueText={`${params.widthNm.toFixed(3)} nanometres`}
        onChange={(v) => update({ widthNm: v })}
        tip={content.controls.width.tip}
      />
      <ParamSlider
        id="tu-packet"
        label={content.controls.packet.label}
        symbol="σ"
        value={params.packetNm}
        {...RANGES.packetNm}
        display={`${params.packetNm.toFixed(2)} nm`}
        valueText={`${params.packetNm.toFixed(2)} nanometres`}
        onChange={(v) => update({ packetNm: v })}
        tip={content.controls.packet.tip}
      />
    </div>
  );
  const views = (
    <div className="panel__block">
      <Toggle
        id="tu-classical"
        label={content.controls.classical.label}
        checked={classical}
        onChange={setClassical}
        tip={content.controls.classical.tip}
        tipLabel="the classical ball"
      />
      <Toggle
        id="tu-arrows"
        label={content.controls.arrows.label}
        checked={arrows}
        onChange={setArrows}
        tip={content.controls.arrows.tip}
        tipLabel="phase arrows"
      />
      <Toggle
        id="tu-theory"
        label={content.controls.theory.label}
        checked={theory}
        onChange={setTheory}
        tip={content.controls.theory.tip}
        tipLabel="the theory lines"
      />
    </div>
  );
  const runButtons = (
    <div className="panel__row">
      <button type="button" className="btn btn--primary" disabled={!locked} onClick={() => sim.launch()}>
        {content.experiment.launch}
      </button>
      <button
        type="button"
        className="btn"
        disabled={!locked || derived.done || !derived.launched}
        onClick={() => sim.setRunning(!derived.running)}
      >
        {derived.running ? content.experiment.pause : content.experiment.resume}
      </button>
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
            id="tu-guess"
            label={content.predict.label}
            value={guess}
            min={0}
            max={100}
            step={1}
            display={`${guess}%`}
            accent="var(--c-predict)"
            onChange={setGuess}
            tip="Your guess appears as a dashed amber line on the Through bar."
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
            The results are hidden until you predict.{' '}
            <button type="button" className="btn btn--predict" onClick={() => setStep('predict')}>
              Make a prediction
            </button>
          </p>
        )}
        <div className="panel__block">
          {runButtons}
          <div className="panel__stat">
            <span>{derived.done ? 'Got through' : 'Right of the wall now'}</span>
            <b data-testid="through">{derived.launched ? pct(derived.transmitted) : '—'}</b>
          </div>
          <div className="panel__stat">
            <span>{derived.done ? 'Reflected' : 'Left of the wall now'}</span>
            <b>{derived.launched ? pct(derived.reflected) : '—'}</b>
          </div>
          <div className="panel__stat">
            <span>Model predicts (this packet)</span>
            <b>{pct(derived.packet)}</b>
          </div>
          <div className="panel__stat">
            <span>A classical ball would</span>
            <b>{derived.classical === 'bounces' ? 'bounce back' : 'pass'}</b>
          </div>
          <div className="panel__stat">
            <span>Status</span>
            <b data-testid="status">
              {derived.done
                ? 'finished'
                : derived.running
                  ? 'running'
                  : derived.launched
                    ? 'paused'
                    : 'ready'}
            </b>
          </div>
          <div className="panel__row">
            <button
              type="button"
              className="btn"
              onClick={() => {
                sim.reset();
                setArrows(false);
                setTheory(false);
                setClassical(true);
              }}
            >
              {content.experiment.reset}
            </button>
          </div>
        </div>
        {sliders}
        {views}
        {locked && (
          <div className="panel__block">
            <p className="panel__lbl">{shared.beforeYouTry}</p>
            <KnowledgeCheck
              spec={{
                ...content.experiment.beforeYouTry,
                choices: [...content.experiment.beforeYouTry.choices],
              }}
              onTry={() => {
                update({ ...DEFAULT_PARAMS, energyEv: 6.5 });
                sim.launch();
              }}
            />
          </div>
        )}
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
    const defaultT = predictions(DEFAULT_PARAMS).packet;
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
            <p className="panel__lede">{content.explain.compare.result(guess, pct(defaultT))}</p>
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
                  <MiniBar
                    label={c.label}
                    v={
                      c.id === 'drop'
                        ? predictions({ ...DEFAULT_PARAMS, widthNm: 0.4 }).packet
                        : c.id === 'halve'
                          ? defaultT / 2
                          : defaultT
                    }
                  />
                ),
              })),
            }}
            onTry={() => {
              update({ ...DEFAULT_PARAMS, widthNm: 0.4 });
              sim.launch();
            }}
          />
          <KnowledgeCheck
            spec={{ ...content.checks[1], choices: content.checks[1].choices.map((c) => ({ ...c })) }}
            onTry={() => {
              update({ ...DEFAULT_PARAMS, energyEv: 9 });
              sim.launch();
            }}
          />
        </div>
        <RealWorld items={content.explain.realWorld} />
        <MathTeaser
          tex={
            params.energyEv < params.barrierEv
              ? String.raw`T(E) = \left[1 + \frac{V_0^2\sinh^2(\kappa a)}{4E(V_0 - E)}\right]^{-1} = ${pct(derived.plane, 2).replace('%', '\\%')}`
              : String.raw`T(E) = \left[1 + \frac{V_0^2\sin^2(k_2 a)}{4E(E - V_0)}\right]^{-1} = ${pct(derived.plane, 2).replace('%', '\\%')}`
          }
          label={`Plane-wave transmission equals ${pct(derived.plane, 2)}`}
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
    const E = params.energyEv;
    const V0 = params.barrierEv;
    const aNm = params.widthNm;
    const below = E < V0;
    // κ in nm⁻¹ from solver units (1 unit = 0.1 nm): κ = √(2(V0−E)) / 0.1
    const kappa = below ? Math.sqrt((2 * (V0 - E)) / ENERGY_UNIT_EV) / LENGTH_UNIT_NM : 0;
    const tex = {
      tdse: String.raw`i\hbar\,\frac{\partial\psi}{\partial t} = -\frac{\hbar^2}{2m_e}\frac{\partial^2\psi}{\partial x^2} + V(x)\,\psi`,
      kappa: below
        ? String.raw`\kappa = \frac{\sqrt{2m_e(V_0 - E)}}{\hbar} = \frac{\sqrt{2m_e(${V0.toFixed(1)} - ${E.toFixed(1)})\,\text{eV}}}{\hbar} = ${kappa.toFixed(2)}\ \text{nm}^{-1}`
        : String.raw`E > V_0:\ \text{no fading; inside the wall}\ k_2 = \sqrt{2m_e(E - V_0)}/\hbar`,
      transmission: below
        ? String.raw`T(E) = \left[1 + \frac{V_0^2\sinh^2(\kappa \htmlClass{sym-d}{a})}{4E(V_0 - E)}\right]^{-1} = ${pct(derived.plane, 2).replace('%', '\\%')}`
        : String.raw`T(E) = \left[1 + \frac{V_0^2\sin^2(k_2 \htmlClass{sym-d}{a})}{4E(E - V_0)}\right]^{-1} = ${pct(derived.plane, 2).replace('%', '\\%')}`,
      packet: String.raw`\langle T\rangle = \int |\phi(k)|^2\, T\!\left(\tfrac{\hbar^2k^2}{2m_e}\right) dk = ${pct(derived.packet, 2).replace('%', '\\%')},\quad \htmlClass{sym-d}{a} = ${aNm.toFixed(3)}\ \text{nm}`,
    };
    panel = (
      <div className="panel">
        <p className="panel__lbl">Go deeper</p>
        <h2 className="panel__prompt">{shared.mathTitle}</h2>
        <p className="panel__lede">{content.deeper.intro}</p>
        <div>
          <LiveEquation
            tex={tex.tdse}
            label="i h-bar d psi d t equals minus h-bar squared over 2 m d squared psi d x squared plus V psi"
            reading={<Rich text={content.deeper.equations.tdse} />}
          />
          <LiveEquation
            tex={tex.kappa}
            label={
              below
                ? `Decay constant kappa equals ${kappa.toFixed(2)} per nanometre`
                : 'Energy above the wall: no exponential fading'
            }
            reading={<Rich text={content.deeper.equations.kappa} />}
          />
          <LiveEquation
            tex={tex.transmission}
            label={`Plane-wave transmission equals ${pct(derived.plane, 2)}`}
            reading={<Rich text={content.deeper.equations.transmission} />}
          />
          <LiveEquation
            tex={tex.packet}
            label={`Packet-averaged transmission equals ${pct(derived.packet, 2)}`}
            reading={<Rich text={content.deeper.equations.packet} />}
          />
        </div>
        {runButtons}
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
                <span className="history__year">{h.year}</span> {h.text}
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
        <TunnelingStage
          sim={sim}
          params={params}
          mode={step}
          showResults={locked}
          showTheory={locked && (theory || step === 'explain')}
          arrows={arrows}
          classical={classical}
          prediction={locked || step === 'predict' ? guess / 100 : null}
          onParams={update}
        />
      }
      panel={panel}
    />
  );
}
