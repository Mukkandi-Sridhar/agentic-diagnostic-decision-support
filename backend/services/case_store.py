from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

from backend.config import Settings


class CaseStore:
    def __init__(self, settings: Settings) -> None:
        self.mode = settings.case_store_mode.lower()
        self.path = Path(settings.case_store_path)
        self.lock = Lock()
        self.memory_store: dict[str, Any] = {"cases": {}}
        if self.mode == "file":
            self.path.parent.mkdir(parents=True, exist_ok=True)
            if not self.path.exists():
                self.path.write_text(json.dumps({"cases": {}}, indent=2), encoding="utf-8")

    def _load(self) -> dict[str, Any]:
        if self.mode == "memory":
            return self.memory_store
        return json.loads(self.path.read_text(encoding="utf-8"))

    def _save(self, payload: dict[str, Any]) -> None:
        if self.mode == "memory":
            self.memory_store = payload
            return
        self.path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def create_case(self, case_id: str, patient_context: dict[str, Any], images: list[dict[str, Any]]) -> dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        record = {
            "case_id": case_id,
            "status": "queued",
            "patient_context": patient_context,
            "images": images,
            "progress": [
                {
                    "step": "queued",
                    "status": "queued",
                    "message": "Case accepted for analysis",
                    "timestamp": now,
                    "metadata": {},
                }
            ],
            "result": None,
            "created_at": now,
            "updated_at": now,
        }
        with self.lock:
            payload = self._load()
            payload["cases"][case_id] = record
            self._save(payload)
        return record

    def append_progress(self, case_id: str, step: str, status: str, message: str, metadata: dict[str, Any]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self.lock:
            payload = self._load()
            case = payload["cases"][case_id]
            case["status"] = "running" if status != "completed" else "completed"
            case["updated_at"] = now
            case["progress"].append(
                {
                    "step": step,
                    "status": status,
                    "message": message,
                    "timestamp": now,
                    "metadata": metadata,
                }
            )
            self._save(payload)

    def set_failed(self, case_id: str, error_message: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with self.lock:
            payload = self._load()
            case = payload["cases"][case_id]
            case["status"] = "failed"
            case["updated_at"] = now
            case["progress"].append(
                {
                    "step": "failed",
                    "status": "failed",
                    "message": error_message,
                    "timestamp": now,
                    "metadata": {},
                }
            )
            self._save(payload)

    def save_result(self, case_id: str, result: dict[str, Any]) -> str:
        now = datetime.now(timezone.utc).isoformat()
        with self.lock:
            payload = self._load()
            case = payload["cases"][case_id]
            case["status"] = "completed"
            case["updated_at"] = now
            result["updated_at"] = now
            case["result"] = result
            self._save(payload)
        return now

    def list_cases(self) -> list[dict[str, Any]]:
        payload = self._load()
        cases = list(payload["cases"].values())
        return sorted(cases, key=lambda item: item["updated_at"], reverse=True)

    def get_case(self, case_id: str) -> dict[str, Any] | None:
        payload = self._load()
        return payload["cases"].get(case_id)

    def stats(self) -> dict[str, Any]:
        cases = self.list_cases()
        completed = [case for case in cases if case["status"] == "completed" and case.get("result")]
        recent_diagnoses = []
        evidence_sources = 0
        for case in completed[:5]:
            result = case.get("result", {})
            if result.get("differentials"):
                recent_diagnoses.append(result["differentials"][0]["dx"])
            evidence_sources += len(result.get("citations", []))
        return {
            "total_analyses": len(cases),
            "completed_analyses": len(completed),
            "recent_diagnoses": recent_diagnoses,
            "evidence_sources_used": evidence_sources,
        }
