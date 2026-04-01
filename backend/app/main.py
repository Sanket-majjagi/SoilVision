"""
backend/app/main.py
FastAPI application entry point — SoilVision backend.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env before anything else reads os.getenv()
load_dotenv()

from app.routers import crops, soil, vision
from app.services.crop_recommender import get_recommender
from app.core.exceptions import setup_exception_handlers

# ---------------------------------------------------------------------------
# App version
# ---------------------------------------------------------------------------
VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Lifespan: load heavy resources at startup, clean up at shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — pre-load the Random Forest model into memory
    print("SoilVision: Loading ML model...")
    try:
        recommender = get_recommender()
        app.state.model_loaded = True
        print(
            f"SoilVision: ML model loaded successfully "
            f"({len(recommender.le.classes_)} crops)"
        )
    except FileNotFoundError as exc:
        app.state.model_loaded = False
        print(f"SoilVision WARNING: ML model not found — {exc}")
        print("SoilVision: Run ml/train.py to generate model artifacts.")

    yield

    # Shutdown — nothing to clean up
    print("SoilVision: Shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SoilVision API",
    description=(
        "AI-powered soil analysis for Indian farmers. "
        "Provides fertility scoring, crop recommendations, and fertilizer plans."
    ),
    version=VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS — allow all origins in dev; restrict in production via env var
# ---------------------------------------------------------------------------
import os
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = (
    ["*"] if allowed_origins_env == "*"
    else [o.strip() for o in allowed_origins_env.split(",")]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(soil.router,  prefix="/api/v1")
app.include_router(crops.router, prefix="/api/v1")
app.include_router(vision.router, prefix="/api/v1")

# Exception Setup
setup_exception_handlers(app)

# ---------------------------------------------------------------------------
# Health check (plan Section 4, Endpoint 1)
# ---------------------------------------------------------------------------
@app.get("/health", tags=["System"], summary="Service health check")
async def health_check():
    """
    GET /health
    Returns API status, version, and whether the ML model is loaded.
    """
    return {
        "status":       "ok",
        "version":      VERSION,
        "model_loaded": getattr(app.state, "model_loaded", False),
    }


# ---------------------------------------------------------------------------
# Root redirect to docs
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
async def root():
    return {"message": "SoilVision API v1.0 — visit /docs for interactive API docs"}
