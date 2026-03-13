from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.logging_config import configure_logging
from backend.routes import router

configure_logging()

app = FastAPI(
    title="Agentic Diagnostic Decision Support System",
    version="0.1.0",
    description="Multi-agent chest X-ray diagnostic decision support prototype with imaging, RAG, and citations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
