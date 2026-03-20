# Privacy-Preserving Campus Delivery Authentication

Monorepo for a privacy-preserving authentication platform inspired by the IEEE paper "Attribute-Based Pseudonymity for Privacy-Preserving Authentication in Cloud Services", adapted for campus delivery worker access control.

## Structure

- `backend/` FastAPI, async SQLAlchemy, Alembic, cryptographic services, tests
- `frontend/` React, TypeScript, Vite, Tailwind, Zustand, TanStack Query
- `deployment/` Docker, nginx, production deployment assets
- `postman/` API collection

## Quick Start

1. Copy `.env.example` to `.env`.
2. Start services with `docker compose up --build`.
3. Open:
   - API: `http://localhost:8000/docs`
   - Frontend: `http://localhost:3000`

## Local Development

Backend:

1. Create and activate a virtualenv in the project root.
2. Install dependencies with:
   - `pip install -r requirements-dev.txt` for local Windows/mock-crypto development
   - `pip install -r requirements.txt` only when you explicitly want the full dependency set, including `charm-crypto`
3. Start the API from the `backend/` directory with one of these commands:
   - `..\venv\Scripts\python.exe run_dev.py`
   - `..\venv\Scripts\python.exe -m uvicorn app.main:app --reload`

Use one of the commands above on Windows instead of bare `uvicorn`. This repo has hit cases where `uvicorn` resolves to an MSYS/global Python executable, which then cannot see the venv-installed `fastapi`.

Frontend:

1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Notes

- The backend ships with a `mock` cryptography provider for development and tests.
- A `charm` provider interface is included and will activate when Charm-Crypto is installed and `CRYPTO_PROVIDER=charm`.
- The implementation preserves the paper's flow and API contracts, but the mock provider intentionally uses deterministic modular algebra instead of real bilinear pairings.

## Verification Pipeline

Gate verification follows the required seven-step sequence:

1. Signature verification
2. Credential expiry check
3. Timestamp freshness window (5 minutes)
4. Gate nonce validation
5. Company trust/approval check
6. Revocation check
7. Replay detection

## Testing

- Backend: `pytest`
- Frontend: `npm run build`
