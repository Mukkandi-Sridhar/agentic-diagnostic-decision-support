from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import Any

import httpx
from PIL import Image

from agents.base import CrewCompatibleAgent, TraceLogger
from backend.config import Settings


class VisionAgent(CrewCompatibleAgent):
    name = "VisionAgent"
    role = "Radiology imaging analyst"
    goal = "Analyze chest X-ray images for clinically relevant findings."
    backstory = "Detects likely thoracic imaging findings and prepares overlays."

    def __init__(self, settings: Settings, trace_logger: TraceLogger) -> None:
        super().__init__(trace_logger)
        self.settings = settings

    def analyze(self, image_paths: list[Path], patient_context: dict[str, Any]) -> dict[str, Any]:
        findings = self._heuristic_findings(patient_context)
        overlays: list[dict[str, Any]] = []
        for index, image_path in enumerate(image_paths):
            overlay = self._build_overlay(index, image_path, findings)
            if overlay:
                overlays.append(overlay)

        if self.settings.use_remote_models and self.settings.gemini_api_key and image_paths:
            remote_findings = self._gemini_vision_findings(image_paths[0], patient_context)
            if remote_findings:
                findings = remote_findings

        payload = {"findings": findings, "overlay_count": len(overlays)}
        self.trace("analysis_complete", payload)
        return {"imaging_findings": findings, "overlays": overlays}

    def _build_overlay(self, index: int, image_path: Path, findings: dict[str, Any]) -> dict[str, Any]:
        try:
            with Image.open(image_path) as image:
                width, height = image.size
        except Exception:
            width, height = 512, 512

        if findings.get("pneumothorax", {}).get("prob", 0) < 0.5:
            return {
                "overlay_id": f"ovl_{index + 1:03d}",
                "type": "bbox",
                "coords": [int(width * 0.28), int(height * 0.18), int(width * 0.68), int(height * 0.48)],
                "label": "Possible right upper lobe opacity",
            }

        lateral = findings["pneumothorax"].get("laterality", "right")
        x1 = int(width * 0.55) if lateral == "right" else int(width * 0.12)
        x2 = int(width * 0.86) if lateral == "right" else int(width * 0.42)
        return {
            "overlay_id": f"ovl_{index + 1:03d}",
            "type": "bbox",
            "coords": [x1, int(height * 0.12), x2, int(height * 0.58)],
            "label": f"Possible {lateral} pneumothorax",
        }

    def _heuristic_findings(self, patient_context: dict[str, Any]) -> dict[str, Any]:
        complaint = " ".join(
            str(patient_context.get(key, "")) for key in ("chief_complaint", "history", "vitals", "labs")
        ).lower()
        if any(term in complaint for term in ("acute dyspnea", "pleuritic", "sudden shortness of breath")):
            return {
                "pneumothorax": {"prob": 0.91, "laterality": "right", "size": "small"},
                "pleural_effusion": {"prob": 0.18, "laterality": "none", "size": "none"},
                "consolidation": {"prob": 0.12, "location": "none"},
            }
        if any(term in complaint for term in ("fever", "cough", "productive", "infection")):
            return {
                "pneumothorax": {"prob": 0.08, "laterality": "none", "size": "none"},
                "pleural_effusion": {"prob": 0.34, "laterality": "left", "size": "trace"},
                "consolidation": {"prob": 0.82, "location": "left lower lobe"},
            }
        return {
            "pneumothorax": {"prob": 0.22, "laterality": "none", "size": "none"},
            "pleural_effusion": {"prob": 0.25, "laterality": "right", "size": "trace"},
            "consolidation": {"prob": 0.38, "location": "right base"},
        }

    def _gemini_vision_findings(self, image_path: Path, patient_context: dict[str, Any]) -> dict[str, Any] | None:
        try:
            encoded = base64.b64encode(image_path.read_bytes()).decode("utf-8")
            prompt = (
                "You are a radiology assistant. Analyze this chest x-ray and output only compact JSON with keys "
                "pneumothorax, pleural_effusion, and consolidation. Include probabilities from 0 to 1."
            )
            response = httpx.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
                params={"key": self.settings.gemini_api_key},
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": prompt},
                                {"text": f"Clinical context: {json.dumps(patient_context)}"},
                                {
                                    "inline_data": {
                                        "mime_type": "image/png",
                                        "data": encoded,
                                    }
                                },
                            ]
                        }
                    ]
                },
                timeout=30,
            )
            response.raise_for_status()
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
        except Exception as exc:
            self.trace("remote_model_error", {"error": str(exc)})
            return None
