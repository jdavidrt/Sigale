# Sígale 2.0 — Astromelias (raw HTML/CSS/JS)

A dependency-free port of the Astromelias visual identity from `docs/design2.0/`.
No React, no Babel, no build step — three files render the whole experience: the
public landing, the organizer home, the 7-step purchase flow, and the five-state
purchase status machine.

It is a faithful rebuild of the mockup (`docs/design2.0/Sígale 2.0 - Prototipo.html`
and its `styles.css` / `proto.css` / `*.jsx`), following `IMPLEMENTATION_GUIDE.md`.
The desktop "phone frame" and left nav panel were intentionally dropped (the guide
says: port the screen, not the chrome); the layout is mobile-first and fills the
viewport, centered in a phone-width column on wider screens.

## Run it

Any static context works — there is nothing to compile.

- VS Code: right-click `index.html` -> **Open with Live Server**.
- Or serve the repo root: `npx serve .` then open `/prototype-2.0/`.
- Or just double-click `index.html` (opens via `file://`).

## The flyer

To make the folder self-contained, copy the real flyer into `assets/` once
(PowerShell):

```powershell
Copy-Item "C:\dev\Sígale\docs\design2.0\1-FLYER.png" "C:\dev\Sígale\prototype-2.0\assets\flyer.png"
```

If `assets/flyer.png` is missing, the landing falls back to the source flyer in
`docs/design2.0/`, and if neither resolves it draws a generated SVG poster — so the
page always looks intentional.

## Screens (hash routes)

| Route | Screen |
|-------|--------|
| `#/` | Public landing — flyer hero + parallax, active stage, line-up |
| `#/home` | Organizer home — event header, sales stats, ticket types |
| `#/compra/1` … `#/compra/6` | Purchase flow: Selección, Confirmar, Datos, Pago, WhatsApp, Verificando |
| `#/estado/:folio/:state` | Purchase status state machine (see below) |

A small floating button (bottom-left) opens a screen launcher to jump between all
screens — it replaces the prototype's nav panel and is a review aid only.

## Status state machine

`#/estado/:folio/:state` renders the five states by **color + dot + label** together
(never color alone), per `IMPLEMENTATION_GUIDE.md` §6:

| State | Label (ES) | Pill |
|-------|------------|------|
| `pending_payment` | Esperando pago | `.pill.wait` (yellow) |
| `payment_submitted` | Pago enviado | `.pill.sent` (blue) |
| `confirmed` | Confirmada | `.pill.ok` (green) — reveals the QR(s) |
| `rejected` | Rechazada | `.pill.no` (red) |
| `expired` | Vencida | `.pill.dead` (muted) |

On `confirmed`, each ticket shows a deterministic faux QR (drawn as inline SVG from a
folio-derived seed). In production this is replaced by the real QR generated from the
ticket's `validationHash`.

## Files

| File | Role |
|------|------|
| `index.html` | Entry point — fonts + `#app` root |
| `styles.css` | Astromelias skin (ported verbatim) + mobile-first shell + landing/parallax + status/launcher |
| `app.js` | Icons, seeded starfield, wordmark/money helpers, all screens, hash router, parallax, countdown, faux QR |

## Conventions honored

- Spanish UI copy, English identifiers and comments.
- Times in AM/PM; currency via es-CO grouping (`$30.000`).
- Touch targets ≥ 44px; inputs ≥ 16px (no iOS zoom).
- All motion (parallax, twinkle, spinner) gated behind `prefers-reduced-motion`.
- Charly is kept (mascot slot in the reserved-cupo step).

## Out of scope

This is the **visual** layer only. It carries no backend: no MySQL/Express, no real
inventory, no auth. The `/admin`, `/scan`, extended event form and `/recuperar-folio`
screens listed in `IMPLEMENTATION_GUIDE.md` §5.4 were explicitly "to design next" and
are not in the mockup, so they are not built here.
