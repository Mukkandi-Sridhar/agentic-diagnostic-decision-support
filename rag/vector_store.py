from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np

try:
    import faiss
except Exception:
    faiss = None


class VectorStore:
    def __init__(self, base_path: Path, dimension: int = 256) -> None:
        self.base_path = base_path
        self.dimension = dimension
        self.base_path.parent.mkdir(parents=True, exist_ok=True)
        self.index_path = self.base_path.with_suffix(".index")
        self.meta_path = self.base_path.with_suffix(".json")
        self.vectors_path = self.base_path.with_suffix(".npy")
        self.documents: list[dict[str, Any]] = []
        self.vectors = np.zeros((0, dimension), dtype="float32")
        self.index = faiss.IndexFlatIP(dimension) if faiss else None
        self.load()

    def embed_text(self, text: str) -> np.ndarray:
        vector = np.zeros(self.dimension, dtype="float32")
        for token in text.lower().split():
            bucket = hash(token) % self.dimension
            vector[bucket] += 1.0
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector /= norm
        return vector

    def add_documents(self, documents: list[dict[str, Any]]) -> None:
        if not documents:
            return
        new_vectors = np.stack([self.embed_text(doc["content"]) for doc in documents]).astype("float32")
        self.documents.extend(documents)
        self.vectors = np.vstack([self.vectors, new_vectors]) if len(self.vectors) else new_vectors
        if self.index is not None:
            self.index.add(new_vectors)
        self.save()

    def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        if not self.documents:
            return []

        query_vector = self.embed_text(query)
        if self.index is not None and self.index.ntotal:
            scores, indices = self.index.search(query_vector.reshape(1, -1), min(top_k, len(self.documents)))
            ranked = []
            for score, idx in zip(scores[0], indices[0], strict=False):
                if idx == -1:
                    continue
                ranked.append({**self.documents[idx], "vector_score": float(score)})
            return ranked

        scores = self.vectors @ query_vector
        ranked_indices = np.argsort(scores)[::-1][:top_k]
        return [{**self.documents[idx], "vector_score": float(scores[idx])} for idx in ranked_indices]

    def save(self) -> None:
        with self.meta_path.open("w", encoding="utf-8") as handle:
            json.dump(self.documents, handle, indent=2)
        np.save(self.vectors_path, self.vectors)
        if self.index is not None:
            faiss.write_index(self.index, str(self.index_path))

    def load(self) -> None:
        if self.meta_path.exists():
            self.documents = json.loads(self.meta_path.read_text(encoding="utf-8"))
        if self.vectors_path.exists():
            self.vectors = np.load(self.vectors_path).astype("float32")
        if self.index is not None and self.index_path.exists():
            self.index = faiss.read_index(str(self.index_path))
        elif self.index is not None and len(self.vectors):
            self.index = faiss.IndexFlatIP(self.dimension)
            self.index.add(self.vectors)

