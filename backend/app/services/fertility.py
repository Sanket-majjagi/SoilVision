"""
backend/app/services/fertility.py
Rule-based ICAR soil fertility scorer.
All thresholds from SOILVISION_PLAN.md Section 3 — Government of India SHC scheme.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


# ---------------------------------------------------------------------------
# ICAR Threshold Tables (exact values from plan Section 3)
# ---------------------------------------------------------------------------

# Macronutrients: (low_max, medium_max)
# Low  = value < low_max
# Med  = low_max <= value <= medium_max
# High = value > medium_max
_MACRO_THRESHOLDS: dict[str, tuple[float, float]] = {
    "nitrogen":       (280.0, 560.0),   # kg/ha
    "phosphorus":     (10.0,  25.0),    # kg/ha
    "potassium":      (120.0, 280.0),   # kg/ha
    "organic_carbon": (0.50,  0.75),    # %
}

# Micronutrients: single critical limit — below = Deficient
_MICRO_CRITICAL: dict[str, float] = {
    "sulphur":   10.0,   # mg/kg
    "zinc":       0.60,  # mg/kg
    "iron":       4.50,  # mg/kg
    "copper":     0.20,  # mg/kg
    "manganese":  2.00,  # mg/kg
    "boron":      0.50,  # mg/kg
}

# pH classification ranges (min_inclusive, max_exclusive, label)
_PH_CLASSES: list[tuple[float, float, str]] = [
    (0.0,  5.5,  "Strongly Acidic"),
    (5.5,  6.5,  "Moderately Acidic"),
    (6.5,  7.5,  "Neutral"),
    (7.5,  8.5,  "Moderately Alkaline"),
    (8.5,  14.0, "Strongly Alkaline"),
]

# EC classification ranges
_EC_CLASSES: list[tuple[float, float, str]] = [
    (0.0, 1.0,  "Normal"),
    (1.0, 3.0,  "Slightly Saline"),
    (3.0, 4.0,  "Moderately Saline"),
    (4.0, 999,  "Saline (Problematic)"),
]

# Scoring weights (from plan Section 3 — Fertility Score Algorithm)
_MACRO_POINTS = {"High": 15, "Medium": 10, "Low": 3}
_MICRO_POINTS = {"Sufficient": 4, "Deficient": 1}
_MAX_SCORE = 100   # 4×15 macro + 6×4 micro + 8 pH + 8 EC = 100


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def _macro_rating(key: str, value: float) -> Literal["Low", "Medium", "High"]:
    low_max, med_max = _MACRO_THRESHOLDS[key]
    if value < low_max:
        return "Low"
    elif value <= med_max:
        return "Medium"
    else:
        return "High"


def _micro_status(key: str, value: float) -> Literal["Sufficient", "Deficient"]:
    return "Sufficient" if value >= _MICRO_CRITICAL[key] else "Deficient"


def _ph_classification(ph: float) -> str:
    for lo, hi, label in _PH_CLASSES:
        if lo <= ph < hi:
            return label
    return "Strongly Alkaline"   # edge case: ph == 14.0


def _ec_classification(ec: float) -> str:
    for lo, hi, label in _EC_CLASSES:
        if lo <= ec < hi:
            return label
    return "Saline (Problematic)"


# ---------------------------------------------------------------------------
# Main Service Function
# ---------------------------------------------------------------------------

def calculate_fertility_score(soil_data: dict) -> dict:
    """
    Rule-based ICAR fertility scoring.
    Implements exact algorithm from SOILVISION_PLAN.md Section 3.

    Args:
        soil_data: dict with keys matching SoilData field names.

    Returns:
        dict with keys: score (float), rating (str), breakdown (dict)
    """
    score = 0

    # --- Macronutrients: 60 points total (15 each × 4) ---
    macro_breakdown: dict = {}
    for key, unit in [
        ("nitrogen",       "kg/ha"),
        ("phosphorus",     "kg/ha"),
        ("potassium",      "kg/ha"),
        ("organic_carbon", "%"),
    ]:
        val = float(soil_data[key])
        rating = _macro_rating(key, val)
        score += _MACRO_POINTS[rating]
        macro_breakdown[key] = {"value": val, "unit": unit, "rating": rating}

    # --- Micronutrients: 24 points total (4 each × 6) ---
    micro_breakdown: dict = {}
    for key in ["sulphur", "zinc", "iron", "copper", "manganese", "boron"]:
        val = float(soil_data[key])
        status = _micro_status(key, val)
        score += _MICRO_POINTS[status]
        micro_breakdown[key] = {"value": val, "status": status}

    # --- pH: 8 points ---
    ph = float(soil_data["ph"])
    if 6.5 <= ph <= 7.5:
        score += 8
    elif 5.5 <= ph <= 8.5:
        score += 5
    else:
        score += 2
    ph_breakdown = {"value": ph, "classification": _ph_classification(ph)}

    # --- EC: 8 points ---
    ec = float(soil_data["ec"])
    if ec < 1.0:
        score += 8
    elif ec < 3.0:
        score += 5
    else:
        score += 2
    ec_breakdown = {"value": ec, "classification": _ec_classification(ec)}

    # --- Final Rating ---
    pct = (score / _MAX_SCORE) * 100
    if pct >= 80:
        rating = "Excellent"
    elif pct >= 60:
        rating = "Good"
    elif pct >= 40:
        rating = "Fair"
    else:
        rating = "Poor"

    breakdown = {
        **macro_breakdown,
        "ph": ph_breakdown,
        "ec": ec_breakdown,
        **micro_breakdown,
    }

    return {
        "score": round(pct, 2),
        "rating": rating,
        "breakdown": breakdown,
    }
