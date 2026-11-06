import { groundOf } from '../../engine/ground';
import { Rich } from '../../ui/learning/Rich';
import { useEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { useElementSize } from '../../engine/useElementSize';
import { useFrameLoop } from '../../engine/useFrameLoop';
import { Popover } from '../../ui/glossary/Popover';
import '../../ui/stage/stage.css';
import { content } from './content';
import {
  computeLayout,
  drawApparatus,
  drawChart,
  drawMeter,
  drawTapes,
  type EntLayout,
} from './renderers/draw';
import type { EntanglementParams, EntanglementSimulation } from './simulation';

interface Props {
  sim: EntanglementSimulation;
  params: EntanglementParams;
  mode: 'wonder' | 'predict' | 'experiment' | 'explain' | 'deeper';
  showResults: boolean;
  prediction: number | null;
  onParams: (p: Partial<EntanglementParams>) => void;
}

export function EntanglementStage(props: Props) {
  const { sim, params, mode, showResults, prediction } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { width, height } = useElementSize(wrap);
  const layout = useMemo(
    () => (width > 60 && height > 160 ? computeLayout(width, height) : null),
    [width, height],
  );

  useEffect(() => {
    const c = canvas.current;
    if (!c || !layout) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(layout.width * dpr);
    c.height = Math.round(layout.height * dpr);
  }, [layout]);

  const latest = useRef({ layout, params, showResults, prediction });
  latest.current = { layout, params, showResults, prediction };

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
    drawApparatus(ctx, s.layout, s.params, sim);
    if (s.showResults) drawTapes(ctx, s.layout, sim);
    drawChart(ctx, s.layout, s.params, sim, { prediction: s.prediction, showResults: s.showResults });
    drawMeter(ctx, s.layout, s.params, sim, s.showResults);
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
              style={{ left: layout.tapes.x, top: layout.tapes.y + 4, width: layout.tapes.w }}
            >
              Results hidden until you predict
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Dial({
  who,
  l,
  value,
  onChange,
}: {
  who: 'Alice' | 'Bob';
  l: EntLayout;
  value: number;
  onChange: (v: number) => void;
}) {
  const c = who === 'Alice' ? l.alice : l.bob;
  const dragging = useRef(false);
  const angleFrom = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (box.left + box.width / 2);
    const dy = -(e.clientY - (box.top + box.height / 2));
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return Math.round(((deg % 180) + 180) % 180);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.key.startsWith('Page') ? 15 : 1;
    const dir = { ArrowUp: 1, ArrowRight: 1, PageUp: 1, ArrowDown: -1, ArrowLeft: -1, PageDown: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    onChange((((value + dir * step) % 180) + 180) % 180);
  };
  return (
    <div
      role="slider"
      tabIndex={0}
      className="dial"
      style={{ left: c.x, top: c.y, width: 2 * l.dialR + 16, height: 2 * l.dialR + 16 }}
      aria-label={`${who}’s polariser (drag to rotate)`}
      aria-valuemin={0}
      aria-valuemax={179}
      aria-valuenow={value}
      aria-valuetext={`${value} degrees`}
      onKeyDown={onKey}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        dragging.current = true;
        onChange(angleFrom(e));
      }}
      onPointerMove={(e) => dragging.current && onChange(angleFrom(e))}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    />
  );
}

function Handles({ sim, params, layout: l, onParams, showResults }: Props & { layout: EntLayout }) {
  return (
    <>
      <button
        type="button"
        className="handle handle--source"
        style={{ left: l.source.x, top: l.source.y }}
        aria-label={showResults ? 'Fire one pair from the source' : 'Fire a pair (make a prediction first)'}
        disabled={!showResults}
        onClick={() => sim.fire(1)}
      >
        <span className="handle__ring" />
      </button>
      <Dial who="Alice" l={l} value={params.aDeg} onChange={(v) => onParams({ aDeg: v })} />
      <Dial who="Bob" l={l} value={params.bDeg} onChange={(v) => onParams({ bDeg: v })} />
    </>
  );
}

function Hotspots({ layout: l }: { layout: EntLayout }) {
  const h = content.explain.hotspots;
  const spots = [
    { id: 'source', x: l.source.x + 30, y: l.source.y - 26, ...h.source },
    { id: 'dial', x: l.bob.x - l.dialR - 10, y: l.bob.y - l.dialR - 6, ...h.dial },
    { id: 'chart', x: l.chart.x + l.chart.w - 16, y: l.chart.y + 16, ...h.chart },
    { id: 'meter', x: l.meter.x + l.meter.w - 12, y: l.meter.y + 12, ...h.meter },
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
