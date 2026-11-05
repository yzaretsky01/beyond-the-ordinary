import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo, type ReactNode } from 'react';
import './math.css';

/**
 * A KaTeX equation whose symbols can be linked to controls. Wrap a symbol in the TeX as
 * \htmlClass{sym-KEY}{...}; hovering or focusing it reports KEY so the matching control lights up,
 * and controls report their key back so the symbol lights up (via `highlight`).
 */
export function LiveEquation({
  tex,
  reading,
  highlight,
  onSymbol,
  label,
}: {
  tex: string;
  /** Plain-English reading of the equation */
  reading: ReactNode;
  highlight?: string | null;
  onSymbol?: (key: string | null) => void;
  /** Spoken version of the equation for screen readers */
  label: string;
}) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: true,
        throwOnError: false,
        trust: (ctx) => ctx.command === '\\htmlClass',
        strict: 'ignore',
        output: 'html',
      }),
    [tex],
  );
  const keyOf = (el: EventTarget | null): string | null => {
    const node = (el as HTMLElement | null)?.closest?.('[class*="sym-"]');
    const m = node?.className.match(/sym-([a-z]+)/);
    return m ? m[1] : null;
  };
  return (
    <figure className="eq" data-highlight={highlight ?? ''}>
      {/* Hovering a symbol is a mouse shortcut; keyboard users get the same link by focusing a control,
          which highlights its symbol here (see ParamSlider onFocus in the room). */}
      {/* Focusable so keyboard users can scroll a wide equation on narrow screens. */}
      <div className="eq__tex" role="group" aria-label={label} tabIndex={0}>
        <div
          aria-hidden="true"
          // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events -- keyboard parity is via the controls (see above)
          onMouseOver={(e) => onSymbol?.(keyOf(e.target))}
          onMouseLeave={() => onSymbol?.(null)}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <figcaption className="eq__reading">{reading}</figcaption>
    </figure>
  );
}
