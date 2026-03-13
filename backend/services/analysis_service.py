from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from agents.base import TraceLogger
from agents.citation_verifier_agent import CitationVerifierAgent
from agents.diagnosis_agent import DiagnosisAgent
from agents.orchestrator_agent import OrchestratorAgent
from agents.retrieval_agent import RetrievalAgent
from agents.safety_agent import SafetyAgent
from agents.vision_agent import VisionAgent
from backend.config import Settings
from backend.services.case_store import CaseStore
from backend.services.file_store import FileStore
from rag.retriever import Retriever

logger = logging.getLogger(__name__)


class AnalysisService:
    def __init__(self, settings: Settings, case_store: CaseStore, file_store: FileStore) -> None:
        self.settings = settings
        self.case_store = case_store
        self.file_store = file_store
        self.trace_logger = TraceLogger(Path(settings.trace_log_path))
        retriever = Retriever(settings)
        self.orchestrator = OrchestratorAgent(
            trace_logger=self.trace_logger,
            vision_agent=VisionAgent(settings, self.trace_logger),
            retrieval_agent=RetrievalAgent(settings, retriever, self.trace_logger),
            diagnosis_agent=DiagnosisAgent(settings, self.trace_logger),
            citation_verifier_agent=CitationVerifierAgent(self.trace_logger),
            safety_agent=SafetyAgent(self.trace_logger),
        )

    def resolve_image_paths(self, images: list[dict[str, Any]]) -> list[Path]:
        paths = []
        for image in images:
            if image.get("file_token"):
                resolved = self.file_store.resolve(image["file_token"])
                if resolved:
                    paths.append(resolved)
        return paths

    def execute_case(self, case_id: str) -> None:
        case = self.case_store.get_case(case_id)
        if not case:
            logger.error("Case %s not found", case_id)
            return

        try:
            image_paths = self.resolve_image_paths(case["images"])
            patient_context = case["patient_context"]

            def progress(step: str, status: str, metadata: dict[str, Any]) -> None:
                self.case_store.append_progress(case_id, step, status, metadata.get("message", step), metadata)

            self.case_store.append_progress(case_id, "started", "running", "Workflow started", {})
            result = self.orchestrator.analyze_case(patient_context, image_paths, progress_callback=progress)
            result["case_id"] = case_id
            result["status"] = "completed"
            result["created_at"] = case["created_at"]
            result["images"] = case["images"]
            self.case_store.save_result(case_id, result)
        except Exception as exc:
            logger.exception("Case execution failed")
            self.trace_logger.log("AnalysisService", "execution_failed", {"case_id": case_id, "error": str(exc)})
            self.case_store.set_failed(case_id, f"Analysis failed: {exc}")
