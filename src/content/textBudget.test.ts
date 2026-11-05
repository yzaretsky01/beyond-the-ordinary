import { describe, expect, it } from 'vitest';
import { content as doubleSlit } from '../experiments/double-slit/content';
import { content as entanglement } from '../experiments/entanglement/content';
import { content as quantumComputing } from '../experiments/quantum-computing/content';
import { content as superposition } from '../experiments/superposition/content';
import { content as tunneling } from '../experiments/tunneling/content';
import { GLOSSARY, isGlossaryKey } from '../ui/glossary/glossary';
import { plain, termKeys } from '../ui/learning/Rich';
import { shared } from './shared';

/** Word budgets from the educational-design skill. Go deeper is exempt. Markup is not counted. */
const words = (s: string) => plain(s).trim().split(/\s+/).filter(Boolean).length;

interface Check {
  question: string;
  right: string;
  wrong: string;
}

interface RoomContent {
  title: string;
  wonder: { question: string; ledes: readonly string[]; buildsOn: { text: string } };
  predict: { prompt: string };
  experiment: { prompt: string; beforeYouTry: Check };
  controls: Record<string, unknown>;
  discoveries: readonly { body: string }[];
  explain: {
    summary: string;
    hotspots: Record<string, { body: string }>;
    realWorld: readonly { body: string }[];
    waitWhy: readonly { q: string; body: string; limits?: string }[];
    story: { title: string; body: string };
    mathTeaser: { reading: string };
  };
  checks: readonly Check[];
}

const ROOMS: RoomContent[] = [doubleSlit, superposition, entanglement, tunneling, quantumComputing];
const BANNED = /\b(simply|obviously|just)\b/i;

/** Every string anywhere in a content object (functions are called with sample values). */
function allStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (typeof v === 'function') out.push(String((v as (...a: unknown[]) => unknown)(1, '50%', '50%')));
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}

describe.each(ROOMS.map((r) => [r.title, r] as const))('copy rules: %s', (_title, c) => {
  it('questions ≤ 12 words', () => {
    expect(words(c.wonder.question)).toBeLessThanOrEqual(12);
    for (const k of [...c.checks, c.experiment.beforeYouTry])
      expect(words(k.question)).toBeLessThanOrEqual(12);
  });
  it('prompts ≤ 10 words', () => {
    expect(words(c.predict.prompt)).toBeLessThanOrEqual(10);
    expect(words(c.experiment.prompt)).toBeLessThanOrEqual(10);
  });
  it('Wonder: each paragraph ≤ 35 words; the builds-on note ≤ 25', () => {
    expect(c.wonder.ledes.length).toBeGreaterThan(0);
    for (const l of c.wonder.ledes) expect(words(l)).toBeLessThanOrEqual(35);
    expect(words(c.wonder.buildsOn.text)).toBeLessThanOrEqual(25);
  });
  it('hotspots, real-world notes and all quiz feedback ≤ 30 words', () => {
    for (const h of Object.values(c.explain.hotspots)) expect(words(h.body)).toBeLessThanOrEqual(30);
    for (const r of c.explain.realWorld) expect(words(r.body)).toBeLessThanOrEqual(30);
    for (const k of [...c.checks, c.experiment.beforeYouTry]) {
      expect(words(k.right)).toBeLessThanOrEqual(30);
      expect(words(k.wrong)).toBeLessThanOrEqual(30);
    }
  });
  it('discoveries ≤ 20 words; summary ≤ 40', () => {
    for (const d of c.discoveries) expect(words(d.body)).toBeLessThanOrEqual(20);
    expect(words(c.explain.summary)).toBeLessThanOrEqual(40);
  });
  it('Wait, why? answers ≤ 50 words, analogy limits ≤ 35, story ≤ 45', () => {
    expect(c.explain.waitWhy.length).toBeGreaterThanOrEqual(3);
    for (const w of c.explain.waitWhy) {
      expect(w.q.startsWith('Wait,')).toBe(true);
      expect(words(w.body)).toBeLessThanOrEqual(50);
      if (w.limits) expect(words(w.limits)).toBeLessThanOrEqual(35);
    }
    // every room offers at least one analogy, and every analogy says where it breaks down
    expect(c.explain.waitWhy.some((w) => w.limits)).toBe(true);
    for (const w of c.explain.waitWhy) if (/\blike\b/i.test(w.q)) expect(w.limits).toBeTruthy();
    expect(words(c.explain.story.body)).toBeLessThanOrEqual(45);
    expect(words(c.explain.mathTeaser.reading)).toBeLessThanOrEqual(35);
  });
  it('control tooltips ≤ 25 words', () => {
    for (const ctl of Object.values(c.controls)) {
      const tip = (ctl as { tip?: string }).tip;
      if (tip) expect(words(tip)).toBeLessThanOrEqual(25);
    }
  });
  it('no banned words (simply, obviously, just) and no glossary marker without a definition', () => {
    for (const s of allStrings(c)) {
      expect(plain(s)).not.toMatch(BANNED);
      for (const k of termKeys(s))
        expect(isGlossaryKey(k), `unknown glossary term "${k}" in: ${s}`).toBe(true);
    }
  });
});

describe('glossary and shared labels', () => {
  it('definitions ≤ 25 words, each with a display name', () => {
    for (const g of Object.values(GLOSSARY)) {
      expect(g.term.length).toBeGreaterThan(0);
      expect(words(g.def)).toBeLessThanOrEqual(25);
      expect(g.def).not.toMatch(BANNED);
    }
  });
  it('shared labels contain no banned words', () => {
    for (const s of Object.values(shared)) expect(s).not.toMatch(BANNED);
  });
});
