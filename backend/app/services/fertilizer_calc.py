"""
backend/app/services/fertilizer_calc.py
Deficit-method fertilizer recommendation.
All constants from SOILVISION_PLAN.md Section 7 — exact values.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Constants — exact from plan Section 7
# ---------------------------------------------------------------------------

HECTARE_TO_ACRE = 2.471

# Target = lower bound of "High" rating (ICAR)
TARGET_VALUES: dict[str, float] = {
    "nitrogen":   560.0,   # kg/ha
    "phosphorus":  25.0,   # kg/ha
    "potassium":  280.0,   # kg/ha
}

# Primary macro fertilizers: one per macronutrient
FERTILIZER_DB: dict[str, dict] = {
    "nitrogen":   {"name": "Urea", "nutrient_pct": 46,   "price_per_kg": 5.38},
    "phosphorus": {"name": "DAP",  "nutrient_pct": 46,   "price_per_kg": 27.00},
    "potassium":  {"name": "MOP",  "nutrient_pct": 60,   "price_per_kg": 17.00},
}

# Standard field-application doses (kg/ha) for micronutrient corrections
MICRO_DOSES: dict[str, dict] = {
    "sulphur":   {"name": "Ammonium Sulphate",  "dose_kg_ha": 50,  "price": 12.00},
    "zinc":      {"name": "Zinc Sulphate",       "dose_kg_ha": 25,  "price": 50.00},
    "iron":      {"name": "Ferrous Sulphate",    "dose_kg_ha": 50,  "price": 30.00},
    "copper":    {"name": "Copper Sulphate",     "dose_kg_ha":  5,  "price": 250.00},
    "manganese": {"name": "Manganese Sulphate",  "dose_kg_ha": 25,  "price": 70.00},
    "boron":     {"name": "Borax",               "dose_kg_ha": 10,  "price": 65.00},
}

# ICAR critical limits — below these → Deficient
MICRO_CRITICAL: dict[str, float] = {
    "sulphur":   10.0,
    "zinc":       0.60,
    "iron":       4.50,
    "copper":     0.20,
    "manganese":  2.00,
    "boron":      0.50,
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_fertilizer_plan(soil: dict, land_acres: float) -> list[dict]:
    """
    Deficit-method fertilizer plan.

    Steps (from plan Section 7):
      1. Deficit (kg/ha) = target - current  [if negative, deficit = 0]
      2. Fertilizer_Required (kg/ha) = deficit / (nutrient_pct / 100)
      3. Per_Acre = fertilizer_required / HECTARE_TO_ACRE
      4. Total = per_acre × land_acres
      5. Cost = total × price_per_kg

    Micronutrients use a standard fixed dose if below critical limit.

    Args:
        soil: dict with all soil parameter keys (matching SoilData field names).
        land_acres: farmer's land size in acres (must be > 0).

    Returns:
        List of recommendation dicts, each with fertilizer, purpose,
        qty_per_acre_kg, total_qty_kg, estimated_cost.
        Empty list means no fertilizer needed.
    """
    recommendations: list[dict] = []
    ph_notes: list[str] = []

    # --- pH edge cases (plan Section 7) ---
    ph = soil.get("ph", 7.0)
    if ph < 5.5:
        ph_notes.append("Apply 2–4 quintal/acre lime before sowing to correct acidic soil")
    elif ph > 8.5:
        ph_notes.append("Apply 2–3 quintal/acre gypsum to correct alkaline soil")

    # --- EC edge case ---
    ec = soil.get("ec", 0.0)
    if ec > 4.0:
        ph_notes.append("Irrigate heavily to flush salts before planting (EC too high)")

    # --- Organic Carbon very low ---
    oc = soil.get("organic_carbon", 1.0)
    if oc < 0.25:
        ph_notes.append("Apply 4–5 tons/acre Farm Yard Manure to improve Organic Carbon")

    # --- Macronutrients (NPK) ---
    for nutrient, target in TARGET_VALUES.items():
        current = float(soil.get(nutrient, 0))
        deficit = max(0.0, target - current)

        if deficit == 0:
            continue   # Already at or above "High" — no action needed

        fert = FERTILIZER_DB[nutrient]
        qty_ha   = deficit / (fert["nutrient_pct"] / 100.0)
        qty_acre = qty_ha / HECTARE_TO_ACRE
        total    = qty_acre * land_acres
        cost     = total * fert["price_per_kg"]

        recommendations.append({
            "fertilizer":      fert["name"],
            "purpose":         f"Increase {nutrient.title()} to High",
            "qty_per_acre_kg": round(qty_acre, 2),
            "total_qty_kg":    round(total, 2),
            "estimated_cost":  f"₹{cost:,.0f}",
        })

    # --- Micronutrients ---
    for micro, threshold in MICRO_CRITICAL.items():
        current = soil.get(micro)
        if current is None:
            continue   # Not provided (e.g. color-kit input)
        if float(current) < threshold:
            info     = MICRO_DOSES[micro]
            qty_acre = info["dose_kg_ha"] / HECTARE_TO_ACRE
            total    = qty_acre * land_acres
            cost     = total * info["price"]

            recommendations.append({
                "fertilizer":      info["name"],
                "purpose":         f"Fix {micro.title()} deficiency",
                "qty_per_acre_kg": round(qty_acre, 2),
                "total_qty_kg":    round(total, 2),
                "estimated_cost":  f"₹{cost:,.0f}",
            })

    # --- Append any soil condition advisories as text items ---
    for note in ph_notes:
        recommendations.append({
            "fertilizer":      "Advisory",
            "purpose":         note,
            "qty_per_acre_kg": None,
            "total_qty_kg":    None,
            "estimated_cost":  "—",
        })

    return recommendations


def total_cost_from_plan(recommendations: list[dict]) -> str:
    """Sum all numeric estimated_cost entries and return formatted ₹ string."""
    total = 0.0
    for rec in recommendations:
        cost_str = rec.get("estimated_cost", "")
        if cost_str and cost_str not in ("—",):
            # Strip ₹ and commas, convert to float
            try:
                total += float(cost_str.replace("₹", "").replace(",", ""))
            except ValueError:
                pass
    return f"₹{total:,.0f}"
