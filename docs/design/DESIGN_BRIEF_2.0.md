# Sígale — Design Brief Sígale 2.0 (for a UI/UX rework)

> Hand-off document for Claude Design. It synthesizes the **current state** of the app with the **2.0 architecture** (public sales over MySQL + Express, see `docs/architecture/ADR-0001-migracion-sql-express.md`). Goal: redesign the surface so it can sell tickets to the public, not just manage them privately.
>
> UI copy is **Spanish**. Code/identifiers **English**. Times shown **AM/PM**. Currency via `formatCurrency()` → `"$50,000"`. Timezone America/Bogota.

---

## 1. What Sígale is (one paragraph)

A mobile-first ticketing PWA. Until now it lived as a private tool: a single organizer managed tickets on their own phone, backed by `localStorage`. 2.0 turns it outward — buyers arrive from a shared link, pick a stage, reserve a spot, pay by bank transfer + WhatsApp screenshot, and wait for the Organizer to confirm. The redesign must serve **two audiences on the same skin**: the public buyer (one-handed, anxious, on mobile data) and the Organizer (verifying payments, scanning at the door).

Brand character: **dark, nocturnal, event-night energy** with a violet/indigo palette and a warm cream text. There is a mascot, **Charly** (`assets/charlyIllustration.js`, base64), used as a friendly presence in empty states and on the printable ticket. Keep him.

---

## 2. Design system already in place (reuse, don't reinvent)

Every visual value lives in `src/styles/tokens.css` (single source of truth — no raw hex/px elsewhere). The rework must stay token-driven. Don´t use Tailwind v4, only use plain CSS with these custom properties.

> **Palette note (2.0).** The color and type *values* in the tables below are the **1.0** identity. Sígale 2.0 adopts the **Astromelias** skin in `docs/design2.0/IMPLEMENTATION_GUIDE.md`, which keeps these token *names* but remaps their values (plum / daffodil / red-orange, Barlow Semi Condensed + DM Serif Display). Treat the Implementation Guide as authoritative for color and type.

**Color — core palette**

| Token                                     | Value                 | Role                                                          |
| ----------------------------------------- | --------------------- | ------------------------------------------------------------- |
| `--color-bg-start` / `--color-bg-end`     | `#27187E` → `#030312` | Page background (vertical gradient, deep indigo → near-black) |
| `--color-card-start` / `--color-card-end` | `#1a1152` → `#0a0620` | Card surfaces                                                 |
| `--color-primary`                         | `#758BFD`             | Primary accent (periwinkle)                                   |
| `--color-secondary`                       | `#BEADFF`             | Secondary accent (lavender)                                   |
| `--color-accent-orange`                   | `#FF8C00`             | High-attention CTA / highlight                                |
| `--color-text-primary`                    | `#FFEDD8`             | Body text (warm cream)                                        |
| `--color-text-heading`                    | `#E2D1B9`             | Headings                                                      |
| `--color-text-secondary`                  | `#BEADFF`             | Secondary text                                                |
| `--color-success`                         | `#4ade80`             | Confirmed / valid                                             |
| `--color-error` / `--color-danger`        | `#ef4444` / `#dc2626` | Rejected / invalid                                            |
| `--color-warning`                         | `#f59e0b`             | Pending / waiting                                             |

Glass fills (`--color-glass-*`) + backdrop blur (`--blur-md: 20px`) give the frosted, layered look. Gradients exist for primary, success, danger, progress.

**Type** — `--font-base: 'D-DIN Condensed'`. Scale runs `--text-xs: 10px` … `--text-body: 16px` (the iOS zoom-safe floor for inputs) … `--text-5xl: 56px`. Weights 400–700.

**Shape & depth** — radii `--radius-sm: 8px` … `--radius-4xl: 24px`, `--radius-full`. Shadows `--shadow-soft/elevated/floating` plus tinted button glows.

**Motion** — easings `--ease-standard` (`cubic-bezier(0.4,0,0.2,1)`), durations `--duration-fast: 150ms` … `--duration-slower: 300ms`.

**Non-negotiable mobile rules**

- Touch targets ≥ **44×44px** (`--touch-min`).
- Inputs render at **16px** minimum (prevents iOS zoom-on-focus).
- Mobile-first: design base for phone, layer `md:` / `lg:` only as enhancement.
- No native `alert/confirm/prompt` — the app uses an in-house dialog/toast system (`useDialog()`); design states for confirm modals and toasts (`success | error | info`).

---

## 3. Current screens (today's surface)

Organizer-only, single-device. Routes and what each does:

| Route                          | Screen         | Purpose                                                    |
| ------------------------------ | -------------- | ---------------------------------------------------------- |
| `/`                            | Home           | Event header + quick stats; big "sell" button              |
| `/create-event`, `/edit-event` | CreateEvent    | Event form (name, date, venue, ticket types→price map)     |
| `/sell-tickets`                | TicketForm     | Manually register a ticket                                 |
| `/tickets`                     | TicketsPage    | Cards/Table toggle, search, type filter, CSV import/export |
| `/validate-qr`                 | ValidateQRPage | Camera scanner + scan log                                  |
| `/copy-event`                  | CopyEventPage  | JSON/CSV/PDF export, JSON import                           |
| `/dashboard`                   | DashboardPage  | Sales + check-in dashboards                                |

Reusable building blocks already designed (extend their visual language, don't redraw from zero): `StatCell`, `EmptyStateCard`, `FieldLabel`, `Modal`, `Toast`, `Button`, `SlideToConfirm` (drag-to-confirm destructive action), `QRDisplay`, `TicketCard`, `TicketTable`, `Navbar`, `Layout`.

---

## 4. What changes in 2.0 (the redesign scope)

2.0 splits the world into **public** and **Organizer**. The data model grows from "a flat list of tickets" to **events → stages (with inventory) → purchases → tickets**. Money and inventory now live server-side; the QR is still generated client-side from a `validationHash` and never stored.
Also, the page is meanto to handle just one event at the time. Focus on that since handling multiple events at the same time is comples, we will just use it for one event and the configure the next one.

### 4.1 New & changed routes

| Route                          | Audience          | Status                   | Design need                                                          |
| ------------------------------ | ----------------- | ------------------------ | -------------------------------------------------------------------- |
| `/` or `/evento/:id`           | Public            | **New public face**      | Flyer, date/venue, active stage, buy CTA                             |
| `/compra/:orderId`             | Public            | **New**                  | Purchase status; QR(s) once confirmed                                |
| `/admin`                       | Organizer (login) | **New/auth**             | Purchases table, payment verification, dashboard                     |
| `/scan`                        | Organizer         | Rework of `/validate-qr` | Door validation + scan log                                           |
| `/create-event`, `/edit-event` | Organizer         | **Extend form**          | + flyer URL, capacity, WhatsApp, bank QR, per-stage quota & schedule |

### 4.2 The public purchase flow (the heart of the redesign)

Strictly mobile-first, one-handed. Seven steps — design each as a calm, legible state with a clear single primary action:

1. **Selección** — Show only the `active` stage. Pick type and quantity; display remaining spots (`cupos restantes`). If a future stage exists, show it as **"próximamente"**.
2. **Confirmar compra** — Availability is reserved server-side; a 3-digit `folio` is generated. Design the transition into a "reserved" state.
3. **Datos de boletas** — One holder per ticket (name + id), plus **delivery method** (`email` | `whatsapp`) and contact.
4. **Realiza el pago** — The tense screen: **total amount**, **bank QR image**, the **folio**, and a gentle line: **"Tienes 20 minutos para completar tu compra"** with a _soft_ countdown (reassuring, not a stress bomb). Prompt to save the transaction screenshot.
5. **Enviar por WhatsApp** — Button opening `wa.me/<número>?text=...` prefilled: **"¡Hola! Envío pantallazo de compra #123"** (123 = folio).
6. **Confirmar envío** — Button **"Ya realicé el pago"** → moves purchase to `payment_submitted` (distinguishes a real payer from an abandoned cart).
7. **Espera** — On `/compra/:orderId`, buyer watches status and, once confirmed, sees their QR(s).

Design the **countdown** with care: warm, low-anxiety. The brand's `--color-warning` for the timer, never alarming red unless truly expired.

### 4.3 Purchase status — the visual state machine

`/compra/:orderId` and the Organizer table both render these states. Each needs a distinct, instantly-readable visual treatment (color + icon + label):

| Status              | UI label (ES)  | Tone            | Color token           |
| ------------------- | -------------- | --------------- | --------------------- |
| `pending_payment`   | Esperando pago | neutral/waiting | `--color-warning`     |
| `payment_submitted` | Pago enviado   | in-progress     | `--color-accent-blue` |
| `confirmed`         | Confirmada     | success         | `--color-success`     |
| `rejected`          | Rechazada      | error           | `--color-error`       |
| `expired`           | Vencida        | muted/dead      | `--color-text-muted`  |

### 4.4 Organizer panel (`/admin`)

Daily gesture: a WhatsApp arrives, the Organizer searches a folio, verifies the screenshot, confirms. Design for that loop.

- **Purchases table**: folio, event, stage, quantity, amount, delivery method, status, date (AM/PM). Reuse the `TicketTable` visual language.
- **Folio search box** — prominent, the primary daily action.
- **Status filters**: pendiente / pago enviado / confirmada / rechazada / vencida.
- **Row actions**: _Confirmar pago_ (reserved→sold) and _Rechazar_ (frees the spot). Use `SlideToConfirm` for the destructive _Rechazar_. Never allow confirming an already-released purchase — design the disabled/blocked state.
- **Dashboard**: tickets sold and spots remaining **per stage**, plus **confirmed vs. pending revenue**. Reuse `StatCell` and the existing dashboard visual system.
- **Registro directo** (walk-in): let the Organizer register a sale without the WhatsApp flow.

### 4.5 Event creation — extended form

Add to the existing CreateEvent form: `flyerImageUrl`, `venueCapacity` (aforo), `whatsappNumber`, `bankQrImageUrl`, and a **repeatable stage editor** — each stage has name, price, quota (`totalQuantity`), order, and optional auto-activation time (`activatesAt`). Show a live **capacity meter**: the sum of stage quotas must not exceed `venueCapacity` (validate visually, warn before submit).

---

## 5. Concrete design asks (deliverables)

1. A **public landing/buy page** (`/evento/:id`) — flyer-forward, the active stage and its remaining spots, one unmistakable buy CTA. This is the first impression for someone arriving cold from a link.
2. The **7-step purchase flow** as a coherent mobile sequence (stepper or full-screen steps), with the payment screen and soft countdown as the emotional center.
3. The **`/compra/:orderId` status page** rendering the 5-state machine, including the celebratory "confirmed → here are your QRs" moment.
4. The **`/admin` panel**: searchable, filterable purchases table with confirm/reject actions and the per-stage + revenue dashboard.
5. The **extended event form** with the stage editor and capacity meter.
6. The **`/scan` rework**: faster door validation, clear valid/invalid/already-used results (tie to `isUsed`).

For each, deliver the mobile layout first; tablet/desktop as progressive enhancement.

---

## 6. Guardrails for the designer

- Stay inside `tokens.css`. If a value is missing, propose a new token rather than a raw literal.
- Preserve the dark, frosted, violet identity and **Charly**. The public face can feel more festive/flyer-driven than the Organizer tools, but they must read as one product.
- Empty, loading, error, and success states are first-class — design them, don't leave them to chance (the codebase already treats them seriously: `EmptyStateCard`, `StorageErrorBanner`, toasts).
- Every interactive element ≥ 44px; inputs ≥ 16px; AM/PM everywhere; currency via the shared formatter.
- The buyer is often on a flaky mobile connection and emotionally invested (they just sent money). Bias every public screen toward **reassurance and clarity** over density.

---

## 7. Source references (in-repo)

- Architecture & data model: `docs/architecture/ADR-0001-migracion-sql-express.md`
- Design tokens: `src/styles/tokens.css` (+ `global.css`, `utilities.css`)
- Agent quick-reference: `CLAUDE.md`
- Deeper overview: `docs/architecture/PROJECT_OVERVIEW.md`
- Reusable UI: `src/components/ui/` (StatCell, EmptyStateCard, FieldLabel, Modal, Toast), `src/components/Common/` (Button, SlideToConfirm)
