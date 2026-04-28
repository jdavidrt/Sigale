# Sígale documentation index

Project root holds the entry points:
- `/CLAUDE.md` — agent quick-reference (read first when modifying code)
- `/README.md` — user-facing project introduction

This `docs/` tree holds the depth.

| Folder / file | Read when… |
|---------------|------------|
| `architecture/PROJECT_OVERVIEW.md` | You need the deep technical reference: data model, providers, components, hooks, utils, recent additions |
| `design/STYLE_GUIDE.md` | Picking colors / spacing / typography / glass treatments |
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
