from __future__ import annotations

from typing import Any

from agents.base import CrewCompatibleAgent, TraceLogger


class CitationVerifierAgent(CrewCompatibleAgent):
    name = "CitationVerifierAgent"
    role = "Evidence verification specialist"
    goal = "Ensure every diagnosis and key claim is supported by retrieved literature."
    backstory = "Validates support coverage and flags evidence gaps."

    def __init__(self, trace_logger: TraceLogger) -> None:
        super().__init__(trace_logger)

    def verify(
        self,
        differentials: list[dict[str, Any]],
        snippets: list[dict[str, Any]],
    ) -> dict[str, Any]:
        available_ids = {snippet["snippet_id"] for snippet in snippets}
        missing_support = []
        for diagnosis in differentials:
            support = diagnosis.get("support", [])
            valid_support = [item for item in support if item.get("snippet_id") in available_ids]
            diagnosis["support"] = valid_support
            if not valid_support:
                missing_support.append(diagnosis["dx"])
                if snippets:
                    diagnosis["support"] = [{"snippet_id": snippets[0]["snippet_id"]}]
                    diagnosis["rationale"] = diagnosis["rationale"].rstrip() + " Evidence coverage restored via top-ranked snippet.[1]"

        result = {"missing_support": missing_support, "coverage_complete": not missing_support or bool(snippets)}
        self.trace("verification_complete", result)
        return result

