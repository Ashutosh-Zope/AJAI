# AI Workflow Note

## Tools Used

- **Claude (claude.ai)** — primary coding assistant throughout

## Where AI Materially Sped Things Up

**Boilerplate elimination.** Express route structure, middleware wiring, and SQLite schema setup would have taken 45–60 minutes manually. Claude produced a solid first pass in one prompt, leaving me to review and adjust edge cases (e.g. the UNIQUE constraint upsert in the share endpoint).

**CSS module generation.** The styling work — consistent design tokens, responsive layouts, micro-interactions — was scaffolded quickly. I specified the aesthetic direction (editorial, warm, serif/sans pairing, terracotta accent) and the output matched. I then tuned spacing, hover states, and animation timing manually.

**Tiptap integration.** I knew Tiptap's API conceptually but hadn't used the latest v2 extension split. Claude correctly identified that `@tiptap/starter-kit` no longer bundles Underline and that it needs a separate import. That saved a debugging cycle.

## What I Changed or Rejected

**Database path handling.** Initial suggestion used `path.resolve(__dirname)` in a way that broke when the process ran from a different CWD. Changed to explicit env var with fallback.

**Share upsert logic.** AI generated an INSERT-or-IGNORE pattern, but the assignment wants permission updates to work (re-sharing with different permission). Replaced with catch-on-UNIQUE + UPDATE.

**Frontend auth guard.** Initial version redirected inside a `useEffect`, which caused a flash of the protected page. Replaced with a synchronous `<Navigate>` in the render path.

**Attachment download.** AI scaffolded a download route with `res.sendFile`. I removed it — serving files from the container filesystem via Express works locally but breaks on Railway without a persistent volume configured first. Noted in architecture doc as a next step rather than shipping something that silently fails.

## How I Verified Correctness

- Ran the backend test suite (`npm test`) covering auth and document CRUD
- Manually tested the full user flow: create → edit → share (as Alice, open in Bob's session) → confirm view-only enforcement → upload file → verify document appears
- Checked the share permission enforcement at the API level (not just UI) by hitting the PUT endpoint directly with Bob's JWT on Alice's document with view-only access
- Reviewed all SQL queries for injection risk (all use parameterized statements via better-sqlite3)
