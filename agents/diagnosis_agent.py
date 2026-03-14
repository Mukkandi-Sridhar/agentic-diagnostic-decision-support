from __future__ import annotations

import json
import re
from typing import Any

import httpx

from agents.base import CrewCompatibleAgent, TraceLogger
from backend.config import Settings


class DiagnosisAgent(CrewCompatibleAgent):
    name = "DiagnosisAgent"
    role = "Diagnostic reasoning specialist"
    goal = "Synthesize patient context, imaging findings, and literature into prioritized diagnoses."
    backstory = "Produces differential diagnoses, rationale, red flags, and next steps."

    def __init__(self, settings: Settings, trace_logger: TraceLogger) -> None:
        super().__init__(trace_logger)
        self.settings = settings

    def generate(
        self,
        patient_context: dict[str, Any],
        imaging_findings: dict[str, Any],
        snippets: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if self.settings.use_remote_models:
            remote = self._call_gemini(patient_context, imaging_findings, snippets)
            if remote and self._validate_remote_response(remote, snippets):
                self.trace("diagnosis_complete", {"mode": "remote", "count": len(remote.get("differentials", []))})
                return remote

        response = self._heuristic_diagnosis(patient_context, imaging_findings, snippets)
        self.trace("diagnosis_complete", {"mode": "local", "count": len(response["differentials"])})
        return response

    def _heuristic_diagnosis(
        self,
        patient_context: dict[str, Any],
        imaging_findings: dict[str, Any],
        snippets: list[dict[str, Any]],
    ) -> dict[str, Any]:
        top_snippet = snippets[0]["snippet_id"] if snippets else None
        alt_snippet = snippets[1]["snippet_id"] if len(snippets) > 1 else top_snippet
        pneumothorax = imaging_findings.get("pneumothorax", {})
        pleural_effusion = imaging_findings.get("pleural_effusion", {})
        consolidation = imaging_findings.get("consolidation", {})
        complaint = " ".join(
            str(patient_context.get(key, "")) for key in ("chief_complaint", "history", "vitals", "labs")
        ).lower()
        focal_location = str(consolidation.get("location", "focal lung"))
        infectious_features = any(term in complaint for term in ("fever", "cough", "productive", "infection"))

        if pneumothorax.get("prob", 0) >= 0.5:
            differentials = [
                {
                    "dx": "Right Pneumothorax",
                    "icd10": "J93.9",
                    "rationale": "Abrupt dyspnea plus absent peripheral lung markings and apical pleural line suggest pneumothorax.[1]",
                    "support": [{"snippet_id": top_snippet}] if top_snippet else [],
                },
                {
                    "dx": "Secondary Pneumothorax due to COPD",
                    "icd10": "J44.9",
                    "rationale": "Underlying lung disease can predispose to spontaneous pneumothorax and worsen hypoxemia.[2]",
                    "support": [{"snippet_id": alt_snippet}] if alt_snippet else [],
                },
                {
                    "dx": "Pulmonary Embolism",
                    "icd10": "I26.99",
                    "rationale": "Persistent dyspnea with chest pain remains a competing urgent diagnosis if imaging or clinical course is discordant.[3]",
                    "support": [{"snippet_id": top_snippet}] if top_snippet else [],
                },
            ]
            red_flags = [
                "Escalate urgently if hypotension, severe hypoxemia, or tracheal deviation suggest tension physiology.",
                "Monitor for worsening respiratory distress after transport or positive-pressure ventilation.",
            ]
            next_steps = [
                "Obtain immediate bedside reassessment and pulse oximetry trend.",
                "Consider repeat chest imaging or ultrasound if symptoms worsen.",
                "Discuss chest tube versus observation based on size, symptoms, and oxygen needs.",
            ]
            summary = "Imaging and literature support a pneumothorax-focused differential with urgent escalation triggers."
        elif consolidation.get("prob", 0) >= 0.35 or infectious_features:
            differentials = [
                {
                    "dx": "Focal Pneumonia",
                    "icd10": "J18.9",
                    "rationale": f"A focal opacity in the {focal_location} is most compatible with pneumonia when paired with respiratory symptoms.[1]",
                    "support": [{"snippet_id": top_snippet}] if top_snippet else [],
                },
                {
                    "dx": "Parapneumonic Effusion",
                    "icd10": "J91.8",
                    "rationale": "Small adjacent pleural fluid can accompany focal inflammatory air-space disease.[2]",
                    "support": [{"snippet_id": alt_snippet}] if alt_snippet else [],
                },
                {
                    "dx": "Atelectasis",
                    "icd10": "J98.11",
                    "rationale": "Subsegmental collapse remains a competing explanation for a focal opacity, especially if inspiration is shallow.[3]",
                    "support": [{"snippet_id": top_snippet}] if top_snippet else [],
                },
            ]
            red_flags = [
                "Escalate if sepsis criteria, rising oxygen requirement, or multilobar disease develops.",
                "Evaluate for pleural drainage if loculation or empyema is suspected.",
            ]
            next_steps = [
                "Correlate with CBC, lactate, and microbiology studies.",
                "Repeat imaging if the patient does not improve after therapy.",
                "Assess aspiration risk and antimicrobial coverage needs.",
            ]
            summary = f"The image pattern is most consistent with a focal air-space opacity in the {focal_location}, with infection favored over collapse."
        elif pleural_effusion.get("prob", 0) >= 0.35:
            laterality = pleural_effusion.get("laterality", "pleural")
            differentials = [
                {
                    "dx": "Pleural Effusion",
                    "icd10": "J90",
                    "rationale": f"A {laterality} pleural fluid pattern can explain dyspnea and reduced lung expansion.[1]",
                    "support": [{"snippet_id": top_snippet}] if top_snippet else [],
                },
                {
                    "dx": "Basilar Atelectasis",
                    "icd10": "J98.11",
                    "rationale": "Adjacent dependent collapse often accompanies pleural fluid and may contribute to the opacity.[2]",
                    "support": [{"snippet_id": alt_snippet}] if alt_snippet else [],
                },
                {
                    "dx": "Focal Pneumonia",
                    "icd10": "J18.9",
                    "rationale": "Parapneumonic fluid remains possible if there are infectious symptoms or focal air-space changes.[3]",
                    "support": [{"snippet_id": top_snippet}] if top_snippet else [],
                },
            ]
            red_flags = [
                "Escalate if there is severe hypoxemia, hemodynamic instability, or concern for empyema.",
            ]
            next_steps = [
                "Correlate with bedside ultrasound to confirm fluid and estimate size.",
                "Assess for infection, heart failure, or malignancy based on the clinical context.",
                "Repeat imaging if respiratory symptoms worsen.",
            ]
            summary = "The image pattern suggests pleural fluid with adjacent compressive change, and bedside correlation is needed."
        else:
            differentials = [
                {
                    "dx": "Abnormal Chest Imaging Finding",
                    "icd10": "R91.8",
                    "rationale": "The uploaded image shows a non-specific thoracic opacity pattern that needs clinical and radiology correlation.[1]",
                    "support": [{"snippet_id": top_snippet}] if top_snippet else [],
                },
                {
                    "dx": "Basilar Atelectasis",
                    "icd10": "J98.11",
                    "rationale": "Low-volume collapse can create a subtle opacity when inspiratory effort is limited.[2]",
                    "support": [{"snippet_id": alt_snippet}] if alt_snippet else [],
                },
                {
                    "dx": "Focal Pneumonia",
                    "icd10": "J18.9",
                    "rationale": "Early infectious air-space disease remains possible if symptoms evolve toward cough, fever, or rising oxygen need.[3]",
                    "support": [{"snippet_id": top_snippet}] if top_snippet else [],
                },
            ]
            red_flags = [
                "Escalate if there is severe hypoxemia, hemodynamic instability, or rapidly worsening dyspnea.",
            ]
            next_steps = [
                "Compare with the formal radiology read if available.",
                "Correlate with oxygen saturation, exam findings, and symptom evolution.",
                "Repeat chest imaging or ultrasound if the clinical picture changes.",
            ]
            summary = "The image pattern is non-specific, so the answer should be treated as a conservative differential rather than a definitive diagnosis."

        return {
            "differentials": differentials,
            "red_flags": red_flags,
            "next_steps": next_steps,
            "diagnostic_summary": summary,
        }

    def _call_gemini(
        self,
        patient_context: dict[str, Any],
        imaging_findings: dict[str, Any],
        snippets: list[dict[str, Any]],
    ) -> dict[str, Any] | None:
        if not self.settings.gemini_api_key:
            return self._call_openai(patient_context, imaging_findings, snippets)

        prompt = {
            "patient_context": patient_context,
            "imaging_findings": imaging_findings,
            "retrieved_snippets": snippets,
            "instructions": (
                "Return JSON with keys differentials, red_flags, next_steps, diagnostic_summary. "
                "Differentials should include dx, icd10, rationale, and support. "
                "Only produce thoracic or cardiopulmonary diagnoses that are grounded in the imaging findings and the retrieved snippets. "
                "Do not use unrelated evidence. Each support entry must reference an existing snippet_id from retrieved_snippets. "
                "If the evidence is weak, stay conservative and say so in the rationale."
            ),
        }
        try:
            response = httpx.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
                params={"key": self.settings.gemini_api_key},
                json={"contents": [{"parts": [{"text": json.dumps(prompt)}]}]},
                timeout=30,
            )
            response.raise_for_status()
            text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            return self._parse_json_payload(text)
        except Exception as exc:
            self.trace("remote_model_error", {"provider": "gemini", "error": str(exc)})
            return self._call_openai(patient_context, imaging_findings, snippets)

    def _call_openai(
        self,
        patient_context: dict[str, Any],
        imaging_findings: dict[str, Any],
        snippets: list[dict[str, Any]],
    ) -> dict[str, Any] | None:
        if not self.settings.openai_api_key:
            return None
        try:
            response = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.settings.openai_api_key}"},
                json={
                    "model": "gpt-4o",
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a diagnostic assistant. Return JSON with differentials, red_flags, "
                                "next_steps, and diagnostic_summary."
                            ),
                        },
                        {
                            "role": "user",
                            "content": json.dumps(
                                {
                                    "patient_context": patient_context,
                                    "imaging_findings": imaging_findings,
                                    "retrieved_snippets": snippets,
                                }
                            ),
                        },
                    ],
                },
                timeout=30,
            )
            response.raise_for_status()
            text = response.json()["choices"][0]["message"]["content"]
            return self._parse_json_payload(text)
        except Exception as exc:
            self.trace("remote_model_error", {"provider": "openai", "error": str(exc)})
            return None

    def _validate_remote_response(self, response: dict[str, Any], snippets: list[dict[str, Any]]) -> bool:
        snippet_ids = {snippet["snippet_id"] for snippet in snippets}
        differentials = response.get("differentials")
        if not isinstance(differentials, list) or not differentials:
            return False

        for diagnosis in differentials:
            if not all(key in diagnosis for key in ("dx", "icd10", "rationale", "support")):
                return False
            support = diagnosis.get("support", [])
            if not isinstance(support, list):
                return False
            for item in support:
                if item.get("snippet_id") not in snippet_ids:
                    return False
        return True

    def _parse_json_payload(self, text: str) -> dict[str, Any] | None:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", text, re.DOTALL)
            if not match:
                return None
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
