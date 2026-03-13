from __future__ import annotations

from pathlib import Path
from typing import Any, Callable

from agents.base import CrewCompatibleAgent, TraceLogger
from agents.citation_verifier_agent import CitationVerifierAgent
from agents.diagnosis_agent import DiagnosisAgent
from agents.retrieval_agent import RetrievalAgent
from agents.safety_agent import SafetyAgent
from agents.vision_agent import VisionAgent

ProgressCallback = Callable[[str, str, dict[str, Any] | None], None]


class OrchestratorAgent(CrewCompatibleAgent):
    name = "OrchestratorAgent"
    role = "Agent workflow coordinator"
    goal = "Coordinate image analysis, retrieval, reasoning, citation coverage, and safety checks."
    backstory = "Supervises the end-to-end diagnostic support workflow."

    def __init__(
        self,
        trace_logger: TraceLogger,
        vision_agent: VisionAgent,
        retrieval_agent: RetrievalAgent,
        diagnosis_agent: DiagnosisAgent,
        citation_verifier_agent: CitationVerifierAgent,
        safety_agent: SafetyAgent,
    ) -> None:
        super().__init__(trace_logger)
        self.vision_agent = vision_agent
        self.retrieval_agent = retrieval_agent
        self.diagnosis_agent = diagnosis_agent
        self.citation_verifier_agent = citation_verifier_agent
        self.safety_agent = safety_agent

    def analyze_case(
        self,
        patient_context: dict[str, Any],
        image_paths: list[Path],
        progress_callback: ProgressCallback | None = None,
    ) -> dict[str, Any]:
        self._update(progress_callback, "vision", "running", {"message": "Vision Agent analyzing X-ray"})
        imaging_payload = self.vision_agent.analyze(image_paths, patient_context)

        self._update(progress_callback, "retrieval", "running", {"message": "Retrieval Agent searching PubMed"})
        retrieval_payload = self.retrieval_agent.retrieve(patient_context, imaging_payload["imaging_findings"])

        self._update(progress_callback, "diagnosis", "running", {"message": "Diagnosis Agent generating differential"})
        diagnosis_payload = self.diagnosis_agent.generate(
            patient_context,
            imaging_payload["imaging_findings"],
            retrieval_payload["snippets"],
        )

        self._update(progress_callback, "citation_verifier", "running", {"message": "Verifying evidence coverage"})
        verification = self.citation_verifier_agent.verify(
            diagnosis_payload["differentials"],
            retrieval_payload["snippets"],
        )

        if verification["missing_support"] and retrieval_payload["snippets"]:
            self.trace("verification_gap", verification)

        report = {
            "imaging_findings": imaging_payload["imaging_findings"],
            "differentials": diagnosis_payload["differentials"],
            "red_flags": diagnosis_payload["red_flags"],
            "next_steps": diagnosis_payload["next_steps"],
            "citations": retrieval_payload["snippets"],
            "overlays": imaging_payload["overlays"],
            "diagnostic_summary": diagnosis_payload["diagnostic_summary"],
            "rag_stats": retrieval_payload["rag_stats"],
        }

        self._update(progress_callback, "safety", "running", {"message": "Applying privacy and safety checks"})
        safe_report = self.safety_agent.apply(patient_context, report)
        self._update(progress_callback, "complete", "completed", {"message": "Case analysis complete"})
        self.trace("orchestration_complete", {"citation_count": len(safe_report["citations"])})
        return safe_report

    def _update(
        self,
        callback: ProgressCallback | None,
        step: str,
        status: str,
        payload: dict[str, Any] | None = None,
    ) -> None:
        if callback:
            callback(step, status, payload or {})
        self.trace("progress_update", {"step": step, "status": status, "payload": payload or {}})
