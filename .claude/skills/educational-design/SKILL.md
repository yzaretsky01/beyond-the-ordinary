---
name: educational-design
description: Learning-experience standards for Beyond the Ordinary. Covers predictions, discoveries, challenges, knowledge checks, hotspots, glossary terms, copy and the Wonder → Predict → Experiment → Explain → Go deeper flow. Use whenever designing or changing a room's interactions, writing or editing any visitor-facing words (content.ts, glossary.ts), adding controls, or judging whether something is too text-heavy, confusing or not engaging enough.
---

# Educational design standards

Visitors are curious people who have never studied quantum physics. They learn most when they **predict, act, and are surprised**, not when they read. Every element on screen should earn its place by teaching, revealing something, or changing the visitor's perspective.

## 1. Accessible language

- Write for a curious 14-year-old who reads well. Use short sentences and everyday words. Use questions more than statements.
- **Define each technical term the first time it appears** with a `<Term>` glossary popover (one sentence plus a tiny animation), not a paragraph. Reuse wording from `glossary.ts` so every room agrees.
- **Stay within the word budgets**, which `textBudget.test.ts` enforces:

  | Kind of text | Limit |
  |---|---|
  | Question | 12 words |
  | Prompt | 10 words |
  | Hotspot | 30 words |
  | Discovery | 20 words |

  Only Go deeper may be longer.
- **Say what is simple without being wrong.** The quantum-physics skill decides what is accurate.
- **Use a warm, personal voice:** curious and slightly playful, never salesy, never condescending ("simply", "obviously" and "just" are banned).

## 2. Prediction-based learning

- **Every room asks for a prediction before the result is visible.** A guess makes the outcome matter.
- **Prefer physical predictions over quizzes:** sketch the pattern, drag a marker, set a dial, or choose between *visual* options.
- **Show the prediction again after the experiment** (amber, dashed) overlaid on the real result. The gap between them is the lesson.
- **Wrong predictions are welcome.** Feedback says what happened and why it is surprising, never "Incorrect".

## 3. Intuitive, meaningful interactions

- **Manipulate the thing itself.** Drag the slits, the barrier edge, the detector angle. Use a slider only when there is nothing natural to grab.
- **Each control changes one physical variable** and shows its value with units.
- **Response is immediate.** If an effect needs time (particles accumulating), show it building.
- **Discoveries unlock by doing something specific**, never by time spent or clicks counted.
- **Before adding any interaction, ask: what does this teach or reveal?** If the answer is "nothing", remove it.
- **Every pointer interaction has a keyboard equivalent and a text description**, through `describe()`.

## 4. Optional depth

- **Layer the content.** The stage carries the intuition. Hotspots give the "why" at a specific place. The Go deeper math lens gives equations bound to the live controls, with derivations revealed step by step.
- **Never block progress behind the maths.** Never assume the visitor has opened Go deeper.
- **Each equation has a plain-English reading beside it,** for example "spacing grows with wavelength".

## 5. Meaningful knowledge checks

- **Challenges are tasks done with the simulation,** for example "make exactly 7 stripes" or "stop the particles getting through without moving the barrier". They are checked by a pure function of params and derived values.
- **Quick checks are visual** ("close one slit: which pattern?") and answered on the stage.
- **Test understanding, not recall.** A good check can't be passed by remembering a sentence from the room.
- **Feedback always shows the simulation's answer**, so the visitor can see why.

## Checklist (run before calling learning work done)

- [ ] Room follows Wonder → Predict → Experiment → Explain → Go deeper, with free navigation between steps
- [ ] A prediction is collected before the result shows, and is overlaid afterwards
- [ ] Every interactive element teaches or reveals something (name what)
- [ ] Discoveries are triggered by meaningful actions; each has a ≤ 20-word insight
- [ ] At least one challenge and one visual knowledge check, each with automated checking
- [ ] All copy is within budget and every technical term uses `<Term>`
- [ ] No wall of text anywhere outside Go deeper
- [ ] Keyboard path and `describe()` text exist for every interaction
- [ ] Discovery, challenge and check logic is unit-tested

## Review criteria

Flag or reject a change if:
- a visitor could reach the result without ever predicting
- the same idea could be shown, but is told instead
- an interaction exists for decoration or "engagement" alone
- a check can be passed by guessing or recall rather than understanding
- language assumes prior physics knowledge, or talks down to the reader
- the room cannot be completed with a keyboard alone
