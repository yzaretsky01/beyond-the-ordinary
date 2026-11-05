import type { ReactNode } from 'react';
import { Popover } from './Popover';
import { GLOSSARY, type GlossaryKey } from './glossary';

/** A word with a tap-to-open definition. */
export function Term({ id, children }: { id: GlossaryKey; children?: ReactNode }) {
  const g = GLOSSARY[id];
  return (
    <Popover trigger={children ?? g.term.toLowerCase()} triggerClassName="term">
      <strong>{g.term}.</strong> {g.def}
    </Popover>
  );
}
