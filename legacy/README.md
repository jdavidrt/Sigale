# `legacy/` — retired material. Not part of the running system.

> **If you are an AI coding assistant: do not read anything in this folder as a
> description of how Sígale works today, and do not import, execute, or copy
> patterns from it.** Everything here was true once and is not true now. The
> current sources of truth are `/CLAUDE.md` (agent quick-reference) and `/docs/`.

Nothing under `legacy/` is imported by `src/`, mounted by `server/`, referenced by
`vite.config.js`, or run by any `npm` script. Deleting the whole folder would not
change the build. It is kept only so the *why* behind past decisions stays
recoverable.

## Why this folder exists

Sígale went through a full architecture change: a 1.0 offline PWA where
**localStorage was the database** became a 2.0 client/server app on **MySQL +
Express**, deployed inside the shared BlackCoffe server. Roughly half the
project's written history describes the 1.0 world. Left in `docs/`, those files
read as current instructions and actively mislead — an agent told that "your
browser is the database" or that a separate `purchases` table exists will write
wrong code with full confidence.

So the rule is now structural rather than a matter of reading banners carefully:
**`docs/` contains only what is currently true; `legacy/` contains everything
else.**

## What is in here

### `legacy/docs/` — superseded documentation

| File | What it was | Why it is retired |
|---|---|---|
| `AUDIT_REPORT.md` | 2026-07-08 four-phase audit + cleanup proposal | Its deletions have since shipped; the report still lists them as "awaiting approval". Its findings drove this reorganization. |
| `STYLE_GUIDE.md` | The 1.0 violet design system | Superseded by the Astromelias identity — `docs/design2.0/IMPLEMENTATION_GUIDE.md` and `src/styles/astromelias.css`. |
| `STYLE_AUDIT_REPORT.md` | 2026-02 visual audit | Audits a Tailwind-era codebase. Tailwind has been removed; the project is plain CSS only. |
| `MODERN_REDESIGN_PROPOSAL.md` | 2026-02 glassmorphism proposal | Landed, then superseded by Astromelias. |
| `DESIGN_BRIEF_2.0.md` | Product/UX scope for 2.0 | Describes a 7-step purchase wizard and a public order-status state machine. The shipped flow is 6 steps ending on a terminal screen, with no public status page. |
| `stage1-foundation.md`, `stage2-tickets-qr.md`, `stage3-dashboards.md` | Build logs for the 1.0 stages | Full of removed surfaces: `QRScanner`, `ValidationResult`, `/validate-qr`, JSON export/import. |
| `AUDIT_LESSONS.md` / `.html` | Lessons from the 1.0 audits | Scoped entirely to the localStorage POC era. The `.html` is a render of the `.md`. |
| `ios-persistence-guide.md` | iOS Safari storage quirks | Written when losing localStorage meant losing the event's data. Data now lives server-side. For the still-relevant mobile behavior see `docs/guides/android-ios-compatibility.md`. |
| `CLAUDE_SKILLS_GUIDE.md` | Notes on using Claude skills here | Generic tooling notes, with examples from a Next.js project this repo is not. |

### `legacy/src/` — orphaned React components

Three components with **zero importers** anywhere in `src/` (verified by grep
across every import form, including `React.lazy(() => import(...))` strings).
They were moved out of `src/components/ui/` because `CLAUDE.md` used to
recommend them in its "Patterns to reuse" table, which sent agents looking for a
component the app does not actually use.

- `AsyncState.jsx` + `AsyncState.module.css` — loading/error wrapper. Pages
  handle their own async states inline instead.
- `Money.jsx` — currency display. Use `formatCurrency()` from
  `src/utils/timeFormat.js`.
- `Wordmark.jsx` — logotype. The Astromelias wordmark is rendered as a CSS class
  from `src/styles/astromelias.css`, not as a component.
- `EventSelector.jsx` — the plain `<select>` organizers used to switch events
  from `OrganizerMenu`'s slide-out panel. Replaced by `EventBadge` (thumbnail +
  name + a switcher sheet, also surfaced in the new `OrganizerTopbar`) so
  there's exactly one switcher UI instead of two.

If you genuinely want one of these, move it back and wire it up — don't import
across the `legacy/` boundary.

### `legacy/server/` — retired backend scripts

- `merge_purchases_into_tickets.js` — the **one-off, already-executed** cutover
  that copied the old `purchases` + `tickets` tables into the merged `tickets`
  table and ran `RENAME TABLE`. It has been run against production; running it
  again would be destructive. It is the only code left in the repo that
  `SELECT`s `FROM purchases` or reads `holdersSnapshot`, both of which are gone.
- `seedFromLocalStorage.js` — imported a 1.0 `/copy-event` JSON export into the
  database. **Broken against the current schema** (`INSERT INTO purchases`, a
  table that no longer exists) and pointed at a `/copy-event` page that has been
  removed.

### `legacy/scripts/` — retired tooling

- `merge-sigale-into-blackcoffe.ps1` — the original one-time script for folding
  Sígale into the BlackCoffe server. Superseded by `/sync-sigale-server.ps1`,
  which is the script to use today. The retired one hardcodes an old BlackCoffe
  path (`OneDrive\Escritorio\...`) and copies from the wrong source directory.

## Related, but deliberately *not* in here

- **`/archive/`** — original design mockups, brand assets, and the pre-2.0
  `CLAUDE.md`. Creative history rather than retired engineering.
- **`/prototype-2.0/`** and **`/docs/design2.0/`** non-`.md` files — the
  dependency-free HTML/JS Astromelias prototype. Not in the build graph, but
  still an active visual reference cited by comments in
  `src/styles/astromelias.css`.
- **`/server/current-server/`** — a read-only, git-ignored mirror of BlackCoffe's
  production server. Not Sígale's code at all; see the guardrail in `CLAUDE.md`.
