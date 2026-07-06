# UZVI Services Employee Self-Management Portal
## Technical Setup Guide — Environment, Versions & Folder Structure

**Version:** 1.2 · **Companion to:** FRD/NFR v1.1
**Repository:** [github.com/UZVIS/uzvi-portal](https://github.com/UZVIS/uzvi-portal)
**Scope:** Get every developer to an identical, working local environment — backend and frontend running and talking to each other. Schemas, API contracts, and wireframes are the next deliverable and are intentionally not covered here.

---

## 1. Purpose

This guide fixes the exact tool versions, the repository layout, and the commands to run so that every developer's environment is identical. It proves the toolchain works end-to-end using a trivial health-check call between backend and frontend — no application module is built here, since that depends on the schemas and API contracts defined in the next deliverable.

---

## 2. Technology Stack & Required Versions

Every layer below is pinned to exactly one version. Nobody chooses between options — the version below is the version everyone runs.

| Layer | Technology | Version |
|---|---|---|
| Backend language | Python | **3.12** — exact patch fixed via `.python-version` (Section 4.1) |
| Backend framework | FastAPI | Fixed by the committed `requirements.txt` (Section 4.3) — everyone installs from that file, nobody resolves it independently |
| ASGI server | Uvicorn | Fixed by the committed `requirements.txt`, same as above |
| Backend package management | pip + venv | Built into Python |
| Database (V1) | SQLite | Built into Python (`sqlite3` module) — no separate install |
| Database (future) | PostgreSQL | 16 — not needed until the project moves beyond SQLite |
| Frontend runtime | Node.js | **24.15.0** — exact version fixed via `.nvmrc` (Section 4.1) |
| Frontend framework | React | Fixed by the committed `package-lock.json` (Section 4.4) |
| Frontend build tool | Vite | Fixed by the committed `package-lock.json`, same as above |
| Frontend language | TypeScript | Fixed by the committed `package-lock.json`, installed via the Vite `react-ts` template |
| Version control | Git | 2.40 |
| Editor | VS Code | Recommended, not mandated. Extensions: Python, Pylance, ESLint, Prettier. |

**Why Python 3.12 and Node 24.15.0 specifically:** both are current, stable, and have full ecosystem support — new enough to avoid missing package compatibility, old enough that nobody hits day-one bugs. Node 26 is excluded because it is still a "Current" pre-LTS release; Node 22 is excluded because it is no longer the recommended default for new projects.

**How the pin is actually enforced:** a version number in this document is not, by itself, enough to stop drift — someone running `pip install fastapi` fresh next month will get whatever is newest that day, not what's written here. So the interpreter and runtime (Python, Node) are pinned by version files committed to the repository (`.python-version`, `.nvmrc`), and every library (FastAPI, Uvicorn, React, Vite, and everything else) is pinned by committed lockfiles (`requirements.txt` with exact `==` versions, `package-lock.json`). After initial setup, every developer installs *from* these committed files — nobody re-resolves "latest" independently. This is what makes "exactly one version" actually true across 15 machines, not just true in this document.

---

## 3. Repository & Folder Structure

One repository, two top-level applications (`backend`, `frontend`), assembled per the integration contract in the FRD (Section 7).

```
uzvi-portal/
├── backend/
│   ├── app/
│   │   ├── main.py                  # Assembles every module's router into one FastAPI app
│   │   ├── config.py                # Shared settings, loaded from environment variables
│   │   ├── database.py              # Shared DB connection/session setup (SQLite for V1)
│   │   └── modules/
│   │       ├── directory/           # M0 — Employee Directory (foundation)
│   │       ├── utilization/         # M1
│   │       ├── leave/               # M2
│   │       ├── attendance/          # M3
│   │       ├── expenses/            # M4
│   │       ├── onboarding/          # M5
│   │       ├── training/            # M6
│   │       ├── assets/              # M7
│   │       ├── documents/           # M8
│   │       ├── announcements/       # M9
│   │       ├── performance/         # M10
│   │       ├── helpdesk/            # M11
│   │       ├── recruiting/          # M12
│   │       ├── quotes/              # M13
│   │       └── calendar/            # M14
│   │           (each module's internal file structure is defined per-module
│   │            alongside its schema — see Section 6)
│   ├── requirements.txt
│   ├── .env.example
│   ├── pytest.ini
│   └── portal.db                    # SQLite file, created on first run (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                 # App entry point
│   │   ├── App.tsx                  # Top-level routing
│   │   ├── api/
│   │   │   └── client.ts            # Shared fetch/axios wrapper, base URL from env
│   │   ├── theme/
│   │   │   └── index.ts             # Shared design tokens (colors, spacing) — NFR-USE-01
│   │   ├── components/              # Shared component library (buttons, tables, cards)
│   │   └── modules/
│   │       ├── directory/           # Mirrors backend/app/modules/directory/ 1:1
│   │       ├── utilization/
│   │       ├── leave/
│   │       │   (... one folder per module, mirroring the backend list above)
│   ├── package.json
│   ├── vite.config.ts               # Includes dev-server proxy to the backend (Section 5)
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/
│   ├── FRD_NFR.md                   # The requirements document (already delivered)
│   └── technical-setup-guide.md     # This document
│
├── .gitignore
└── README.md
```

**The one rule that matters most:** a module's folder name is identical in `backend/app/modules/` and `frontend/src/modules/`. When schemas and API contracts are defined next, whoever works on a module works in exactly two folders, and nowhere else.

---

## 4. Environment Setup

### 4.1 Install prerequisites and fix the exact interpreter/runtime version

Confirm each tool is installed:

```bash
python3 --version
node --version
npm --version
git --version
```

Use `pyenv` (Python) and `nvm` (Node) rather than system-wide installs — this is what lets every developer switch to the exact pinned version below with one command, instead of managing it by hand.

```bash
pyenv install 3.12.8      # or whatever the latest 3.12.x patch is at setup time
pyenv local 3.12.8         # writes .python-version in the repo root

nvm install 24.15.0
nvm use 24.15.0
echo "24.15.0" > .nvmrc     # writes .nvmrc in the repo root
```

Commit `.python-version` and `.nvmrc` to the repository. From this point on, `pyenv` and `nvm` read these files automatically — anyone who runs `pyenv local` / `nvm use` inside the repo gets exactly 3.12.8 / 24.15.0, with no manual version-checking required.

### 4.2 Clone the repository and create the base structure

```bash
git clone https://github.com/UZVIS/uzvi-portal.git
cd uzvi-portal
mkdir -p backend/app/modules frontend docs
```

### 4.3 Backend setup

**First-time setup only** (whoever sets this up initially — after this, `requirements.txt` is committed and nobody repeats this step):

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install --upgrade pip
pip install fastapi "uvicorn[standard]" pydantic pytest httpx
pip freeze > requirements.txt      # captures exact resolved versions — commit this file
```

**Every subsequent developer** installs from the committed file — this is what makes the version actually fixed, not just documented:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt    # installs the exact versions already pinned — no resolution happens
```

Create a minimal `app/main.py` to prove the backend runs:

```python
# backend/app/main.py
from fastapi import FastAPI

app = FastAPI(title="UZVI Services Employee Portal")

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

Run it:

```bash
uvicorn app.main:app --reload --port 8000
```

Visit `http://127.0.0.1:8000/health` — expect `{"status": "ok"}`. Visit `http://127.0.0.1:8000/docs` — expect the auto-generated FastAPI documentation page to load. Both working confirms the backend toolchain is correctly installed.

### 4.4 Frontend setup

**First-time setup only** (whoever sets this up initially — after this, `package-lock.json` is committed and nobody repeats this step):

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install axios
# package.json and package-lock.json now exist — commit both
```

**Every subsequent developer** installs from the committed lockfile:

```bash
cd frontend
npm install     # npm reads package-lock.json and installs the exact versions already pinned
```

Run it:

```bash
npm run dev
```

Visit the URL Vite prints (typically `http://localhost:5173`) — expect the default Vite + React starter page. This confirms the frontend toolchain is correctly installed.

---

## 5. Verifying the Full Stack Connection

This step proves the backend and frontend are correctly wired together, using nothing but the trivial `/health` endpoint above — no application module or schema is needed for this check.

Configure the Vite dev server to proxy API calls to the backend, so the frontend can call `/api/...` without hardcoding `localhost:8000` everywhere:

```ts
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

Replace the contents of `frontend/src/App.tsx` with a version that calls the backend's health endpoint:

```tsx
import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('backend unreachable'))
  }, [])

  return <h1>Backend status: {status}</h1>
}

export default App
```

With both `uvicorn` and `npm run dev` running, reload the frontend page — expect **"Backend status: ok"**.

### 5.1 Verification checklist

- [ ] `python3 --version` shows 3.12.8 (or matches `.python-version`)
- [ ] `node --version` shows v24.15.0 (or matches `.nvmrc`)
- [ ] `uvicorn app.main:app --reload` starts without errors
- [ ] `http://127.0.0.1:8000/docs` loads the FastAPI docs page
- [ ] `npm run dev` starts without errors
- [ ] The frontend page shows **"Backend status: ok"** — confirming the proxy and the API call both work

---

## 6. Module Structure Convention

This is the shape every module will follow once its schema and API contract are defined next. It's fixed now so that when that work starts, everyone builds to the same convention.

**Backend module (`backend/app/modules/<module_name>/`):**
| File | Responsibility |
|---|---|
| `models.py` | Data structures — what a record looks like |
| `schemas.py` | Pydantic models — what the API accepts and returns |
| `service.py` | Business logic — validation, calculations, rules |
| `router.py` | FastAPI `APIRouter` — thin HTTP layer, delegates to `service.py` |
| `tests/` | Unit tests for `service.py` logic |

**Frontend module (`frontend/src/modules/<module_name>/`):**
| File | Responsibility |
|---|---|
| `api.ts` | Functions that call this module's backend endpoints via the shared client |
| `<Module>Page.tsx` | The page/route component for this module |
| `components/` | Any sub-components specific to this module |

---

## 7. Development Conventions

### 7.1 Environment variables

Both apps read configuration from `.env` files, never hardcoded values:

```
# backend/.env.example
DATABASE_URL=sqlite:///./portal.db
ENVIRONMENT=development
```

```
# frontend/.env.example
VITE_API_BASE_URL=/api
```

Each developer copies `.env.example` to `.env` locally; `.env` itself is gitignored.

### 7.2 Git workflow

- **Branch naming:** `module/<module-name>` (e.g. `module/leave`, `module/attendance`).
- **Commits:** small and descriptive; prefix with the module name where relevant (e.g. `leave: add balance calculation`).
- **Before opening a pull request:** the module's own tests pass (`pytest backend/app/modules/<module>/tests`), and the module's frontend page renders without console errors.

### 7.3 Code style & tooling

| Layer | Formatter/Linter | Command |
|---|---|---|
| Python | `black` + `ruff` | `pip install black ruff`, then `black .` / `ruff check .` |
| TypeScript/React | ESLint + Prettier (included in Vite's `react-ts` template) | `npm run lint` |

Run both before committing. This keeps everyone's code looking like one codebase.

---

## 8. What's Next

With the environment proven end-to-end and the module convention fixed, the next deliverable defines, for each of the 14 remaining modules: the database schema, the full API contract (request/response shapes for every endpoint), and wireframes for each module's frontend views.

---

*This document is the environment-setup companion to the FRD/NFR (v1.1). Per-module schemas, API contracts, and wireframes follow as the next deliverable.*
