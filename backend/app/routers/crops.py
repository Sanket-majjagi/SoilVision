"""
backend/app/routers/crops.py
POST /api/v1/crops/check — specific crop suitability check.
Response format matches SOILVISION_PLAN.md Section 4 Endpoint 4 exactly.
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.schemas.soil import CropCheckRequest

router = APIRouter(tags=["Crop Check"])

# ---------------------------------------------------------------------------
# Load crops_db.json once at import time
# ---------------------------------------------------------------------------
_DATA_DIR = Path(__file__).resolve().parents[1] / "data"

with open(_DATA_DIR / "crops_db.json", encoding="utf-8") as _f:
    _CROPS_DB: dict = json.load(_f)

_CROPS_BY_NAME: dict[str, dict] = {c["name"]: c for c in _CROPS_DB["crops"]}


# ---------------------------------------------------------------------------
# Suitability scoring logic
# ---------------------------------------------------------------------------

def _param_status_npk(
    value: float,
    ideal_min: float,
    ideal_max: float,
    unit: str,
    label: str,
) -> tuple[str, int]:
    """
    Score a single NPK parameter (0-20 points).
    Returns (status_text, points).
    """
    if ideal_min <= value <= ideal_max:
        return f"Within range ✓", 20
    elif value > ideal_max:
        return f"Above ideal but OK", 15
    else:
        # Below ideal
        return f"Below ideal — needs improvement", 8


def _ph_status(value: float, ph_min: float, ph_max: float) -> tuple[str, int]:
    if ph_min <= value <= ph_max:
        return "Within range ✓", 20
    gap = min(abs(value - ph_min), abs(value - ph_max))
    if gap <= 0.5:
        return "Slightly outside ideal range", 12
    return "Outside ideal pH range", 5


def _ec_status(value: float, max_ec: float) -> tuple[str, int]:
    if value <= max_ec:
        return "Safe ✓", 20
    return "Too high — may stress crop", 0


def _compute_suitability(crop: dict, soil: dict) -> tuple[int, bool, dict, list[str]]:
    """
    Score the given soil against the crop's ideal conditions.

    Returns:
        (score_0_100, suitable_bool, ideal_conditions_dict, deficiency_fixes_list)
    """
    points = 0
    ideal_conditions: dict = {}
    fixes: list[str] = []

    n = float(soil.get("nitrogen", 0))
    p = float(soil.get("phosphorus", 0))
    k = float(soil.get("potassium", 0))
    ph = float(soil.get("ph", 7.0))
    ec = float(soil.get("ec", 0.5))

    # Nitrogen
    status_n, pts_n = _param_status_npk(n, crop["ideal_n_min"], crop["ideal_n_max"], "kg/ha", "Nitrogen")
    points += pts_n
    ideal_conditions["nitrogen"] = {
        "ideal": f"{crop['ideal_n_min']}-{crop['ideal_n_max']} kg/ha",
        "yours": n,
        "status": status_n,
    }
    if pts_n < 15:
        fixes.append(
            f"Apply Urea to bring Nitrogen closer to {crop['ideal_n_min']}-{crop['ideal_n_max']} kg/ha"
        )

    # Phosphorus
    status_p, pts_p = _param_status_npk(p, crop["ideal_p_min"], crop["ideal_p_max"], "kg/ha", "Phosphorus")
    points += pts_p
    ideal_conditions["phosphorus"] = {
        "ideal": f"{crop['ideal_p_min']}-{crop['ideal_p_max']} kg/ha",
        "yours": p,
        "status": status_p,
    }
    if pts_p < 15:
        needed = crop["ideal_p_min"] - p
        ssp_per_acre = round((needed / 0.16) / 2.471, 1) if needed > 0 else 0
        if ssp_per_acre > 0:
            fixes.append(f"Apply {ssp_per_acre} kg SSP per acre to bring Phosphorus to adequate level")

    # Potassium
    status_k, pts_k = _param_status_npk(k, crop["ideal_k_min"], crop["ideal_k_max"], "kg/ha", "Potassium")
    points += pts_k
    ideal_conditions["potassium"] = {
        "ideal": f"{crop['ideal_k_min']}-{crop['ideal_k_max']} kg/ha",
        "yours": k,
        "status": status_k,
    }
    if pts_k < 15:
        fixes.append(
            f"Apply MOP to bring Potassium closer to {crop['ideal_k_min']}-{crop['ideal_k_max']} kg/ha"
        )

    # pH
    status_ph, pts_ph = _ph_status(ph, crop["ideal_ph_min"], crop["ideal_ph_max"])
    points += pts_ph
    ideal_conditions["ph"] = {
        "ideal": f"{crop['ideal_ph_min']}-{crop['ideal_ph_max']}",
        "yours": ph,
        "status": status_ph,
    }
    if pts_ph < 20:
        if ph < crop["ideal_ph_min"]:
            fixes.append("Apply 2-4 quintal/acre lime to raise soil pH")
        elif ph > crop["ideal_ph_max"]:
            fixes.append("Apply 2-3 quintal/acre gypsum to lower soil pH")

    # EC
    max_ec = crop.get("max_ec", 3.0)
    status_ec, pts_ec = _ec_status(ec, max_ec)
    points += pts_ec
    ideal_conditions["ec"] = {
        "max": max_ec,
        "yours": ec,
        "status": status_ec,
    }
    if pts_ec == 0:
        fixes.append("Irrigate heavily to flush salts before planting")

    # suitable if score >= 60 out of 100
    suitable = points >= 60
    return points, suitable, ideal_conditions, fixes


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/crops/check", summary="Check if a specific crop suits your soil")
async def check_crop(body: CropCheckRequest) -> dict:
    """
    POST /api/v1/crops/check
    Compares farmer's soil parameters against the ideal conditions
    for a specific crop from crops_db.json.
    Returns suitability score, suitable flag, per-parameter comparison,
    and specific deficiency fixes.
    """
    crop_name = body.crop_name.lower().strip()

    if crop_name not in _CROPS_BY_NAME:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Crop '{crop_name}' not found in database. "
                f"Available crops: {', '.join(sorted(_CROPS_BY_NAME.keys()))}"
            ),
        )

    crop = _CROPS_BY_NAME[crop_name]
    score, suitable, ideal_conditions, fixes = _compute_suitability(crop, body.soil_data)

    return {
        "crop":              crop["display_name"],
        "suitable":          suitable,
        "suitability_score": score,
        "season":            crop["season"],
        "ideal_conditions":  ideal_conditions,
        "deficiency_fixes":  fixes if fixes else ["Your soil conditions look good for this crop!"],
    }
