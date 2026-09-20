"""
backend/app/routers/weather.py
GET /api/v1/weather?lat={lat}&lon={lon}
Proxies OpenWeatherMap API and enriches with annual rainfall from IMD data.
Keeps OPENWEATHER_API_KEY on server — never exposed to mobile app.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(tags=["Weather"])
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Annual rainfall lookup (IMD state-wise averages)
# ---------------------------------------------------------------------------
_DATA_DIR = Path(__file__).resolve().parents[1] / "data"

with open(_DATA_DIR / "rainfall_india.json", encoding="utf-8") as _f:
    _RAINFALL_DATA: dict = json.load(_f)

_DEFAULT_RAINFALL: float = _RAINFALL_DATA.get("_default", 1100.0)


def _get_annual_rainfall(state: str | None) -> float:
    """Look up annual rainfall for an Indian state. Falls back to national average."""
    if not state:
        return _DEFAULT_RAINFALL
    # Try exact match first, then case-insensitive
    if state in _RAINFALL_DATA:
        return float(_RAINFALL_DATA[state])
    for key, val in _RAINFALL_DATA.items():
        if key.startswith("_"):
            continue
        if key.lower() == state.lower():
            return float(val)
    return _DEFAULT_RAINFALL


# ---------------------------------------------------------------------------
# OpenWeatherMap → state name extraction
# ---------------------------------------------------------------------------
def _extract_state(owm_data: dict) -> str | None:
    """
    Try to extract state/region from OpenWeatherMap response.
    OWM returns 'sys.country' (IN) and 'name' (city name).
    For state, we need reverse geocoding — OWM current weather doesn't return state.
    Fallback: use the city name to do a best-effort match.
    """
    # OWM doesn't reliably return state in current weather API.
    # We'll use the OWM Geocoding API for that (same free tier).
    return None  # Handled in the main endpoint via separate geo call


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
_OWM_WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
_OWM_GEO_URL = "https://api.openweathermap.org/geo/1.0/reverse"


@router.get("/weather", summary="Get weather data for GPS coordinates")
async def get_weather(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
) -> dict:
    """
    GET /api/v1/weather?lat=12.97&lon=77.59
    Returns real temperature, humidity, annual rainfall, and location name.
    Uses OpenWeatherMap free API + IMD rainfall lookup.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENWEATHER_API_KEY not configured. Add it to backend/.env",
        )

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Fetch current weather
        try:
            weather_resp = await client.get(
                _OWM_WEATHER_URL,
                params={
                    "lat": lat,
                    "lon": lon,
                    "units": "metric",
                    "appid": api_key,
                },
            )
            weather_resp.raise_for_status()
            weather_data = weather_resp.json()
        except httpx.HTTPStatusError as exc:
            logger.error(f"OpenWeatherMap HTTP error: {exc.response.status_code}")
            raise HTTPException(
                status_code=503,
                detail=f"OpenWeatherMap API error: {exc.response.status_code}",
            )
        except httpx.RequestError as exc:
            logger.error(f"OpenWeatherMap request failed: {exc}")
            raise HTTPException(
                status_code=503,
                detail="Could not reach OpenWeatherMap. Check internet connection.",
            )

        # 2. Reverse geocode to get state name
        state = None
        city_name = weather_data.get("name", "")
        try:
            geo_resp = await client.get(
                _OWM_GEO_URL,
                params={
                    "lat": lat,
                    "lon": lon,
                    "limit": 1,
                    "appid": api_key,
                },
            )
            if geo_resp.status_code == 200:
                geo_data = geo_resp.json()
                if geo_data and len(geo_data) > 0:
                    state = geo_data[0].get("state", None)
                    city_name = geo_data[0].get("name", city_name)
        except Exception as exc:
            logger.warning(f"Reverse geocoding failed (non-critical): {exc}")

    # 3. Extract values
    temperature = round(weather_data.get("main", {}).get("temp", 28.5), 1)
    humidity = round(weather_data.get("main", {}).get("humidity", 72.0), 1)
    annual_rainfall = _get_annual_rainfall(state)

    # Build location name
    location_parts = [city_name]
    if state:
        location_parts.append(state)
    location_name = ", ".join(filter(None, location_parts))

    return {
        "temperature": temperature,
        "humidity": humidity,
        "rainfall": annual_rainfall,
        "location_name": location_name or "India",
        "state": state or "",
    }
