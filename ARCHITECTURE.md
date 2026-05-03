# Architecture Notes

## Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React + Vite | Fast DX, rich ecosystem |
| Editor | Tiptap (ProseMirror) | Best OSS rich-text for React; schema-based JSON storage |
| Backend | Express.js | Minimal, well-understood, fast to ship |
| Database | SQLite via better-sqlite3 | Zero-infra, synchronous API, good for this scope |
| Auth | JWT (bcryptjs) | Stateless, no session store needed |
| Deployment | Vercel (FE) + Railway (BE) | Free tiers, one-click GitHub deploys |

## What I Prioritized

**1. Editing experience first.** Tiptap was the correct call: it stores content as ProseMirror JSON, which serializes cleanly to SQLite TEXT and restores without lossy round-trips. The alternative (storing HTML) creates XSS surface area and brittle re-hydration.

**2. Sharing model with real permission semantics.** Two permission levels (`view`, `edit`) stored in a join table. The backend enforces this on every write — the UI "view only" badge is cosmetic confirmation, not the control plane.

**3. Auto-save over manual save.** 1.5s debounce on editor `onUpdate`. Users shouldn't think about saving. The save state indicator (`● Saved / ○ Saving…`) is honest about in-flight state.

**4. Lightweight auth.** Three seeded users with bcrypt-hashed passwords + JWTs. No OAuth complexity. Real production would add refresh tokens and email verification.

## What I Deprioritized

**Real-time collaboration (WebSockets/CRDTs).** This is the defining feature of Google Docs but would have consumed the entire timebox. Tiptap has `@tiptap/extension-collaboration` for this — it's a clear next step.

**DOCX import.** `mammoth.js` handles .docx → HTML well, but mapping its HTML output cleanly to ProseMirror JSON in 30 minutes isn't worth the edge cases. Stated clearly in UI: `.txt`, `.md`, `.json` only.

**File download/preview.** Attachments are tracked in DB and filenames stored on disk. Serving them back requires a signed URL or proxy route — skipped for time, easy addition.

**Granular error states.** Errors surface to the user but aren't categorized (network vs. auth vs. validation). Fine for a prototype.

## Data Model

```
users          id, email, name, password_hash, created_at
documents      id, title, content (JSON string), owner_id, created_at, updated_at
document_shares id, document_id, shared_with_id, permission ('view'|'edit'), created_at
attachments    id, document_id, filename, original_name, mimetype, size, created_at
```

Foreign keys are enforced at the SQLite level (`PRAGMA foreign_keys = ON`).

## Next 2-4 Hours

1. Real-time presence / conflict-free editing via Tiptap Collaboration + Hocuspocus
2. DOCX import via `mammoth.js`
3. Attachment download/view endpoints
4. Soft-delete for documents (trash bin)
5. Search across document titles and content
