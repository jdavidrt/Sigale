# Lessons from the Sígale Audit

A personal-growth reference distilled from ~25 distinct findings across two audit passes
of the Sígale codebase (React 19 + Vite + localStorage POC). Organised by the **design
lesson each finding teaches**, not by severity — if you need a line-by-line history,
the original audit and re-audit reports cover that.

The audit produced 5 Critical, 8 High, 9 Medium, and 6 Low items, plus 4 newly
introduced findings during remediation. All are resolved except H4 (list virtualisation)
and N6 (bundle split), both deferred with explicit thresholds at which they stop being
acceptable.

---

## Contents

1. [State persistence: localStorage is a database without the safety nets](#1-state-persistence)
2. [Identity & uniqueness: do the math before you pick a length](#2-identity)
3. [Names are part of the contract](#3-names)
4. [Inputs deserve four things at every boundary](#4-inputs)
5. [React re-render economics in a context-heavy app](#5-react-rerender)
6. [The real world doesn't show up in test fixtures](#6-real-world)
7. [Security theater is worse than no security](#7-security-theater)
8. [SVG/HTML injection: escape at the boundary, every time](#8-injection)
9. [i18n discipline: route strings at the first display site](#9-i18n)
10. [Dead code, hidden mismatches, and the cost of "I'll come back to this"](#10-dead-code)
11. [Cross-cutting: designing for a future SQL migration](#cross-cutting-sql)
12. [Cross-cutting: POC mindset vs. production paranoia](#cross-cutting-poc)
13. [Self-review checklist](#checklist)

---

<a id="1-state-persistence"></a>
## 1. State persistence: localStorage is a database without the safety nets

`localStorage` looks like a key/value bag — but the moment two tabs or two writes race
for the same key, you discover it has none of the durability guarantees you took for
granted.

**What we found:**

- **Cross-tab race on check-in (C1).** Two scanners both read the array, both wrote a
  "checked-in" flag, the second write silently wiped the first. Fix: re-read fresh
  storage inside `checkInTicket`, reject if the row is already checked in.
- **Stale read on CSV import (C4).** Every other mutator did `loadFromStorage() ?? data`
  first; `addTicketsFromCSV` spread the in-memory `data.tickets` directly. A tab that
  imported while another tab edited would clobber the edit.
- **Silent quota errors (C5).** `saveToStorage` caught `QuotaExceededError`, returned
  `false`, and no caller cared. At the door, "check-in" appeared to succeed but never
  persisted — the next reload re-admitted the same person.
- **Single storage key (M4).** `sigale-event-data` was one giant blob. Creating Event B
  overwrote Event A. No `schemaVersion`, so no migration anchor.

**The lesson — treat storage like a tiny database, not memory:**

- Read-modify-write means *read fresh first*, then write. Never write based on a cached
  snapshot when concurrent change is possible.
- Every write returns a result. Storage failures must surface to the UI, not console.
- Plan for schema evolution from day 1: a `version` field at the root costs nothing and
  saves a future migration.
- One key per logical entity. The day you need a second event, you've already lost.

This is the cluster that pays off most directly when you migrate to SQL — every fix
above maps 1:1 to a server-side concept (transactions, returned errors, migrations,
table-per-entity).

---

<a id="2-identity"></a>
## 2. Identity & uniqueness: do the math before you pick a length

Validation hashes were 10 hex characters. Sounds plenty until you remember the
**birthday paradox**: collision probability isn't `n / 2^k`, it's roughly `n² / 2^(k+1)`.
At 40 bits of entropy and 10 000 tickets, you cross 0.5% collision odds. That's not a
maybe — that's an inevitability at the wrong event.

**What we found:**

- **Truncated hash (C2).** 40 bits → ~0.5% collision at 10k. Lengthened to 16 hex
  (64 bits) → ~10⁻⁸. One-line change, no schema migration needed.
- **`TKT-${0..999}-${Date.now()}` (L5).** Two imports issued in the same millisecond
  with the same random slot collide. Replaced with `crypto.randomUUID()` for the suffix.

**The lesson — budget your entropy.** Rough table for ~1-in-10⁹ collision odds:

| Items | Bits needed |
|------:|:-----------:|
| 1k    | ~50 |
| 10k   | ~57 |
| 100k  | ~64 |
| 1M    | ~70 |

`crypto.randomUUID()` gives you 122 bits of randomness. Free in every modern browser.
Reach for it by default and only optimise downward when you've measured a reason.

---

<a id="3-names"></a>
## 3. Names are part of the contract

`resetAllCheckIns()` deleted every ticket (C3). Not the check-in flags — the entire
ticket array. The UI prompt said "Reset all check-ins." The function did
`setData({ ...fresh, tickets: [] })`. The password gate above it could not save you
from the gap between *what the name promised* and *what the body did*.

**The lesson:** A function name is a public contract. Renaming costs five minutes; the
operator who clicks it once costs a sold-out event. When you find a name/behaviour
mismatch, the answer is never "add a confirm dialog" — fix the name *or* fix the body.

This generalises beyond functions: variable names, file names, route paths, translation
keys. The closer two things look, the more dangerous it is when they diverge.

---

<a id="4-inputs"></a>
## 4. Inputs deserve four things at every boundary

Anywhere data crosses a trust boundary — paste-from-clipboard, CSV import, JSON import,
QR scanner — you owe it four checks:

1. **Shape validation.** Is the structure what we expect? (CSV header check, JSON
   `event` key check.)
2. **Length cap.** What's the maximum any reasonable input can be? H7 enforced 100/30/30
   char caps on name/id/phone, mirrored on UI `maxLength` and CSV-import validation so
   the import path can't end-run the form.
3. **Escape for the next sink.** Where will this data end up?
   - CSV → Excel formula injection (`=HYPERLINK(...)` opens links when the operator
     opens the file). H8 prefixes any cell starting with `=+-@\t\r` with a `'`.
   - SVG → `escapeXml` for every interpolation (M2).
4. **Accept what's valid.** L6 was a Latin-only regex `/[^a-zA-ZÀ-ÿ\s'-]/g` that
   mangled Cyrillic, Arabic, CJK, Hebrew names. `\p{L}\p{M}` Unicode property escapes
   accept letters from any script.

The CSV-injection bug is the standout because it crosses *two* trust boundaries in one
operation: your code writes a CSV → operator opens it in Excel → Excel executes the cell
as a formula. **You're not the only program that will read your output.** Sanitise for
the dumbest downstream consumer you can imagine.

---

<a id="5-react-rerender"></a>
## 5. React re-render economics in a context-heavy app

The most performance-relevant cluster.

- **H2 — context value not memoised.** `<Provider value={{ tickets, addTicket, ... }}>`
  creates a fresh object every render. Every `useContext` consumer re-renders even when
  nothing they read changed. Fix: `useMemo` over the value object, `useCallback` over
  every action so the function identities stay stable.
- **H3 — `getStats` called as a function each render.** Two passes over `tickets` per
  consumer per render. Lifted into
  `useMemo(() => computeStats(tickets, event), [tickets, event])` and exposed the
  *value*, not the function.
- **M9 — per-card scroll listener.** N tickets meant N scroll listeners doing parallax
  math on every wheel event. Removed; turns out the parallax wasn't missed.
- **M8 — eager route imports.** All pages imported at the top of `App.jsx`, so
  `html5-qrcode` (~100 KB gz) loaded for users who never visited the scanner. Fix:
  `lazy(() => import(...))` per route + `<Suspense>` fallback.
- **H4 — no list virtualisation, deferred.** At 10k tickets the DOM has 10k cards.
  Acceptable today; `react-window` is the answer when it stops being acceptable.

**The lesson — in React, *identity* matters as much as *value*.** A new object literal
on every render breaks `===` comparisons in every memoisation downstream. The Context
API is a re-render multiplier — what feels like "one state update" can become a
tree-wide cascade if you skip the memo.

A useful rule of thumb:

- Any object passed *down* through Context must be `useMemo`'d.
- Any function passed *down* must be `useCallback`'d.
- The dep arrays must list every captured value.

The first time you skip this it doesn't bite. The hundredth time it does, you can't
tell which skip caused it.

---

<a id="6-real-world"></a>
## 6. The real world doesn't show up in test fixtures

These are the bugs that pass every dev test and break at the actual event.

- **H5 — no event-date awareness.** Tickets validated at any time on any day. Two-night
  festivals, stale device data, post-event accidental scans, rehearsal burns — all
  undetected. Fix: a *soft* warning (`confirm()` to proceed or cancel) when the scan is
  outside `[event.date − 1d, event.date + 1d]`. **Soft, not hard** — events run late,
  VIPs arrive early, the operator is the ground truth and the software is a second
  pair of eyes.
- **M1 — QR has no eventId.** A ticket from Event A scans cleanly at Event B if the
  device hasn't been wiped. Fix: embed `eventId` (hash of name + date) in the QR JSON,
  reject mismatches at scan time.
- **M6 — UTC date in `purchaseDate`.** `new Date().toISOString().split("T")[0]`
  returns the *UTC* date. In UTC-5 near midnight, a ticket sold on Tuesday Bogotá time
  gets stamped Wednesday. Fix: `toLocalDateString()` formats local-timezone date parts.
- **M7 — service worker stale cache.** Phone shared across two events; second event
  rendered the first event's UI from cache before localStorage cleared.

**The lesson — time, identity, and cache are the three places where "works on my
machine" diverges hardest from production.** Whenever you see a date being formatted,
ask: *what timezone?*. Whenever you see two devices doing the same thing, ask: *can
they disagree?*. Whenever you see a service worker, ask: *what happens after I deploy
a new version?*.

The H5 fix is also a UX lesson worth its own line: at a live event, **never hard-block
the operator**. They are the ground truth. Make the software whisper, not scream.

---

<a id="7-security-theater"></a>
## 7. Security theater is worse than no security

H1 was a hardcoded password in the client bundle: `if (password !== "980827")`. Anyone
with DevTools could read it. Anyone could bypass it with `setData(...)` from the console.
The check provided no actual access control — just enough friction to make the developer
feel safe.

**This is worse than no password,** because it implies a security guarantee the system
can't keep. If an operator in good faith trusts the password to mean something, you've
given them false confidence.

Fix: removed the password, replaced with a two-step "type DELETE to confirm". The
confirmation is honest about what it is — friction against fat-fingering, not auth.

**The lesson:** be ruthless about what your security model can actually enforce.

- If the secret ships in the JS bundle, it isn't secret.
- If the check can be bypassed by editing localStorage in DevTools, it isn't a check.
- Replace fake security with **honest friction**.

When you migrate to SQL with a real backend, this is the moment auth actually becomes
possible. Until then, "two-step confirm" is the most security you can honestly provide.

---

<a id="8-injection"></a>
## 8. SVG/HTML injection: escape at the boundary, every time

- **M2.** Most interpolations into `svgTicketTemplate.js` used `escapeXml(...)`, but
  `ticketId` was inserted raw. Today `ticketId` is deterministic (`TKT-…`) so the risk
  was latent — but a future refactor or a crafted JSON import could break the
  invariant. Fix: `escapeXml(ticketId)` for defense in depth.
- **M3.** `dangerouslySetInnerHTML` for the SVG ticket preview. The render is only safe
  if every upstream string was escaped before it reached the template — a contract
  enforced by humans, not the compiler. Sanitised output with DOMPurify before
  injecting.

**The lesson — escape at the *boundary* (the place data becomes markup), not at the
source (the place data enters the system).** Source-side escaping is fragile because
new code paths bypass it. Boundary-side escaping is structural — every string crossing
into the template gets the same treatment by construction.

`dangerouslySetInnerHTML` is a code smell. Sometimes necessary, never casual. Treat it
as a `// CONTRACT:` comment that every input upstream is sanitised, and re-verify that
contract whenever the upstream code changes.

---

<a id="9-i18n"></a>
## 9. i18n discipline: route strings at the first display site

Of the 25+ findings, six were "hardcoded English string in a Spanish app" (L2, N1, N2,
N3, the QRScanner pass, the ValidationResult pass). They re-emerge because each
developer types literal text inline when they're solving the *real* problem in front of
them.

**The lesson:** the moment a string is rendered, it should already be `t()`'d. The
translation keys live in one file (`translations.js`), so the cost of doing it right is
*one extra import + one new key*. The cost of doing it wrong is a follow-up audit pass
three months later.

Set the rule: **no English string literal in JSX**. ESLint can enforce this with a
custom regex rule if you want a hard wall. Until then, treat any literal string in a
component as a code review red flag.

Edge case: short universal labels (`"ID"`, `"USD"`, units). Debatable — but in this
repo I routed even those through `t()` (e.g. `detailId`, `detailPrice`) so the ES/EN
switch is uniform across the UI and there's never a half-translated screen.

---

<a id="10-dead-code"></a>
## 10. Dead code, hidden mismatches, and the cost of "I'll come back to this"

- **L1.** Unused imports, unused vars. ESLint was set to `warn`. Bumped to `error`,
  fixed the offenders.
- **L3.** Catch-all `<Route path="*" />` not documented in CLAUDE.md.
- **L4.** Two CSV shapes — 5-column (round-trip) and 6-column (human-with-price) —
  collided under the same function name. Round-trip was broken. Fix: split into
  `ticketsToRoundTripCSV` and `ticketsToHumanCSV`, kept `ticketsToCSV` as an alias for
  back-compat with existing callers and tests.
- **N4.** `extractMimeType`, `purgeNavigationCache` — exported, never imported. Dead.

**The lesson:** friction-free dev environments accumulate dead code at compound
interest.

- Lint at `error`, not `warn`. The line between "noise to ignore" and "must-fix" is
  what keeps codebases honest.
- When two artifacts share a name, they share a fate — split early, alias only when
  there's a back-compat story.
- Document every code path. If it's not in CLAUDE.md (or your equivalent), it might as
  well not exist for the next developer (which might be future you in three months).

---

<a id="cross-cutting-sql"></a>
## Cross-cutting: designing for a future SQL migration

Throughout the remediation we kept asking: *if this code has to move to a server next
quarter, does the shape help or hurt?* Three patterns helped:

1. **Pure-function business logic.**
   - `checkInWindowStatus(event, now, windowDays)` (timeFormat.js)
   - `computeStats(tickets, event)` (TicketContext.jsx)
   - `csvToTickets(string)` and `ticketsToRoundTripCSV(tickets)` (csvUtils.js)
   - `generateValidationHash(ticket)` (hashGenerator.js)

   All take primitives + records, return values, no React, no storage. Each lifts to a
   server endpoint or stored procedure verbatim.

2. **Schema-version anchor.** M4 introduced a `schemaVersion` field at the storage root.
   When you migrate to SQL, that's where the migration script branches. Without it,
   you're guessing about which version of the data shape lives on each device.

3. **Foreign-key thinking, even without an FK.** M1's `eventId` in the QR is a foreign
   key in everything but name. That's exactly what survives the migration — IDs that
   already point at the right thing don't need rewriting.

The opposite pattern — *write to localStorage from inside a React `useEffect`, read
from `useState` in three places, derive a sum in JSX* — is what makes migrations hard.
**Pure functions don't care where state lives. UI-coupled logic does.**

---

<a id="cross-cutting-poc"></a>
## Cross-cutting: POC mindset vs. production paranoia

Every audit finding had a "this is a POC for ≤2 users" qualifier. That qualifier is
*not* an excuse — it's a **budget**.

**In scope for a POC:**

- Correctness — you can't ship wrong data.
- Boundary safety — CSV injection, XSS, length caps.
- Name honesty — don't lie to the operator.
- Basic re-render hygiene — don't ship a phone-freezer.

**Out of scope for a POC (deferred with thresholds, not forgotten):**

- Virtualisation for 10k+ rows (revisit when single events regularly exceed 5k).
- Multi-event storage isolation per device.
- Bundle-split optimisation for cold-load on 4G (revisit if real-world TTI hurts).
- Bulletproof cross-tab consensus beyond 2 simultaneous operators.

**The trick is being explicit about which is which.** H4 (virtualisation) is *deferred*,
not *forgotten* — there's a written threshold at which it stops being acceptable.
Without that threshold, the deferred item turns into the production incident.

When you write deferral notes in code, write the *condition*, not the *intent*:
- Bad: `// TODO: virtualise this later`
- Good: `// H4: virtualise when ticket count > 5k. Currently acceptable per POC scope.`

---

<a id="checklist"></a>
## Self-review checklist

When you write new code in this codebase (or your next one), scan this list as a
habit:

- [ ] Did I read storage fresh before I write?
- [ ] Did I memoise the context value and `useCallback` the actions?
- [ ] Did I cap the input length and escape for the next sink?
- [ ] Is my function name the same shape as my function body?
- [ ] Did the string go through `t()`?
- [ ] If this had to run on a server tomorrow, would it?
- [ ] Have I budgeted the entropy of my IDs against birthday-paradox math?
- [ ] If this is a deferral, did I write the *condition* under which it stops being
      acceptable?
- [ ] If the code touches dates, is it timezone-aware?
- [ ] If the code touches `dangerouslySetInnerHTML`, is the upstream contract still
      true?

Good code isn't memorised — it's the **questions you ask out of habit**. These are
mine after this audit. Yours will grow as your codebases hit different walls.

---

## Further reading

If any of the lessons above hit a nerve, these are the most useful primary sources to
go deeper:

- **Birthday paradox / entropy budgeting** — search "Birthday attack" on Wikipedia;
  the table there matches the math I used in §2.
- **OWASP CSV Injection** — `https://owasp.org/www-community/attacks/CSV_Injection`,
  the source of H8's `'` prefix mitigation.
- **React Context performance** — Kent C. Dodds, "How to optimize your context value",
  covers the `useMemo` + `useCallback` discipline in §5.
- **`crypto.randomUUID()`** — MDN; covers C2/L5 directly.
- **Service worker lifecycle** — MDN's "Using Service Workers" guide; relevant to
  M7 and the cache-invalidation question in §6.
- **Unicode property escapes (`\p{L}\p{M}`)** — MDN's Regular Expressions reference;
  fixes L6's name regex.
