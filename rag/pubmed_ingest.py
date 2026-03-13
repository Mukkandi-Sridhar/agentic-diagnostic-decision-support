from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import httpx

from backend.config import Settings, get_settings


class PubMedIngestor:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.seed_path = Path("data/samples/pubmed_seed.json")

    def fetch_documents(self, query: str, limit: int = 8) -> list[dict[str, str]]:
        remote_docs = self._fetch_remote(query, limit * 2)
        seed_docs = self._load_seed_documents(query, limit)

        scored_remote = sorted(
            ((self.score_document(query, doc), doc) for doc in remote_docs),
            key=lambda item: item[0],
            reverse=True,
        )
        relevant_remote = [doc for score, doc in scored_remote if score >= 0.2]

        if not relevant_remote:
            return seed_docs[:limit]

        merged = self._merge_documents(relevant_remote, seed_docs)
        ranked = sorted(merged, key=lambda doc: self.score_document(query, doc), reverse=True)
        return ranked[:limit]

    def _fetch_remote(self, query: str, limit: int) -> list[dict[str, str]]:
        if not self.settings.pubmed_email:
            return []

        try:
            search_response = httpx.get(
                "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
                params={
                    "db": "pubmed",
                    "term": query,
                    "retmax": limit,
                    "retmode": "json",
                    "tool": self.settings.pubmed_tool,
                    "email": self.settings.pubmed_email,
                },
                timeout=20,
            )
            search_response.raise_for_status()
            ids = search_response.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                return []

            fetch_response = httpx.get(
                "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
                params={
                    "db": "pubmed",
                    "id": ",".join(ids),
                    "retmode": "xml",
                    "tool": self.settings.pubmed_tool,
                    "email": self.settings.pubmed_email,
                },
                timeout=20,
            )
            fetch_response.raise_for_status()
            return self._parse_pubmed_xml(fetch_response.text)
        except Exception:
            return []

    def _parse_pubmed_xml(self, xml_text: str) -> list[dict[str, str]]:
        root = ET.fromstring(xml_text)
        documents = []
        for article in root.findall(".//PubmedArticle"):
            pmid = article.findtext(".//PMID", default="")
            title = article.findtext(".//ArticleTitle", default="")
            abstract_parts = article.findall(".//AbstractText")
            abstract = " ".join(part.text.strip() for part in abstract_parts if part.text)
            journal = article.findtext(".//Journal/Title", default="")
            year = article.findtext(".//PubDate/Year", default="")
            doi = ""
            for id_node in article.findall(".//ArticleId"):
                if id_node.attrib.get("IdType") == "doi" and id_node.text:
                    doi = id_node.text
            if abstract:
                documents.append(
                    {
                        "pmid": pmid,
                        "doi": doi,
                        "year": year,
                        "journal": journal,
                        "title": title,
                        "content": abstract,
                        "quote": self._pick_quote(abstract),
                    }
                )
        return documents

    def _load_seed_documents(self, query: str, limit: int) -> list[dict[str, str]]:
        if not self.seed_path.exists():
            return []
        documents = json.loads(self.seed_path.read_text(encoding="utf-8"))
        ranked = [(self.score_document(query, document), document) for document in documents]
        ranked.sort(key=lambda item: item[0], reverse=True)
        selected = [doc for _, doc in ranked[:limit]]
        return [{**doc, "quote": self._pick_quote(doc["content"])} for doc in selected]

    def score_document(self, query: str, document: dict[str, str]) -> float:
        stopwords = {"acute", "evaluation", "emergency", "patient", "clinical", "case", "cases"}
        query_terms = {term for term in re.findall(r"[a-z0-9]+", query.lower()) if term not in stopwords and len(term) > 2}
        title = document.get("title", "").lower()
        content = document.get("content", "").lower()
        full_text = f"{title} {content}"
        text_terms = set(re.findall(r"[a-z0-9]+", full_text))

        overlap = len(query_terms & text_terms) / max(len(query_terms), 1)

        thoracic_terms = [
            "chest",
            "xray",
            "radiograph",
            "thoracic",
            "pulmonary",
            "pleural",
            "pneumothorax",
            "edema",
            "effusion",
            "pneumonia",
            "atelectasis",
            "dyspnea",
            "respiratory",
        ]
        diagnosis_terms = [term for term in query_terms if term in full_text]
        thoracic_hits = sum(1 for term in thoracic_terms if term in full_text)

        off_topic_terms = [
            "renal",
            "troponin",
            "aortic",
            "dissection",
            "tuberculosis",
            "pericardial",
            "embolism",
            "trauma",
            "subsegmental",
        ]
        off_topic_hits = sum(1 for term in off_topic_terms if term in full_text)

        score = overlap + (thoracic_hits * 0.08) + (len(diagnosis_terms) * 0.05) - (off_topic_hits * 0.1)
        if "case report" in title:
            score -= 0.08
        if thoracic_hits == 0:
            score -= 0.35
        return score

    def _merge_documents(self, primary: list[dict[str, str]], secondary: list[dict[str, str]]) -> list[dict[str, str]]:
        merged: list[dict[str, str]] = []
        seen_pmids: set[str] = set()
        for collection in (primary, secondary):
            for document in collection:
                pmid = document.get("pmid", "")
                if pmid and pmid not in seen_pmids:
                    merged.append(document)
                    seen_pmids.add(pmid)
        return merged

    def _pick_quote(self, content: str) -> str:
        sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", content) if sentence.strip()]
        return sentences[0] if sentences else content[:220]


def main() -> None:
    settings = get_settings()
    ingestor = PubMedIngestor(settings)
    documents = ingestor.fetch_documents("acute dyspnea pneumothorax chest x-ray", limit=5)
    output_path = Path("data/samples/pubmed_preview.json")
    output_path.write_text(json.dumps(documents, indent=2), encoding="utf-8")
    print(f"Wrote {len(documents)} documents to {output_path}")


if __name__ == "__main__":
    main()
