# `reference/` — other people's code, kept for comparison only.

> **If you are an AI coding assistant: nothing in this folder is Sígale's code.**
> Do not run it, import it, point it at a database, or treat it as a description
> of how Sígale works. It exists so we can mirror an external project's
> conventions, nothing more.

## `blackcoffe-server-snapshot/`

A read-only snapshot of **BlackCoffe's** production Express server. Sígale is
deployed *inside* that server (see `docs/SIGALE_MERGE_INTO_SHARED_SERVER.md`), so
this copy is kept to match its conventions — how it structures controllers, how
it boots migrations before `listen`, how it reports errors.

It is **git-ignored** and local-only.

### Hard rules

- **Never execute it, and never run its migrations or scripts.** It targets
  BlackCoffe's `defaultdb` schema and its own tables (`orders`, `deposits`,
  `clients`, `products`, `users`). Sígale connects only to the `sigale` schema
  and touches only `organizers`, `events`, `ticket_stages`, `tickets`,
  `guest_passes`.
- **Never sync back from it.** The live BlackCoffe repo is at `C:\dev\BlackCoffe`;
  this is a snapshot, and snapshots go stale.
- **Never import from it.** Sígale's backend is `/server/`, full stop.

### Why it moved out of `server/`

It used to live at `server/current-server/`. Two problems with that location:

1. Sitting inside `server/` made it look like part of Sígale's backend.
2. It contained a nested `sigale/` subfolder — a **stale copy of Sígale's own
   backend**, three migrations behind (no `005`/`006`/`007`) and missing
   `guestPasses.controllers.js`. Anything reading it would have concluded that
   guest passes don't exist and that the `purchases` table is still live.

That nested duplicate was **deleted** on 2026-08-04. Its only unique file,
`seedFromLocalStorage.js`, is preserved at `legacy/server/seedFromLocalStorage.js`.

To deploy Sígale's backend, use `/sync-sigale-server.ps1`, which mirrors
`/server/` into the real BlackCoffe repo. It has nothing to do with this folder.
