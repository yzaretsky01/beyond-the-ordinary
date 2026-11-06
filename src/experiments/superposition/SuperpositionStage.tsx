import { groundOf } from '../../engine/ground';
import { Rich } from '../../ui/learning/Rich';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { RANGES, type SuperpositionParams } from '../../physics/superposition/interferometer';
import { useElementSize } from '../../engine/useElementSize';
import { useFrameLoop } from '../../engine/useFrameLoop';
import { Popover } from '../../ui/glossary/Popover';
import '../../ui/stage/stage.css';
import { content } from './content';
import { computeLayout, drawBars, drawBloch, drawInterferometer, type SupLayout } from './renderers/draw';
import type { SuperpositionSimulation } from './simulation';

interface Props {
  sim: SuperpositionSimulation;
  params: SuperpositionParams;
  mode: 'wonder' | 'predict' | 'experiment' | 'explain' | 'deeper';
  showResults: boolean;
  showTheory: boolean;
  phaseArrows: boolean;
  reducedMotion: boolean;
  predictionD1: number | null;
  onParams: (p: Partial<SuperpositionParams>) => void;
}

export function SuperpositionStage(props: Props) {
  const { sim, params, mode, showResults, showTheory, reducedMotion, predictionD1, phaseArrows } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { width, height } = useElementSize(wrap);
  const layout = useMemo(
    () => (width > 60 && height > 120 ? computeLayout(width, height) : null),
    [width, height],
  );
  const frozenT = useRef(0);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !layout) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(layout.width * dpr);
    c.height = Math.round(layout.height * dpr);
  }, [layout]);

  const latest = useRef({
    layout,
    params,
    showResults,
    showTheory,
    predictionD1,
    reducedMotion,
    phaseArrows,
  });
  latest.current = { layout, params, showResults, showTheory, predictionD1, reducedMotion, phaseArrows };

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
    const time = s.reducedMotion ? frozenT.current : (frozenT.current = t);
    drawInterferometer(ctx, s.layout, s.params, sim, time, s.phaseArrows);
    drawBloch(ctx, s.layout, s.params);
    drawBars(ctx, s.layout, sim, {
      showResults: s.showResults,
      showTheory: s.showTheory,
      predictionD1: s.predictionD1,
    });
  });

  return (
    <div className="stage" ref={wrap}>
      <canvas ref={canvas} className="stage__canvas" aria-hidden="true" />
      {layout && (
        <>
          <Handles {...props} layout={layout} />
          {mode === 'explain' && <Hotspots layout={layout} />}
          {!showResults && (
            <p
              className="stage__covered"
              style={{
                left: layout.bars.x,
                top: layout.bars.y + layout.bars.h / 2 - 10,
                width: layout.bars.w,
              }}
            >
              Counts hidden until you predict
            </p>
          )}
        </>
      )}
    </div>
  );
}

function useDelta(onDelta: (dx: number, dy: number) => void) {
  const last = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      last.current = { x: e.clientX, y: e.clientY };
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (!last.current) return;
      onDelta(e.clientX - last.current.x, e.clientY - last.current.y);
      last.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: () => (last.current = null),
    onPointerCancel: () => (last.current = null),
  };
}

const wrapDeg = (v: number) => ((Math.round(v) % 360) + 360) % 360;
const clampTheta = (v: number) => Math.min(RANGES.thetaDeg.max, Math.max(RANGES.thetaDeg.min, Math.round(v)));

function Handles({ sim, params, layout: l, onParams, showResults }: Props & { layout: SupLayout }) {
  const holdTimer = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);
  const p = useRef(params);
  p.current = params;

  const thetaDrag = useDelta((_dx, dy) => onParams({ thetaDeg: clampTheta(p.current.thetaDeg + dy * 0.6) }));
  const phiDrag = useDelta((dx) => onParams({ phiDeg: wrapDeg(p.current.phiDeg + dx * 1.2) }));
  const blochDrag = useDelta((dx, dy) =>
    onParams({
      phiDeg: wrapDeg(p.current.phiDeg + dx * 1.2),
      thetaDeg: clampTheta(p.current.thetaDeg + dy * 0.8),
    }),
  );

  const key = (e: KeyboardEvent, which: 'theta' | 'phi') => {
    const step = e.shiftKey || e.key.startsWith('Page') ? 15 : 1;
    const dir = { ArrowUp: 1, ArrowRight: 1, PageUp: 1, ArrowDown: -1, ArrowLeft: -1, PageDown: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    if (which === 'theta') onParams({ thetaDeg: clampTheta(params.thetaDeg + dir * step) });
    else onParams({ phiDeg: wrapDeg(params.phiDeg + dir * step) });
  };

  return (
    <>
      <button
        type="button"
        className="handle handle--source"
        style={{ left: l.source.x, top: l.source.y }}
        aria-label={
          showResults
            ? 'Fire one photon. Hold to fire continuously.'
            : 'Fire a photon (make a prediction first)'
        }
        disabled={!showResults}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          sim.fire(1);
          holdTimer.current = window.setTimeout(() => {
            sim.setStreaming(true);
            setHolding(true);
          }, 350);
        }}
        onPointerUp={() => {
          if (holdTimer.current) window.clearTimeout(holdTimer.current);
          if (holding) {
            sim.setStreaming(false);
            setHolding(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            sim.fire(1);
          }
        }}
      >
        <span className="handle__ring" data-holding={holding} />
      </button>

      <div
        role="slider"
        tabIndex={0}
        className="handle handle--knob"
        style={{ left: l.bs1.x - 30, top: l.bs1.y - 30 }}
        aria-label="First splitter (drag up or down)"
        aria-valuemin={RANGES.thetaDeg.min}
        aria-valuemax={RANGES.thetaDeg.max}
        aria-valuenow={params.thetaDeg}
        aria-valuetext={`${Math.round(Math.cos((params.thetaDeg * Math.PI) / 360) ** 2 * 100)} percent to the upper path`}
        onKeyDown={(e) => key(e, 'theta')}
        {...thetaDrag}
      >
        <span aria-hidden="true">↕</span>
      </div>

      <div
        role="slider"
        tabIndex={0}
        className="handle handle--knob"
        style={{ left: l.plate.x, top: l.plate.y - 36, borderColor: 'var(--c-link-d)' }}
        aria-label="Phase shift (drag left or right)"
        aria-valuemin={RANGES.phiDeg.min}
        aria-valuemax={RANGES.phiDeg.max}
        aria-valuenow={params.phiDeg}
        aria-valuetext={`${params.phiDeg} degrees`}
        onKeyDown={(e) => key(e, 'phi')}
        {...phiDrag}
      >
        <span aria-hidden="true">↔</span>
      </div>

      <button
        type="button"
        className="handle handle--detector"
        style={{ left: l.bs2.x - 4, top: l.bs2.y + 64 }}
        aria-pressed={params.secondSplitter}
        onClick={() => onParams({ secondSplitter: !params.secondSplitter })}
      >
        {params.secondSplitter ? 'Remove splitter 2' : 'Insert splitter 2'}
      </button>

      <div
        className="bloch-drag"
        aria-hidden="true"
        style={{
          left: l.bloch.cx - l.bloch.r,
          top: l.bloch.cy - l.bloch.r,
          width: 2 * l.bloch.r,
          height: 2 * l.bloch.r,
        }}
        {...blochDrag}
      />
    </>
  );
}

function Hotspots({ layout: l }: { layout: SupLayout }) {
  const h = content.explain.hotspots;
  const spots = [
    { id: 'split', x: l.bs1.x + 26, y: l.bs1.y + 26, ...h.split },
    { id: 'phase', x: l.plate.x + 30, y: l.plate.y + 10, ...h.phase },
    { id: 'meet', x: l.bs2.x - 28, y: l.bs2.y - 26, ...h.meet },
    { id: 'sphere', x: l.bloch.cx + l.bloch.r * 0.85, y: l.bloch.cy - l.bloch.r * 0.85, ...h.sphere },
  ];
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
