import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { basisLabel } from '../../physics/quantum-computing/stateVector';
import { useProgress } from '../../app/state/progressStore';
import { ParamSlider, Segmented, Toggle } from '../../ui/controls/Controls';
import { InfoTip } from '../../ui/glossary/Popover';
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
import { challengeDone, describe, unlockedDiscoveries } from './learning';
import { QcStage } from './QcStage';
import { COLS, QuantumComputerSimulation, type PresetId } from './simulation';

const ROOM = 'quantum-computing';

function MiniBars({ values, label }: { values: number[]; label: string }) {
  const w = 80 / values.length;
  return (
    <svg viewBox="0 0 80 44" role="img" aria-label={label}>
      {values.map((v, i) => (
        <g key={i}>
          <rect x={i * w + 8} y={4 + 36 * (1 - v)} width={w - 16} height={36 * v} fill="#fff" />
          <rect x={i * w + 8} y={4} width={w - 16} height={36} fill="none" stroke="rgba(233,234,255,0.35)" />
        </g>
      ))}
    </svg>
  );
}

const PRESET_LABELS: Record<PresetId, string> = {
  interference: 'H · H',
  phase: 'H · Z · H',
  bell: 'Bell pair',
  ghz: 'Three-qubit GHZ',
  grover: 'Grover’s search for 11',
};

export default function QcRoom() {
  const [sim] = useState(() => new QuantumComputerSimulation());
  const [version, setVersion] = useState(0);
  const [step, setStep] = useState<StepId>('wonder');
  const [choice, setChoice] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [arrows, setArrows] = useState(false);
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const progress = useProgress();
  const found = progress.discoveries[ROOM] ?? [];
  const done = progress.challenges[ROOM] ?? [];

  useEffect(() => sim.on(() => setVersion(sim.version)), [sim]);
  const refresh = useCallback(() => setVersion(sim.version), [sim]);
  const derived = sim.derived();
  void version;

  useEffect(() => {
    if (!locked) return;
    const ctx = { qubits: sim.qubits, columns: sim.columns, derived, preset: sim.preset };
    for (const id of unlockedDiscoveries(ctx))
      if (useProgress.getState().addDiscovery(ROOM, id)) {
        const d = content.discoveries.find((x) => x.id === id)!;
        setToast({ title: d.title, body: d.body });
      }
    for (const c of content.challenges)
      if (challengeDone(c.id, ctx)) useProgress.getState().completeChallenge(ROOM, c.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-evaluate whenever the simulation changes
  }, [version, locked]);

  const liveRef = useRef('');
  const liveText = describe({ qubits: sim.qubits, columns: sim.columns, derived, preset: sim.preset });
  liveRef.current = liveText;

  const lock = () => {
    if (!choice) return;
    setLocked(true);
    sim.loadPreset('interference');
    setStep('experiment');
    if (window.matchMedia?.('(max-width: 960px)').matches)
      document.querySelector('.room__stage')?.scrollIntoView({ block: 'start' });
  };

  const controls = (
    <div className="panel__block">
      <Segmented<string>
        name="qc-qubits"
        legend={
          <span className="ctl__head">
            {content.controls.qubits.legend}{' '}
            <InfoTip label={content.controls.qubits.legend}>{content.controls.qubits.tip}</InfoTip>
          </span>
        }
        value={String(sim.qubits)}
        options={[
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
        ]}
        onChange={(v) => sim.setQubits(Number(v))}
      />
      <ParamSlider
        id="qc-view"
        label={content.controls.view.label}
        value={derived.view}
        min={0}
        max={COLS}
        step={1}
        display={`${derived.view} of ${COLS}`}
        onChange={(v) => sim.setView(v)}
        tip={content.controls.view.tip}
      />
      <Toggle
        id="qc-arrows"
        label="Show phase as arrows"
        checked={arrows}
        onChange={setArrows}
        tip="Arrows pointing the way the colour does: the same phase information, readable without colour."
        tipLabel="phase arrows"
      />
      <div>
        <p className="ctl__head" style={{ marginBottom: 'var(--s-2)' }}>
          {content.controls.presets.legend}{' '}
          <InfoTip label={content.controls.presets.legend}>{content.controls.presets.tip}</InfoTip>
        </p>
        <div className="panel__row">
          {(Object.keys(PRESET_LABELS) as PresetId[]).map((id) => (
            <button
              key={id}
              type="button"
              className="btn"
              aria-pressed={sim.preset === id}
              onClick={() => sim.loadPreset(id)}
            >
              {PRESET_LABELS[id]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const measureBlock = (
    <div className="panel__block">
      <div className="panel__row">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!locked}
          onClick={() => sim.measureShots(1)}
        >
          {content.experiment.measureOne}
        </button>
        <button type="button" className="btn" disabled={!locked} onClick={() => sim.measureShots(100)}>
          {content.experiment.measureMany}
        </button>
      </div>
      <div className="panel__stat">
        <span>Measurements</span>
        <b data-testid="shots">{derived.totalShots}</b>
      </div>
      <div className="panel__stat">
        <span>Last result</span>
        <b data-testid="last">
          {derived.lastOutcome === null ? '—' : basisLabel(derived.lastOutcome, derived.qubits)}
        </b>
      </div>
      <div className="panel__stat">
        <span>
          <Term id="entangled">Entangled</Term> at the end?
        </span>
        <b>{derived.entangled ? 'yes' : 'no'}</b>
      </div>
      <div className="panel__row">
        <button type="button" className="btn" onClick={() => sim.clearCircuit()}>
          {content.experiment.clear}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            sim.reset();
            setArrows(false);
          }}
        >
          {content.experiment.reset}
        </button>
      </div>
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
        <ChoiceGroup
          legend="Your prediction"
          choices={content.predict.choices.map((c) => ({
            ...c,
            preview: (
              <MiniBars
                label={c.label}
                values={c.id === 'zero' ? [1, 0] : c.id === 'one' ? [0, 1] : [0.5, 0.5]}
              />
            ),
          }))}
          value={choice}
          onChange={setChoice}
        />
        <div className="panel__row">
          <button type="button" className="btn btn--predict" disabled={!choice} onClick={lock}>
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
        <p className="panel__lede">{content.experiment.paletteHint}</p>
        {!locked && (
          <p className="panel__lede">
            Measurements are hidden until you predict.{' '}
            <button type="button" className="btn btn--predict" onClick={() => setStep('predict')}>
              Make a prediction
            </button>
          </p>
        )}
        {measureBlock}
        {locked && (
          <div className="panel__block">
            <p className="panel__lbl">{shared.beforeYouTry}</p>
            <KnowledgeCheck
              spec={{
                ...content.experiment.beforeYouTry,
                choices: [...content.experiment.beforeYouTry.choices],
              }}
              onTry={() => {
                sim.setQubits(1);
                sim.clearCircuit();
                sim.place('X', 0, 0);
                sim.place('H', 0, 1);
                sim.place('H', 0, 2);
                sim.measureShots(100);
              }}
            />
          </div>
        )}
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
    const picked = content.predict.choices.find((c) => c.id === choice)?.label;
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
            <p className="panel__lede">{content.explain.compare.result(picked ?? '')}</p>
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
                    values={c.id === 'zero' ? [1, 0] : c.id === 'one' ? [0, 1] : [0.5, 0.5]}
                  />
                ),
              })),
            }}
            onTry={() => {
              sim.loadPreset('phase');
              sim.measureShots(100);
            }}
          />
          <KnowledgeCheck
            spec={{ ...content.checks[1], choices: content.checks[1].choices.map((c) => ({ ...c })) }}
            onTry={() => {
              sim.loadPreset('grover');
              sim.measureShots(100);
            }}
          />
        </div>
        <RealWorld items={content.explain.realWorld} />
        <MathTeaser
          tex={String.raw`P(b) = |\alpha_b|^2,\qquad H\,H = I`}
          label="Probability of answer b equals the size squared of its amplitude; H times H is the identity"
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
    const n = derived.qubits;
    const terms = Array.from(derived.state.re, (re, b) => ({ re, im: derived.state.im[b], b }))
      .filter((t) => t.re * t.re + t.im * t.im > 1e-6)
      .slice(0, 8)
      .map((t) => {
        const c =
          Math.abs(t.im) < 1e-9
            ? t.re.toFixed(2)
            : `(${t.re.toFixed(2)}${t.im >= 0 ? '+' : ''}${t.im.toFixed(2)}i)`;
        return `${c}\\,|${t.b.toString(2).padStart(n, '0')}\\rangle`;
      })
      .join(' + ')
      .replace(/\+ -/g, '- ');
    const tex = {
      state: String.raw`|\psi\rangle = \sum_{b} \alpha_b |b\rangle = ${terms || '0'}`,
      hadamard: String.raw`H = \frac{1}{\sqrt2}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix},\qquad H\,H = I`,
      born: String.raw`P(b) = |\alpha_b|^2,\qquad \textstyle\sum_b |\alpha_b|^2 = 1`,
      cost: String.raw`\text{amplitudes} = 2^{n} = 2^{${n}} = ${1 << n},\qquad 2^{50} \approx 1.1 \times 10^{15}`,
    };
    panel = (
      <div className="panel">
        <p className="panel__lbl">Go deeper</p>
        <h2 className="panel__prompt">{shared.mathTitle}</h2>
        <p className="panel__lede">{content.deeper.intro}</p>
        <div>
          <LiveEquation
            tex={tex.state}
            label="The state is a sum of amplitudes times basis states"
            reading={<Rich text={content.deeper.equations.state} />}
          />
          <LiveEquation
            tex={tex.hadamard}
            label="H equals one over root two times the matrix 1 1, 1 minus 1; H times H is the identity"
            reading={<Rich text={content.deeper.equations.hadamard} />}
          />
          <LiveEquation
            tex={tex.born}
            label="Probability of b equals the size squared of alpha b"
            reading={<Rich text={content.deeper.equations.born} />}
          />
          <LiveEquation
            tex={tex.cost}
            label={`Number of amplitudes equals 2 to the n, here ${1 << n}`}
            reading={<Rich text={content.deeper.equations.cost} />}
          />
        </div>
        {measureBlock}
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
        <QcStage
          sim={sim}
          derived={derived}
          mode={step}
          showResults={locked}
          arrows={arrows}
          onChange={refresh}
        />
      }
      panel={panel}
    />
  );
}
