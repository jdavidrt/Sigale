# Styling guide

Plain CSS only — no Tailwind, no `@apply`, no CSS-in-JS library. Mobile-first
(`min-width` media queries), touch targets ≥ 44 px, base font 16 px (inputs
too, so iOS never zooms). UI copy is Spanish.

## Layers

Imported once, in this order, by `src/App.jsx`:

| File | Holds |
|---|---|
| `styles/tokens.css` | every raw value: the `--am-*` Astromelias palette, semantic colors, spacing, radii, type scale, shadows, gradients, motion |
| `styles/global.css` | reset, `body`, form elements, keyframes |
| `styles/utilities.css` | a few helpers used by 3+ components (glass surfaces, shadows, `.modal-light`) |
| `styles/astromelias.css` | the shared component classes: `.scr` `.card` `.btn` `.chip` `.pill` `.stat` `.field` `.input` `.trow` `.tb-btn` `.label` `.serif` `.capmeter` `.stepper` `.seg`, landing (`.lhero`, `.lbody`, …) and more |
| `styles/skins/*.skin.css` | one file per event look, scoped to a `.skin-*` class on `<body>` |
| `*.module.css` | co-located CSS Modules for component-specific layout |

`astromelias.css` is structure only. Colors come from the short aliases
(`--black`, `--cream`, `--cream-dim`, `--yellow`, `--lilac`, `--purple`,
`--orange`, `--frame`, `--hair`, …), which each skin defines.

## Rules

- Reference tokens; never hardcode a hex, px spacing or duration in a
  component. Inline `style={{}}` is acceptable only for values computed at
  runtime.
- Reuse an Astromelias class before writing a module; write a module before
  adding a utility.
- Organizer-form buttons use `src/components/Common/Button.module.css`
  (`primary`, `secondary`, `secondaryDashed`, `success`, `danger`,
  `orange`; sizes `md` / `lg`). Public screens use the global `.btn`.
- State via `data-*` attributes or modifier classes, not by rebuilding
  class strings from colors.
- Inside `.modal-light` (cream modal surface) the short aliases `--cream`,
  `--cream-dim`, `--cream-faint`, `--frame`, `--hair`, `--lilac`,
  `--lilac-deep` are re-pointed for dark-on-cream text. Use the aliases in
  modal content and it reads correctly on both surfaces.
- Status is never color alone: `.pill` pairs color + dot + label.
- Respect `prefers-reduced-motion` for anything that moves (the landing
  parallax, the spinner, the star field already do).

## Per-event skins

`useEventSkin(slug)` (`src/hooks/useEventSkin.js`) puts one `.skin-*` class on
`<body>` for the landing and the wizard; everything else (including the
organizer chrome) keeps `skin-astromelias`.

To give an event its own look:

1. Copy `skins/astromelias.skin.css` to `skins/<name>.skin.css`, rename the
   selector to `.skin-<name>`, and redefine **every** token in the contract
   documented at the top of the Astromelias file (palette aliases, RGB
   triplets, direction-theme vars).
2. Import it in `App.jsx` after the other skins.
3. Map the slug in `EVENT_SKINS` (and, if the star field should change,
   `SKIN_STAR_DECOR`) in `useEventSkin.js`.

Isolation test: deleting a skin file must leave the app looking exactly like
Astromelias. `rock-en-vivo` → `skin-rock` is the current example; its bespoke
landing blocks live in `LandingPage.jsx` behind an `isRock` check.
