# Sígale documentation index

Everything in this folder describes **Sígale as it works today** (2.0: React +
Vite frontend, Express + MySQL backend, in production inside the shared
BlackCoffe server).

Documentation that describes an earlier architecture has been moved out to
[`/legacy/docs/`](../legacy/README.md) so nothing here can be mistaken for
current behavior. If a doc you remember is missing, look there.

Project root holds the entry points:

- [`/CLAUDE.md`](../CLAUDE.md) — agent quick-reference; **read first** when modifying code
- [`/README.md`](../README.md) — user-facing project introduction
- [`/legacy/README.md`](../legacy/README.md) — retired docs and dead code, history only

## Architecture

| File | Read when… |
|------|------------|
| `architecture/PROJECT_OVERVIEW.md` | You need the deep technical reference: providers, components, hooks, utils, request flows |
| `architecture/TICKETS_SCHEMA.md` | You are touching the `tickets` table — column-by-column reference for the merged order/seat schema |
| `architecture/ADR-0001-migracion-sql-express.md` | You want the *reasoning* behind moving from localStorage to MySQL + Express (Spanish). The decision stands; some implementation details in it were superseded — see its header |

## Backend, deploy, and operations

| File | Read when… |
|------|------------|
| `../server/README.md` | Backend layout, migrations, scheduled jobs, security floor |
| `SIGALE_MERGE_INTO_SHARED_SERVER.md` | Deploying — how Sígale mounts inside the BlackCoffe server, env vars, sync workflow |
| `SIGALE_2.0_IMPLEMENTATION_PLAN.md` | You need the DB-isolation guardrail (§3.1, cited from `server/db.js` and the migration runner) or the original 2.0 build plan. The build has shipped; treat the plan as background |
| `LOCAL_TESTING.md` | Running the full stack locally against a local database |

## Design

| File | Read when… |
|------|------------|
| `design2.0/IMPLEMENTATION_GUIDE.md` | **The current visual identity** — Astromelias tokens, component classes, layout rules |
| `guides/css-architecture-guide.md` | CSS Modules conventions, token layering, naming |

The non-`.md` files in `design2.0/` (`proto.jsx`, `proto.css`, the prototype
HTML) are the original Astromelias prototype sources, cited by comments in
`src/styles/astromelias.css`. They are reference, not build inputs.

## Features and platform

| File | Read when… |
|------|------------|
| `features/CSV_FEATURE_GUIDE.md` | CSV import/export on `/tickets` — column shapes, dedup rules |
| `guides/android-ios-compatibility.md` | Cross-platform behavior notes (tab suspension, camera, share sheet) |
| `guides/MOBILE_TESTING.md` | Manual device test checklist before a release |

## Related folders

- [`/archive/`](../archive/README.md) — original mockups, brand assets, and the pre-2.0 `CLAUDE.md`
- [`/prototype-2.0/`](../prototype-2.0/README.md) — dependency-free HTML/CSS/JS port of the Astromelias prototype
