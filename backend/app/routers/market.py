"""
backend/app/routers/market.py
GET /api/v1/market/prices?crops={crops}&state={state}
Proxies data.gov.in Mandi prices API.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter, Query

router = APIRouter(tags=["Market"])
logger = logging.getLogger(__name__)

# Resource UUID for daily prices (can be updated if data.gov changes it)
_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
_BASE_URL = f"https://api.data.gov.in/resource/{_RESOURCE_ID}"

# Load mapping
_DATA_DIR = Path(__file__).resolve().parents[1] / "data"
with open(_DATA_DIR / "crop_commodity_map.json", encoding="utf-8") as _f:
    _CROP_MAP = json.load(_f)

@router.get("/market/prices", summary="Get Mandi prices for requested crops")
async def get_market_prices(
    crops: str = Query(..., description="Comma-separated crop names"),
    state: str = Query("", description="User's state to filter")
) -> dict:
    """
    GET /api/v1/market/prices?crops=rice,wheat&state=Maharashtra
    Fetches real mandi prices. If state match fails, fallback to national average.
    """
    # Accept both key naming conventions just in case
    api_key = os.getenv("DATA_GOV_API_KEY") or os.getenv("DATAGOV_API_KEY")
    
    # If not set, return graceful empty dict so app doesn't crash
    if not api_key or "your_key_here" in api_key:
        return {}

    crop_list = [c.strip().lower() for c in crops.split(",") if c.strip()]
    results = {}

    async with httpx.AsyncClient(timeout=5.0) as client:
        for crop in crop_list:
            commodity = _CROP_MAP.get(crop)
            if not commodity:
                continue

            # Query 1: Try with state filter
            params = {
                "api-key": api_key,
                "format": "json",
                "limit": 10,
                "filters[commodity]": commodity,
            }
            if state:
                params["filters[state]"] = state

            try:
                resp = await client.get(_BASE_URL, params=params)
                if resp.status_code != 200:
                    continue
                data = resp.json()
                records = data.get("records", [])
                
                # Query 2: Fallback to National Average if no state records
                if not records and state:
                    fallback_params = params.copy()
                    del fallback_params["filters[state]"]
                    resp_fallback = await client.get(_BASE_URL, params=fallback_params)
                    if resp_fallback.status_code == 200:
                        records = resp_fallback.json().get("records", [])
                        state_matched = False
                else:
                    state_matched = bool(state and records)

                if records:
                    prices = []
                    for r in records:
                        try:
                            prices.append(float(r.get("modal_price", 0)))
                        except (ValueError, TypeError):
                            pass
                    prices = [p for p in prices if p > 0]
                    
                    if prices:
                        min_p = min(prices)
                        max_p = max(prices)
                        results[crop] = {
                            "min_price": min_p,
                            "max_price": max_p,
                            "state_matched": state_matched,
                            "matched_state_name": state if state_matched else "National Avg"
                        }
            except Exception as e:
                logger.warning(f"Failed to fetch market data for {crop}: {e}")
                # We simply continue to next crop; the frontend falls back gracefully
                
    return results
