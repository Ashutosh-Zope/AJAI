# Submission

## Contents

| File/Folder | Description |
|---|---|
| `backend/` | Express API — auth, documents, upload, SQLite |
| `frontend/` | React + Vite + Tiptap editor |
| `README.md` | Local setup and run instructions |
| `ARCHITECTURE.md` | Design decisions, tradeoffs, data model |
| `AI_WORKFLOW.md` | AI tool usage, what was changed, how correctness was verified |
| `SUBMISSION.md` | This file |

## Live URL

`https://ajaia-docs.vercel.app` *(update after deploy)*

## Test Credentials

| Email | Password | Role |
|---|---|---|
| alice@demo.com | demo1234 | Has a seeded document |
| bob@demo.com | demo1234 | For testing share recipient |
| carol@demo.com | demo1234 | Additional test user |

## Sharing Flow Demo

1. Log in as `alice@demo.com`
2. Open "Welcome to Ajaia Docs"
3. Click **Share** → enter `bob@demo.com` → set "Can view" → Share
4. Log out, log in as `bob@demo.com`
5. Document appears under "Shared with me" — editing is disabled

## What Works End-to-End

- Auth (login, register, JWT, seeded accounts)
- Create, rename, edit, delete documents
- Rich-text: bold, italic, underline, H1/H2/H3, bullet list, numbered list
- Auto-save with status indicator
- Share with view or edit permission; revoke access
- File import (.txt, .md → new document)
- File attachments per document
- Persistence across refresh

## What's Incomplete / Would Build Next

- Real-time collaboration (Tiptap Collaboration + Hocuspocus)
- Attachment download/view endpoint
- DOCX import (mammoth.js)
- Document search
- Soft-delete / trash
