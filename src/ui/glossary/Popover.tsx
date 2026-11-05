import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import './popover.css';

interface PopoverProps {
  /** Content of the trigger button */
  trigger: ReactNode;
  /** Accessible name for the trigger when its content is not descriptive (e.g. an "i" icon) */
  label?: string;
  triggerClassName?: string;
  children: ReactNode;
  /** Preferred side; flips automatically near the viewport edge */
  side?: 'top' | 'bottom';
}

/**
 * A small click/tap-to-open bubble. Keyboard: Enter/Space opens, Escape closes and returns focus.
 * Used for glossary terms and control tooltips, so touch users get them too (hover-only tooltips fail on phones).
 */
export function Popover({ trigger, label, triggerClassName, children, side = 'top' }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState(side);
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const r = btn.current?.getBoundingClientRect();
    if (r)
      setPlacement(
        side === 'top' && r.top < 180
          ? 'bottom'
          : side === 'bottom' && window.innerHeight - r.bottom < 180
            ? 'top'
            : side,
      );
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, side]);

  return (
    <span className="pop" ref={wrap}>
      <button
        ref={btn}
        type="button"
        className={triggerClassName}
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open && (
        <span id={id} role="note" className={`pop__bubble pop__bubble--${placement}`}>
          {children}
        </span>
      )}
    </span>
  );
}

/** The small "i" button used beside controls. */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover
      trigger={<span aria-hidden="true">i</span>}
      label={`About ${label}`}
      triggerClassName="pop__info"
    >
      {children}
    </Popover>
  );
}
