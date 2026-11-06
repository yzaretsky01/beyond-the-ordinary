import { groundOf } from '../../engine/ground';
import { Rich } from '../../ui/learning/Rich';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import {
  RANGES,
  darkFringeMm,
  hasInterference,
  type DoubleSlitParams,
} from '../../physics/double-slit/fraunhofer';
import { useElementSize } from '../../engine/useElementSize';
import { useFrameLoop } from '../../engine/useFrameLoop';
import { Popover } from '../../ui/glossary/Popover';
import { content } from './content';
import { drawApparatus, slitCentres } from './renderers/apparatus';
import { FieldRenderer } from './renderers/field';
import { computeLayout, screenMmToY, slitToScreenToMetres, type StageLayout } from './renderers/layout';
import { ScreenRenderer } from './renderers/screen';
import { HISTOGRAM_BINS, type DoubleSlitSimulation } from './simulation';
import '../../ui/stage/stage.css';

export type StageMode = 'wonder' | 'predict' | 'experiment' | 'explain' | 'deeper';

interface StageProps {
  sim: DoubleSlitSimulation;
  params: DoubleSlitParams;
  mode: StageMode;
  showResults: boolean;
  showTheory: boolean;
  phaseArrows: boolean;
  reducedMotion: boolean;
  prediction: number[] | null;
  onSketch: (profile: number[]) => void;
  onParams: (p: Partial<DoubleSlitParams>) => void;
}

export function DoubleSlitStage(props: StageProps) {
  const { sim, params, mode, showResults, showTheory, phaseArrows, reducedMotion, prediction } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { width, height } = useElementSize(wrap);
  const layout = useMemo(
    () => (width > 40 && height > 120 ? computeLayout(width, height, params) : null),
    [width, height, params],
  );
  const field = useRef(new FieldRenderer());
  const screen = useRef(new ScreenRenderer());
  const frozenT = useRef(0);

  // size the backing store for crisp drawing
  useEffect(() => {
    const c = canvas.current;
    if (!c || !layout) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(layout.width * dpr);
    c.height = Math.round(layout.height * dpr);
  }, [layout]);

  const latest = useRef({ layout, params, showResults, showTheory, phaseArrows, prediction, reducedMotion });
  latest.current = { layout, params, showResults, showTheory, phaseArrows, prediction, reducedMotion };

  useFrameLoop((dt, t) => {
    sim.step(dt);
    const s = latest.current;
    const c = canvas.current;
    if (!c || !s.layout) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = c.width / s.layout.width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = groundOf(c);
    ctx.fillRect(0, 0, s.layout.width, s.layout.height);
    // reduced motion: the wave holds still; photons still arrive
    const time = s.reducedMotion ? frozenT.current : (frozenT.current = t);
    field.current.ensure(s.layout, s.params);
    field.current.draw(ctx, s.layout, s.params, time);
    if (s.phaseArrows) field.current.drawPhaseArrows(ctx, s.layout);
    drawApparatus(ctx, s.layout, s.params);
    screen.current.draw(ctx, s.layout, sim, {
      showResults: s.showResults,
      showTheory: s.showTheory,
      prediction: s.prediction,
    });
  });

  return (
    <div className="stage" ref={wrap}>
      <canvas ref={canvas} className="stage__canvas" aria-hidden="true" />
      {layout && (
        <>
          <Handles {...props} layout={layout} />
          {mode === 'predict' && <SketchPad layout={layout} onSketch={props.onSketch} />}
          {mode === 'explain' && <Hotspots layout={layout} params={params} />}
          {!showResults && (
            <p
              className="stage__covered"
              style={{ left: layout.histX, top: layout.cy - 30, width: layout.histWidth }}
            >
              Hidden until you predict
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- On-stage controls: hands-on, with keyboard equivalents ---------------- */

function Handles({ sim, params, layout: l, onParams, showResults }: StageProps & { layout: StageLayout }) {
  const { upper, lower } = slitCentres(l);
  const half = l.geometry.slitWidthPx / 2;
  const holdTimer = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);

  const startFire = (e: PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    sim.fire(1);
    holdTimer.current = window.setTimeout(() => {
      sim.setStreaming(true);
      setHolding(true);
    }, 350);
  };
  const endFire = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (holding) {
      sim.setStreaming(false);
      setHolding(false);
    }
  };

  const drag = (onMove: (x: number, y: number) => void) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.currentTarget.dataset.dragging = 'true';
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (e.currentTarget.dataset.dragging !== 'true') return;
      const box = e.currentTarget.parentElement!.getBoundingClientRect();
      onMove(e.clientX - box.left, e.clientY - box.top);
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.dataset.dragging = 'false';
    },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.dataset.dragging = 'false';
    },
  });

  const key = (e: KeyboardEvent, value: number, step: number, big: number, set: (v: number) => void) => {
    const map: Record<string, number> = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
      PageUp: big,
      PageDown: -big,
    };
    if (e.key in map) {
      e.preventDefault();
      set(value + map[e.key]);
    }
  };

  const toggleSlit = (which: 'upper' | 'lower') => {
    const o = params.openSlits;
    if (o === 'both') onParams({ openSlits: which === 'upper' ? 'lower' : 'upper' });
    else if (o !== which) onParams({ openSlits: 'both' });
  };
  const slitLabel = (which: 'upper' | 'lower') => {
    const open = params.openSlits === 'both' || params.openSlits === which;
    const name = which === 'upper' ? 'Top' : 'Bottom';
    return open ? `${name} slit: open. Press to close it.` : `${name} slit: closed. Press to open it.`;
  };
  const onlyOpen = (which: 'upper' | 'lower') => params.openSlits === which;

  return (
    <>
      <button
        type="button"
        className="handle handle--source"
        style={{ left: l.sourceX, top: l.cy }}
        aria-label={
          showResults
            ? 'Fire one photon. Hold to fire continuously.'
            : 'Fire a photon (make a prediction first)'
        }
        disabled={!showResults}
        onPointerDown={startFire}
        onPointerUp={endFire}
        onPointerCancel={endFire}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            sim.fire(1);
          }
        }}
        onClick={(e) => e.preventDefault()}
      >
        <span className="handle__ring" data-holding={holding} />
      </button>

      <div
        role="slider"
        tabIndex={0}
        className="handle handle--knob"
        style={{ left: l.slitX, top: Math.max(l.top + 8, upper - half - 18) }}
        aria-label="Slit separation (drag the top slit)"
        aria-valuemin={RANGES.separationMm.min}
        aria-valuemax={RANGES.separationMm.max}
        aria-valuenow={params.separationMm}
        aria-valuetext={`${params.separationMm.toFixed(2)} millimetres`}
        aria-orientation="vertical"
        onKeyDown={(e) =>
          key(e, params.separationMm, 0.01, 0.05, (v) =>
            onParams({ separationMm: Math.round(v * 100) / 100 }),
          )
        }
        {...drag((_x, y) => {
          const sepPx = Math.max(4, 2 * (l.cy - (y + half + 18)));
          onParams({
            separationMm: Math.round(((params.separationMm * sepPx) / l.geometry.separationPx) * 100) / 100,
          });
        })}
      >
        <span aria-hidden="true">↕</span>
      </div>

      <div
        role="slider"
        tabIndex={0}
        className="handle handle--knob"
        style={{ left: l.screenX + l.stripWidth / 2, top: l.top - 17 }}
        aria-label="Screen distance (drag the screen)"
        aria-valuemin={RANGES.screenDistanceM.min}
        aria-valuemax={RANGES.screenDistanceM.max}
        aria-valuenow={params.screenDistanceM}
        aria-valuetext={`${params.screenDistanceM.toFixed(2)} metres`}
        onKeyDown={(e) =>
          key(e, params.screenDistanceM, 0.05, 0.25, (v) =>
            onParams({ screenDistanceM: Math.round(v * 20) / 20 }),
          )
        }
        {...drag((x) =>
          onParams({ screenDistanceM: Math.round(slitToScreenToMetres(l, x - l.slitX) * 20) / 20 }),
        )}
      >
        <span aria-hidden="true">↔</span>
      </div>

      {(['upper', 'lower'] as const).map((w) => (
        <button
          key={w}
          type="button"
          className="handle handle--slit"
          style={{ left: l.slitX, top: w === 'upper' ? upper : lower, height: Math.max(28, 2 * half + 12) }}
          aria-label={slitLabel(w)}
          aria-pressed={params.openSlits === 'both' || params.openSlits === w}
          disabled={onlyOpen(w)}
          title={onlyOpen(w) ? 'At least one slit stays open' : undefined}
          onClick={() => toggleSlit(w)}
        />
      ))}

      <button
        type="button"
        className="handle handle--detector"
        style={{ left: l.slitX, top: l.bottom - 20 }}
        aria-pressed={params.detector}
        onClick={() => onParams({ detector: !params.detector })}
      >
        <span className="handle__eye" aria-hidden="true" />
        {params.detector ? 'Detector on' : 'Detector off'}
      </button>
    </>
  );
}

/* ---------------- Prediction sketch on the screen column ---------------- */

function SketchPad({ layout: l, onSketch }: { layout: StageLayout; onSketch: (p: number[]) => void }) {
  const profile = useRef<number[]>(new Array(HISTOGRAM_BINS).fill(0));
  const last = useRef<{ b: number; v: number } | null>(null);
  const paint = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const v = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    const b = Math.min(
      HISTOGRAM_BINS - 1,
      Math.max(0, Math.floor((1 - (e.clientY - box.top) / box.height) * HISTOGRAM_BINS)),
    );
    const p = profile.current;
    const prev = last.current;
    if (prev) {
      const step = b > prev.b ? 1 : -1;
      for (let k = prev.b; k !== b; k += step) p[k] = prev.v + ((v - prev.v) * (k - prev.b)) / (b - prev.b);
    }
    p[b] = v;
    last.current = { b, v };
    onSketch([...p]);
  };
  return (
    <div
      className="sketch"
      style={{ left: l.histX, top: l.top, width: l.histWidth, height: l.screenHeight }}
      aria-hidden="true"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        last.current = null;
        paint(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons || e.pointerType === 'touch') paint(e);
      }}
      onPointerUp={() => (last.current = null)}
    >
      <span className="sketch__hint">draw here</span>
    </div>
  );
}

/* ---------------- Explain-step hotspots, placed from the model ---------------- */

function Hotspots({ layout: l, params }: { layout: StageLayout; params: DoubleSlitParams }) {
  const h = content.explain.hotspots;
  const spots: { id: string; x: number; y: number; title: string; body: string }[] = [
    { id: 'centre', x: l.screenX - 16, y: screenMmToY(l, 0), ...h.centre },
    { id: 'slits', x: l.slitX - 24, y: l.cy, ...h.slits },
    { id: 'colours', x: l.slitX + l.slitToScreen * 0.45, y: l.top + l.screenHeight * 0.18, ...h.colours },
  ];
  if (hasInterference(params)) {
    // the second dark stripe (path difference 1½ λ): far enough from the centre marker to tap separately
    const y = darkFringeMm(1, params);
    if (Number.isFinite(y)) spots.push({ id: 'dark', x: l.screenX - 16, y: screenMmToY(l, y), ...h.dark });
  }
  return (
    <>
      {spots.map((s, i) => (
        <span key={s.id} className="hotspot" style={{ left: s.x, top: s.y }}>
          <Popover
            trigger={<span className="hotspot__dot">{i + 1}</span>}
            label={`${i + 1}: ${s.title}`}
            triggerClassName="hotspot__btn"
            side="bottom"
          >
            <strong>{s.title}.</strong> <Rich text={s.body} />
          </Popover>
        </span>
      ))}
    </>
  );
}
