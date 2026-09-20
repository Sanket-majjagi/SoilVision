# 🌾 Kisan Mitra — 3 New Features Implementation Plan

## Goal

Add three data-driven features to Kisan Mitra that replace hardcoded defaults with **real weather**, **live market prices**, and **government MSP forecasts** — transforming the app from a static recommender into a dynamic, market-aware farming advisor.

---

## User Review Required

> [!IMPORTANT]
> **API Keys Needed:** You will need to register for 2 free API keys before implementation begins:
> 1. **OpenWeatherMap** — Free at [openweathermap.org/api](https://openweathermap.org/api) (1M calls/month)
> 2. **data.gov.in** — Free at [data.gov.in](https://data.gov.in) (register → get API key)
>
> Do you already have these keys, or should I guide you through registration?

> [!WARNING]
> **data.gov.in Mandi API Reliability:** Government APIs can be slow, have downtime, or change without notice. The plan includes a **static fallback** so the app never breaks even if the API is down. Are you okay with static fallback prices for crops when the live API fails?

> [!IMPORTANT]
> **MSP Data (Feature 3):** Official MSP is published yearly by the government but there is **no real-time API** for it. The plan uses a **static JSON dataset** with official 2025-26 MSP values that you update once per year when new MSP is announced. Is this acceptable?

---

## Correct Implementation Order

```
Feature 1 (Real Weather) → Feature 3 (MSP/Harvest) → Feature 2 (Mandi Prices)
```

**Why this order:**
1. **Weather first** — it's the simplest, self-contained change (frontend-only GPS + one backend proxy). Zero risk to existing flow.
2. **MSP/Harvest second** — it's 100% static data (a JSON file), so zero API dependency risk. Adds `growth_duration_months` to `crops_db.json` which Feature 2 also needs.
3. **Mandi Prices last** — it's the most complex (external gov API, rate limits, error handling). By this point, the results screen already has the new UI sections from Feature 3, so adding another section is trivial.

---

## Feature 1 — Real Weather (GPS + OpenWeatherMap)

### Overview
Replace the hardcoded `climate: { temperature: 28.5, humidity: 72.0, rainfall: 1200.0 }` defaults in `api.js` with **real weather** from the farmer's device GPS location.

### API Details

| Item | Value |
|------|-------|
| **Provider** | OpenWeatherMap |
| **Endpoint** | `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={KEY}` |
| **Free Tier** | 60 calls/min, 1M calls/month |
| **Response Fields** | `main.temp` (°C), `main.humidity` (%), `rain.1h` (mm — optional field) |
| **Rainfall Note** | `rain.1h` only exists if it's raining. For annual rainfall (used by ML model), we'll use a **regional average lookup** since the model expects annual mm, not hourly. |

### Proposed Changes

---

#### [NEW] `frontend/src/services/weather.js`

New service module that:
1. Uses `expo-location` to get device GPS coordinates
2. Calls our **backend proxy** (not OpenWeatherMap directly — keeps API key safe)
3. Returns `{ temperature, humidity, rainfall, locationName }` or falls back to hardcoded defaults on failure

```javascript
// Pseudocode structure:
import * as Location from 'expo-location';
import { BASE_URL } from '../constants/api';

export async function getWeatherData() {
  // 1. Request location permission
  // 2. Get lat/lon via Location.getCurrentPositionAsync()
  // 3. Call backend: GET /api/v1/weather?lat=X&lon=Y
  // 4. Return { temperature, humidity, rainfall, locationName }
  // 5. On ANY failure → return DEFAULT_CLIMATE (current hardcoded values)
}
```

---

#### [NEW] `backend/app/routers/weather.py`

New backend route that proxies the OpenWeatherMap call:

```
GET /api/v1/weather?lat={lat}&lon={lon}
```

**Why proxy through backend:**
- Keeps `OPENWEATHER_API_KEY` on server (not exposed in mobile app bundle)
- Allows caching, rate limiting, and logging
- Can add regional rainfall lookup logic server-side

**Response:**
```json
{
  "temperature": 28.5,
  "humidity": 72.0,
  "rainfall": 1200.0,
  "location_name": "Bengaluru, Karnataka"
}
```

**Rainfall logic:** The ML model expects **annual rainfall (mm)**. OpenWeatherMap only gives current rain. So:
- Create a static `backend/app/data/rainfall_india.json` mapping Indian state/districts to average annual rainfall (data from IMD)
- Use the `lat/lon` → reverse geocode to state → lookup annual rainfall
- This gives a much more meaningful value for the ML model than "0mm because it's not raining right now"

---

#### [NEW] `backend/app/data/rainfall_india.json`

Static dataset: average annual rainfall by Indian state (from India Meteorological Department data).

```json
{
  "Karnataka": 1248,
  "Kerala": 2817,
  "Tamil Nadu": 998,
  "Maharashtra": 1139,
  "Uttar Pradesh": 990,
  "Punjab": 649,
  "Rajasthan": 575,
  ...
}
```

---

#### [MODIFY] `frontend/src/services/api.js`

- Remove hardcoded `climate` defaults from `analyzeSoil()` and `analyzeColorKit()`
- Accept `climate` as a **required** parameter (callers must provide it)

```diff
-export const analyzeSoil = async (soilData, landAcres, climate = { temperature: 28.5, humidity: 72.0, rainfall: 1200.0 }) => {
+export const analyzeSoil = async (soilData, landAcres, climate) => {
```

---

#### [MODIFY] `frontend/src/screens/ManualEntryScreen.js`

- Import `getWeatherData` from `../services/weather`
- On mount (or before analysis), fetch weather silently
- Show a small "📍 Weather detected: 28°C, 72% humidity — Bengaluru" chip in the UI
- Pass real climate data to `analyzeSoil()`
- If weather fetch fails → use old defaults silently (no user-facing error)

---

#### [MODIFY] `frontend/src/screens/ColorKitScreen.js`

Same pattern as ManualEntryScreen — fetch weather, pass to `analyzeColorKit()`.

---

#### [MODIFY] `frontend/src/screens/PhotoScanScreen.js`

The photo scan flow already uses vision API directly. If the vision endpoint returns full analysis results, weather should be fetched and passed as well. Depends on whether the vision flow also calls `/soil/analyze` internally.

---

#### [MODIFY] `backend/app/main.py`

- Register the new `weather` router: `app.include_router(weather.router, prefix="/api/v1")`

---

#### [MODIFY] `backend/.env` / `.env.example`

- Add `OPENWEATHER_API_KEY=your_key_here`

---

#### Install dependency

```bash
# Frontend
npx expo install expo-location
```

---

### Risks & Mitigations (Feature 1)

| Risk | Impact | Mitigation |
|------|--------|------------|
| GPS permission denied | No location data | Fall back to hardcoded defaults silently |
| OpenWeatherMap API down | No weather data | Fall back to hardcoded defaults |
| Emulator has no GPS | Testing fails | Use expo's mock location feature |
| `rain.1h` field missing | Rainfall = 0 | Use annual rainfall lookup from `rainfall_india.json` instead |
| Expo Web has no GPS | Web testing fails | Use browser's Geolocation API as fallback (expo-location handles this) |

---

## Feature 2 — Current Mandi Prices

### Overview
After crop recommendations are shown, display **current market price per quintal** for each recommended crop from government data.

### API Details

| Item | Value |
|------|-------|
| **Provider** | data.gov.in (AGMARKNET data) |
| **Endpoint** | `https://api.data.gov.in/resource/{resource_id}?api-key={KEY}&format=json&filters[commodity]={CROP}` |
| **Resource ID** | `9ef84268-d588-465a-a308-a864a43d0070` (Daily mandi prices) |
| **Free Tier** | Free with registration, rate-limited |
| **Response Fields** | `commodity`, `market`, `state`, `min_price`, `max_price`, `modal_price` |
| **Fallback** | Static `mandi_fallback.json` with last-known typical prices |

### Proposed Changes

---

#### [NEW] `backend/app/routers/market.py`

New backend route:

```
GET /api/v1/market/prices?crops=rice,wheat,maize&state=Karnataka
```

**Logic:**
1. For each crop name → map to AGMARKNET commodity name (e.g., `rice` → `Paddy(Dhan)(Common)`)
2. Call data.gov.in API with commodity filter
3. Return most recent `modal_price` (most common trading price)
4. If API fails → return prices from `mandi_fallback.json`

**Response:**
```json
{
  "prices": [
    {
      "crop": "rice",
      "display_name": "Rice",
      "price_per_quintal": 2450,
      "market": "Raichur",
      "state": "Karnataka",
      "date": "2026-04-01",
      "source": "AGMARKNET"
    }
  ],
  "is_live": true
}
```

---

#### [NEW] `backend/app/data/crop_commodity_map.json`

Maps our internal crop names to AGMARKNET commodity names:

```json
{
  "rice": "Paddy(Dhan)(Common)",
  "wheat": "Wheat",
  "maize": "Maize",
  "cotton": "Cotton",
  "sugarcane": "Sugarcane",
  "soybean": "Soyabean",
  "groundnut": "Groundnut",
  "mustard": "Mustard",
  "chickpea": "Bengal Gram(Gram)(Whole)",
  "pigeonpeas": "Arhar (Tur/Red Gram)(Whole)",
  "lentil": "Masoor Dal",
  "mungbean": "Green Gram (Moong)(Whole)",
  "potato": "Potato",
  "onion": "Onion",
  "tomato": "Tomato",
  "chilli": "Chillies (Green)",
  "tea": "Tea",
  "coffee": "Coffee",
  "banana": "Banana",
  "mango": "Mango (Raw-Loss)",
  "turmeric": "Turmeric",
  "jute": "Jute",
  "sunflower": "Sunflower",
  "barley": "Barley (Jau)",
  "millets": "Bajra(Pearl Millet/Cumbu)",
  "orange": "Orange",
  "coconut": "Coconut",
  "grapes": "Grapes",
  "apple": "Apple",
  "papaya": "Papaya",
  "mothbeans": "Moth"
}
```

---

#### [NEW] `backend/app/data/mandi_fallback.json`

Static fallback prices (typical market rates, updated periodically):

```json
{
  "rice": 2450,
  "wheat": 2700,
  "maize": 2200,
  "cotton": 7500,
  ...
}
```

---

#### [MODIFY] `frontend/src/services/api.js`

Add new function:

```javascript
export const getMandiPrices = async (cropNames, state = '') => {
  const response = await fetch(
    `${BASE_URL}/api/v1/market/prices?crops=${cropNames.join(',')}&state=${state}`
  );
  return handleResponse(response);
};
```

---

#### [MODIFY] `frontend/src/screens/ResultsScreen.js`

- After the Crop Recommendations card, add a new **"📊 Current Market Prices"** card
- On mount, call `getMandiPrices()` with the recommended crop names
- Show loading shimmer while fetching
- Display price per quintal for each crop in "₹X,XXX /quintal" format
- Show "Live 🟢" or "Estimate 🟡" badge based on `is_live`

**UI Preview per crop row:**
```
🌾 Rice          ₹2,450/q    📍 Raichur    🟢 Live
🌾 Wheat         ₹2,800/q    📍 Hubli      🟢 Live
```

---

#### [MODIFY] `backend/app/main.py`

- Register `market` router: `app.include_router(market.router, prefix="/api/v1")`

---

#### [MODIFY] `backend/.env` / `.env.example`

- Add `DATA_GOV_API_KEY=your_key_here`

---

### Risks & Mitigations (Feature 2)

| Risk | Impact | Mitigation |
|------|--------|------------|
| data.gov.in API is down/slow | No live prices | Fall back to `mandi_fallback.json` with "Estimate" badge |
| Commodity name mismatch | Wrong crop prices | Use `crop_commodity_map.json` with manual verification |
| API rate limiting | Blocked requests | Cache prices for 6 hours on backend (in-memory dict) |
| Crop not found in AGMARKNET | No price for crop | Show "Price unavailable" gracefully |
| API response format changes | Parsing breaks | Wrap in try/catch, fall back to static |

---

## Feature 3 — Harvest Time MSP (Expected Price at Harvest)

### Overview
For each recommended crop, show the **expected MSP** at harvest time. Calculate harvest month using today's date + crop growth duration, then show the applicable MSP from the government schedule.

### Data Source

| Item | Value |
|------|-------|
| **Source** | Official Government MSP notifications (PIB, agriwelfare.gov.in) |
| **Update Frequency** | Once per year (Kharif MSP announced May-June, Rabi MSP announced Sep-Oct) |
| **Implementation** | Static JSON file with latest MSP values — **no API needed** |
| **Data Available** | 2025-26 Kharif + Rabi MSP for all 23 notified crops |

### Proposed Changes

---

#### [NEW] `backend/app/data/msp_data.json`

Complete MSP dataset with growth durations:

```json
{
  "_source": "Government of India MSP 2025-26 (PIB / agriwelfare.gov.in)",
  "_updated": "2026-04-02",
  "crops": {
    "rice":        { "msp_per_quintal": 2369, "growth_months": 4, "season": "Kharif" },
    "wheat":       { "msp_per_quintal": 2425, "growth_months": 5, "season": "Rabi" },
    "maize":       { "msp_per_quintal": 2400, "growth_months": 4, "season": "Kharif" },
    "cotton":      { "msp_per_quintal": 7710, "growth_months": 6, "season": "Kharif" },
    "sugarcane":   { "msp_per_quintal": 3150, "growth_months": 12, "season": "Annual", "_note": "FRP not MSP" },
    "soybean":     { "msp_per_quintal": 4892, "growth_months": 4, "season": "Kharif" },
    "groundnut":   { "msp_per_quintal": 6783, "growth_months": 4, "season": "Kharif" },
    "mustard":     { "msp_per_quintal": 5950, "growth_months": 5, "season": "Rabi" },
    "chickpea":    { "msp_per_quintal": 5650, "growth_months": 5, "season": "Rabi" },
    "pigeonpeas":  { "msp_per_quintal": 8000, "growth_months": 6, "season": "Kharif" },
    "lentil":      { "msp_per_quintal": 6700, "growth_months": 4, "season": "Rabi" },
    "mungbean":    { "msp_per_quintal": 8768, "growth_months": 3, "season": "Kharif" },
    "barley":      { "msp_per_quintal": 1980, "growth_months": 5, "season": "Rabi" },
    "millets":     { "msp_per_quintal": 2775, "growth_months": 3, "season": "Kharif" },
    "sunflower":   { "msp_per_quintal": 7280, "growth_months": 4, "season": "Kharif" },
    "jute":        { "msp_per_quintal": 5450, "growth_months": 4, "season": "Kharif" },
    "potato":      { "msp_per_quintal": null, "growth_months": 4, "season": "Rabi", "_note": "No MSP — market driven" },
    "onion":       { "msp_per_quintal": null, "growth_months": 4, "season": "Rabi", "_note": "No MSP — market driven" },
    "tomato":      { "msp_per_quintal": null, "growth_months": 3, "season": "Rabi", "_note": "No MSP — market driven" },
    "chilli":      { "msp_per_quintal": null, "growth_months": 5, "season": "Kharif", "_note": "No MSP — market driven" },
    "tea":         { "msp_per_quintal": null, "growth_months": null, "season": "Perennial", "_note": "No MSP" },
    "coffee":      { "msp_per_quintal": null, "growth_months": null, "season": "Perennial", "_note": "No MSP" },
    "banana":      { "msp_per_quintal": null, "growth_months": 10, "season": "Perennial", "_note": "No MSP" },
    "mango":       { "msp_per_quintal": null, "growth_months": null, "season": "Perennial", "_note": "No MSP" },
    "turmeric":    { "msp_per_quintal": null, "growth_months": 8, "season": "Kharif", "_note": "No MSP" },
    "coconut":     { "msp_per_quintal": 3400, "growth_months": null, "season": "Perennial", "_note": "Copra MSP" },
    "grapes":      { "msp_per_quintal": null, "growth_months": null, "season": "Perennial", "_note": "No MSP" },
    "apple":       { "msp_per_quintal": null, "growth_months": null, "season": "Perennial", "_note": "No MSP" },
    "papaya":      { "msp_per_quintal": null, "growth_months": 10, "season": "Annual", "_note": "No MSP" },
    "mothbeans":   { "msp_per_quintal": 8558, "growth_months": 3, "season": "Kharif" },
    "orange":      { "msp_per_quintal": null, "growth_months": null, "season": "Perennial", "_note": "No MSP" }
  }
}
```

---

#### [NEW] `backend/app/services/harvest_forecast.py`

Service that computes harvest date and returns MSP info:

```python
def get_harvest_forecast(crop_name: str) -> dict:
    """
    Returns:
    {
        "crop": "rice",
        "growth_months": 4,
        "expected_harvest_month": "August 2026",
        "msp_per_quintal": 2369,
        "msp_applicable": True,
        "note": "Government guaranteed price"
    }
    """
    # 1. Look up crop in msp_data.json
    # 2. harvest_date = today + growth_months
    # 3. Return forecast dict
```

---

#### [MODIFY] `backend/app/routers/soil.py`

In the `_build_response()` function, **after** computing crop recommendations, also compute harvest forecast for each recommended crop and include it in the response.

Add to response:
```python
# In _build_response(), after crops enrichment:
from app.services.harvest_forecast import get_harvest_forecast

harvest_data = []
for crop_rec in crops:
    forecast = get_harvest_forecast(crop_rec["crop"])
    harvest_data.append(forecast)

# Add to return dict:
return {
    ...existing fields...,
    "harvest_forecast": harvest_data,
}
```

---

#### [MODIFY] `frontend/src/screens/ResultsScreen.js`

Add a new **"🗓️ Harvest Price Forecast"** card after the Crop Recommendations card.

**UI per crop row:**
```
🌾 Rice
   Harvest ready: August 2026 (4 months)
   Govt. MSP: ₹2,369/quintal ✅

🌾 Wheat
   Harvest ready: September 2026 (5 months)
   Govt. MSP: ₹2,425/quintal ✅

🥔 Potato
   Harvest ready: August 2026 (4 months)
   No MSP — market price driven ⚠️
```

---

### Risks & Mitigations (Feature 3)

| Risk | Impact | Mitigation |
|------|--------|------------|
| MSP data becomes outdated next year | Wrong prices shown | Add `_updated` field; log reminder. Simple annual JSON update. |
| Some crops don't have MSP (vegetables, fruits) | Empty price | Show "No MSP — market price driven" with ⚠️ |
| Growth duration varies by variety/region | Approximate harvest date | Show "~4 months" with disclaimer text |
| Perennial crops have no fixed harvest | No forecast possible | Show "Perennial crop — continuous harvest" instead |

---

## Complete File Change Summary

### New Files (7)

| # | File | Feature |
|---|------|---------|
| 1 | `frontend/src/services/weather.js` | F1 |
| 2 | `backend/app/routers/weather.py` | F1 |
| 3 | `backend/app/data/rainfall_india.json` | F1 |
| 4 | `backend/app/data/msp_data.json` | F3 |
| 5 | `backend/app/services/harvest_forecast.py` | F3 |
| 6 | `backend/app/routers/market.py` | F2 |
| 7 | `backend/app/data/crop_commodity_map.json` + `mandi_fallback.json` | F2 |

### Modified Files (8)

| # | File | Feature | Change |
|---|------|---------|--------|
| 1 | `frontend/src/services/api.js` | F1, F2 | Remove hardcoded climate, add `getMandiPrices()` |
| 2 | `frontend/src/screens/ManualEntryScreen.js` | F1 | Fetch weather on mount, show location chip, pass climate |
| 3 | `frontend/src/screens/ColorKitScreen.js` | F1 | Same — fetch weather, pass climate |
| 4 | `frontend/src/screens/PhotoScanScreen.js` | F1 | Fetch weather for vision flow |
| 5 | `frontend/src/screens/ResultsScreen.js` | F2, F3 | Add Market Prices card + Harvest Forecast card |
| 6 | `backend/app/main.py` | F1, F2 | Register `weather` + `market` routers |
| 7 | `backend/app/routers/soil.py` | F3 | Add harvest_forecast to `_build_response()` |
| 8 | `backend/.env` / `.env.example` | F1, F2 | Add `OPENWEATHER_API_KEY`, `DATA_GOV_API_KEY` |

### Install Dependencies

| Package | Where | Command |
|---------|-------|---------|
| `expo-location` | Frontend | `npx expo install expo-location` |
| `httpx` | Backend | `pip install httpx` (async HTTP for weather/mandi proxying) |

---

## Open Questions

> [!IMPORTANT]
> 1. **Do you have OpenWeatherMap and data.gov.in API keys ready?** Or should I add dummy placeholders for now?
> 2. **Should the weather chip be visible on the input screens** (showing detected location + temp)? Or should it silently fetch and pass data without UI feedback?
> 3. **For Mandi prices, do you want state-specific results?** If yes, we can use the GPS location to detect the farmer's state. If no, we show national average modal price.
> 4. **Should the harvest forecast and mandi prices also appear in the PDF report?** Or results screen only?
> 5. **PhotoScan flow:** Currently the vision endpoint returns analysis results directly. Should weather data be injected into that flow too? This would require modifying the vision router to accept climate data.

---

## Verification Plan

### Automated Tests
- Backend: Add pytest cases for `/api/v1/weather?lat=12.97&lon=77.59` (Bengaluru)
- Backend: Add pytest cases for `/api/v1/market/prices?crops=rice,wheat`
- Backend: Unit test `get_harvest_forecast("rice")` returns valid MSP and harvest month

### Manual Verification
1. Run app on physical device → grant GPS permission → verify weather chip shows location
2. Submit soil analysis → verify ResultsScreen shows harvest forecast card
3. Submit soil analysis → verify ResultsScreen shows mandi prices card
4. Deny GPS permission → verify app falls back to defaults without crashing
5. Disconnect internet → verify mandi prices show fallback values with "Estimate" badge
