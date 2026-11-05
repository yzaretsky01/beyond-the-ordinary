# Beyond the Ordinary: Technical Architecture

Draft 1 · 4 November 2026 · Status: for review. Companion to `2026-11-04-beyond-the-ordinary-design.md`.

Stack: **React + TypeScript + Vite**, free and open-source libraries only. No implementation has started.

---

## 1. Guiding principles

1. **Experience first, text last.** Each room is a single full-screen, interactive stage. Visitors learn by doing things to the simulation. Words appear only as short labels, one-line prompts, and annotations the visitor chooses to reveal.
2. **Physics is separate from pictures.** All science lives in plain TypeScript with no React and no drawing code. It can be tested on its own, and a lint rule enforces the separation.
3. **Five independent rooms, one shared contract.** Each experiment is a self-contained module that plugs into the same room shell. Any room can be built, tested and improved without touching the others.
4. **Reliable before ambitious.** Canvas 2D first, the simplest numerical method that is provably accurate, and automated checks against known results. WebGL, Web Workers and extra effects come only if measurement shows they are needed.
5. **Accessible by construction.** Every on-stage interaction has a keyboard equivalent, a text description, and a reduced-motion version.

---

## 2. The interaction-first experience model

This replaces the earlier "sections with explanations" idea.

### 2.1 The hall (homepage)

- One screen with no scrolling: a living, physics-driven scene with the five rooms as objects in it.
- Hovering or focusing a room plays a tiny live preview of its phenomenon. Choosing a room zooms the scene into it, as one continuous transition.
- A **discovery map** (constellation, map or tide line, depending on the visual direction) quietly fills in as the visitor makes discoveries in each room.

### 2.2 A room: one stage, five states

The five steps are **states of the same stage**, not separate pages or sections:

| Step | What the visitor does | Text budget |
|---|---|---|
| **Wonder** | The stage runs a strange phenomenon. One question is overlaid. | ≤ 12 words |
| **Predict** | Answers *on the stage itself*: sketch the pattern on the screen, drag a marker, set a dial, or pick a visual option. | ≤ 10-word prompt |
| **Experiment** | Controls appear. The visitor drags, fires, and toggles. Discoveries unlock as they do things. | labels only |
| **Explain** | The visitor taps glowing **hotspots** on the visualization to reveal short annotations, and sees their prediction overlaid on the result. | ≤ 30 words per hotspot |
| **Go deeper** | The **math lens** overlays live equations on the stage, with symbols tied to controls. Model notes and history live here. | longer text allowed here only |

Movement between states is free. The step rail is navigation, not a gate.

### 2.3 Learning mechanics: each one must teach

| Mechanic | Purpose | Example (double slit) |
|---|---|---|
| **Prediction** | Brings the visitor's intuition to the surface so the surprise lands. | Sketch where particles will land. |
| **Discovery** | A short insight, unlocked by *doing* something specific. | Turning on the detector unlocks "Knowing the path erases the stripes." |
| **Challenge** (knowledge check by action) | Proves understanding by reaching a goal with the controls. The simulation checks it automatically. | "Make the stripes twice as far apart." |
| **Knowledge check** (quick question) | A visual either/or question at the end of Explain, with an immediate answer shown on the stage. | "Close one slit: which pattern appears?" |
| **Hotspot** | Reveals *why* at a specific place on the picture. | Tap a dark stripe: "Here the two waves cancel." |
| **Term** (glossary tooltip) | Defines a word in place, with a tiny animation instead of a paragraph. | "wavelength" shows a moving wave with λ marked. |
| **Model note** | Says honestly what is simplified. | "Ideal slits · one wavelength · waves drawn enlarged." |

A unit test enforces the text budgets (see §8).

---

## 3. Architecture overview

```
┌───────────────────────────── app/ ─────────────────────────────┐
│ Hall · routing · room transitions · progress & preferences      │
└───────────────┬─────────────────────────────────────────────────┘
                │ lazy-loads one experiment module per room
┌───────────────▼──────────── experiments/<room>/ ────────────────┐
│ manifest: content, predictions, discoveries, challenges,         │
│ equations, hotspots · Stage component · renderers                │
└──────┬────────────────────────┬─────────────────────────────────┘
       │ uses                   │ uses
┌──────▼─────── ui/ ───────┐ ┌──▼──────── engine/ ──────────────────┐
│ ExperimentRoom shell,    │ │ Simulation interface, frame loop,     │
│ controls, learning       │ │ canvas host, drag + keyboard,         │
│ components, math, viz    │ │ quality scaling, pause when hidden    │
└──────────────────────────┘ └──┬────────────────────────────────────┘
                                │ drives
                   ┌────────────▼──────── physics/ ───────────────┐
                   │ Pure TypeScript: models, solvers, sampling.   │
                   │ No React, no DOM. Fully unit-tested.          │
                   └───────────────────────────────────────────────┘
```

**Dependency rule:** `physics` imports nothing from the app. `engine` and `ui` never import from `experiments`. Experiments never import from each other. ESLint enforces this with `no-restricted-imports` patterns.

### 3.1 Data flow (and why it stays fast)

```
control (drag/slider/key) ──► params (React state) ──► simulation.setParams()
                                                          │
           requestAnimationFrame loop ──► simulation.step(dt)
                                                          │
                       renderer.draw(ctx, simulation.snapshot())   ← per frame, no React
                                                          │
       derived values (stripe count, T, CHSH S…) ──► React UI      ← throttled ~10×/s
       simulation events ──► discovery & challenge checks
```

Per-frame data (wave fields, particle hits) never passes through React state. Re-rendering React 60 times a second would be the most likely cause of jank. React only sees slow-changing summary values.

### 3.2 The simulation contract (`engine/Simulation.ts`)

```ts
export interface Simulation<P, S, D> {
  readonly params: Readonly<P>;
  setParams(next: Partial<P>): void;   // may trigger a rebuild
  step(dt: number): void;              // advance by dt seconds of "display time"
  reset(): void;
  snapshot(): Readonly<S>;             // cheap read-only view for renderers (typed arrays)
  derived(): D;                        // small summary for UI, discoveries, screen readers
  on(event: SimEvent, fn: Listener): Unsubscribe;
}
```

All randomness comes from a **seeded generator**, so tests and bug reports are reproducible.

### 3.3 The experiment contract (`experiments/types.ts`)

```ts
export interface ExperimentModule<P, S, D> {
  id: 'double-slit' | 'superposition' | 'entanglement' | 'tunneling' | 'quantum-computing';
  meta: { title: string; question: string; accent: string };
  createSimulation(params: P, seed?: number): Simulation<P, S, D>;
  defaultParams: P;
  controls: ControlSpec<P>[];          // drives generic controls (range, units, colour link)
  Stage: React.ComponentType<StageProps<P, S, D>>;   // the room's visual + on-stage interactions
  predictions: PredictionSpec<P, D>[];
  discoveries: DiscoverySpec<P, D>[];  // pure predicates: (ctx) => boolean
  challenges: ChallengeSpec<P, D>[];   // goal + pure success check
  knowledgeChecks: KnowledgeCheckSpec[];
  hotspots: HotspotSpec<D>[];          // where on the stage + ≤30-word annotation
  equations: EquationSpec<P, D>[];     // LaTeX + symbol→control/derived bindings
  modelNote: ModelNote;                // assumptions + limitations (from §5)
  describe(d: D, p: P): string;        // live text description for screen readers
}
```

Discoveries, challenges and descriptions are **pure functions of params and derived values**. They can therefore be unit-tested without rendering anything.

---

## 4. Shared components

### Room and layout (`ui/room/`)
| Component | Role |
|---|---|
| `ExperimentRoom` | Shell for every room. Owns the step state, positions the stage, controls and overlays, handles responsive layout. |
| `StepRail` | Wonder → Predict → Experiment → Explain → Go deeper, freely navigable. |
| `RoomTransition` | Zoom-in and zoom-out between the hall and a room. Becomes a crossfade with reduced motion. |
| `DiscoveryToast` / `DiscoveryLog` | A brief moment when something is found, and the room's collection of discoveries. |

### Visualization host (`engine/`)
| Component / hook | Role |
|---|---|
| `StageCanvas` | Canvas sized to its container. Handles device-pixel ratio (capped at 2), resizing, and pausing when off-screen or the tab is hidden. |
| `useSimulation` | Creates and owns a simulation, runs the frame loop, exposes throttled `derived` values. |
| `useStageDrag` | Pointer dragging of on-stage handles (slits, barrier edges, detector dials), with arrow-key equivalents. |
| `useQuality` | Lowers grid resolution if frames run slow, so phones stay smooth. |
| `useMotionPreference` | Reduced motion means slower simulations or step-on-demand, and no camera moves. |

### Controls (`ui/controls/`)
`ParamSlider` (units, live value, colour linked to its equation symbol) · `SpectrumSlider` (wavelength drawn as colour) · `AngleDial` · `Toggle` · `FireButton` (tap for one particle, hold for a stream) · `StageHandle` (an accessible draggable shown on the canvas).

### Learning (`ui/learning/`)
`SketchPrediction` (draw a curve on the stage) · `ChoicePrediction` (visual options, not text) · `PlacePrediction` (drag a marker) · `Hotspot` · `Challenge` · `KnowledgeCheck` · `ModelNote` · `PredictionOverlay` (your guess drawn over the result).

### Mathematics (`ui/math/`)
| Component | Role |
|---|---|
| `LiveEquation` | KaTeX-rendered formula. Symbols are tagged so each variable shares its control's colour, shows its live value, and highlights its control on hover or focus (and the reverse). |
| `MathLens` | A toggleable layer that places the equations on the stage beside what they describe. |

### Glossary (`ui/glossary/`)
`Term` is a tappable word that opens a popover with a one-sentence definition and a tiny animation. All definitions live in one `glossary.ts`, so every room uses the same wording.

### Data visualization (`ui/viz/`)
`Histogram` · `LinePlot` · `PhaseDisc` (an amplitude drawn as a disc: area = probability, hue and arrow = phase, so it works without colour vision) · `AmplitudeBars`. These are small purpose-built SVG or canvas components. No charting library is needed.

---

## 5. Mathematical models

Each model below becomes a `physics/` module with tests. Its assumptions and limitations become that room's `modelNote`.

### 5.1 Double slit
- **Model:** scalar wave optics in the far field (Fraunhofer).
  `I(y) ∝ sinc²(π a sinθ / λ) · cos²(π d sinθ / λ)`, with `sinθ = y / √(y² + L²)`.
  Electrons use the same formula with the de Broglie wavelength `λ = h / p`, where p comes from the accelerating voltage.
- **Particle arrivals:** sampled one at a time from the normalised intensity (the Born rule) using a precomputed inverse cumulative table. This is exact and fast.
- **Which-path detector:** full which-path information means the intensities add without interference: `I = I₁ + I₂`.
- **On-stage waves:** a Huygens sum of point sources across each slit, drawn at an enlarged scale. The drawn geometry is chosen so the stage shows the same number of stripes as the true-scale screen (as in the mockups).
- **Assumptions:** monochromatic and fully coherent source; ideal thin slits; screen in the far field. Parameter ranges keep `L ≥ 5 d² / λ`.
- **Limitations:** no partial which-path information (fringe visibility between 0 and 1), no slit-edge effects, no polarization. The on-stage wave is a visual aid; the screen pattern is the quantitative result.
- **Tests:** maxima appear at `y = mλL/d`; zeros of the envelope at `y = λL/a`; sampled histograms match `I(y)` (χ² test with a fixed seed); with the detector on, no fringes.

### 5.2 Superposition
- **Model:** one qubit (a two-level system), `|ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩`, shown on the Bloch sphere. A measurement along axis **n̂** gives +1 with probability `(1 + r̂·n̂)/2`, then the state collapses.
- **Why phase matters:** a Mach–Zehnder interferometer (the same qubit seen as two paths). Detector probability is `P(D₁) = cos²(Δφ/2)` as the visitor turns the phase shifter. This is where phase-as-colour is introduced.
- **Assumptions:** ideal two-level system; perfect 50/50 beam splitters; ideal projective measurement; no decoherence.
- **Limitations:** the Bloch sphere describes one qubit only. Room 5 explains why many qubits need a different picture. Decoherence is mentioned, not simulated.
- **Tests:** normalisation; measurement statistics converge to the Born rule; measuring twice in the same basis gives the same result; interferometer output against `cos²`.

### 5.3 Entanglement
- **Model:** polarization-entangled photon pairs in the state `|Φ⁺⟩`.
  - `P(same result) = cos²(α − β)` and correlation `E(α, β) = cos 2(α − β)`.
  - `S = E(a,b) − E(a,b′) + E(a′,b) + E(a′,b′)`, which reaches 2√2 at the standard angles.
- **Local hidden-variable models:** the visitor designs "secret instruction" strategies, deterministic answers for each angle, and a few classic preset strategies are included. These are simulated with exactly the same sampling and scoring, so the comparison is fair. Every local strategy satisfies `|S| ≤ 2`.
- **Finite statistics:** S is shown with its uncertainty (± standard error), so visitors learn why many pairs are needed.
- **No-signalling view:** Alice's own results stay at 50/50 whatever Bob's setting.
- **Assumptions:** perfect source and detectors, no losses (fair sampling), settings chosen independently.
- **Limitations:** outcomes are generated from quantum predictions, so this is a demonstration, not a proof. The real proof comes from experiments, including the loophole-free tests of 2015, which are noted in Go deeper. An optional "noise" control shows the violation disappearing below a fringe visibility of 1/√2.
- **Tests:** E converges to `cos 2Δ`; S ≈ 2√2 at the optimal angles; brute force over all deterministic local strategies never exceeds 2; marginals stay at 50/50.

### 5.4 Quantum tunneling
- **Model:** the one-dimensional time-dependent Schrödinger equation, `iħ ∂ψ/∂t = −(ħ²/2m) ∂²ψ/∂x² + V(x)ψ`. It is computed in natural units (ħ = m = 1) and labelled in electron/nanometre/eV terms for display.
- **Solver:** split-operator Fourier method (Strang splitting). It is unitary, second-order accurate, and simple. Grid of N = 2048 points with several sub-steps per frame. Absorbing edges stop reflections from the grid boundary.
- **Initial state:** a Gaussian wave packet with mean energy E₀ and width σ.
- **Barrier:** rectangular, height V₀ and width w, both draggable. An optional smooth-edged barrier is available.
- **Measured vs. theory:** the transmitted probability (probability beyond the barrier once the packet has left) is shown next to:
  1. the analytic plane-wave result T(E₀) for a rectangular barrier, and
  2. the packet-averaged ⟨T⟩ over its energy spread.

  The second is the fair comparison, and the difference between the two is itself a teaching moment.
- **Assumptions:** one dimension; non-relativistic; a single particle; a static barrier.
- **Limitations:** real tunneling happens in 3D, with shaped potentials (alpha decay, STM tips, tunnel diodes). These are mentioned in Go deeper as examples, not simulated.
- **Tests:** norm conserved to < 10⁻⁶ per 1,000 steps without absorbers; a free packet's spreading matches the analytic Gaussian width; measured ⟨T⟩ agrees with the packet-averaged analytic value within 2% across a parameter sweep; no transmission or reflection with V₀ = 0.

### 5.5 Quantum computing
- **Model:** a state-vector simulator for n ≤ 3 qubits (2ⁿ complex amplitudes).
  - Gates H, X, Z, S, T, CNOT as unitary matrices.
  - Measurement samples the Born rule and collapses the state.
  - A circuit scrubber steps through the circuit gate by gate.
- **Display:** each basis state is a `PhaseDisc`, with area showing probability and hue plus an arrow showing phase. Visitors watch interference happen as amplitudes cancel.
- **Puzzles, checked by fidelity** (`|⟨target|ψ⟩|² > 0.999`): make an entangled pair, Deutsch's algorithm, two-qubit Grover search. The visitor discovers that the right answer is amplified by interference.
- **Assumptions:** ideal noiseless gates, perfect measurement, no decoherence.
- **Limitations:** real quantum computers are noisy and need error correction. Three qubits on a classical computer is easy; the 2ⁿ growth shown in Go deeper is why large ones are not.
- **Tests:** every gate is unitary; known identities (HH = I, HZH = X, CNOT creates a Bell state); measurement statistics; Grover finds the marked item with probability 1 for n = 2.

### 5.6 Shared numerical utilities (`physics/core/`)
Complex numbers stored as paired `Float64Array`s for speed · seeded random generator (mulberry32) · inverse-CDF sampling · FFT wrapper · units and physical constants (CODATA values) · wavelength → display colour · phase → colour map.

---

## 6. Dependencies

Every package below is free and open source (MIT, Apache-2.0, or SIL OFL for fonts).

### Runtime
| Package | Why |
|---|---|
| `react`, `react-dom` | The interface (as requested). |
| `react-router-dom` | One URL per room, so links can be shared and the back button works. |
| `zustand` | Small, simple store for progress (discoveries, predictions) and preferences (reduced motion, phase cue, math lens). Saved to the visitor's own browser. |
| `motion` (Framer Motion) | Interface transitions: step changes, hotspot reveals, hall-to-room zoom. Not used for simulations. |
| `@radix-ui/react-slider`, `-popover`, `-tooltip`, `-dialog`, `-toggle` | Unstyled components with correct keyboard and screen-reader behaviour built in. We style them ourselves. |
| `katex` | Fast, beautiful equation typesetting. |
| `fft.js` | A small, well-tested FFT for the tunneling solver. |
| `@fontsource/*` | Self-hosted fonts for the chosen direction (no third-party font requests). |

### Development and quality
| Package | Why |
|---|---|
| `vite`, `@vitejs/plugin-react`, `typescript` | Build tool, React support, type checking. |
| `vitest` | Unit tests for physics, discoveries and challenges (shares Vite's config). |
| `@testing-library/react`, `jsdom` | Component tests (controls, room shell). |
| `@playwright/test`, `@axe-core/playwright` | End-to-end smoke tests in real browsers, plus automated accessibility scans. |
| `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `prettier` | Consistent code, accessibility linting, and the physics/UI boundary rule. |

### Deliberately **not** included (until a real need appears)
- Three.js: the Bloch sphere is a simple projected circle on Canvas 2D.
- Charting libraries: our plots are small and custom.
- Tailwind: plain CSS Modules and design tokens are easier to read.
- Web Workers and WebGL: the mockups ran on Canvas 2D, and phase 4 profiling will confirm it on a phone. The physics layer has no DOM access, so either can be added later without rewrites.

---

## 7. File structure

```
beyond-the-ordinary/
├─ index.html
├─ package.json · vite.config.ts · tsconfig.json · eslint.config.js · playwright.config.ts
├─ docs/
│  ├─ specs/                     design spec + this architecture
│  └─ decisions/                 short notes on why big choices were made
├─ public/                       favicon, social preview image
├─ e2e/                          Playwright: smoke, accessibility, one journey per room
└─ src/
   ├─ main.tsx
   ├─ app/
   │  ├─ App.tsx · routes.tsx · AppShell.tsx
   │  ├─ hall/                   Hall.tsx · HallScene.tsx · RoomPortal.tsx
   │  └─ state/                  progressStore.ts · preferencesStore.ts
   ├─ physics/                   ← pure TypeScript; may not import React or the DOM
   │  ├─ core/                   complex.ts · rng.ts · sampling.ts · fft.ts · constants.ts · colour.ts
   │  ├─ double-slit/            fraunhofer.ts · huygensField.ts · *.test.ts
   │  ├─ superposition/          qubit.ts · blochSphere.ts · interferometer.ts · *.test.ts
   │  ├─ entanglement/           bellPairs.ts · localStrategies.ts · chsh.ts · *.test.ts
   │  ├─ tunneling/              splitOperator.ts · wavePacket.ts · barrier.ts · transmission.ts · *.test.ts
   │  └─ quantum-computing/      stateVector.ts · gates.ts · circuit.ts · puzzles.ts · *.test.ts
   ├─ engine/
   │  ├─ Simulation.ts · useSimulation.ts · useFrameLoop.ts
   │  ├─ StageCanvas.tsx · useStageDrag.ts · useQuality.ts · useMotionPreference.ts
   ├─ ui/
   │  ├─ room/                   ExperimentRoom · StepRail · RoomTransition · DiscoveryToast · DiscoveryLog
   │  ├─ controls/               ParamSlider · SpectrumSlider · AngleDial · Toggle · FireButton · StageHandle
   │  ├─ learning/               SketchPrediction · ChoicePrediction · PlacePrediction · PredictionOverlay
   │  │                          Hotspot · Challenge · KnowledgeCheck · ModelNote
   │  ├─ math/                   LiveEquation · MathLens · katexSetup.ts
   │  ├─ glossary/               Term.tsx · glossary.ts
   │  ├─ viz/                    Histogram · LinePlot · PhaseDisc · AmplitudeBars
   │  └─ a11y/                   LiveRegion · VisuallyHidden
   ├─ experiments/
   │  ├─ types.ts                the ExperimentModule contract
   │  ├─ registry.ts             metadata + lazy imports for all five rooms
   │  ├─ double-slit/
   │  │  ├─ index.ts             the manifest (wires everything below together)
   │  │  ├─ simulation.ts        adapts physics → Simulation interface
   │  │  ├─ DoubleSlitStage.tsx  stage layout + on-stage handles
   │  │  ├─ renderers/           field.ts · screen.ts · apparatus.ts (drawing only)
   │  │  ├─ content.ts           every visible word for this room
   │  │  ├─ discoveries.ts · challenges.ts · knowledgeChecks.ts · hotspots.ts · equations.ts
   │  │  ├─ describe.ts          screen-reader descriptions
   │  │  └─ *.test.ts
   │  ├─ superposition/ · entanglement/ · tunneling/ · quantum-computing/   (same shape)
   ├─ theme/                     tokens.css · typography.css · motion.ts · palettes.ts
   └─ content/
      └─ textBudget.test.ts      fails the build if any copy exceeds its word budget
```

Every room has **the same shape**. Once you've seen one, you can find your way around all five.

---

## 8. Cross-cutting concerns

### Responsive layout
| Width | Layout |
|---|---|
| Desktop | Full-screen stage, controls floating at the edges, math lens beside the stage. |
| Tablet | Stage on top, controls docked in a bar. |
| Phone | Stage first, controls in a bottom sheet that slides up, hotspots enlarged. |

- Never horizontal scroll. Touch targets at least 44 px.
- Rooms are designed as "one screen", but nothing is clipped if a phone is short: the control sheet scrolls internally.

### Accessibility
- Radix components handle keyboard focus and roles.
- Every on-stage handle is a real focusable element positioned over the canvas, with a label ("Slit separation, 0.25 mm") and arrow-key control.
- `describe()` feeds a polite live region, throttled. For example: "11 bright stripes, 2.2 millimetres apart."
- Colour never carries meaning alone: phase is hue *and* arrow; predictions are amber *and* dashed.
- Automated axe scans run in CI on every room. A manual screen-reader pass happens before launch.

### Reduced motion
- Simulations still run when stepped (a "next" button or slower speed).
- Room transitions become crossfades. Ambient hall motion becomes nearly still.

### Performance budget
- 60 fps on a mid-range laptop, and at least 30 fps on a mid-range phone.
- Initial page under about 250 KB of compressed JavaScript; each room is lazy-loaded.
- Simulations pause when their tab or room is hidden.

### Content
- Every visible word lives in each room's `content.ts`, never scattered inside components. You can review all of a room's words in one file.
- Text budgets, enforced by `textBudget.test.ts`:

  | Kind of text | Limit |
  |---|---|
  | Question | 12 words |
  | Prompt | 10 words |
  | Hotspot | 30 words |
  | Discovery | 20 words |

  Go deeper is exempt.

### Persistence
Discoveries, predictions and preferences are saved in the visitor's own browser. There are no accounts and no server.

### Hosting
A static build. Netlify or GitHub Pages, both free, with a single-page-app fallback so room URLs work when shared.

### Visual direction
The final look (A, B, C or a mix) only touches `theme/` and each room's `renderers/`. The architecture does not depend on that choice.

---

## 9. Development sequence

Each phase ends with something you can open and try. **R** marks a review point where you approve before the next phase begins.

| # | Phase | Delivers | Done when |
|---|---|---|---|
| 0 | **Scaffold** | Vite + React + TS project, lint/format, Vitest, Playwright, CI on GitHub, preview deploys. | `npm run dev`, `test`, `build` all pass in CI. |
| 1 | **Physics core** | `physics/core` utilities with tests. | 100% of core functions tested. |
| 2 | **Engine + shell skeleton** | `StageCanvas`, frame loop, `useSimulation`, `ExperimentRoom` with the five states, controls, hotspot and model-note components (unstyled). | A dummy experiment runs through all five states with keyboard only. |
| 3 | **Design system** | Tokens, type and motion for the chosen direction. Styled controls and learning components. | **R**: you approve the look on the dummy room. |
| 4 | **Room 1: Double slit (vertical slice)** | Physics + tests, simulation, renderers, predictions (sketch), discoveries, challenges, hotspots, math lens, descriptions. | **R**: you play it end to end. This room becomes the template for the rest. |
| 5 | **The hall** | Living homepage, room previews, zoom transition, discovery map. | **R** |
| 6 | **Room 4: Tunneling** | Built second because it is the hardest numerically, so risk surfaces early. | Accuracy tests pass. **R** |
| 7 | **Room 2: Superposition** | Bloch sphere and interferometer; introduces phase-as-colour. | **R** |
| 8 | **Room 3: Entanglement** | Bell game, your-strategy builder, CHSH meter. | **R** |
| 9 | **Room 5: Quantum computing** | Circuit builder, phase discs, puzzles. | **R** |
| 10 | **Polish passes** | Accessibility audit, phone testing on real devices, performance profiling, cross-browser. | axe clean; budgets met. |
| 11 | **Content and launch** | Content review, your curator's note, history fact-check, deploy. | **R**: you press publish. |

Rooms 6–9 depend only on phases 0–4, not on each other, so their order can change freely.

---

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Tunneling numerics are wrong or unstable. | Built early (phase 6); validated against analytic results in tests; uses the simplest unitary method. |
| Phone performance. | Adaptive grid resolution; per-frame data kept out of React; profiling on a real mid-range phone in phase 4. |
| Visuals overpower meaning. | Every effect must map to a computed quantity; review at each **R** point asks "what does this teach?" |
| Text creeps back in. | Automated word budgets; text lives in one file per room for easy review. |
| Inaccessible canvas interactions. | Every handle is a real focusable element; live text descriptions; axe in CI. |
