---
name: quantum-physics
description: Scientific standards for Beyond the Ordinary. Covers building or changing simulations, physics models, solvers, equations, model notes, explanations and historical claims. Use whenever work touches src/physics/, a room's simulation or renderers, equations.ts, modelNote, hotspot or explanation copy, glossary definitions, or any statement about how quantum mechanics works, even for a "small visual tweak" to something that displays physics.
---

# Quantum physics standards

This site's promise is that what visitors see is real physics. One faked animation or one popular-science myth breaks the visitor's trust and can teach them something false. Treat accuracy like a failing test: work is not done until it holds.

## 1. Simulations must mean something

- **Compute every physics visual from the room's stated model.** Brightness, positions, counts and colours that claim to be physical must come from the equations, not be hand-tuned to "look right".
- **Choose the simplest model that is correct for the claim.** Prefer analytic results; use numerical methods only where needed. Prefer unitary, well-understood schemes, such as split-operator Fourier for the time-dependent Schrödinger equation.
- **Sample randomness from the Born-rule distribution** using the seeded RNG (`physics/core/rng.ts`), so results are reproducible.
- **When the display scale differs from reality, preserve the physically meaningful quantity** (for example, the number of fringes) and label the enlargement.
- **Keep physics pure.** No React and no DOM inside `src/physics/`. Renderers only draw what the model returns.

## 2. State assumptions and limitations

Every room's `modelNote` lists:
- **the model**, with its key equation
- **the assumptions**, for example: ideal slits, monochromatic, far field; noiseless gates
- **the limitations**, meaning what real phenomena it leaves out
- **what is illustrative versus quantitative** on screen

Keep the note in sync with the code. If you change the model, change the note in the same commit. Parameter ranges must stay within the model's validity. For example, the double slit keeps `L ≥ 5d²/λ` for the far-field approximation.

## 3. Explanations must be accurate

Plain language is welcome; wrong language is not. Before writing or approving copy, check it against these common myths:

| Myth | Accurate framing |
|---|---|
| Observation requires a conscious observer | Measurement is a physical interaction that records which-path information |
| The particle "is in both places" literally | The amplitude has contributions from both paths, and they interfere |
| Tunneling "borrows energy" | The wavefunction extends into the barrier, so there is a nonzero probability beyond it |
| Entanglement sends signals faster than light | The correlations appear only when results are compared; each side's own statistics never change |
| Quantum computers try every answer at once | Algorithms arrange interference so that wrong answers cancel |
| Collapse is fully understood | Interpretations differ; the predictions (the Born rule) do not |

Analogies are allowed if you say where they break down. For example: "water waves are a cousin, not the same thing".

## 4. References

- **Every historical claim, number, or non-obvious physics statement in Go deeper needs a reputable source** recorded in the room's `content.ts` as `refs`.
  - **Acceptable:** peer-reviewed papers (with DOI), standard textbooks (Griffiths, Sakurai, Feynman Lectures, Nielsen & Chuang), CODATA/NIST for constants, and major lab or university resources.
  - **Not acceptable:** blogs, uncited videos, AI summaries.
- **Constants come from CODATA** via `physics/core/constants.ts`. Never re-type them inline.
- **If you cannot verify a claim, leave it out** or mark it `TODO(verify)` for the owner. Do not guess dates, names or numbers.

## 5. Tests that prove it

Each model needs tests against known results. At minimum:

| Room | Must test |
|---|---|
| Double slit | maxima at `mλL/d`, envelope zeros at `λL/a`, sampled histogram matches I(y) (fixed seed, χ²), no fringes with the detector |
| Superposition | normalisation, Born-rule statistics, repeated measurement stability, interferometer follows cos²(Δφ/2) |
| Entanglement | E → cos 2Δ, S ≈ 2√2 at optimal angles, exhaustive local strategies give \|S\| ≤ 2, marginals stay 50/50 |
| Tunneling | norm drift < 1e-6 per 1,000 steps (no absorber), free Gaussian spreading, ⟨T⟩ within 2% of the packet-averaged analytic value, V₀ = 0 gives full transmission |
| Quantum computing | gate unitarity, HH = I, HZH = X, Bell-state creation, 2-qubit Grover succeeds with p = 1 |

## Checklist (run before calling physics work done)

- [ ] Every physics visual traces back to a function in `src/physics/`
- [ ] No hand-tuned "looks right" constants in place of physical ones
- [ ] `modelNote` updated: model, assumptions, limitations, illustrative vs quantitative
- [ ] Parameter ranges stay inside the model's validity
- [ ] Copy checked against the myth table; analogies say where they fail
- [ ] New claims have references; constants come from `constants.ts`
- [ ] Tests added or updated against analytic or known results, and passing
- [ ] Random behaviour is seeded and reproducible

## Review criteria

When reviewing a change, reject it, or flag it to the owner, if any of these are true:
- a visual implies a physical quantity the code does not compute
- an explanation would make a physicist wince, even if it is "simpler"
- a limitation is hidden rather than stated
- a number, date or attribution has no source
- a physics module has no test comparing it with theory
