from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ImageInput(BaseModel):
    id: str
    format: str
    file_token: str | None = None
    content_base64: str | None = None
    content_type: str | None = None


class PatientContext(BaseModel):
    age: int = Field(..., ge=0, le=120)
    sex: str
    chief_complaint: str
    vitals: str | None = ""
    labs: str | None = ""
    medications: str | None = ""
    history: str | None = ""


class AnalyzeCaseRequest(BaseModel):
    case_id: str
    patient_context: PatientContext
    images: list[ImageInput]


class UploadImageResponse(BaseModel):
    file_token: str
    filename: str
    content_type: str
    size_bytes: int


class Overlay(BaseModel):
    overlay_id: str
    type: str
    coords: list[int]
    label: str | None = None


class CitationSnippet(BaseModel):
    snippet_id: str
    pmid: str
    doi: str | None = ""
    quote: str
    journal: str | None = ""
    year: str | None = ""
    title: str | None = ""


class SupportRef(BaseModel):
    snippet_id: str


class DifferentialDiagnosis(BaseModel):
    dx: str
    icd10: str
    rationale: str
    support: list[SupportRef] = []


class AnalysisResult(BaseModel):
    case_id: str
    status: str
    patient_context: dict[str, Any]
    imaging_findings: dict[str, Any]
    differentials: list[DifferentialDiagnosis]
    red_flags: list[str]
    next_steps: list[str]
    citations: list[CitationSnippet]
    overlays: list[Overlay]
    diagnostic_summary: str
    compliance_banner: str
    disclaimer: str
    safety_checks: list[str]
    rag_stats: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class AnalysisStartResponse(BaseModel):
    case_id: str
    status: str
    progress_url: str
    result_url: str


class DashboardStats(BaseModel):
    total_analyses: int
    completed_analyses: int
    recent_diagnoses: list[str]
    evidence_sources_used: int
    indexed_documents: int


class SettingsResponse(BaseModel):
    use_remote_models: bool
    gemini_configured: bool
    openai_fallback_configured: bool
    pubmed_email: str
    vector_store_path: str
    upload_dir: str

