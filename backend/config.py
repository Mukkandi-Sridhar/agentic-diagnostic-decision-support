from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    openai_api_key: str = ""
    pubmed_email: str = ""
    pubmed_tool: str = "agentic-diagnostic-support"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_port: int = 3000
    next_public_api_base_url: str = "http://localhost:8000"
    vector_store_path: str = "data/indexes/medical_index"
    trace_log_path: str = "traces/agent_logs.jsonl"
    case_store_path: str = "data/cases.json"
    case_store_mode: str = "memory"
    upload_dir: str = "data/uploads"
    use_remote_models: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
