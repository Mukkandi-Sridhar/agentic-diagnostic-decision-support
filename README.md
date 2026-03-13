# Agentic Diagnostic Decision Support System (with Imaging)

Multi-agent prototype for chest X-ray diagnostic decision support with a FastAPI backend, CrewAI-style agent orchestration, FAISS-backed retrieval, PubMed ingestion, and a multi-page Next.js clinical portal.

## Features

- Chest X-ray case intake with upload, preview, and prototype metadata viewer
- Orchestrated agents for vision, retrieval, diagnosis, citation verification, and safety
- PubMed E-utilities retrieval with local seed fallback and FAISS vector indexing
- Professional multi-page UI with dashboard, progress tracking, results, history, and settings
- Trace logging to `traces/agent_logs.jsonl`
- Dockerized backend and frontend with `.env.template`

## Architecture

```text
                +------------------------------+
                |      Next.js Frontend        |
                | Landing / Dashboard / Cases  |
                +---------------+--------------+
                                |
                                v
                    +-----------+-----------+
                    |       FastAPI API     |
                    |  uploads / cases /    |
                    | analyze-case / stats   |
                    +-----------+-----------+
                                |
              +-----------------+------------------+
              |                                    |
              v                                    v
   +----------+----------+              +----------+----------+
   | Multi-Agent System  |              |      RAG Layer      |
   | Orchestrator Agent  |              | PubMed Ingestor     |
   | Vision Agent        |              | Vector Store (FAISS)|
   | Retrieval Agent     |              | Hybrid Retriever    |
   | Diagnosis Agent     |              +----------+----------+
   | Citation Verifier   |                         |
   | Safety Agent        |                         v
   +----------+----------+              +----------+----------+
              |                         | PubMed E-utilities  |
              v                         | Seed dataset fallback|
   +----------+----------+              +---------------------+
   | Trace Logs / Cases  |
   | uploads / JSON store|
   +---------------------+
```

## Project Structure

```text
agents/
backend/
frontend/
infra/
rag/
data/
traces/
```

## Local Run

1. Copy `.env.template` to `.env`.
2. Add `GEMINI_API_KEY` and optionally `OPENAI_API_KEY`.
3. Backend:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

4. Frontend:

```bash
cd frontend
npm install
npm run dev
```

5. Open `http://localhost:3000`.

## Docker Run

```bash
copy .env.template .env
docker compose -f infra/docker-compose.yml up --build
```

## Deploy

### Frontend on Vercel

Create a Vercel project from this repository and set the project Root Directory to `frontend`.

- Framework: `Next.js`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Install Command: `npm install`

Add this environment variable in Vercel:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-render-backend.onrender.com
```

The frontend repo config is included in `frontend/vercel.json`.

### Backend on Render

This repo includes a Render Blueprint at `render.yaml` for the FastAPI backend.

- Runtime: `Python`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`

For the current demo-friendly setup, Render only needs these environment variables during setup:

```bash
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
USE_REMOTE_MODELS=true
```

Render deployment steps:

1. Push this repository to GitHub.
2. In Render, create a new Blueprint instance from the repo, or create a Python Web Service manually using the same commands.
3. Set `PYTHON_VERSION=3.12.7` if you are configuring the service manually. This repo also includes `.python-version` and the Render Blueprint sets the same version.
4. Add the secret environment variables.
5. Deploy and verify `https://your-service.onrender.com/health`.

### Deployment Notes

- Vercel should host only the frontend for this project.
- Render is the better fit for the backend because the backend runs the FastAPI API and agent workflow.
- The app now defaults to temporary session-style storage, so case history is not persisted across restarts unless you explicitly reconfigure storage paths.
- Render currently defaults newly created Python services to Python `3.14.3`, so this project pins Python `3.12.7` to avoid dependency build issues.

## Sample Case Loader

```bash
python backend/load_sample_case.py
```

This posts `data/samples/example_case.json` to `POST /analyze-case`.

## API Endpoints

- `POST /upload-image`
- `POST /analyze-case`
- `GET /cases`
- `GET /cases/{case_id}`
- `GET /cases/{case_id}/progress`
- `GET /cases/{case_id}/result`
- `GET /dashboard/stats`
- `GET /settings`
- `GET /health`

## Notes

- The prototype runs locally without external keys by using deterministic heuristics plus seeded literature.
- When `USE_REMOTE_MODELS=true` and keys are set, Gemini is used first and GPT-4o acts as the fallback path.
- The UI always displays the banner: `Research / Education Only - Not a Medical Device`.
- Official docs used for deployment guidance:
  - Vercel monorepos and Root Directory: https://vercel.com/docs/monorepos
  - Vercel project configuration: https://vercel.com/docs/projects/project-configuration
  - Render FastAPI deploys: https://render.com/docs/deploy-fastapi
  - Render persistent disks: https://render.com/docs/disks
  - Render Blueprint spec: https://render.com/docs/blueprint-spec
