from __future__ import annotations

import json
from pathlib import Path

import httpx


def main() -> None:
    payload = json.loads(Path("data/samples/example_case.json").read_text(encoding="utf-8"))
    response = httpx.post("http://localhost:8000/analyze-case", json=payload, timeout=30)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))


if __name__ == "__main__":
    main()

