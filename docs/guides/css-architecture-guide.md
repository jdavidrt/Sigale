# CSS Architecture Guide: Token-First Modular CSS

A framework-agnostic guide for building scalable, maintainable CSS without utility-class frameworks.

---

## Philosophy

The goal is a single source of truth for every visual decision — colors, spacing, typography, shadows — expressed as CSS custom properties (tokens), consumed by global rules and component-scoped modules. No inline styles. No magic numbers. No framework lock-in.

```
tokens.css          ← all design decisions live here (the "what")
global.css          ← element-level defaults that reference tokens (the "where")
utilities.css       ← single-purpose helper classes for cross-cutting patterns
[Component].module.css  ← scoped rules for one component only
```

---

## Layer 1: Design Tokens (`tokens.css`)

All raw values go here, defined as CSS custom properties on `:root`. Every other file references these — never raw hex, px, or timing values anywhere else.

### Categories to define

```css
:root {
  /* ── Typography ── */
  --font-base: 'Your Font', system-ui, sans-serif;
  --font-mono: 'Courier New', monospace;

  --text-xs:   11px;
  --text-sm:   12px;
  --text-base: 13px;
  --text-md:   14px;
  --text-body: 16px;
  --text-lg:   18px;  /* 18px = iOS zoom threshold — use for inputs */
  --text-xl:   20px;
  --text-2xl:  24px;

  --weight-normal:   400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  --leading-tight:  1.2;
  --leading-normal: 1.5;
  --leading-loose:  1.7;

  --tracking-tight:  -0.02em;
  --tracking-normal:  0;
  --tracking-wide:    0.05em;
  --tracking-wider:   0.1em;

  /* ── Spacing (scale in px) ── */
  --space-1:  2px;
  --space-2:  4px;
  --space-3:  6px;
  --space-4:  8px;
  --space-5:  10px;
  --space-6:  12px;
  --space-7:  16px;
  --space-8:  24px;
  --space-9:  32px;
  --space-10: 40px;
  --space-11: 48px;
  --space-12: 64px;

  /* ── Border radius ── */
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-3xl:  24px;
  --radius-4xl:  32px;
  --radius-full: 9999px;

  /* ── Colors — semantic names, not descriptive ── */
  --color-primary:        #758BFD;   /* brand accent */
  --color-success:        #4ade80;   /* positive states */
  --color-error:          #f87171;   /* danger / destructive */
  --color-warning:        #f59e0b;   /* caution */

  --color-text-primary:   #FFEDD8;   /* body text */
  --color-text-secondary: #BEADFF;   /* muted / labels */
  --color-text-heading:   #F5F0FF;   /* headings */

  --color-input-bg-solid: #4a3d8f;   /* form field background */

  /* Tints (semi-transparent overlays) */
  --color-tint-primary:   rgba(117, 139, 253, 0.08);
  --color-tint-success:   rgba(74, 222, 128, 0.10);
  --color-tint-error:     rgba(248, 113, 113, 0.08);

  /* Borders */
  --color-border-primary: rgba(117, 139, 253, 0.15);
  --color-border-subtle:  rgba(255, 255, 255, 0.06);

  /* ── Shadows ── */
  --shadow-soft:     0 2px 8px rgba(0, 0, 0, 0.15);
  --shadow-elevated: 0 4px 20px rgba(0, 0, 0, 0.25);
  --shadow-floating: 0 8px 32px rgba(0, 0, 0, 0.40);
  --shadow-focus:    0 0 0 3px rgba(117, 139, 253, 0.35);
  --shadow-btn:      0 4px 14px rgba(117, 139, 253, 0.40);

  /* ── Motion ── */
  --duration-fast:    100ms;
  --duration-base:    200ms;
  --duration-slow:    300ms;
  --duration-slower:  400ms;
  --ease-out:         cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-standard:    cubic-bezier(0.4, 0.0, 0.2, 1);
  --transition-fast:  all 100ms ease;
  --transition-base:  all 200ms ease;

  /* ── Blur (glass morphism) ── */
  --blur-sm:  8px;
  --blur-md:  12px;
  --blur-lg:  20px;
  --blur-xl:  40px;

  /* ── Z-index scale ── */
  --z-base:    1;
  --z-sticky:  100;
  --z-overlay: 200;
  --z-modal:   300;
  --z-toast:   400;

  /* ── Touch targets ── */
  --touch-min: 44px;   /* Apple HIG minimum */

  /* ── Gradients ── */
  --gradient-bg:      linear-gradient(135deg, #0f0a1e 0%, #1a1152 50%, #0d0a2e 100%);
  --gradient-primary: linear-gradient(135deg, #758BFD, #9B59B6);
}
```

### Rules
- Every value in the design lives here. If it doesn't have a token, add one.
- Name tokens by **role** (`--color-text-secondary`), not by **value** (`--color-purple-light`). Role-named tokens survive redesigns; value-named ones don't.
- Group tokens into named sections with comments.
- Import `tokens.css` first in your app entry point, before any other stylesheet.

---

## Layer 2: Global Styles (`global.css`)

Element-level resets and defaults. All values reference tokens — no raw numbers.

```css
/* Box model reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Body */
body {
  font-family: var(--font-base);
  font-size: var(--text-body);
  color: var(--color-text-primary);
  background: var(--gradient-bg);
  background-attachment: fixed;
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--color-text-heading);
}

/* Links */
a {
  color: inherit;
  text-decoration: none;
}

/* Buttons */
button {
  font-family: var(--font-base);
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  user-select: none;
}

/* Inputs */
input, textarea, select {
  font-family: var(--font-base);
  font-size: var(--text-lg);   /* 18px prevents iOS auto-zoom */
  -webkit-appearance: none;
  appearance: none;
  min-height: var(--touch-min);
  color: var(--color-text-primary);
  background: var(--color-input-bg-solid);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  width: 100%;
}

/* Focus ring (accessibility) */
input:focus, textarea:focus, select:focus, button:focus {
  outline: none;
  box-shadow: var(--shadow-focus);
}

/* Smooth transitions */
a, button, input, select, textarea {
  transition: var(--transition-fast);
}
```

### Rules
- No component-level rules here — only element selectors (`body`, `button`, `input`).
- No class selectors in `global.css`. Classes belong in modules or utilities.
- Font size on inputs must be ≥ 16px on iOS to prevent the browser zoom-on-focus behavior.

---

## Layer 3: Utility Classes (`utilities.css`)

Small, single-purpose classes for patterns used across many components. Think of these as your own minimal utility layer — only what you actually use.

```css
/* Glass morphism surface variants */
.glass-clean {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(var(--blur-md));
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
}

.glass-elevated {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(var(--blur-lg));
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-elevated);
}

/* Icon container */
.icon-box {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Hover lift */
.hover-lift {
  transition: var(--transition-base);
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated);
}

/* Color helpers */
.color-primary { color: var(--color-primary); }
.color-success { color: var(--color-success); }
.color-error   { color: var(--color-error); }

/* Typography helpers */
.text-mono     { font-family: var(--font-mono); }
.text-heading  { color: var(--color-text-heading); }
.text-body     { color: var(--color-text-primary); opacity: 0.80; }

/* Layout helpers */
.accent-bar {
  height: 1px;
  background: var(--color-border-subtle);
  margin: var(--space-4) 0;
}
```

### Rules
- Utilities are for **cross-cutting** patterns, not component layout.
- A utility class should do exactly one thing. If it does two things, split it.
- Resist the urge to build a full utility system — you'll end up with Tailwind. Keep this file small and intentional.
- Apply utility classes in JSX/HTML alongside module classes: `className="glass-elevated s.card"`.

---

## Layer 4: Component Modules (`[Name].module.css`)

Scoped CSS for a single component. The build tool (Vite, webpack, etc.) transforms class names to unique hashes, so there are no naming collisions.

### File naming
```
Button.module.css       → imported as btn
Navbar.module.css       → imported as s
TicketCard.module.css   → imported as s
```

Convention: use `s` for the component's own module, named aliases for shared modules.

### Basic structure

```css
/* ComponentName.module.css */

/* ── Root container ── */
.root {
  padding: var(--space-7);
  border-radius: var(--radius-3xl);
}

/* ── Header section ── */
.header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  color: var(--color-text-heading);
  margin: 0;
}
```

### In JSX/HTML

```jsx
import s from "./ComponentName.module.css";
import btn from "../Common/Button.module.css";

// Own module
<div className={s.root}>
  <h1 className={s.title}>Hello</h1>

  {/* Shared module */}
  <button className={`${btn.btn} ${btn.primary} ${btn.lg}`}>
    Save
  </button>

  {/* Module class + global utility */}
  <div className={`glass-elevated ${s.card}`}>
    ...
  </div>
</div>
```

---

## Patterns

### State-based styling with `data-*` attributes

Instead of toggling class names for state, use `data-*` attributes and CSS attribute selectors. This keeps state logic in JS and visual logic in CSS.

```jsx
// JSX
<div className={s.result} data-state={state}>
  <span className={s.icon} data-state={state} />
  <h2 className={s.title} data-state={state}>{message}</h2>
</div>
```

```css
/* CSS */
.result[data-state="success"] { border-color: var(--color-success); }
.result[data-state="error"]   { border-color: var(--color-error); }

.icon[data-state="success"] { color: var(--color-success); }
.icon[data-state="error"]   { color: var(--color-error); }

.title[data-state="success"] { color: var(--color-success); }
.title[data-state="error"]   { color: var(--color-error); }
```

Use this pattern for: validation states, loading/error/empty states, active/inactive tabs, open/closed panels.

### BEM-style modifiers in CSS Modules

Since CSS Modules scope names, flat modifier classes work fine:

```css
.btn         { /* base */ }
.btnPrimary  { background: var(--gradient-primary); }
.btnDanger   { background: var(--color-error); }
.btnLg       { padding: var(--space-5) var(--space-9); font-size: var(--text-lg); }
.btnSm       { padding: var(--space-2) var(--space-5); font-size: var(--text-base); }
```

```jsx
<button className={`${btn.btn} ${btn.btnPrimary} ${btn.btnLg}`}>Save</button>
```

For `--` double-dash names (if you prefer the BEM look), use bracket notation in JS since hyphens aren't valid identifiers:

```css
.statValue--success { color: var(--color-success); }
.statValue--error   { color: var(--color-error); }
```

```jsx
<span className={s["statValue--success"]}>42</span>
```

### Shared Button module

Extract a `Button.module.css` shared across the whole app:

```css
/* Button.module.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  border: none;
  transition: var(--transition-base);
  min-height: var(--touch-min);
  white-space: nowrap;
}

/* Sizes */
.sm  { padding: var(--space-3) var(--space-6);  font-size: var(--text-base); }
.md  { padding: var(--space-4) var(--space-8);  font-size: var(--text-body); }
.lg  { padding: var(--space-5) var(--space-10); font-size: var(--text-lg); }

/* Variants */
.primary   { background: var(--gradient-primary); color: white; box-shadow: var(--shadow-btn); }
.secondary { background: var(--color-tint-primary); color: var(--color-primary); border: 1px solid var(--color-border-primary); }
.danger    { background: var(--color-tint-error); color: var(--color-error); border: 1px solid var(--color-border-error); }

.primary:hover,
.secondary:hover,
.danger:hover { transform: scale(1.02); }

.primary:disabled,
.secondary:disabled,
.danger:disabled { opacity: 0.40; cursor: not-allowed; transform: none; }
```

Import anywhere: `import btn from "../Common/Button.module.css"`.

### When inline styles are acceptable

The "no inline styles" rule has narrow, legitimate exceptions:

| Situation | Example | Reason |
|---|---|---|
| Computed JS values | `style={{ transform: \`translateY(${offset}px)\` }}` | CSS can't compute JS state |
| Dynamic progress/percentage | `style={{ width: \`${progress}%\` }}` | Truly runtime-computed |
| CSS token vars on wrapper pages | `style={{ padding: "var(--space-7)" }}` | Avoids creating a module for a trivial wrapper |

Everything else — colors, spacing, hover states, breakpoints — belongs in a CSS file.

---

## Import Order

In your app entry file (e.g. `main.jsx`, `App.jsx`):

```js
import "./styles/tokens.css";    // 1. tokens first — everything depends on these
import "./styles/global.css";    // 2. element resets
import "./styles/utilities.css"; // 3. utility classes
```

Component modules are imported inside their own files. Never import a component's module in a different component.

---

## Checklist: Migrating from Tailwind or Inline Styles

1. **Create `tokens.css`** — extract every unique color, spacing, shadow, and timing value from your codebase into named tokens.
2. **Create `global.css`** — rewrite element-level rules using tokens. Remove all `@apply` or `@tailwind` directives.
3. **Create `utilities.css`** — identify classes used in 3+ components and promote them here.
4. **Per component**: create `[Name].module.css`, move all styles, replace Tailwind classes and inline style objects with module class names.
5. **Audit**: grep for `style={{`, `text-[#`, `bg-[#`, `@apply` — each match is a migration target.
6. **Verify**: grep for hardcoded hex colors in JSX/HTML — these should not exist after migration.

---

## What Not to Do

- **Don't use `@apply`** in CSS Modules or global CSS — it creates tight coupling to the utility layer and fails in some build setups.
- **Don't repeat raw values** — if `#758BFD` appears in two files, it should be a token.
- **Don't create utilities for one-off patterns** — if a class is only used in one component, it belongs in that component's module.
- **Don't put layout rules in `global.css`** — only element selectors, no classes.
- **Don't import one component's module in another** — use a shared module (like `Button.module.css`) for cross-component reuse.
- **Don't fight the cascade** — global element styles set sensible defaults; component modules override locally. Work with specificity, not against it.
