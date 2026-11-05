import type { CSSProperties, ReactNode } from 'react';
import { InfoTip } from '../glossary/Popover';
import './controls.css';

interface SliderProps {
  id: string;
  label: string;
  /** Maths symbol shown beside the label and linked to the same symbol in equations */
  symbol?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
  tip: ReactNode;
  accent?: string;
  spectrum?: boolean;
  highlighted?: boolean;
  /** Spoken value for screen readers, e.g. "532 nanometres" */
  valueText?: string;
}

export function ParamSlider(p: SliderProps) {
  return (
    <div
      className="ctl"
      data-highlight={p.highlighted ? 'true' : 'false'}
      style={{ '--ctl-accent': p.accent } as CSSProperties}
    >
      <div className="ctl__head">
        <label htmlFor={p.id}>{p.label}</label>
        {p.symbol && (
          <span className="ctl__sym" aria-hidden="true">
            {p.symbol}
          </span>
        )}
        <InfoTip label={p.label}>{p.tip}</InfoTip>
        <output className="ctl__value" htmlFor={p.id}>
          {p.display}
        </output>
      </div>
      <input
        id={p.id}
        className={`rng${p.spectrum ? ' rng--spectrum' : ''}`}
        type="range"
        min={p.min}
        max={p.max}
        step={p.step}
        value={p.value}
        aria-valuetext={p.valueText ?? p.display}
        onChange={(e) => p.onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Toggle(p: {
  id: string;
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  tip?: ReactNode;
  tipLabel?: string;
}) {
  return (
    <div className="ctl__head" style={{ gap: 'var(--s-2)' }}>
      <label className="toggle" htmlFor={p.id}>
        <input
          id={p.id}
          type="checkbox"
          role="switch"
          checked={p.checked}
          onChange={(e) => p.onChange(e.target.checked)}
        />
        <span>{p.label}</span>
      </label>
      {p.tip && <InfoTip label={p.tipLabel ?? 'this setting'}>{p.tip}</InfoTip>}
    </div>
  );
}

export function Segmented<T extends string>(p: {
  name: string;
  legend: ReactNode;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="seg">
      <legend>{p.legend}</legend>
      {p.options.map((o) => (
        <label key={o.value}>
          <input
            type="radio"
            name={p.name}
            value={o.value}
            checked={p.value === o.value}
            onChange={() => p.onChange(o.value)}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}
