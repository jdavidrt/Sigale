# Sígale documentation index

Project root holds the entry points:
- `/CLAUDE.md` — agent quick-reference (read first when modifying code)
- `/README.md` — user-facing project introduction

This `docs/` tree holds the depth.

## Sígale 2.0 — migration in progress

Sígale is moving from an offline localStorage PWA to public ticket sales over MySQL + Express, with a new visual identity. These are the authoritative 2.0 documents:

| File | Read when… |
|------|------------|
| `SIGALE_2.0_IMPLEMENTATION_PLAN.md` | **Start here** — the master plan unifying backend, product, and visual work |
| `architecture/ADR-0001-migracion-sql-express.md` | Backend decision: MySQL schema, transactions, routes, security |
| `design/DESIGN_BRIEF_2.0.md` | Product/UX scope: audiences, 7-step purchase flow, status state machine |
| `design2.0/IMPLEMENTATION_GUIDE.md` | The **Astromelias** visual identity (supersedes the 1.0 `design/STYLE_GUIDE.md`) |

## Sígale 1.0 — shipped reference

| Folder / file | Read when… |
|---------------|------------|
| `architecture/PROJECT_OVERVIEW.md` | You need the deep technical reference: data model, providers, components, hooks, utils, recent additions |
| `design/STYLE_GUIDE.md` | Picking colors / spacing / typography / glass treatments (1.0 violet identity; superseded for 2.0 by `design2.0/IMPLEMENTATION_GUIDE.md`) |
| `design/STYLE_AUDIT_REPORT.md` | Historical pre-redesign visual audit |
| `design/MODERN_REDESIGN_PROPOSAL.md` | Historical redesign proposal that landed |
| `features/CSV_FEATURE_GUIDE.md` | CSV import/export behavior, column shapes, dedup rules |
| `guides/css-architecture-guide.md` | CSS Modules conventions, token layering, naming |
| `guides/ios-persistence-guide.md` | iOS Safari storage quirks (private mode, suspension, quota) |
| `guides/MOBILE_TESTING.md` | Manual device test checklist |
| `guides/android-ios-compatibility.md` | Cross-platform behavior notes |
| `guides/AUDIT_LESSONS.md` | Lessons from past audits (race conditions, hash strength, etc.) |
| `guides/CLAUDE_SKILLS_GUIDE.md` | Working with Claude skills inside this project |
| `implementation/stage1-foundation.md` | Historical: how the foundation shipped |
| `implementation/stage2-tickets-qr.md` | Historical: how tickets + QR shipped |
| `implementation/stage3-dashboards.md` | Historical: how dashboards + export shipped |

`/archive` holds older mockups and superseded docs (see `/archive/README.md`). The `implementation/stage*` files are kept for context — current status lives in `architecture/PROJECT_OVERVIEW.md`, not in those files.
