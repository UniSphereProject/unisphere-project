

from __future__ import annotations

import io
import uuid
from supabase import create_client, Client

from app.utils.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


MAX_IMAGE_SIZE = 10 * 1024 * 1024      # 10 MB
MAX_FILE_SIZE = 50 * 1024 * 1024       # 50 MB

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

ALLOWED_FILE_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
    "application/msword",            # .doc
    "application/vnd.ms-powerpoint", # .ppt
    "text/plain",                    # .txt
}

PRESIGNED_URL_EXPIRY_SECONDS = 60 * 15  # 15 minutes


class SupabaseStorageClient:

    def __init__(self):
        self._client: Client | None = None

    @property
    def client(self) -> Client:
        if self._client is None:
            self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return self._client

    @property
    def bucket(self):
        return self.client.storage.from_(settings.SUPABASE_BUCKET)

    # ── Upload ──────────────────────────────────────────────────────

    def upload_file(
        self,
        file_data: bytes | io.BytesIO,
        filename: str,
        content_type: str,
        prefix: str = "images",
        max_size: int = MAX_IMAGE_SIZE,
        allowed_types: set[str] | None = None,
    ) -> dict:
        """
        Upload a file to Supabase Storage.

        dict with keys: key, url, file_name, file_size, file_type

        Raises:
            ValueError: If file is too large or has an invalid MIME type
            Exception:  If the Supabase upload call fails
        """
        allowed = allowed_types or ALLOWED_IMAGE_TYPES
        if content_type not in allowed:
            raise ValueError(
                f"File type '{content_type}' is not allowed. "
                f"Accepted: {', '.join(sorted(allowed))}"
            )

        data = file_data.getvalue() if isinstance(file_data, io.BytesIO) else file_data

        if len(data) > max_size:
            max_mb = max_size // (1024 * 1024)
            raise ValueError(f"File too large. Max {max_mb}MB for this upload type.")

        short_uuid = uuid.uuid4().hex[:8]
        safe_name = "".join(c if c.isalnum() or c in ".-" else "_" for c in filename)
        key = f"{prefix}/{short_uuid}_{safe_name}"

        try:
            self.bucket.upload(
                path=key,
                file=data,
                file_options={"content-type": content_type},
            )
        except Exception:
            logger.exception("Supabase upload failed for %s", key)
            raise

        logger.info("Uploaded %s (%d bytes) → %s", key, len(data), settings.SUPABASE_BUCKET)

        presigned_url = self.get_presigned_url(key, PRESIGNED_URL_EXPIRY_SECONDS)

        return {
            "key": key,
            "url": presigned_url,
            "file_name": filename,
            "file_size": len(data),
            "file_type": content_type,
        }

    # ── Presigned / signed URL ────────────────────────────────────

    def get_presigned_url(self, key: str, expires: int = PRESIGNED_URL_EXPIRY_SECONDS) -> str:
        """
        Generate a signed URL for a private bucket object.
        """
        result = self.bucket.create_signed_url(key, expires)
        # supabase-py has changed this key's casing across versions, so check all of them
        url = result.get("signedURL") or result.get("signedUrl") or result.get("signed_url")
        if not url:
            raise RuntimeError(f"Could not create signed URL for {key}: {result}")
        return url

    def get_public_url(self, key: str) -> str:

        return self.bucket.get_public_url(key)

    # ── Delete ─────────────────────────────────────────────────────

    def delete_file(self, key: str) -> None:
        """Delete an object from Supabase Storage (e.g., when a post is deleted)."""
        if not key:
            return
        try:
            self.bucket.remove([key])
            logger.info("Deleted %s from %s", key, settings.SUPABASE_BUCKET)
        except Exception as exc:
            logger.warning("Failed to delete %s: %s", key, exc)


# ── Singleton instance ────────────────────────────────────────────

supabase_client = SupabaseStorageClient()