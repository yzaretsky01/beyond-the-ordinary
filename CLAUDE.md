# Beyond the Ordinary

*An Interactive Exploration of Quantum Physics*: a personal passion project, built as an interactive science museum with five rooms. Full detail lives in `docs/specs/` (design spec and architecture). Read them before any significant change.

## Vision

- **Visitors learn by doing, not reading.** Each room is one full-screen interactive stage.
- **The rooms:** double slit, superposition, entanglement, tunneling, quantum computing.
- **The same five states in every room:** Wonder → Predict → Experiment → Explain → Go deeper.
- **Welcoming to beginners** who know no physics. The mathematics is optional, live, and tied to the controls.
- **Wondrous and immersive, but never decorative for its own sake.** Every visual and interaction teaches, reveals, or changes perspective.
- **Personal, not commercial.** The owner writes the curator's note. Claude drafts all other copy for the owner to review.

## Architecture (React + TypeScript + Vite)

```
src/physics/       Pure TS science: models, solvers, sampling. No React, no DOM.
src/engine/        Simulation interface, frame loop, StageCanvas, drag + keyboard, quality scaling.
src/ui/            Shared, experiment-agnostic components (room shell, controls, learning, math, glossary, viz).
src/experiments/   One folder per room, same shape; each exports an ExperimentModule manifest.
src/app/           Hall (homepage), routing, progress + preferences stores.
src/theme/         Design tokens: the only place colours, type, spacing and motion values are defined.
```

**Rules:**
- Dependencies point downward only. `physics` imports nothing from the app. `engine` and `ui` never import `experiments`. Experiments never import each other.
- Per-frame data (fields, hits) goes from the simulation straight to the renderer. React only receives throttled summary values (`derived()`).
- All randomness uses the seeded RNG in `physics/core/rng.ts`.
- Every visible word lives in the room's `content.ts`. Word budgets are enforced by `src/content/textBudget.test.ts`.
- Use only free, open-source dependencies already listed in the architecture doc. Ask the owner before adding a new one.

## Commands

These scripts are created during phase 0 (scaffold). Keep this table in sync with `package.json`.

| Command | Does |
|---|---|
| `npm run dev` | Local dev server. |
| `npm run build` | Type-check and production build. |
| `npm test` | Vitest unit tests (physics, discoveries, challenges, components). |
| `npm run test:e2e` | Playwright journeys and axe accessibility scans. |
| `npm run lint` | ESLint (including the layer-boundary rules) and Prettier check. |

## Scientific accuracy (non-negotiable)

- **Every visual that claims to show physics must be computed from the stated model.** If something is decorative, it must not look like data.
- **Each room keeps a `modelNote`** listing its assumptions and limitations. Update it whenever the model changes.
- **Distinguish illustration from quantity.** For example: "waves drawn enlarged; screen pattern at true scale."
- **Explanations must be correct in plain language.** No "observation needs a conscious observer", no "tunneling borrows energy", no "entanglement sends signals", no "quantum computers try every answer at once".
- **Physics changes follow the `quantum-physics` skill. Learning and UX changes follow `educational-design`. Visual work follows `visual-design`.**

## Testing requirements

- Every `physics/` module has unit tests against analytic or known results. Examples:
  - fringe positions
  - norm conservation
  - packet-averaged tunneling transmission within 2%
  - CHSH ≈ 2√2, and every local strategy satisfies |S| ≤ 2
  - gate unitarity
- Discoveries, challenges and `describe()` are pure functions and are unit-tested.
- Every room has a Playwright journey through all five states using the keyboard only, plus a clean axe scan.
- `npm test`, `npm run lint` and `npm run build` must pass before work is called done. Report failures honestly, with their output.
