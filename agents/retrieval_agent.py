from __future__ import annotations

from typing import Any

from agents.base import CrewCompatibleAgent, TraceLogger
from backend.config import Settings
from rag.retriever import Retriever


class RetrievalAgent(CrewCompatibleAgent):
    name = "RetrievalAgent"
    role = "Medical literature retrieval specialist"
    goal = "Retrieve evidence-grounded literature from PubMed and the vector store."
    backstory = "Indexes abstracts, searches them semantically, and returns citable snippets."

    def __init__(self, settings: Settings, retriever: Retriever, trace_logger: TraceLogger) -> None:
        super().__init__(trace_logger)
        self.settings = settings
        self.retriever = retriever

    def retrieve(self, patient_context: dict[str, Any], imaging_findings: dict[str, Any]) -> dict[str, Any]:
        query = self._build_query(patient_context, imaging_findings)
        result = self.retriever.hybrid_retrieve(query, top_k=6)
        snippets = []
        for index, doc in enumerate(result["documents"], start=1):
            snippets.append(
                {
                    "snippet_id": f"s{index}",
                    "pmid": doc["pmid"],
                    "doi": doc.get("doi", ""),
                    "quote": doc["quote"],
                    "journal": doc.get("journal", "Unknown"),
                    "year": doc.get("year", ""),
                    "title": doc.get("title", ""),
                }
            )
        payload = {"query": query, "result_count": len(snippets)}
        self.trace("retrieval_complete", payload)
        return {"query": query, "snippets": snippets, "rag_stats": result["stats"]}

    def _build_query(self, patient_context: dict[str, Any], imaging_findings: dict[str, Any]) -> str:
        complaint = patient_context.get("chief_complaint", "")
        ranked_findings = sorted(
            [
                (name.replace("_", " "), details.get("prob", 0))
                for name, details in imaging_findings.items()
                if isinstance(details, dict)
            ],
            key=lambda item: item[1],
            reverse=True,
        )
        finding_terms = [name for name, probability in ranked_findings if probability >= 0.25][:3]
        joined_findings = ", ".join(finding_terms) or "thoracic imaging differential"
        return f"{complaint} chest x-ray thoracic imaging {joined_findings}"
