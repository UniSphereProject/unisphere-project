# ── Campus Connect backend ─────────────────────────────────────────
# Works on both amd64 (Linux/Windows PCs, Intel Macs) and arm64
# (Apple Silicon Macs) — see docs/docker/02-cross-platform-amd64-arm64.md
FROM python:3.11-slim

# Prevents .pyc clutter + makes logs appear immediately
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# ── Dependency layer (cached until requirements.txt changes) ──────
COPY requirements.txt .

# Install the CPU-only torch wheel FIRST. Without this, pip pulls the
# default CUDA build of torch: ~4-6 GB of NVIDIA libraries that are
# useless in a container without a GPU. CPU wheel is ~200 MB.
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install -r requirements.txt

# ── (Optional but recommended) bake the AI models into the image ──
# Downloads SBERT (~90 MB) + CLIP (~600 MB) at BUILD time so the first
# matching run doesn't stall for minutes downloading from HuggingFace.
# Comment out for a slimmer image if you don't need AI matching.
RUN python -c "from sentence_transformers import SentenceTransformer; \
    SentenceTransformer('all-MiniLM-L6-v2'); \
    SentenceTransformer('clip-ViT-B-32')"

# ── App code (changes most often → last layer) ─────────────────────
COPY . .

EXPOSE 8000

# main.py sits at /app/main.py and exposes `app`
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]