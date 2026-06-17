# ConstructHub Backend

## Prereqs
- Python 3.11+
- Postgres (or run docker compose)



## Install deps
- `python -m venv .venv`
- `.\.venv\Scripts\activate`
- `pip install -r backend\requirements.txt`

## Run API
- `uvicorn app.main:app --reload --app-dir backend --host 0.0.0.0 --port 8000`

API base: `http://localhost:8000`

