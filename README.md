# UZVI Services — Employee Self-Management Portal

Internal employee self-management portal: a single application composed of
independent modules sharing one identity model.

## Documentation

- [`docs/FRD_NFR.md`](docs/FRD_NFR.md) — Functional & Non-Functional Requirements
- [`docs/technical-setup-guide.md`](docs/technical-setup-guide.md) — Environment setup, required versions, folder structure

## Getting started

Backend and frontend are already scaffolded and their exact dependency
versions already pinned (`requirements.txt`, `package-lock.json`). Everyone
installs FROM these files — nobody re-resolves versions independently.

```bash
# Backend
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install
npm run dev
```

Visit the frontend URL — it should show "Backend status: ok", confirming
the full stack is wired correctly.

## Stack

Python 3.12 (pinned via `.python-version`) · FastAPI 0.139.0 · SQLite (dev) -> PostgreSQL (production)
Node 24.15.0 (pinned via `.nvmrc`) · React 19.2.7 + Vite 8.1.3 + TypeScript

See `docs/technical-setup-guide.md` for how these pins are enforced.
