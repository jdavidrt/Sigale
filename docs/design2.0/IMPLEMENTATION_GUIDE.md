# Sígale 2.0 — Astromelias Reskin · Implementation Guide

> **The design.** Everything in this guide describes one design: the **Astromelias** skin as built in the final mockup, **`Sígale 2.0 - Prototipo.html`**. Open that prototype — it is the single source of truth for look, layout, motion and copy. This document explains how to port it into the real Sígale codebase (React + plain CSS, token-driven, no Tailwind, Spanish UI).
>
> **Product context:** `uploads/DESIGN_BRIEF_v3.md`. **Live tokens:** `uploads/tokens.css` (the single source of visual truth — no raw hex/px anywhere else).

---

## 0. The final mockup

`Sígale 2.0 - Prototipo.html` is the clickable mockup. It runs three things in one phone shell:

1. **Public Landing** — a flyer-forward, parallax scroll page (tap **Comprar boleta** to enter the flow).
2. **Organizer Home** — event header + sales stats.
3. **The 7-step purchase flow** — Selección → Confirmar → Datos → Pago → WhatsApp → Verificando.

It is assembled from these files (this is the whole project now — earlier exploration files have been removed):

| File | Role |
|---|---|
| `Sígale 2.0 - Prototipo.html` | Entry point — loads everything below |
| `styles.css` | **Palette + every reusable component class** (the Astromelias skin) |
| `proto.css` | Prototype shell: phone frame, nav panel, parallax landing CSS |
| `lib.jsx` | Shared primitives: `StarField`, `Screen`, `StatusBar`, `TopBar`, `Ic`, `Wordmark`, `Money` |
| `proto.jsx` | The interactive app: parallax Landing + router + phone shell |
| `home.jsx` | Organizer Home (`HomeCollage`) |
| `flow.jsx` | The 7-step purchase flow (`FlowShell` + `Step1…Step6`) |
| `assets/flyer.png` | Event flyer (hero imagery) |

> Note: the prototype renders inside a phone frame with a left nav panel (`proto.css` `.navpanel`, `.phone`). That chrome is **prototype scaffolding only** — don't port it. Port the *screen* contents (`.scr` and inside).

---

## 1. The design in one paragraph

The skin abstracts a warm, nocturnal palette from the Astromelias flyer: a near-black night field (`#09060A`), **daffodil yellow** for prices/highlights, **lilac** for secondary, **plum purple** as brand, **red-orange** for the primary CTA, and **warm cream** text. Type is **Barlow Semi Condensed** for UI paired with **DM Serif Display** for headings, prices and the wordmark. A faint seeded **starfield** and a warm purple glow rising from the bottom sit behind every screen. The festive, event-night treatment uses gradient **tiles** (purple / yellow / orange) and **ticket-stub** notches. The public buyer face and the Organizer tools share the same tokens and components so they read as one product.

---

## 2. Step 1 — Migrate the tokens (the foundation)

Edit `src/styles/tokens.css`. Replace the **values** of existing tokens; keep the **names** so nothing downstream breaks. Because the codebase is token-driven, this single step reskins most of the app.

### 2.1 Add the Astromelias raw palette

Add at the top of `:root` (these are the exact values from `styles.css`):

```css
/* ── Astromelias raw palette (flyer-abstracted) ── */
--am-black:       #09060A;  /* page night field (warm near-black) */
--am-black-2:     #120C14;  /* raised surface */
--am-black-3:     #1B1320;  /* higher surface */
--am-cream:       #F3E8D6;  /* primary text */
--am-cream-dim:   rgba(243,232,214,0.60);
--am-cream-faint: rgba(243,232,214,0.34);
--am-yellow:      #E7AE3F;  /* daffodil — highlight / price */
--am-yellow-soft: #F2C766;
--am-lilac:       #CBB7DA;  /* pale petal — secondary */
--am-lilac-deep:  #A98FC0;
--am-purple:      #8B4A91;  /* plum flower — brand */
--am-purple-2:    #B468BC;
--am-purple-deep: #46294C;
--am-orange:      #D5582E;  /* red-orange — CTA / attention */
--am-orange-soft: #E87A4F;
--am-green:       #5FBE7B;  /* success */
--am-red:         #DB5340;  /* error / rejected */
--am-blue:        #79A6E8;  /* pago enviado */
--am-frame:       rgba(203,183,218,0.42); /* flyer's pale border */
--am-hair:        rgba(243,232,214,0.13);
--am-hair-2:      rgba(243,232,214,0.08);
```

### 2.2 Remap the existing semantic tokens

Point the app's existing token names at the new palette. **This block reskins most of the app.**

| Token | Old value | New value |
|---|---|---|
| `--color-bg-start` | `#27187E` | `var(--am-black-2)` |
| `--color-bg-end` | `#030312` | `var(--am-black)` |
| `--color-card-start` | `#1a1152` | `var(--am-black-2)` |
| `--color-card-end` | `#0a0620` | `var(--am-black)` |
| `--color-primary` | `#758BFD` | `var(--am-purple)` |
| `--color-secondary` | `#BEADFF` | `var(--am-lilac)` |
| `--color-accent-blue` | `#60a5fa` | `var(--am-blue)` |
| `--color-accent-orange` | `#FF8C00` | `var(--am-orange)` |
| `--color-success` | `#4ade80` | `var(--am-green)` |
| `--color-error` | `#ef4444` | `var(--am-red)` |
| `--color-danger` | `#dc2626` | `var(--am-red)` (+ `--color-danger-rgb: 219,83,64`) |
| `--color-warning` | `#f59e0b` | `var(--am-yellow)` |
| `--color-text-primary` | `#FFEDD8` | `var(--am-cream)` |
| `--color-text-heading` | `#E2D1B9` | `var(--am-cream)` |
| `--color-text-secondary` | `#BEADFF` | `var(--am-lilac)` |
| `--color-text-muted` | `rgba(190,173,255,.6)` | `var(--am-cream-dim)` |
| `--color-border-subtle` / `-medium` | white alphas | `var(--am-hair)` / `var(--am-frame)` |

**Add** the price/highlight color (used constantly):

```css
--color-price:     var(--am-yellow);
--color-highlight: var(--am-yellow);
```

> Keep the names of the glass-fill, gradient, tint and shadow tokens; re-tint the purple-based ones — e.g. `--gradient-primary: linear-gradient(135deg, var(--am-purple), var(--am-purple-2))`, and shift the primary-CTA glow to `rgba(213,88,46,0.34)` (orange).

### 2.3 Type tokens

```css
--font-base:    'Barlow Semi Condensed', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-display: 'DM Serif Display', Georgia, serif;   /* headings, prices, wordmark */
--font-mono:    ui-monospace, 'Courier New', monospace; /* folio numbers, placeholders */
```

The existing size scale, weights, radii, spacing, motion and `--touch-min: 44px` are unchanged — they already match the skin.

### 2.4 Load the fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
```

**✅ Checkpoint:** after §2 the existing app should already look Astromelias — warm dark field, plum/lilac accents, cream text, yellow prices — because every component reads these tokens.

---

## 3. Step 2 — Shared primitives & global shell

Add these (ported from `lib.jsx` / `styles.css`) to `src/components/ui/`.

### 3.1 Atmosphere — starfield + aura

Every screen sits on a night field with a warm bottom glow and scattered stars.
- **CSS aura** — `styles.css` `.scr::after`: two radial gradients (a purple glow rising from the bottom `rgba(139,74,145,0.22)` + a faint yellow wash top-right). Attach to the page shell.
- **`<StarField seed density>`** — port from `lib.jsx`. Seeded PRNG (`mulberry`) makes layouts **stable per screen**; default density 40; ~8% larger glowing stars. Render `position:absolute; inset:0; z-index:0; pointer-events:none; aria-hidden`.

### 3.2 Icon set — `<Ic n s sw fill>`

`lib.jsx` ships a compact stroke set (`home, menu, pin, cal, clock, ticket, plus, chevD/R, arrowL, user, id, phone, wa, check, copy, qr, share, star, bell, lock, sparkle`). Use it as the canonical icon component (currentColor, 24-viewbox, strokeWidth ~1.7). `wa` is the WhatsApp glyph used through the flow.

### 3.3 Wordmark & Money

> **Implementation note.** `<Wordmark>` and `<Money>` are **prototype components**, described here as design specs. They were never adopted in `src/` and their React ports have been retired to `legacy/src/`. In the app: render the wordmark with the Astromelias CSS classes from `src/styles/astromelias.css`, and format money with `formatCurrency()` from `src/utils/timeFormat.js` — which already produces the CO grouping specified below.

- **`<Wordmark text swash={[…]}>`** — the "Astromelias" lockup in `--font-display`; `swash` indices render selected letters italic for flyer flavor.
- **`<Money v>`** — must match the codebase's `formatCurrency()` → CO grouping `"$30.000"`; small superscript `$` + tabular-nums. Use everywhere money appears.

### 3.4 Theme class

The skin lives behind a single root class **`.t3`** (it sets `--title-font`, `--cta-bg`, `--card-bg`, `--accent`, `--badge-bg`, etc.). Either keep `.t3` on the app root, or fold its variable assignments straight into `:root` so no class is needed.

---

## 4. Step 3 — Reusable component classes

Port these classes (all in `styles.css`) and bind your existing components to them. They are token/`.t3`-driven.

| Class | Use | Existing component to bind |
|---|---|---|
| `.scr` / `.scr-body` / `.pad` | Screen shell, scroll body, 18px h-padding | `Layout` |
| `.statusbar` | iOS-style status bar | new |
| `.topbar` / `.tb-btn` | Organizer top bar (home + Menu) | `Navbar` |
| `.card` | Surface | `Card` / `EmptyStateCard` shell |
| `.btn` / `.btn.ghost` / `.btn.sm` | Primary CTA (54px), ghost, small | `Button` (≥44px ✓) |
| `.tile` + `.purple/.orange/.yellow` | Gradient tiles (header, stats, stages) | Collage cards |
| `.stub` | Ticket-stub notch | ticket/type cards |
| `.chip` / `.chip.lilac/.green` | Status & meta chips | badges |
| `.badge` | Count badge (ticket-type quantities) | `TicketCard` qty |
| `.price` / `.cur` | Yellow tabular price | `Money` |
| `.stat` / `.stat-grid` / `.v` / `.k` | Dashboard stat cells | **`StatCell`** |
| `.trow` | Ticket-type / stage row | `TicketTable` row |
| `.stepper` | Quantity ± (46px targets) | new — Selección |
| `.field` / `.flabel` / `.input` | Labelled field (min 50px, **16px** font) | `FieldLabel` + inputs |
| `.seg` / `.opt` | Segmented control (WhatsApp/Email) | new |
| `.pill` + `.wait/.sent/.ok/.no/.dead` | **Purchase status pills** | new — see §6 |
| `.count` / `.t` | Soft countdown (yellow) | new — payment step |
| `.qr` | QR placeholder | swap for real `QRDisplay` |
| `.folio` | Mono order number `#123` | new |
| `.steps` / `.steps i.on/.done` | Flow progress dots | new |
| `.ph-img` | Striped image placeholder | flyer/QR slots before upload |
| `.charly` | Charly mascot avatar slot — **keep Charly** | existing `charlyIllustration` |

**Inputs** are `font-size:16px`, `min-height:50px` — preserves the iOS zoom-safe / 44px-touch rules. Don't shrink them.

---

## 5. Step 4 — Screens

### 5.1 Public Landing — `/evento/:id`

Cold-arrival first impression. **Flyer-forward, one unmistakable buy CTA.** Spec: `proto.jsx` → `Landing`.

Layout top→bottom: full-flyer **hero** → purple active-stage **`.tile.stub`** (stage, big yellow price, `cupos restantes`) → **`Comprar boleta`** CTA → two secondary tiles (yellow "Etapa 2 · Próximamente", orange "Taquilla · En puerta") → **line-up** (large serif names) → venue/contact info card with a green WhatsApp button → repeat CTA.

**Motion:** on scroll the flyer parallaxes up + scales down, a dark overlay fades in, the "Desliza" hint fades out, and a **collapsed sticky header** (flyer thumbnail + wordmark + date) fades in past ~560px; floating sparkle/star glyphs drift at different rates. Gate all motion behind `@media (prefers-reduced-motion: no-preference)`.

**Data:** show only the `active` stage with live `cupos restantes`; render future stages as **"Próximamente"**; taquilla price is informational.

### 5.2 Organizer Home — `/`

Spec: `home.jsx` → `HomeCollage`. Event header in a purple `.tile` (event-active chip, wordmark, `PlusBtn`), `InfoBlock`s for venue/doors (AM/PM, yellow icons), two stat tiles (**Vendidas** yellow, **Ingresos** orange — bind to `StatCell`), then **Tipos de Boletas** as `.trow.stub` rows with `<Money>` + count `.badge`. Reuse `Navbar` behind `.topbar`.

### 5.3 The 7-step purchase flow — `/compra`

The heart of the redesign. Spec: `flow.jsx`. All steps share **`<FlowShell>`** (back button + wordmark + `.steps` progress dots + "Paso N de 6" header + a single pinned bottom CTA). Each step is a calm full-screen state with **one** primary action.

| Step | Component | Screen | Key elements |
|---|---|---|---|
| 1 · Selección | `Step1` | Elige tu boleta | Active-stage tile, `.stepper` (máx 6), future stage greyed, live **Total** |
| 2 · Confirmar | `Step2` | Tu cupo está reservado | Charly mark, generated **`#folio`** in a purple tile, "Guárdala, no la compartas" |
| 3 · Datos | `Step3` | ¿Para quién son? | One holder card (name + cédula) **per ticket**, delivery `.seg` (WhatsApp/Email) + contact |
| 4 · Pago | `Step4` | Transfiere y guarda el pantallazo | **Emotional center:** soft `.count` countdown (yellow, "tu cupo está guardado"), big total, bank QR, copyable folio |
| 5 · WhatsApp | `Step5` | Envíanos tu pantallazo | Green WhatsApp circle, prefilled message preview, **`Abrir WhatsApp`** |
| 6 · Verificando | `Step6` | Tus boletas están en camino | Blue spinner ring, **`pago enviado`** pill, reassurance copy |
| 7 · Espera→Confirmada | (on `/compra/:folio`) | Status page | State machine (§6); on `confirmed` reveals the QR(s) |

**Countdown (Step 4):** 20-minute soft timer in `--color-warning` (yellow), never alarming red unless truly `expired`. Keep copy reassuring.

**WhatsApp deep link (Step 5):** `https://wa.me/<whatsappNumber>?text=` + `encodeURIComponent('¡Hola! Envío pantallazo de compra #' + folio)`.

### 5.4 Screens to design next (not in the mockup)

Build on the same primitives — flag to design before building:
- **`/admin`** — purchases table (`.trow` / `TicketTable`), prominent folio search, status filters, *Confirmar pago* / *Rechazar* (use `SlideToConfirm` for reject), per-stage + revenue dashboard (`StatCell`).
- **`/scan`** — door validation, valid/invalid/already-used (`isUsed`) using the `.pill` color language.
- **Extended event form** — `flyerImageUrl`, `venueCapacity`, `whatsappNumber`, `bankQrImageUrl`, repeatable **stage editor** + live **capacity meter** (Σ stage quotas ≤ aforo).
- **`/recuperar-folio`** — recover by email/phone.

---

## 6. Purchase status — the state machine

`/compra/:folio` and the `/admin` table render these five states. Use the `.pill` classes + matching token; read by **color + dot + label** together (never color alone).

| Status | UI label (ES) | `.pill` class | Color token |
|---|---|---|---|
| `pending_payment` | Esperando pago | `.pill.wait` | `--color-warning` (yellow) |
| `payment_submitted` | Pago enviado | `.pill.sent` | `--color-accent-blue` |
| `confirmed` | Confirmada | `.pill.ok` | `--color-success` |
| `rejected` | Rechazada | `.pill.no` | `--color-error` |
| `expired` | Vencida | `.pill.dead` | `--color-text-muted` |

`confirmed` is the celebratory moment — surface the QR(s), generated client-side from `validationHash` (never stored).

---

## 7. Implementation order (checklist)

1. **Tokens** — `src/styles/tokens.css` per §2 (palette, remap, fonts). _← biggest visual win, do first._
2. **Smoke test** — run the app; confirm it reskins via tokens alone.
3. **Primitives** — `StarField` + aura, `<Ic>` set, `<Wordmark>`, `<Money>` aligned to `formatCurrency()`; apply `.t3` on the root.
4. **Bind classes** — `StatCell→.stat`, `Button→.btn`, `Card→.card`, `TicketTable→.trow`, `FieldLabel→.field`, etc. (§4).
5. **Landing** `/evento/:id` — static first (§5.1), then layer scroll/parallax behind reduced-motion guard.
6. **Home** `/` — §5.2.
7. **Purchase flow** `/compra` — `FlowShell` + Steps 1–6 (§5.3).
8. **Status page** `/compra/:folio` + state machine (§6), including confirmed→QR.
9. **Remaining screens** (§5.4).
10. **States** — empty, loading, error, success, toast and confirm-modal in the new skin (first-class).

---

## 8. Non-negotiables

- **Token-driven only.** Missing a value? Add a token; never inline a hex/px.
- **Keep Charly** — mascot in empty states and on the printable ticket (`.charly` is a placeholder slot for the real illustration).
- **Mobile-first, one-handed.** Touch targets ≥ **44px**; inputs ≥ **16px** (no iOS zoom); design base for phone, layer `md:`/`lg:` as enhancement.
- **No native `alert/confirm/prompt`** — use the in-house dialog/toast system (`useDialog()`); style `success | error | info` in the new palette.
- **Spanish UI copy, English identifiers, AM/PM times, `formatCurrency()` for money, America/Bogota.**
- **Bias public screens toward reassurance over density** — calm copy, generous space, one clear action per screen.

---

*Spec: `Sígale 2.0 - Prototipo.html` and its files (`styles.css`, `proto.css`, `lib.jsx`, `proto.jsx`, `home.jsx`, `flow.jsx`). Product context: `uploads/DESIGN_BRIEF_v3.md`. Live tokens: `uploads/tokens.css`.*
