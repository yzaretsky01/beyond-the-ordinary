import { Rich } from '../../ui/learning/Rich';
import { useState, type DragEvent } from 'react';
import { phaseToRgb } from '../../physics/core/colour';
import { basisLabel, probabilities, type GateName } from '../../physics/quantum-computing/stateVector';
import { Popover } from '../../ui/glossary/Popover';
import { content } from './content';
import { COLS, type QcDerived, type QuantumComputerSimulation } from './simulation';
import './qc.css';

const GATES: GateName[] = ['H', 'X', 'Z', 'S', 'T', 'CNOT', 'CZ'];

interface Props {
  sim: QuantumComputerSimulation;
  derived: QcDerived;
  mode: 'wonder' | 'predict' | 'experiment' | 'explain' | 'deeper';
  showResults: boolean;
  arrows: boolean;
  onChange: () => void;
}

function Hotspot({ n, id }: { n: number; id: keyof typeof content.explain.hotspots }) {
  const h = content.explain.hotspots[id];
  return (
    <span className="qc-hotspot">
      <Popover
        trigger={<span className="hotspot__dot">{n}</span>}
        label={`${n}: ${h.title}`}
        triggerClassName="hotspot__btn"
        side="bottom"
      >
        <strong>{h.title}.</strong> <Rich text={h.body} />
      </Popover>
    </span>
  );
}

export function QcStage({ sim, derived: d, mode, showResults, arrows, onChange }: Props) {
  const [selected, setSelected] = useState<GateName | null>('H');
  const n = d.qubits;
  const explain = mode === 'explain';

  const act = (q: number, c: number) => {
    const cell = sim.cell(q, c);
    if (selected && (!cell || cell.op.gate !== selected || cell.role !== 'single')) {
      if (!sim.place(selected, q, c)) return;
    } else if (cell) sim.remove(q, c);
    onChange();
  };

  const onDrop = (e: DragEvent, q: number, c: number) => {
    e.preventDefault();
    const g = e.dataTransfer.getData('text/plain') as GateName;
    if (GATES.includes(g) && sim.place(g, q, c)) onChange();
  };

  // connectors for two-qubit gates
  const links: { c: number; a: number; b: number }[] = [];
  sim.columns.forEach((col, c) =>
    col.forEach((op) => {
      if ('control' in op)
        links.push({ c, a: Math.min(op.control, op.target), b: Math.max(op.control, op.target) });
    }),
  );

  const probs = probabilities(d.state);
  const maxShots = Math.max(1, ...d.shots);

  return (
    <div className="qc">
      <div className="qc__tools">
        <div className="qc__palette" role="toolbar" aria-label="Gates">
          {GATES.map((g) => (
            <button
              key={g}
              type="button"
              className="qc__chip"
              data-gate={g}
              aria-pressed={selected === g}
              aria-describedby={selected === g ? 'qc-gate-help' : undefined}
              disabled={(g === 'CNOT' || g === 'CZ') && n < 2}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', g)}
              onClick={() => setSelected(g)}
            >
              {g}
            </button>
          ))}
          {explain && <Hotspot n={1} id="circuit" />}
        </div>
        {/* one line describing the chosen gate replaces a row of separate info buttons */}
        <p id="qc-gate-help" className="qc__help" aria-live="polite">
          {selected ? (
            <>
              <b className="mono">{selected}</b> {content.gates[selected]}
            </>
          ) : null}
        </p>
      </div>

      <div className="qc__circuit-scroll">
        <div className="qc__circuit" style={{ ['--cols' as string]: COLS, ['--rows' as string]: n }}>
          {links.map((k, i) => (
            <span
              key={i}
              className="qc__link"
              aria-hidden="true"
              style={{
                left: `calc(var(--label) + ${k.c} * var(--cell) + var(--cell) / 2 - 1px)`,
                top: `calc(${k.a} * var(--cell) + var(--cell) / 2)`,
                height: `calc(${k.b - k.a} * var(--cell))`,
              }}
            />
          ))}
          {Array.from({ length: n }, (_, q) => (
            <div className="qc__row" key={q}>
              <span className="qc__label mono">
                q{q} <span aria-hidden="true">|0⟩</span>
              </span>
              {Array.from({ length: COLS }, (_, c) => {
                const cell = sim.cell(q, c);
                const sym = !cell
                  ? ''
                  : cell.role === 'control'
                    ? '●'
                    : cell.role === 'target' && cell.op.gate === 'CNOT'
                      ? '⊕'
                      : cell.role === 'target'
                        ? '●'
                        : cell.op.gate;
                const name = !cell
                  ? `Qubit ${q}, step ${c + 1}: empty.${selected ? ` Place ${selected}.` : ''}`
                  : `Qubit ${q}, step ${c + 1}: ${cell.op.gate}${cell.role !== 'single' ? ` ${cell.role}` : ''}. ${selected && cell.op.gate !== selected ? `Replace with ${selected}.` : 'Remove.'}`;
                return (
                  <button
                    key={c}
                    type="button"
                    className="qc__slot"
                    data-filled={!!cell}
                    data-role={cell?.role}
                    data-past={c < d.view}
                    aria-label={name}
                    onClick={() => act(q, c)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDrop(e, q, c)}
                  >
                    {sym}
                  </button>
                );
              })}
              <span className="qc__meter" aria-hidden="true">
                ⟋
              </span>
            </div>
          ))}
          <div
            className="qc__viewline"
            style={{ left: `calc(var(--label) + ${d.view} * var(--cell))` }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="qc__lower">
        <section className="qc__amps" aria-label={`Amplitudes after step ${d.view}`}>
          <p className="qc__title mono">AMPLITUDES AFTER STEP {d.view}</p>
          <div className="qc__discs">
            {probs.map((p, b) => {
              const re = d.state.re[b];
              const im = d.state.im[b];
              const ph = Math.atan2(im, re);
              const [r, g, bl] = phaseToRgb(ph);
              const scale = Math.sqrt(p);
              return (
                <figure key={b} className="qc__disc">
                  <svg
                    viewBox="-30 -30 60 60"
                    role="img"
                    aria-label={`${basisLabel(b, n)}: probability ${Math.round(p * 100)} percent, phase ${Math.round((ph * 180) / Math.PI)} degrees`}
                  >
                    <circle r="28" fill="none" stroke="rgba(233,234,255,0.2)" />
                    <circle
                      className="qc__fill"
                      r="28"
                      fill={`rgb(${r},${g},${bl})`}
                      style={{ transform: `scale(${scale})` }}
                    />
                    {arrows && p > 0.001 && (
                      <line
                        className="qc__arrow"
                        x1="0"
                        y1="0"
                        x2="24"
                        y2="0"
                        style={{
                          transform: `rotate(${(-ph * 180) / Math.PI}deg) scale(${Math.max(0.35, scale)})`,
                        }}
                      />
                    )}
                  </svg>
                  <figcaption className="mono">
                    {basisLabel(b, n)}
                    <br />
                    {Math.round(p * 100)}%
                  </figcaption>
                </figure>
              );
            })}
          </div>
          {explain && <Hotspot n={2} id="discs" />}
        </section>

        <section className="qc__shots" aria-label="Measurement results">
          <p className="qc__title mono">
            {showResults ? `MEASURED ${d.totalShots} TIMES` : 'MEASUREMENTS HIDDEN UNTIL YOU PREDICT'}
          </p>
          <div className="qc__bars">
            {d.shots.map((s, b) => (
              <div key={b} className="qc__bar" data-last={d.lastOutcome === b}>
                <div className="qc__barbox">
                  {showResults && (
                    <div className="qc__barfill" style={{ height: `${(s / maxShots) * 100}%` }} />
                  )}
                  {showResults && d.totalShots > 0 && (
                    <div
                      className="qc__theory"
                      style={{ bottom: `${(d.final[b] * d.totalShots * 100) / maxShots}%` }}
                    />
                  )}
                </div>
                <span className="mono">{basisLabel(b, n)}</span>
                {showResults && <span className="mono qc__count">{s}</span>}
              </div>
            ))}
          </div>
          {explain && <Hotspot n={3} id="shots" />}
        </section>
      </div>
      {explain && (
        <span className="qc-hotspot qc-hotspot--scrub">
          <Hotspot n={4} id="scrub" />
        </span>
      )}
    </div>
  );
}
