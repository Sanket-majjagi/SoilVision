"""
backend/app/routers/soil.py
POST /api/v1/soil/analyze  — full 12-parameter soil analysis
POST /api/v1/soil/color-kit — NPK-only color kit analysis
Response format matches SOILVISION_PLAN.md Section 4 exactly.
"""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.schemas.soil import (
    ColorKitRequest,
    SoilAnalysisRequest,
    SoilAnalysisResponse,
)
from app.services.crop_recommender import get_recommender
from app.services.fertility import calculate_fertility_score
from app.services.fertilizer_calc import compute_fertilizer_plan, total_cost_from_plan

router = APIRouter(tags=["Soil Analysis"])

# ---------------------------------------------------------------------------
# Crops DB lookup — loaded once for season / ideal_ph enrichment
# ---------------------------------------------------------------------------
_DATA_DIR = Path(__file__).resolve().parents[1] / "data"

def _load_crops_lookup() -> dict[str, dict]:
    """Return dict keyed by crop name for quick O(1) lookup."""
    with open(_DATA_DIR / "crops_db.json", encoding="utf-8") as f:
        data = json.load(f)
    return {c["name"]: c for c in data["crops"]}

_CROPS_LOOKUP: dict[str, dict] = _load_crops_lookup()

# ---------------------------------------------------------------------------
# Color-kit mid-range conversions (plan Section 4, Endpoint 5)
# ---------------------------------------------------------------------------
_COLOR_KIT_VALUES: dict[str, dict[str, float]] = {
    "nitrogen":   {"Low": 140.0, "Medium": 420.0, "High": 700.0},
    "phosphorus": {"Low":   5.0, "Medium":  17.5, "High":  35.0},
    "potassium":  {"Low":  60.0, "Medium": 200.0, "High": 350.0},
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _enrich_crop_recommendations(raw_preds: list[dict]) -> list[dict]:
    """
    Add rank, season and ideal_ph from crops_db.json to each prediction.
    Crops not in crops_db (e.g. Kaggle-only names) get safe default values.
    """
    enriched = []
    for rank, pred in enumerate(raw_preds, start=1):
        crop_name = pred["crop"]
        meta = _CROPS_LOOKUP.get(crop_name, {})
        ph_min = meta.get("ideal_ph_min", "—")
        ph_max = meta.get("ideal_ph_max", "—")
        season = meta.get("season", "—")
        enriched.append({
            "rank":        rank,
            "crop":        crop_name,
            "probability": pred["probability"],
            "season":      season,
            "ideal_ph":    f"{ph_min}-{ph_max}" if ph_min != "—" else "—",
        })
    return enriched


def _build_response(
    soil_dict: dict,
    land_acres: float,
    climate: dict,
    input_method: str,
) -> dict:
    """Shared pipeline for both analyze and color-kit endpoints."""
    # 1. Fertility scoring
    fertility = calculate_fertility_score(soil_dict)

    # 2. Crop recommendations
    rec = get_recommender()
    raw_preds = rec.predict(
        n=soil_dict.get("nitrogen", 0),
        p=soil_dict.get("phosphorus", 0),
        k=soil_dict.get("potassium", 0),
        temperature=climate["temperature"],
        humidity=climate["humidity"],
        ph=soil_dict.get("ph", 7.0),
        rainfall=climate["rainfall"],
        top_n=5,
    )
    crops = _enrich_crop_recommendations(raw_preds)

    # 3. Fertilizer plan
    fert_recs = compute_fertilizer_plan(soil_dict, land_acres)
    total_cost = total_cost_from_plan(fert_recs)

    return {
        "session_id": str(uuid.uuid4()),
        "fertility":  fertility,
        "crop_recommendations": crops,
        "fertilizer_plan": {
            "land_size_acres":    land_acres,
            "recommendations":    fert_recs,
            "total_estimated_cost": total_cost,
        },
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/soil/analyze", summary="Full 12-parameter soil analysis")
async def analyze_soil(body: SoilAnalysisRequest) -> dict:
    """
    POST /api/v1/soil/analyze
    Accepts all 12 soil parameters + climate + land size.
    Returns fertility score, top-5 crop recommendations, fertilizer plan.
    """
    soil_dict = body.soil_data.model_dump()
    climate   = body.climate.model_dump()

    result = _build_response(
        soil_dict=soil_dict,
        land_acres=body.land_size_acres,
        climate=climate,
        input_method=body.input_method,
    )
    return result


@router.post("/soil/color-kit", summary="Color kit (NPK Low/Medium/High) analysis")
async def analyze_color_kit(body: ColorKitRequest) -> dict:
    """
    POST /api/v1/soil/color-kit
    Converts Low/Medium/High NPK readings to mid-range numeric values,
    then runs the same analysis pipeline as /soil/analyze.
    Micronutrient fields are not available from color kits (set to None).
    """
    readings = body.readings

    # Convert L/M/H → numeric mid-range (plan Section 4, Endpoint 5)
    soil_dict: dict[str, Any] = {
        "nitrogen":   _COLOR_KIT_VALUES["nitrogen"][readings.nitrogen],
        "phosphorus": _COLOR_KIT_VALUES["phosphorus"][readings.phosphorus],
        "potassium":  _COLOR_KIT_VALUES["potassium"][readings.potassium],
        "ph":         7.0,    # Unknown — use neutral default
        "ec":         0.5,    # Unknown — use normal default
        "organic_carbon": 0.5,
        # Micronutrients unknown from color kit — use sufficient defaults
        "sulphur":   10.0,
        "zinc":       1.0,
        "iron":       5.0,
        "copper":     0.5,
        "manganese":  3.0,
        "boron":      0.3,
    }

    climate = body.climate.model_dump()

    result = _build_response(
        soil_dict=soil_dict,
        land_acres=body.land_size_acres,
        climate=climate,
        input_method="color_kit",
    )
    return result
