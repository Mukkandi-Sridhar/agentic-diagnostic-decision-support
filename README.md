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
2. Optional: add `GEMINI_API_KEY` and `OPENAI_API_KEY`.
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
