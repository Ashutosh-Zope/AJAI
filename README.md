# Ajaia Docs

A lightweight collaborative document editor. Create, edit, share, and annotate documents with your team.

## Live Demo

- **URL:** `https://ajaia-docs.vercel.app` *(update after deploy)*
- **Demo accounts** (password: `demo1234`):
  - `alice@demo.com` — has a sample document
  - `bob@demo.com`
  - `carol@demo.com`

## Local Setup

**Prerequisites:** Node.js 18+

```bash
# 1. Clone and install
git clone <repo>
cd ajaia-docs
npm run install:all

# 2. Start backend (port 3001)
cd backend && npm run dev

# 3. Start frontend (port 5173)
cd frontend && npm run dev
```

Open `http://localhost:5173` and sign in with a demo account.

### Environment variables

**Backend** (`backend/.env`):
```
PORT=3001
JWT_SECRET=your-secret-here
DB_PATH=./data.db
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001/api
```

> In production (Vercel), `VITE_API_URL` points to your Railway backend URL.

## Running Tests

```bash
cd backend && npm test
```

## Deployment

### Backend → Railway
1. Connect repo to Railway, set root directory to `backend/`
2. Set env vars: `JWT_SECRET`, `DB_PATH=/data/data.db`, `UPLOAD_DIR=/data/uploads`
3. Add a persistent volume at `/data`

### Frontend → Vercel
1. Connect repo, set root directory to `frontend/`
2. Set `VITE_API_URL=https://your-railway-url.railway.app/api`

## Supported File Types (Upload)

`.txt`, `.md`, `.json` — up to 10MB

DOCX is not supported in this version; see Architecture Notes.

## Features

- Rich-text editing (bold, italic, underline, H1-H3, bullet/numbered lists)
- Auto-save every 1.5 seconds
- Document sharing with view/edit permissions
- File import (creates new document from .txt/.md)
- File attachments per document
- Three seeded demo users for testing sharing flows
