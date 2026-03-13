from __future__ import annotations

import base64
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from backend.config import Settings


class FileStore:
    def __init__(self, settings: Settings) -> None:
        self.root = Path(settings.upload_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    async def save_upload(self, upload: UploadFile) -> dict[str, str | int]:
        suffix = Path(upload.filename or "image.png").suffix or ".png"
        token = f"upl_{uuid4().hex}"
        destination = self.root / f"{token}{suffix}"
        content = await upload.read()
        destination.write_bytes(content)
        return {
            "file_token": token,
            "filename": upload.filename or destination.name,
            "content_type": upload.content_type or "application/octet-stream",
            "size_bytes": len(content),
        }

    def save_base64(self, encoded: str, image_id: str, extension: str = ".png") -> str:
        token = f"upl_{uuid4().hex}_{image_id}"
        destination = self.root / f"{token}{extension}"
        clean_payload = encoded.split(",", maxsplit=1)[-1]
        destination.write_bytes(base64.b64decode(clean_payload))
        return token

    def resolve(self, file_token: str) -> Path | None:
        matches = list(self.root.glob(f"{file_token}.*"))
        return matches[0] if matches else None
