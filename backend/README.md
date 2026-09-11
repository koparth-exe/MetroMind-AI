# MetroMind AI — Canonical FastAPI Backend

> [!NOTE]
> **Production Service**: This directory houses the canonical, fully featured Python/FastAPI backend for MetroMind AI, including the mathematical analysis pipeline, multi-model prediction, risk scoring, constrained fleet optimization, scenario simulation, and Gemini Insights integration. For the complete system architecture and frontend instructions, see the root [README.md](../README.md).

This directory is the production Python/FastAPI backend powering MetroMind AI.

## Architecture

```
backend/
├── app/
│   ├── main.py                 # FastAPI factory and ASGI app
│   ├── core/
│   │   ├── config.py           # Environment-backed settings
│   │   ├── logging.py          # Application logging
│   │   └── exceptions.py       # JSON error handlers
│   ├── api/routes/health.py    # Health endpoint
│   ├── api/routes/transport.py # Supported-mode discovery and validation
│   ├── domain/transport/        # Canonical mode enum and registry
│   ├── models/common.py        # Shared Pydantic schemas
│   ├── services/               # Reserved for later phases
│   └── mathematics/            # Reserved for later phases
├── tests/
├── requirements.txt
└── .env.example
```

Configuration is loaded through `pydantic-settings`. Allowed CORS origins come from `CORS_ALLOWED_ORIGINS` (comma-separated). Defaults are local frontend origins only; there is no wildcard `*`.

## Setup

From this directory:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Set values in `.env` locally. Never commit `.env`. API key names are declared for later phases; Phase 1 does not call Gemini or OpenRouter.

## Run

```powershell
uvicorn app.main:app --reload
```

Health check:

```text
GET http://127.0.0.1:8000/api/healthz
```

Expected body:

```json
{"status": "ok", "service": "metromind-fastapi"}
```

Transport modes:

```text
GET http://127.0.0.1:8000/api/transport/modes
GET http://127.0.0.1:8000/api/transport/modes/RAILWAY
```

The validation route normalizes case at its boundary (for example, `bus` becomes `BUS`) but rejects aliases such as `train` and `rail`. Recognition of a mode does not indicate that a FastAPI dataset or mode-specific calculations are available.

## Tests

```powershell
pytest
```
