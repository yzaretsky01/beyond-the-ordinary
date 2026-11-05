# Beyond the Ordinary: Project Specification

*An Interactive Exploration of Quantum Physics*
Draft 2 · 4 November 2026 · Status: for review
Draft 2 changes: interaction-first experience (less text, discovery through doing) and a React + TypeScript + Vite stack. The full technical plan is in `2026-11-04-beyond-the-ordinary-architecture.md`.

## 1. Purpose

A personal passion project that makes quantum physics approachable and wondrous. It should feel like stepping into an interactive science museum dedicated to the strange and beautiful nature of the universe. It is not a commercial product, a course, or a showcase built to impress.

**Success looks like this:** a visitor with no physics background makes a prediction, sees it proven wrong by an experiment they ran themselves, and leaves able to explain, in their own words, *why* the world behaves that way. A curious visitor can go on into the real mathematics.

## 2. Audience

- **Primary:** curious adults and teenagers who have never studied quantum physics. No jargon is assumed. Every technical term is explained the first time it appears.
- **Secondary:** visitors who know some physics and want the equations. They are served by an optional layer that never gets in the beginner's way.

## 3. Experience structure

**Interaction first.** Visitors learn by doing, not reading:
- no scrolling pages, walls of text, or card grids
- each room is one full-screen interactive stage
- words appear only as short labels, one-line prompts, and annotations the visitor chooses to reveal
- every interactive element must teach, reveal, or change perspective; nothing is decorative

**The homepage ("the hall")** is a single living, physics-driven scene with the five rooms as objects in it. Hovering a room previews its phenomenon live, and choosing one zooms into it. A discovery map fills in as the visitor explores. A suggested order is shown, and any room can be entered directly.

**The five rooms**, in suggested order. Each idea builds on the one before:

| # | Room | The question it opens with |
|---|------|----------------------------|
| 1 | Double slit | Can one particle go through two openings at once? |
| 2 | Superposition | Can something hold two answers until you look? |
| 3 | Entanglement | Can two particles share one story, however far apart they are? |
| 4 | Tunneling | Can a particle pass through a wall it can't climb over? |
| 5 | Quantum computing | Can we compute by making waves cancel and reinforce? |

**Every room moves through the same five states on one stage:**

1. **Wonder:** the stage shows a strange phenomenon, with one question of at most 12 words.
2. **Predict:** the visitor answers *on the stage*: sketching the pattern, dragging a marker, or choosing a visual option. Warm amber always marks their prediction.
3. **Experiment:** controls appear. The visitor drags, fires and toggles. **Discoveries** unlock as they do specific things, and **challenges** ask them to reach a goal ("make the stripes twice as far apart"), which the simulation checks.
4. **Explain:** the visitor taps glowing **hotspots** on the result to reveal short annotations (at most 30 words each). Their prediction is overlaid on what actually happened, and a quick visual knowledge check closes the step.
5. **Go deeper:** a **math lens** overlays live equations on the stage. The model notes, history and misconceptions live here. This is the only place longer text is allowed.

Visitors can move freely between states. The steps guide; they never lock anyone in.

## 4. The rooms in detail

Each room states what is simplified, in one short visible note (see §6).

**Room 1: Double slit.** Light or electrons hit two slits, and particles arrive one at a time, landing as single dots drawn at random from the true probability pattern. Stripes slowly emerge.
- *Controls:* wavelength, slit separation, slit width, and a which-slit detector.
- *Key discovery:* knowing which slit the particle used destroys the stripes.

**Room 2: Superposition.** One quantum bit (a two-state system such as a photon's polarization) shown as a point on a sphere.
- *Controls:* the visitor prepares a state, then measures it many times.
- *Key discovery:* each measurement gives one definite answer, but the proportions follow the squared amplitudes. This room introduces phase as colour.

**Room 3: Entanglement.** A Bell-test game. The visitor sets the angle of each detector and fires thousands of particle pairs.
- The visitor then tries to beat quantum mechanics with a "secret instructions" strategy of their own, and cannot. A CHSH score shows quantum results passing 2, the most any such strategy can reach.
- A second view shows that each side's own results never change, so no message can be sent this way.

**Room 4: Tunneling.** A wave packet meets a barrier, simulated live from the Schrödinger equation.
- *Controls:* barrier height, barrier width, and particle energy.
- *Key discovery:* part of the wave gets through. The measured fraction is shown next to the textbook formula.

**Room 5: Quantum computing.** A circuit builder for 1 to 3 qubits with the gates H, X, Z and CNOT, plus measurement. The state is shown in the shared phase-colour language.
- *Guided puzzles:* make an entangled pair, Deutsch's algorithm, then a two-qubit Grover search.
- *Key discovery:* quantum algorithms work by arranging interference, not by "trying every answer at once".

## 5. Interactive mathematics

Each room's "Go deeper" layer contains the governing equations, written as live objects:

- Values inside each equation update as the visitor moves the controls.
- Each variable shares a colour with the control it belongs to. Hovering or focusing a symbol highlights that control, and the reverse.
- Each equation has a plain-English reading beside it ("the spacing grows when the wavelength grows").
- Derivations are short and optional, and can be revealed step by step.

## 6. Scientific accuracy

- Every visual that claims to show physics is computed from the real equations. Nothing is a hand-drawn imitation.
- Each simulation carries a short **model note** that names its simplifications. For example: "ideal slits, one wavelength; waves drawn enlarged, screen pattern at true scale".
- Decorative effects never imitate physics they don't compute. If something is only atmosphere, it doesn't pretend to be data.
- Common misconceptions are addressed directly in each room. Examples: "observation" doesn't require a conscious observer; tunneling isn't "borrowing energy"; entanglement doesn't send signals; quantum computers don't simply try every answer at once.
- Automated tests check the physics against known results:
  - double-slit intensity matches the expected formula
  - tunneling transmission matches the analytic result, and total probability stays at 1
  - Bell correlations follow the expected curve
  - quantum circuit outputs match known gate results
- Historical claims (Young, Davisson–Germer, Bell, Aspect, and others) are checked against reliable sources before publishing.

## 7. Visual direction

**Decision pending: choose one of the three concepts (A Aurora Observatory, B Night Tide, C Phase Light) or a combination.** The mockups show each one.

These principles hold whatever the choice:

- **Mood:** wondrous, dreamy and immersive, but sophisticated and welcoming. Deep midnight, indigo and violet backgrounds; luminous cyan and turquoise; occasional warm accents.
- **The physics is the most beautiful thing on screen.** Interference, probability and waves are the hero visuals. Atmosphere supports them and never competes.
- **A shared visual language:** hue shows phase and brightness shows probability. It is introduced gently, explained in plain words, and always backed by a second cue (rotating arrows) for colour-blind visitors.
- **Each room has its own accent and character** within one recognisable world.
- **Avoid:** paper or parchment, vintage illustration, generic neon tech, dashboards and repeated card grids, cartoons, and effects that distract from the science.

## 8. Writing and voice

- Claude drafts all educational, historical and explanatory text. You review and revise it.
- **You write the curator's note yourself.** It is the personal heart of the site.
- Style: warm, plain and precise. Short sentences. Questions over statements.
- Technical terms are tappable. They open a one-line definition with a tiny animation, never a paragraph.
- Word budgets are enforced automatically:

  | Kind of text | Limit |
  |---|---|
  | Question | 12 words |
  | Prompt | 10 words |
  | Hotspot | 30 words |
  | Discovery | 20 words |

  Only Go deeper is exempt.

## 9. Accessibility and comfort

- Every control works from the keyboard, with visible focus.
- The reduced-motion setting is respected, and every animation can be paused.
- Each simulation has a text description of its result for screen readers (for example, "11 bright stripes, 2.2 mm apart").
- Colour is never the only way information is shown. Text contrast meets WCAG AA.
- Works on phones and tablets, with touch-friendly controls. Phones may get a simpler layout, but the same experiments.

## 10. Technical approach (in plain terms)

- **A static website.** Plain files that any free host can serve (GitHub Pages or Netlify). No server, accounts or database, so it is cheap to run and hard to break.
- **React + TypeScript + Vite**, free libraries only. React builds the interface from small reusable pieces, TypeScript catches mistakes before they reach visitors, and Vite builds the site. See the architecture document for the full plan.
- **Physics separate from pictures.** Each room's physics lives in its own module with no drawing code, and is tested on its own. Drawing code only displays what the physics calculates. This separation is what lets us promise accuracy.
- **Canvas and WebGL** for the visuals. Canvas is the standard, fast way to draw animated graphics in a browser. WebGL, which uses the graphics card, is reserved for the heaviest visuals.
- **KaTeX** for beautifully typeset equations that render instantly.
- **Performance:** animations pause when off-screen, and each room loads only when it is opened. We target smooth motion on a mid-range phone.
- **Organisation:** one folder per room, one shared design system (colours, type, controls, the phase-colour language), and short documentation explaining how the pieces fit together.

## 11. Build order

The detailed sequence is in the architecture document (§9). In short:

1. Foundation.
2. The double slit as a complete reference room.
3. The hall.
4. Tunneling, which carries the most technical risk.
5. Superposition, entanglement and quantum computing.
6. Polish, then launch.

You review at each step.

## 12. Out of scope (for now)

Accounts and saved progress, languages other than English, a backend or analytics, 3D walkable spaces, and more than three qubits.

## 13. Open decisions

1. **Visual direction:** A, B, C, or a combination (see the mockups).
2. Electrons or light as the default particle in Room 1. Recommendation: start with light, then reveal that electrons do exactly the same thing. That reveal is one of the great surprises in physics.
