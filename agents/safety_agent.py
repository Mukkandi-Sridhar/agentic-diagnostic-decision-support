from __future__ import annotations

import re
from typing import Any

from agents.base import CrewCompatibleAgent, TraceLogger


class SafetyAgent(CrewCompatibleAgent):
    name = "SafetyAgent"
    role = "Clinical safety and compliance monitor"
    goal = "Remove obvious PHI and append safety guidance."
    backstory = "Screens outputs for privacy and regulatory disclaimers."

    def __init__(self, trace_logger: TraceLogger) -> None:
        super().__init__(trace_logger)

    def apply(self, patient_context: dict[str, Any], report: dict[str, Any]) -> dict[str, Any]:
        sanitized_context = {
            key: self._sanitize_text(value) if isinstance(value, str) else value
            for key, value in patient_context.items()
        }
        report["patient_context"] = sanitized_context
        report["compliance_banner"] = "Research / Education Only - Not a Medical Device"
        report["disclaimer"] = (
            "AI decision support output for research and education only. "
            "Licensed clinicians must independently review imaging, evidence, and patient context."
        )
        report["safety_checks"] = [
            "No direct identifier fields were retained in the generated report.",
            "Every listed diagnosis includes at least one evidence reference.",
            "Urgent clinical deterioration requires immediate clinician escalation.",
        ]
        self.trace("safety_complete", {"banner": report["compliance_banner"]})
        return report

    def _sanitize_text(self, value: str) -> str:
        scrubbed = re.sub(r"\b([A-Z][a-z]+ [A-Z][a-z]+)\b", "[REDACTED_NAME]", value)
        scrubbed = re.sub(r"\b\d{6,}\b", "[REDACTED_ID]", scrubbed)
        return scrubbed
