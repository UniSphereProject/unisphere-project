from __future__ import annotations

import io
import threading

from app.utils.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Module-level caches — models are heavy (~100-600 MB), load them once.
_text_model = None
_image_model = None
_load_lock = threading.Lock()


def get_text_model():
    """Return the (cached) Sentence-BERT model, loading it on first use."""
    global _text_model
    if _text_model is None:
        with _load_lock:
            if _text_model is None:
                from sentence_transformers import SentenceTransformer

                logger.info("Loading SBERT model '%s' ...", settings.SBERT_MODEL_NAME)
                _text_model = SentenceTransformer(settings.SBERT_MODEL_NAME)
                logger.info("SBERT model loaded")
    return _text_model


def get_image_model():
    """Return the (cached) CLIP model, loading it on first use."""
    global _image_model
    if _image_model is None:
        with _load_lock:
            if _image_model is None:
                from sentence_transformers import SentenceTransformer

                logger.info("Loading CLIP model '%s' ...", settings.CLIP_MODEL_NAME)
                _image_model = SentenceTransformer(settings.CLIP_MODEL_NAME)
                logger.info("CLIP model loaded")
    return _image_model


def build_post_text(title: str, body: str | None, location: str | None) -> str:
    """Combine the relevant text fields of a post into one string for SBERT."""
    parts = [title.strip()]
    if body:
        parts.append(body.strip())
    if location:
        parts.append(f"Location: {location.strip()}")
    return ". ".join(p for p in parts if p)


def embed_text(text: str) -> list[float]:
    """Encode text with Sentence-BERT. Returns a normalised 384-dim vector."""
    model = get_text_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def embed_image(image_bytes: bytes) -> list[float] | None:
    """Encode an image with CLIP. Returns a normalised 512-dim vector.

    Returns None (and logs) when the bytes cannot be decoded as an image
    so a single corrupt upload never breaks a whole scheduler run.
    """
    from PIL import Image

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        logger.warning("Could not decode image for embedding: %s", exc)
        return None

    model = get_image_model()
    vector = model.encode(image, normalize_embeddings=True)
    return vector.tolist()
