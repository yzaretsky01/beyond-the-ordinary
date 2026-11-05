import { Fragment } from 'react';
import { isGlossaryKey } from '../glossary/glossary';
import { Term } from '../glossary/Term';

/**
 * Renders copy from content files, turning {{key}} or {{key|shown words}} into a glossary popover.
 * Keeping the markers in content.ts means every word stays in one reviewable place.
 */
const TOKEN = /\{\{(\w+)(?:\|([^}]+))?\}\}/g;

export function Rich({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKEN)) {
    const [whole, key, shown] = m;
    out.push(text.slice(last, m.index));
    out.push(
      isGlossaryKey(key) ? (
        <Term key={i++} id={key}>
          {shown ?? key}
        </Term>
      ) : (
        (shown ?? key)
      ),
    );
    last = (m.index ?? 0) + whole.length;
  }
  out.push(text.slice(last));
  return (
    <>
      {out.map((n, k) => (
        <Fragment key={k}>{n}</Fragment>
      ))}
    </>
  );
}

/** Plain text of a marked-up string (for word counts and screen-reader labels). */
export function plain(text: string): string {
  return text.replace(TOKEN, (_w, key: string, shown?: string) => shown ?? key);
}

/** Every glossary key used in a string. */
export function termKeys(text: string): string[] {
  return [...text.matchAll(TOKEN)].map((m) => m[1]);
}
