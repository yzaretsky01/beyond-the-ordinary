import { groundOf } from '../../engine/ground';
import { Rich } from '../../ui/learning/Rich';
import { useEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { RANGES, toUnits, type TunnelParams } from '../../physics/tunneling/schrodinger1d';
import { useElementSize } from '../../engine/useElementSize';
import { useFrameLoop } from '../../engine/useFrameLoop';
import { Popover } from '../../ui/glossary/Popover';
import '../../ui/stage/stage.css';
import { content } from './content';
import {
  computeLayout,
  drawBars,
  drawTunnel,
  eToPx,
  pxToE,
  pxToX,
  xToPx,
  type TunLayout,
} from './renderers/draw';
import type { TunnelingSimulation } from './simulation';

interface Props {
  sim: TunnelingSimulation;
  params: TunnelParams;
  mode: 'wonder' | 'predict' | 'experiment' | 'explain' | 'deeper';
  showResults: boolean;
  showTheory: boolean;
  arrows: boolean;
  classical: boolean;
  prediction: number | null;
  onParams: (p: Partial<TunnelParams>) => void;
}

export function TunnelingStage(props: Props) {
  const { sim, params, mode, showResults, showTheory, arrows, classical, prediction } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { width, height } = useElementSize(wrap);
  const layout = useMemo(
    () => (width > 60 && height > 160 ? computeLayout(width, height, params) : null),
    [width, height, params],
  );

  useEffect(() => {
    const c = canvas.current;
    if (!c || !layout) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(layout.width * dpr);
    c.height = Math.round(layout.height * dpr);
  }, [layout]);

  const latest = useRef({ layout, params, showResults, showTheory, arrows, classical, prediction });
  latest.current = { layout, params, showResults, showTheory, arrows, classical, prediction };

  useFrameLoop((dt) => {
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
    drawTunnel(ctx, s.layout, s.params, sim, { arrows: s.arrows, classical: s.classical });
    drawBars(ctx, s.layout, sim, {
      showResults: s.showResults,
      prediction: s.prediction,
      showTheory: s.showTheory,
    });
  });

  return (
    <div className="stage" ref={wrap}>
      <canvas ref={canvas} className="stage__canvas" aria-hidden="true" />
      {layout && (
        <>
          <Handles {...props} layout={layout} />
          {mode === 'explain' && <Hotspots layout={layout} params={params} />}
          {!showResults && (
            <p
              className="stage__covered"
              style={{
                left: layout.bars.x,
                top: layout.bars.y + layout.bars.h / 2 - 10,
                width: layout.bars.w,
              }}
            >
              Hidden until you predict
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Knob(p: {
  label: string;
  x: number;
  y: number;
  value: number;
  min: number;
  max: number;
  step: number;
  text: string;
  onChange: (v: number) => void;
  fromPointer: (x: number, y: number) => number;
  colour?: string;
  glyph: string;
}) {
  const dragging = useRef(false);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.parentElement!.getBoundingClientRect();
    p.onChange(p.fromPointer(e.clientX - box.left, e.clientY - box.top));
  };
  const key = (e: KeyboardEvent) => {
    const big = e.key.startsWith('Page') ? 10 : 1;
    const dir = { ArrowUp: 1, ArrowRight: 1, PageUp: 1, ArrowDown: -1, ArrowLeft: -1, PageDown: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    p.onChange(p.value + dir * big * p.step);
  };
  return (
    <div
      role="slider"
      tabIndex={0}
      className="handle handle--knob"
      style={{ left: p.x, top: p.y, borderColor: p.colour }}
      aria-label={p.label}
      aria-valuemin={p.min}
      aria-valuemax={p.max}
      aria-valuenow={p.value}
      aria-valuetext={p.text}
      onKeyDown={key}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        dragging.current = true;
      }}
      onPointerMove={(e) => dragging.current && move(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <span aria-hidden="true">{p.glyph}</span>
    </div>
  );
}

const snap = (v: number, step: number) => Math.round(v / step) * step;

function Handles({ sim, params, layout: l, onParams, showResults }: Props & { layout: TunLayout }) {
  const bx0 = xToPx(l, 0);
  const bx1 = xToPx(l, toUnits.length(params.widthNm));
  const by = eToPx(l, params.barrierEv);
  const ey = eToPx(l, params.energyEv);
  return (
    <>
      <button
        type="button"
        className="handle handle--source"
        style={{ left: xToPx(l, sim.wave.x0), top: l.plot.y + l.plot.h - 24 }}
        aria-label={showResults ? 'Launch the electron from here' : 'Launch (make a prediction first)'}
        disabled={!showResults}
        onClick={() => sim.launch()}
      >
        <span className="handle__ring" />
      </button>
      <Knob
        label="Wall height (drag up or down)"
        x={(bx0 + bx1) / 2}
        y={by - 24}
        value={params.barrierEv}
        {...RANGES.barrierEv}
        text={`${params.barrierEv.toFixed(1)} electronvolts`}
        glyph="↕"
        colour="#d9d2c4"
        onChange={(v) => onParams({ barrierEv: snap(v, 0.1) })}
        fromPointer={(_x, y) => snap(pxToE(l, y + 24), 0.1)}
      />
      <Knob
        label="Wall thickness (drag left or right)"
        x={bx1 + 18}
        y={Math.min(l.plot.y + l.plot.h - 30, by + 30)}
        value={params.widthNm}
        {...RANGES.widthNm}
        text={`${params.widthNm.toFixed(3)} nanometres`}
        glyph="↔"
        colour="var(--c-link-d)"
        onChange={(v) => onParams({ widthNm: v })}
        fromPointer={(x) => (pxToX(l, x - 18) - 0) * 0.1}
      />
      <Knob
        label="Electron energy (drag up or down)"
        x={l.plot.x + 22}
        y={ey}
        value={params.energyEv}
        {...RANGES.energyEv}
        text={`${params.energyEv.toFixed(1)} electronvolts`}
        glyph="↕"
        colour="var(--c-text)"
        onChange={(v) => onParams({ energyEv: snap(v, 0.1) })}
        fromPointer={(_x, y) => snap(pxToE(l, y), 0.1)}
      />
    </>
  );
}

function Hotspots({ layout: l, params }: { layout: TunLayout; params: TunnelParams }) {
  const h = content.explain.hotspots;
  const bx0 = xToPx(l, 0);
  const bx1 = xToPx(l, toUnits.length(params.widthNm));
  const base = l.plot.y + l.plot.h;
  const spots = [
    { id: 'inside', x: (bx0 + bx1) / 2, y: base - 40, ...h.inside },
    { id: 'beyond', x: xToPx(l, 50), y: base - 60, ...h.beyond },
    { id: 'reflected', x: xToPx(l, -50), y: base - 90, ...h.reflected },
    { id: 'energy', x: l.plot.x + l.plot.w * 0.25, y: eToPx(l, params.energyEv) - 22, ...h.energy },
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
