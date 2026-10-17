# n8n QA — SaaS foundation

Static QA rules for exported n8n workflows. **Not a penetration test, live API test, or security certification.**

## Current phase

The original Streamlit prototype is preserved in `app.py` and now imports the same audit engine from `packages/qa_engine`.

- `packages/qa_engine/core.py` — parser, four heuristic rule engines and JSON annotation.
- `app.py` — existing Streamlit user interface (legacy prototype).
- `tests/` — regression smoke tests, without external services.
- `.github/workflows/` — test-only CI, **no automatic deployment**.

## Local development

Requires Python 3.12 or newer.

```bash
python -m unittest discover -s tests -v
python -m pip install streamlit
streamlit run app.py
```

## Planned application layout (not deployed yet)

```text
apps/web/             Next.js interface
apps/api/             FastAPI, auth and project API
packages/qa_engine/   Shared, independent audit engine
workers/qa_worker/    Background queue worker
infrastructure/       Dockerfiles and Compose
```

### Security note

Workflow JSON can include credentials or personal data. Never commit customer exports, keys, or environment files. Uploaded JSON must be treated as untrusted data; do not execute code or expressions from uploads. Review false positives in existing heuristic rules before production use.

No Coolify or VPS resources are changed by this repository refactor.

## KevoLint frontend development

PR01 adds a credential-free Next.js foundation in `apps/web`. See
[frontend setup and checks](apps/web/README.md), [architecture ADR](docs/adr/0001-frontend-foundation.md)
and [verification evidence](docs/verification-pr01.md). The existing Python engine,
API, tests and Streamlit prototype are preserved. No frontend deployment is included.
