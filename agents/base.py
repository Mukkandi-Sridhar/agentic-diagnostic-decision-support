from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from crewai import Agent as CrewAgent
except Exception:
    CrewAgent = None


@dataclass
class TraceLogger:
    trace_path: Path

    def log(self, agent: str, event: str, payload: dict[str, Any]) -> None:
        self.trace_path.parent.mkdir(parents=True, exist_ok=True)
        line = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent": agent,
            "event": event,
            "payload": payload,
        }
        with self.trace_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(line) + "\n")


class CrewCompatibleAgent:
    name = "Agent"
    role = "Medical AI agent"
    goal = "Support diagnostic decision making."
    backstory = "A specialized medical agent in a multi-agent workflow."

    def __init__(self, trace_logger: TraceLogger) -> None:
        self.trace_logger = trace_logger

    def trace(self, event: str, payload: dict[str, Any]) -> None:
        self.trace_logger.log(self.name, event, payload)

    def to_crewai_agent(self) -> Any | None:
        if CrewAgent is None:
            return None
        return CrewAgent(
            role=self.role,
            goal=self.goal,
            backstory=self.backstory,
            allow_delegation=False,
            verbose=False,
        )

