---
name: visual-design
description: Visual standards for Beyond the Ordinary. Covers the design system (tokens, colour, typography, spacing), layout, responsiveness, animation, and polish. Use whenever creating or changing anything visitors see: components, CSS, renderers, the hall, room layouts, transitions, colours or fonts. Also use when something "looks off", feels generic, or needs to work on phones, even if the request sounds like a small styling fix.
---

# Visual design standards

The site should feel wondrous, immersive and otherworldly, yet sophisticated and welcoming. **The physics is the most beautiful thing on screen.** Atmosphere supports it and never competes with it.

## 1. The design system is the source of truth

- **All colours, fonts, sizes, spacing, radii, shadows and motion timings come from `src/theme/`** (`tokens.css`, `typography.css`, `motion.ts`, `palettes.ts`).
  - Never write a raw hex value, pixel size or duration in a component.
  - If a value is missing, add a token, and say so in your summary.
- **Use the scientific colour maps in `palettes.ts`:** wavelength → colour, and phase → hue (a cyclic map). Do not invent per-room variants.
- **Reserved meanings.** Never use these colours for anything else:

  | Colour / cue | Meaning |
  |---|---|
  | Warm amber + dashed | The visitor's prediction |
  | Hue + arrow | Quantum phase |
  | Brightness | Probability |

- **Each room has one accent token** within the shared world. Rooms differ by accent and visual subject, not by layout system.
- **The chosen direction is the Night Laboratory** (design spec §7): the only light comes from the physics. Follow it; don't re-litigate it.

## 2. Spacing and layout

- **Use the spacing scale only.** Lay out groups with flex or grid and `gap`, not ad-hoc margins.
- **Stage first.** The simulation fills the room. Controls and overlays float at the edges and never cover the part of the visualization being discussed.
- **Avoid conventional web patterns:** no card grids, no long scrolling pages, no dashboard panels, no hero-plus-sections templates.
- **Keep a consistent anatomy across rooms:** step rail, stage, controls and math lens always in the same places.

## 3. Typography

- **Use only the type scale tokens.** Display face for headings, used sparingly. Body face for reading. Mono with `tabular-nums` for live numbers and units.
- **Body text at least 16 px.** Line length 45–70 characters. `text-wrap: balance` on headings.
- **Write units properly:** a thin or normal space, correct symbols (nm, mm, eV, ħ, λ), and a real minus sign (−).

## 4. Colour and contrast

- **Warm near-black grounds with faint grain** (one per room), ink-and-bone text and lines, and one muted pigment per room. Light and saturated colour belong to the physics only. Warm amber stays reserved for predictions.
- **Text contrast meets WCAG AA**, including text over animated backgrounds. Add a scrim token where needed.
- **Colour never carries meaning alone.** Pair it with shape, pattern, arrow or label.
- **Avoid:** excessive neon glow, rainbow decoration, paper or parchment textures, cartoonish illustration, and stock "tech" gradients.

## 5. Responsive layouts

| Width | Layout |
|---|---|
| Desktop | Full stage, floating controls, math lens beside the stage |
| Tablet | Stage on top, controls docked |
| Phone | Stage first, controls in a bottom sheet, larger hotspots |

- Never scroll horizontally. Touch targets are at least 44 px. Respect safe-area insets.
- Canvas resolution follows `devicePixelRatio` (capped at 2) through `StageCanvas`. Quality scales down rather than dropping frames.

## 6. Thoughtful animation

- **Simulation motion is physics:** its speed and shape come from the model.
- **Interface motion is short and purposeful:** it shows where something came from or went. Use `motion.ts` durations and easings only.
- **One orchestrated moment per transition** (hall → room zoom) beats many scattered effects. No looping decoration that doesn't encode something.
- **`prefers-reduced-motion`:** transitions become crossfades, ambient motion nearly stops, and simulations offer stepping. Animations also pause when off-screen or when the tab is hidden.
- **Performance:** 60 fps on a mid-range laptop, at least 30 fps on a mid-range phone.

## 7. Polished details

- Every interactive element has hover, focus-visible, active and disabled states.
- No layout shift when values change (fixed-width numerals). No text clipping. No overlapping labels.
- Empty and loading states are designed. A room never flashes blank before its first frame.
- Icons and line weights are consistent. Corner radii come from tokens, and only where they mean something.

## Checklist (run before calling visual work done)

- [ ] No raw colours, sizes or durations outside `src/theme/`
- [ ] Reserved colour meanings respected; colour is never the only cue
- [ ] Layout matches the shared room anatomy; no card grids or scroll-heavy sections
- [ ] Checked at about 375 px, 768 px and 1280 px+; no horizontal scroll; touch targets ≥ 44 px
- [ ] Contrast AA, including text over moving backgrounds
- [ ] Every animation either encodes physics or explains a change; reduced-motion path works
- [ ] Focus states visible; no layout shift or clipping
- [ ] Looked at in a real browser (screenshot or preview), not just reasoned about

## Review criteria

Flag or reject a change if:
- an effect is beautiful but teaches nothing, or competes with the simulation
- it introduces a one-off value instead of a token
- a reserved colour is reused for something else
- it looks like a generic dark tech site, a dashboard, or a template
- it breaks on a phone, under reduced motion, or with keyboard focus
