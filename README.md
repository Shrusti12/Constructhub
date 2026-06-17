# ConstructHub (React + FastAPI + Postgres)

## What you get
- Landing page: Home, About, Contact
- Auth: Login + Register (role-based: company / client)
- Marketplace: clients post build requests, companies connect, clients accept, then chat
- AI Studio: suggestions + concept images generated from your prompt (offline-friendly)

## Run (dev)


### 1) Backend (FastAPI)
- `python -m venv .venv`
- `.\.venv\Scripts\activate`
- `pip install -r backend\requirements.txt`
- `uvicorn app.main:app --reload --app-dir backend --host 0.0.0.0 --port 8000`

--( .\.venv\Scripts\python -m uvicorn app.main:app --reload --app-dir backend --port 8000)  =>to run backend

### 2) Frontend (React)
- `cd frontend`
- `npm install`
- `npm run dev`

Open:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000/docs`



## Notes
- Default DB url is in `backend/app/core/config.py` and points to localhost Postgres.
- AI Studio requires login (uses `/ai/suggest`).


