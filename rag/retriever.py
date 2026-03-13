from __future__ import annotations

import re
from pathlib import Path

from backend.config import Settings
from rag.pubmed_ingest import PubMedIngestor
from rag.vector_store import VectorStore


class Retriever:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.ingestor = PubMedIngestor(settings)
        self.vector_store = VectorStore(Path(settings.vector_store_path))

    def hybrid_retrieve(self, query: str, top_k: int = 6) -> dict[str, object]:
        documents = self.ingestor.fetch_documents(query, limit=max(top_k, 8))
        existing_pmids = {doc["pmid"] for doc in self.vector_store.documents}
        new_docs = [doc for doc in documents if doc["pmid"] not in existing_pmids]
        self.vector_store.add_documents(new_docs)

        semantic_hits = self.vector_store.search(query, top_k=top_k * 2)
        query_terms = set(re.findall(r"[a-z0-9]+", query.lower()))

        rescored = []
        for doc in semantic_hits:
            lexical_terms = set(re.findall(r"[a-z0-9]+", doc["content"].lower()))
            lexical_score = len(query_terms & lexical_terms) / max(len(query_terms), 1)
            source_relevance = self.ingestor.score_document(query, doc)
            hybrid_score = (0.45 * doc.get("vector_score", 0.0)) + (0.25 * lexical_score) + (0.30 * source_relevance)
            if source_relevance >= 0.15:
                rescored.append(
                    {
                        **doc,
                        "lexical_score": lexical_score,
                        "source_relevance": source_relevance,
                        "hybrid_score": hybrid_score,
                    }
                )

        rescored.sort(key=lambda item: item["hybrid_score"], reverse=True)
        return {
            "documents": rescored[:top_k],
            "stats": {
                "indexed_documents": len(self.vector_store.documents),
                "new_documents_added": len(new_docs),
                "retrieved_candidates": len(rescored),
                "query": query,
            },
        }
