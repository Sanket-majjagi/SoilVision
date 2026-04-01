# SOILVISION — Complete Project Plan

> **Version:** 1.0 · **Date:** 2026-03-28 · **Author:** Lead Architect
> **Status:** APPROVED FOR IMPLEMENTATION

---

## TABLE OF CONTENTS

1. [Phases & Timeline](#section-1--phases--timeline)
2. [System Architecture](#section-2--system-architecture)
3. [Database Design](#section-3--database-design)
4. [API Design](#section-4--api-design)
5. [ML Model Spec](#section-5--ml-model-spec)
6. [Vision AI Spec](#section-6--vision-ai-spec)
7. [Fertilizer Calculation](#section-7--fertilizer-calculation)
8. [Frontend Screens](#section-8--frontend-screens)
9. [Environment Setup](#section-9--environment-setup)
10. [Deployment](#section-10--deployment)
11. [Testing Plan](#section-11--testing-plan)
12. [Future Features](#section-12--future-features)

---

# SECTION 1 — PHASES & TIMELINE

## Frontend Decision: React Native (Expo)

**Choice: React Native with Expo.** React Native with Expo provides instant OTA updates, a single JavaScript codebase that 70%+ of Indian mobile devs already know, and the Expo Camera/ImagePicker APIs work out-of-the-box for our photo-capture flows. Flutter would require Dart expertise which is less available in the Indian developer market, and React Native's npm ecosystem gives us direct access to chart libraries (victory-native) and localization packages (i18next) critical for a farmer-facing app.

---

### Phase 1: Project Setup (Days 1–2)

**Goal:** Repository, environments, CI skeleton, dependency lock.

| # | Task | Files Created | Verify |
|---|------|---------------|--------|
| 1.1 | Init Git repo, `.gitignore` (Python + Node) | `.gitignore`, `README.md` | `git status` clean |
| 1.2 | Create Python venv, install FastAPI + deps | `backend/requirements.txt`, `backend/pyproject.toml` | `pip list` shows fastapi, uvicorn, scikit-learn |
| 1.3 | Init Expo React Native project | `frontend/` (Expo scaffold) | `npx expo start` shows QR code |
| 1.4 | Create backend folder structure | `backend/app/main.py`, `backend/app/routers/`, `backend/app/services/`, `backend/app/models/`, `backend/app/schemas/`, `backend/app/core/` | All `__init__.py` present |
| 1.5 | Create `.env.example` with placeholder keys | `backend/.env.example` | File exists with `GEMINI_API_KEY`, `DATABASE_URL` |
| 1.6 | Setup SQLite for dev | `backend/app/core/database.py` | `python -c "from app.core.database import engine"` no error |

**Estimated Time:** 4–6 hours

---

### Phase 2: Data & ML Training (Days 3–5)

**Goal:** Download Kaggle dataset, train Random Forest, save model pickle, validate accuracy ≥ 90%.

| # | Task | Files Created | Verify |
|---|------|---------------|--------|
| 2.1 | Download Kaggle Crop Recommendation Dataset | `ml/data/Crop_recommendation.csv` | 2200 rows, 8 columns |
| 2.2 | Write EDA notebook | `ml/notebooks/01_eda.ipynb` | Plots for each feature distribution |
| 2.3 | Write preprocessing script | `ml/preprocess.py` | Prints train/test split sizes |
| 2.4 | Train Random Forest model | `ml/train.py` | Accuracy ≥ 90% on test set |
| 2.5 | Save model artifacts | `ml/models/crop_model.pkl`, `ml/models/label_encoder.pkl`, `ml/models/scaler.pkl` | Files > 0 bytes |
| 2.6 | Write ICAR benchmark JSON | `backend/app/data/icar_benchmarks.json` | JSON validates, 12 parameters present |
| 2.7 | Write crops database JSON | `backend/app/data/crops_db.json` | 25 crops with all fields |
| 2.8 | Write fertilizer database JSON | `backend/app/data/fertilizers_db.json` | 15 fertilizers with NPK%, cost |

**Estimated Time:** 8–12 hours

---

### Phase 3: Backend Core (Days 6–10)

**Goal:** All API endpoints working, model loaded, fertility scoring functional.

| # | Task | Files Created | Verify |
|---|------|---------------|--------|
| 3.1 | Pydantic schemas for soil input/output | `backend/app/schemas/soil.py` | Imports without error |
| 3.2 | Fertility scoring service (rule-based) | `backend/app/services/fertility.py` | Unit test with known soil → correct rating |
| 3.3 | Crop recommendation service (ML) | `backend/app/services/crop_recommender.py` | Predict returns top-5 crops |
| 3.4 | Fertilizer calculation service | `backend/app/services/fertilizer_calc.py` | Worked example matches manual calculation |
| 3.5 | Soil analysis router | `backend/app/routers/soil.py` | `POST /api/v1/soil/analyze` returns 200 |
| 3.6 | Crop check router | `backend/app/routers/crops.py` | `POST /api/v1/crops/check` returns 200 |
| 3.7 | Health check + CORS | `backend/app/main.py` | `GET /health` → `{"status":"ok"}` |
| 3.8 | Error handling middleware | `backend/app/core/exceptions.py` | Invalid input → structured error JSON |
| 3.9 | Session storage (SQLite) | `backend/app/models/session.py` | Insert + retrieve a session |

**Estimated Time:** 16–20 hours

---

### Phase 4: Vision AI Integration (Days 11–13)

**Goal:** Gemini 1.5 Flash API reads soil meter photos and SHC photos, returns structured JSON.

| # | Task | Files Created | Verify |
|---|------|---------------|--------|
| 4.1 | Gemini API client wrapper | `backend/app/services/vision_ai.py` | `analyze_image(bytes)` returns dict |
| 4.2 | LCD meter prompt template | `backend/app/prompts/meter_prompt.txt` | Prompt includes all expected fields |
| 4.3 | Soil Health Card prompt template | `backend/app/prompts/shc_prompt.txt` | Prompt includes all 12 parameters |
| 4.4 | Image upload endpoint | `backend/app/routers/vision.py` | `POST /api/v1/vision/analyze` accepts multipart |
| 4.5 | Blurry/failed image fallback | `backend/app/services/vision_ai.py` | Return `confidence < 0.5` triggers manual entry prompt |
| 4.6 | Unit conversion logic (meter → SHC units) | `backend/app/services/unit_converter.py` | mg/kg → kg/ha conversion correct |

**Estimated Time:** 10–14 hours

---

### Phase 5: Frontend Development (Days 14–22)

**Goal:** Complete farmer-facing UI with all screens, navigation, camera, and API integration.

| # | Task | Files Created | Verify |
|---|------|---------------|--------|
| 5.1 | Navigation setup (React Navigation) | `frontend/src/navigation/AppNavigator.tsx` | App opens to Home screen |
| 5.2 | Home screen (3 input method cards) | `frontend/src/screens/HomeScreen.tsx` | 3 tappable cards visible |
| 5.3 | Camera capture screen | `frontend/src/screens/CameraScreen.tsx` | Camera opens, takes photo |
| 5.4 | Manual entry screen (12 fields) | `frontend/src/screens/ManualEntryScreen.tsx` | All 12 inputs render |
| 5.5 | Color kit screen (Low/Med/High selectors) | `frontend/src/screens/ColorKitScreen.tsx` | Dropdowns for each nutrient |
| 5.6 | Results screen (score + crops + fertilizer) | `frontend/src/screens/ResultsScreen.tsx` | All 3 sections render |
| 5.7 | Crop check screen | `frontend/src/screens/CropCheckScreen.tsx` | Crop selector + result |
| 5.8 | API service layer | `frontend/src/services/api.ts` | All endpoints callable |
| 5.9 | Hindi/English toggle | `frontend/src/i18n/` | Language switch works |
| 5.10 | Loading/error states | All screens | Spinner on API call, error toast on failure |

**Estimated Time:** 30–40 hours

---

### Phase 6: Testing (Days 23–25)

**Goal:** Backend 80%+ test coverage, frontend smoke tests, integration tests.

| # | Task | Files Created | Verify |
|---|------|---------------|--------|
| 6.1 | Backend unit tests | `backend/tests/test_fertility.py`, `test_crop_recommender.py`, `test_fertilizer_calc.py` | `pytest` all green |
| 6.2 | Backend integration tests | `backend/tests/test_api.py` | All endpoints return expected status codes |
| 6.3 | Vision AI mock tests | `backend/tests/test_vision.py` | Mocked Gemini responses parse correctly |
| 6.4 | Frontend component tests | `frontend/__tests__/` | `npm test` passes |
| 6.5 | End-to-end manual test | — | Full flow: photo → results on device |

**Estimated Time:** 10–14 hours

---

### Phase 7: Deployment (Days 26–28)

**Goal:** Backend live on Railway, frontend APK built, API keys secured.

| # | Task | Files Created | Verify |
|---|------|---------------|--------|
| 7.1 | Dockerfile for backend | `backend/Dockerfile` | `docker build` succeeds |
| 7.2 | Railway deployment | `railway.toml` | `https://<app>.railway.app/health` → 200 |
| 7.3 | Environment variables on Railway | — | `GEMINI_API_KEY` set, not in code |
| 7.4 | Expo EAS build config | `frontend/eas.json` | `eas build --platform android` starts |
| 7.5 | APK generation | — | `.apk` file downloadable |
| 7.6 | Production PostgreSQL setup | — | `DATABASE_URL` points to Railway Postgres |

**Estimated Time:** 8–12 hours

---

### Phase 8: Future Scope (Post-MVP)

| Feature | Priority | Effort |
|---------|----------|--------|
| Weather API integration (OpenWeatherMap) | High | 2 days |
| GPS-based regional recommendations | High | 3 days |
| Offline mode with cached model | Medium | 5 days |
| Voice input in Hindi/regional languages | Medium | 4 days |
| Historical soil trend tracking per farmer | Medium | 3 days |
| WhatsApp bot integration | Low | 5 days |
| Multi-language support (Tamil, Telugu, Marathi) | Low | 4 days |
| Government scheme eligibility checker | Low | 3 days |

**Total MVP Estimated Time: 28–30 working days (1 developer)**

---

# SECTION 2 — SYSTEM ARCHITECTURE

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FARMER'S ANDROID PHONE                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Camera       │  │ Manual Entry │  │ Color Kit Selector │  │
│  │ (Photo)      │  │ (12 fields)  │  │ (L/M/H dropdowns)  │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘  │
│         └─────────────────┼────────────────────┘             │
│                           ▼                                  │
│               ┌───────────────────────┐                      │
│               │   React Native App    │                      │
│               │   (Expo managed)      │                      │
│               └───────────┬───────────┘                      │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTPS (JSON)
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                    RAILWAY CLOUD SERVER                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                  FastAPI Backend                         │  │
│  │                                                         │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │  │
│  │  │ /vision  │  │ /soil/analyze│  │ /crops/check     │   │  │
│  │  │ endpoint │  │ endpoint     │  │ endpoint         │   │  │
│  │  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘   │  │
│  │       │               │                   │             │  │
│  │       ▼               ▼                   ▼             │  │
│  │  ┌─────────┐   ┌────────────┐   ┌──────────────────┐   │  │
│  │  │Vision AI│   │Fertility   │   │Crop Recommender  │   │  │
│  │  │Service  │   │Scorer      │   │(Random Forest)   │   │  │
│  │  └────┬────┘   │(ICAR rules)│   └──────────────────┘   │  │
│  │       │        └────────────┘                           │  │
│  │       │                                                 │  │
│  │       ▼               ┌──────────────────┐              │  │
│  │  ┌─────────┐          │Fertilizer Calc   │              │  │
│  │  │Gemini   │◄────┐    │(Math formulas)   │              │  │
│  │  │API      │     │    └──────────────────┘              │  │
│  │  │(Vision) │     │                                      │  │
│  │  └─────────┘     │    ┌──────────────────┐              │  │
│  │                  │    │PostgreSQL DB     │              │  │
│  │                  └───►│(sessions, logs)  │              │  │
│  │                       └──────────────────┘              │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## Component Detail

### A. React Native App (Frontend)

| Attribute | Value |
|-----------|-------|
| **Role** | Farmer-facing mobile UI |
| **Technology** | React Native 0.76+, Expo SDK 52, TypeScript |
| **Input** | Camera photos, manual numeric entry, color kit selections |
| **Output** | Display fertility score, crop recommendations, fertilizer plan |
| **Connects to** | FastAPI backend via HTTPS REST calls |
| **Key Libraries** | `expo-camera`, `expo-image-picker`, `react-navigation`, `axios`, `i18next`, `victory-native` |

### B. FastAPI Backend

| Attribute | Value |
|-----------|-------|
| **Role** | Business logic, ML inference, Vision AI orchestration |
| **Technology** | Python 3.11, FastAPI 0.115+, Uvicorn |
| **Input** | JSON payloads (soil params) or multipart (images) |
| **Output** | JSON responses (scores, recommendations, fertilizer plans) |
| **Connects to** | Gemini API (external), PostgreSQL (data), ML model (local .pkl) |
| **Key Libraries** | `pydantic`, `scikit-learn`, `google-generativeai`, `sqlalchemy`, `pillow` |

### C. ML Model (Random Forest)

| Attribute | Value |
|-----------|-------|
| **Role** | Predict best crop from soil + climate parameters |
| **Technology** | scikit-learn RandomForestClassifier |
| **Input** | 7 features: N, P, K, temperature, humidity, pH, rainfall |
| **Output** | Top-5 crops with probability scores |
| **Loaded by** | Backend at startup, held in memory |
| **File** | `ml/models/crop_model.pkl` (~2–5 MB) |

### D. Gemini Vision AI

| Attribute | Value |
|-----------|-------|
| **Role** | Extract soil parameters from photos of devices/cards |
| **Technology** | Google Gemini 1.5 Flash API (free tier — 1500 requests/day) |
| **Input** | Base64-encoded JPEG/PNG image |
| **Output** | Structured JSON with parameter values + confidence score |
| **Connects to** | Google AI Studio API (external, HTTPS) |
| **Cost** | Free (no credit card required) |
| **API key from** | https://aistudio.google.com |

### E. Database (PostgreSQL)

| Attribute | Value |
|-----------|-------|
| **Role** | Persist user sessions, analysis history |
| **Technology** | SQLite (dev), PostgreSQL 16 (production on Railway) |
| **Input** | Session data from backend services |
| **Output** | Query results for history/analytics |
| **ORM** | SQLAlchemy 2.0 with async support |

### Data Flow: Photo Analysis Path

```
Farmer takes photo → App sends image (multipart) → /api/v1/vision/analyze
    → Vision AI Service → Gemini API → returns raw JSON
    → Unit Converter → normalizes to SHC units (kg/ha, mg/kg)
    → Fertility Scorer → ICAR rule-based rating
    → Crop Recommender → Random Forest predict_proba → top 5 crops
    → Fertilizer Calculator → dose per acre × land size
    → Response JSON → App displays Results Screen
```

### Data Flow: Manual Entry Path

```
Farmer enters 12 values → App sends JSON → /api/v1/soil/analyze
    → Fertility Scorer → ICAR rule-based rating
    → Crop Recommender → Random Forest predict_proba → top 5 crops
    → Fertilizer Calculator → dose per acre × land size
    → Response JSON → App displays Results Screen
```

---

# SECTION 3 — DATABASE DESIGN

## A. ICAR Soil Benchmark Thresholds

These are the actual values used by the Government of India Soil Health Card scheme.

### Macronutrients

| Parameter | Unit | Low | Medium | High | Method |
|-----------|------|-----|--------|------|--------|
| **Nitrogen (N)** | kg/ha | < 280 | 280–560 | > 560 | Alkaline KMnO₄ |
| **Phosphorus (P)** | kg/ha | < 10 | 10–25 | > 25 | Olsen's method |
| **Potassium (K)** | kg/ha | < 120 | 120–280 | > 280 | NH₄OAc extraction |
| **Organic Carbon (OC)** | % | < 0.50 | 0.50–0.75 | > 0.75 | Walkley-Black |

### Micronutrients (Critical Limits — below = Deficient)

| Parameter | Unit | Critical Limit | Sufficient | Method |
|-----------|------|---------------|------------|--------|
| **Sulphur (S)** | mg/kg | < 10.0 | ≥ 10.0 | 0.15% CaCl₂ |
| **Zinc (Zn)** | mg/kg | < 0.60 | ≥ 0.60 | DTPA |
| **Iron (Fe)** | mg/kg | < 4.50 | ≥ 4.50 | DTPA |
| **Copper (Cu)** | mg/kg | < 0.20 | ≥ 0.20 | DTPA |
| **Manganese (Mn)** | mg/kg | < 2.00 | ≥ 2.00 | DTPA |
| **Boron (B)** | mg/kg | < 0.50 | ≥ 0.50 | Hot water |

### pH and EC Classification

| Parameter | Unit | Range | Classification |
|-----------|------|-------|---------------|
| **pH** | — | < 5.5 | Strongly Acidic |
| | | 5.5–6.5 | Moderately Acidic |
| | | 6.5–7.5 | Neutral (Ideal) |
| | | 7.5–8.5 | Moderately Alkaline |
| | | > 8.5 | Strongly Alkaline |
| **EC** | dS/m | < 1.0 | Normal |
| | | 1.0–3.0 | Slightly Saline |
| | | 3.0–4.0 | Moderately Saline |
| | | > 4.0 | Saline (Problematic) |

### Fertility Score Algorithm

```python
def calculate_fertility_score(soil_data: dict) -> tuple[str, float]:
    score = 0
    max_score = 100
    
    # Macronutrients (60 points total, 15 each)
    for nutrient, key in [("N", "nitrogen"), ("P", "phosphorus"), 
                           ("K", "potassium"), ("OC", "organic_carbon")]:
        val = soil_data[key]
        if rating(nutrient, val) == "High":
            score += 15
        elif rating(nutrient, val) == "Medium":
            score += 10
        else:
            score += 3
    
    # Micronutrients (24 points total, 4 each for S, Zn, Fe, Cu, Mn, B)
    for micro in ["sulphur", "zinc", "iron", "copper", "manganese", "boron"]:
        val = soil_data[micro]
        if val >= critical_limit[micro]:
            score += 4
        else:
            score += 1
    
    # pH (8 points) — neutral is best
    ph = soil_data["ph"]
    if 6.5 <= ph <= 7.5:
        score += 8
    elif 5.5 <= ph <= 8.5:
        score += 5
    else:
        score += 2
    
    # EC (8 points) — lower is better
    ec = soil_data["ec"]
    if ec < 1.0:
        score += 8
    elif ec < 3.0:
        score += 5
    else:
        score += 2
    
    # Rating
    pct = (score / max_score) * 100
    if pct >= 80:
        return ("Excellent", pct)
    elif pct >= 60:
        return ("Good", pct)
    elif pct >= 40:
        return ("Fair", pct)
    else:
        return ("Poor", pct)
```

---

## B. Crops Database (25 Major Indian Crops)

| # | Crop | Ideal N (kg/ha) | Ideal P (kg/ha) | Ideal K (kg/ha) | pH Range | Season | Major States |
|---|------|----------------|----------------|----------------|----------|--------|-------------|
| 1 | Rice | 80–120 | 40–60 | 40–60 | 5.5–7.0 | Kharif | WB, UP, Punjab, AP |
| 2 | Wheat | 100–150 | 40–60 | 40–50 | 6.0–7.5 | Rabi | UP, Punjab, MP, Haryana |
| 3 | Maize | 80–120 | 40–60 | 40–60 | 5.5–7.5 | Kharif/Rabi | Karnataka, MP, Bihar |
| 4 | Cotton | 60–80 | 30–40 | 30–40 | 6.0–8.0 | Kharif | Gujarat, Maharashtra, Telangana |
| 5 | Sugarcane | 150–250 | 60–80 | 60–80 | 6.5–7.5 | Annual | UP, Maharashtra, Karnataka |
| 6 | Soybean | 20–30 | 60–80 | 40–60 | 6.0–7.0 | Kharif | MP, Maharashtra, Rajasthan |
| 7 | Groundnut | 10–25 | 40–60 | 40–50 | 6.0–7.0 | Kharif | Gujarat, AP, Rajasthan |
| 8 | Mustard | 60–80 | 30–40 | 20–30 | 6.0–7.5 | Rabi | Rajasthan, MP, UP |
| 9 | Chickpea | 20–25 | 40–60 | 20–30 | 6.0–7.5 | Rabi | MP, Maharashtra, Rajasthan |
| 10 | Pigeon Pea (Tur) | 20–25 | 40–60 | 20–30 | 6.0–7.5 | Kharif | Maharashtra, Karnataka, MP |
| 11 | Lentil | 20–25 | 40–50 | 20–30 | 6.0–7.5 | Rabi | UP, MP, Bihar |
| 12 | Mung Bean | 20–25 | 40–50 | 20–30 | 6.3–7.2 | Kharif/Summer | Rajasthan, Maharashtra, MP |
| 13 | Potato | 120–150 | 60–80 | 100–120 | 5.5–6.5 | Rabi | UP, WB, Bihar |
| 14 | Onion | 100–120 | 50–60 | 60–80 | 6.0–7.0 | Rabi | Maharashtra, Karnataka, MP |
| 15 | Tomato | 100–120 | 60–80 | 80–100 | 6.0–7.0 | Rabi/Summer | MP, Karnataka, AP |
| 16 | Chilli | 80–100 | 40–60 | 50–60 | 6.0–7.0 | Kharif | AP, Karnataka, MP |
| 17 | Tea | 80–120 | 30–40 | 40–60 | 4.5–5.5 | Perennial | Assam, WB, Kerala |
| 18 | Coffee | 40–60 | 30–40 | 40–60 | 6.0–6.5 | Perennial | Karnataka, Kerala, TN |
| 19 | Banana | 150–200 | 50–60 | 200–250 | 6.0–7.5 | Perennial | TN, Maharashtra, Gujarat |
| 20 | Mango | 60–100 | 30–50 | 60–100 | 5.5–7.5 | Perennial | UP, AP, Karnataka |
| 21 | Turmeric | 60–80 | 30–40 | 80–120 | 6.0–7.5 | Kharif | Telangana, TN, AP |
| 22 | Jute | 60–80 | 30–40 | 30–40 | 6.5–7.5 | Kharif | WB, Bihar, Assam |
| 23 | Sunflower | 60–90 | 40–60 | 30–40 | 6.0–7.5 | Kharif/Rabi | Karnataka, AP, Maharashtra |
| 24 | Barley | 60–80 | 30–40 | 20–30 | 6.0–8.0 | Rabi | Rajasthan, UP, MP |
| 25 | Millets (Bajra) | 40–60 | 20–30 | 20–30 | 6.0–7.5 | Kharif | Rajasthan, Maharashtra, Gujarat |

---

## C. Fertilizer Database (15 Common Indian Fertilizers)

| # | Fertilizer | N% | P₂O₅% | K₂O% | Other | Fixes Deficiency | MRP ₹/kg (approx) |
|---|-----------|-----|--------|-------|-------|-----------------|-------------------|
| 1 | Urea | 46 | 0 | 0 | — | Nitrogen | ₹5.38 |
| 2 | DAP (Diammonium Phosphate) | 18 | 46 | 0 | — | Nitrogen + Phosphorus | ₹27.00 |
| 3 | MOP (Muriate of Potash) | 0 | 0 | 60 | — | Potassium | ₹17.00 |
| 4 | SSP (Single Super Phosphate) | 0 | 16 | 0 | 11% S | Phosphorus + Sulphur | ₹7.50 |
| 5 | NPK 10:26:26 | 10 | 26 | 26 | — | Balanced P+K | ₹27.50 |
| 6 | NPK 12:32:16 | 12 | 32 | 16 | — | Phosphorus-heavy | ₹28.00 |
| 7 | NPK 20:20:0 | 20 | 20 | 0 | — | Balanced N+P | ₹22.00 |
| 8 | NPK 15:15:15 | 15 | 15 | 15 | — | Balanced all | ₹25.00 |
| 9 | Ammonium Sulphate | 20.6 | 0 | 0 | 24% S | Nitrogen + Sulphur | ₹12.00 |
| 10 | Zinc Sulphate (ZnSO₄) | 0 | 0 | 0 | 21% Zn, 10% S | Zinc + Sulphur | ₹50.00 |
| 11 | Ferrous Sulphate (FeSO₄) | 0 | 0 | 0 | 19% Fe, 11% S | Iron + Sulphur | ₹30.00 |
| 12 | Borax | 0 | 0 | 0 | 11% B | Boron | ₹65.00 |
| 13 | Copper Sulphate (CuSO₄) | 0 | 0 | 0 | 24% Cu | Copper | ₹250.00 |
| 14 | Manganese Sulphate (MnSO₄) | 0 | 0 | 0 | 30.5% Mn | Manganese | ₹70.00 |
| 15 | Neem Coated Urea | 46 | 0 | 0 | Neem oil coating | Nitrogen (slow release) | ₹5.63 |

---

## D. User Session Storage Schema

```sql
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    input_method    VARCHAR(20) NOT NULL,  -- 'photo_meter', 'photo_shc', 'manual', 'color_kit'
    land_size_acres FLOAT,
    
    -- Raw soil input values
    nitrogen        FLOAT,    -- kg/ha
    phosphorus      FLOAT,    -- kg/ha
    potassium       FLOAT,    -- kg/ha
    ph              FLOAT,
    ec              FLOAT,    -- dS/m
    organic_carbon  FLOAT,    -- %
    sulphur         FLOAT,    -- mg/kg
    zinc            FLOAT,    -- mg/kg
    iron            FLOAT,    -- mg/kg
    copper          FLOAT,    -- mg/kg
    manganese       FLOAT,    -- mg/kg
    boron           FLOAT,    -- mg/kg
    
    -- Computed results
    fertility_score FLOAT,
    fertility_rating VARCHAR(10),  -- 'Excellent', 'Good', 'Fair', 'Poor'
    top_crops       JSONB,         -- [{"crop":"rice","probability":0.85}, ...]
    fertilizer_plan JSONB,         -- [{"fertilizer":"Urea","qty_kg_per_acre":45.6}, ...]
    
    -- Vision AI metadata (if photo input)
    vision_confidence FLOAT,
    image_url         TEXT
);

CREATE INDEX idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX idx_sessions_rating ON sessions(fertility_rating);
```

---

# SECTION 4 — API DESIGN

**Base URL:** `https://<app>.railway.app/api/v1`

## Endpoint 1: Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "model_loaded": true
}
```

---

## Endpoint 2: Full Soil Analysis

```
POST /api/v1/soil/analyze
```

**Request Body:**
```json
{
  "input_method": "manual",
  "land_size_acres": 5.0,
  "soil_data": {
    "nitrogen": 320,
    "phosphorus": 18,
    "potassium": 200,
    "ph": 6.8,
    "ec": 0.45,
    "organic_carbon": 0.62,
    "sulphur": 12.5,
    "zinc": 0.8,
    "iron": 5.2,
    "copper": 0.3,
    "manganese": 3.1,
    "boron": 0.6
  },
  "climate": {
    "temperature": 28.5,
    "humidity": 72.0,
    "rainfall": 1200.0
  }
}
```

**Response:**
```json
{
  "session_id": "a1b2c3d4-...",
  "fertility": {
    "score": 72.0,
    "rating": "Good",
    "breakdown": {
      "nitrogen": {"value": 320, "unit": "kg/ha", "rating": "Medium"},
      "phosphorus": {"value": 18, "unit": "kg/ha", "rating": "Medium"},
      "potassium": {"value": 200, "unit": "kg/ha", "rating": "Medium"},
      "ph": {"value": 6.8, "classification": "Neutral"},
      "ec": {"value": 0.45, "classification": "Normal"},
      "organic_carbon": {"value": 0.62, "rating": "Medium"},
      "sulphur": {"value": 12.5, "status": "Sufficient"},
      "zinc": {"value": 0.8, "status": "Sufficient"},
      "iron": {"value": 5.2, "status": "Sufficient"},
      "copper": {"value": 0.3, "status": "Sufficient"},
      "manganese": {"value": 3.1, "status": "Sufficient"},
      "boron": {"value": 0.6, "status": "Sufficient"}
    }
  },
  "crop_recommendations": [
    {"rank": 1, "crop": "rice", "probability": 0.89, "season": "Kharif", "ideal_ph": "5.5-7.0"},
    {"rank": 2, "crop": "maize", "probability": 0.76, "season": "Kharif", "ideal_ph": "5.5-7.5"},
    {"rank": 3, "crop": "cotton", "probability": 0.68, "season": "Kharif", "ideal_ph": "6.0-8.0"},
    {"rank": 4, "crop": "jute", "probability": 0.55, "season": "Kharif", "ideal_ph": "6.5-7.5"},
    {"rank": 5, "crop": "chickpea", "probability": 0.42, "season": "Rabi", "ideal_ph": "6.0-7.5"}
  ],
  "fertilizer_plan": {
    "land_size_acres": 5.0,
    "recommendations": [
      {
        "fertilizer": "Urea",
        "purpose": "Increase Nitrogen to High",
        "qty_per_acre_kg": 52.17,
        "total_qty_kg": 260.87,
        "estimated_cost": "₹1,403"
      },
      {
        "fertilizer": "SSP",
        "purpose": "Increase Phosphorus to High",
        "qty_per_acre_kg": 43.75,
        "total_qty_kg": 218.75,
        "estimated_cost": "₹1,641"
      }
    ],
    "total_estimated_cost": "₹3,044"
  }
}
```

**Internal Logic:**
1. Validate all 12 soil params via Pydantic (range checks)
2. Run `fertility.calculate_score(soil_data)` → score + rating + breakdown
3. Run `crop_recommender.predict(N, P, K, temp, humidity, pH, rainfall)` → top 5
4. Run `fertilizer_calc.compute(soil_data, land_size)` → fertilizer plan
5. Save session to DB
6. Return combined response

---

## Endpoint 3: Vision Image Analysis

```
POST /api/v1/vision/analyze
Content-Type: multipart/form-data
```

**Request:** Form fields:
- `image`: JPEG/PNG file (max 10 MB)
- `image_type`: `"lcd_meter"` or `"soil_health_card"`

**Response (Success):**
```json
{
  "success": true,
  "confidence": 0.92,
  "extracted_data": {
    "nitrogen": 340,
    "phosphorus": 22,
    "potassium": 180,
    "ph": 7.1,
    "ec": 0.38,
    "organic_carbon": null,
    "sulphur": null,
    "zinc": null,
    "iron": null,
    "copper": null,
    "manganese": null,
    "boron": null
  },
  "missing_fields": ["organic_carbon", "sulphur", "zinc", "iron", "copper", "manganese", "boron"],
  "message": "Extracted 5 parameters. 7 fields need manual entry."
}
```

**Response (Failed read):**
```json
{
  "success": false,
  "confidence": 0.15,
  "extracted_data": null,
  "message": "Image too blurry. Please retake the photo with better lighting."
}
```

---

## Endpoint 4: Specific Crop Suitability Check

```
POST /api/v1/crops/check
```

**Request:**
```json
{
  "crop_name": "rice",
  "soil_data": {
    "nitrogen": 320,
    "phosphorus": 18,
    "potassium": 200,
    "ph": 6.8,
    "ec": 0.45
  }
}
```

**Response:**
```json
{
  "crop": "rice",
  "suitable": true,
  "suitability_score": 85,
  "season": "Kharif",
  "ideal_conditions": {
    "nitrogen": {"ideal": "80-120 kg/ha", "yours": 320, "status": "Above ideal but OK"},
    "phosphorus": {"ideal": "40-60 kg/ha", "yours": 18, "status": "Below ideal — needs improvement"},
    "potassium": {"ideal": "40-60 kg/ha", "yours": 200, "status": "Above ideal but OK"},
    "ph": {"ideal": "5.5-7.0", "yours": 6.8, "status": "Within range ✓"},
    "ec": {"max": 3.0, "yours": 0.45, "status": "Safe ✓"}
  },
  "deficiency_fixes": [
    "Apply 37.5 kg SSP per acre to bring Phosphorus to adequate level"
  ]
}
```

---

## Endpoint 5: Color Kit Input

```
POST /api/v1/soil/color-kit
```

**Request:**
```json
{
  "land_size_acres": 3.0,
  "readings": {
    "nitrogen": "Medium",
    "phosphorus": "Low",
    "potassium": "High"
  },
  "climate": {
    "temperature": 30.0,
    "humidity": 65.0,
    "rainfall": 800.0
  }
}
```

**Internal Logic:** Convert Low/Medium/High to mid-range numeric values:
- N: Low=140, Medium=420, High=700 (kg/ha)
- P: Low=5, Medium=17.5, High=35 (kg/ha)
- K: Low=60, Medium=200, High=350 (kg/ha)

Then feed to the same analysis pipeline as Endpoint 2, minus micronutrients.

**Response:** Same structure as Endpoint 2, but micronutrient fields are `null`.

---

# SECTION 5 — ML MODEL SPEC

## Dataset

- **Source:** Kaggle — "Crop Recommendation Dataset" by Atharva Ingle
- **URL:** `https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset`
- **Size:** 2200 rows × 8 columns
- **Columns:** `N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`, `label`
- **Labels (22 crops):** rice, maize, chickpea, kidneybeans, pigeonpeas, mothbeans, mungbean, blackgram, lentil, pomegranate, banana, mango, grapes, watermelon, muskmelon, apple, orange, papaya, coconut, cotton, jute, coffee

## Download Steps (Windows)

```powershell
# Option A: Kaggle CLI
pip install kaggle
# Place kaggle.json in C:\Users\<you>\.kaggle\
kaggle datasets download -d atharvaingle/crop-recommendation-dataset -p ml/data/
Expand-Archive ml/data/crop-recommendation-dataset.zip -DestinationPath ml/data/

# Option B: Manual
# Go to URL above → Download → Unzip to ml/data/
```

## Preprocessing (`ml/preprocess.py`)

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib

df = pd.read_csv("data/Crop_recommendation.csv")

# Features and target
X = df[["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]]
y = df["label"]

# Encode labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split 80/20
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

# Save artifacts
joblib.dump(le, "models/label_encoder.pkl")
joblib.dump(scaler, "models/scaler.pkl")
```

## Model Training (`ml/train.py`)

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Hyperparameters
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_split=5,
    min_samples_leaf=2,
    max_features="sqrt",
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.4f}")  # Expected: ≥ 0.95
print(classification_report(y_test, y_pred, target_names=le.classes_))

# Save model
joblib.dump(model, "models/crop_model.pkl")
```

## Hyperparameters Justification

| Parameter | Value | Why |
|-----------|-------|-----|
| `n_estimators` | 100 | Stable accuracy without overfitting on 2200 rows |
| `max_depth` | 20 | Deep enough for 22 classes, prevents forest from being too shallow |
| `min_samples_split` | 5 | Avoids overfitting small leaf nodes |
| `min_samples_leaf` | 2 | Each leaf represents at least 2 samples |
| `max_features` | "sqrt" | Standard for classification — sqrt(7) ≈ 2.6 features per split |
| `random_state` | 42 | Reproducibility |

## Expected Metrics

| Metric | Target |
|--------|--------|
| Accuracy | ≥ 95% |
| Per-class F1 | ≥ 0.85 for all 22 crops |
| Model file size | < 5 MB |

## Inference in Backend

```python
# backend/app/services/crop_recommender.py
import joblib
import numpy as np

class CropRecommender:
    def __init__(self):
        self.model = joblib.load("ml/models/crop_model.pkl")
        self.scaler = joblib.load("ml/models/scaler.pkl")
        self.le = joblib.load("ml/models/label_encoder.pkl")
    
    def predict(self, n, p, k, temp, humidity, ph, rainfall, top_n=5):
        features = np.array([[n, p, k, temp, humidity, ph, rainfall]])
        features_scaled = self.scaler.transform(features)
        probabilities = self.model.predict_proba(features_scaled)[0]
        
        top_indices = np.argsort(probabilities)[::-1][:top_n]
        results = []
        for idx in top_indices:
            results.append({
                "crop": self.le.inverse_transform([idx])[0],
                "probability": round(float(probabilities[idx]), 4)
            })
        return results
```

---

# SECTION 6 — VISION AI SPEC

## Gemini API Configuration

```python
import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")
```

## Prompt A: LCD Digital Meter Photo

```text
You are analyzing a photo of a handheld digital soil testing meter's LCD screen.

Extract ALL visible readings from the display. The meter typically shows:
- NPK values (in mg/kg)
- pH (0-14 scale)
- EC / Electrical Conductivity (in mS/cm)
- Moisture (%)
- Temperature (°C)

RULES:
1. Read EXACTLY what is on the LCD screen - do not guess or estimate
2. If a value is partially visible or unclear, set its confidence to "low"
3. If a value is not displayed at all, set it to null
4. Pay attention to decimal points on the LCD
5. Note the units shown on the device

Return ONLY this JSON structure, no other text:
{
  "confidence": 0.0-1.0,
  "readings": {
    "nitrogen_mg_kg": <number or null>,
    "phosphorus_mg_kg": <number or null>,
    "potassium_mg_kg": <number or null>,
    "ph": <number or null>,
    "ec_ms_cm": <number or null>,
    "moisture_pct": <number or null>,
    "temperature_c": <number or null>
  },
  "device_brand": "<detected brand or 'unknown'>",
  "notes": "<any issues with the image>"
}
```

## Prompt B: Government Soil Health Card Photo

```text
You are analyzing a photo of an Indian Government Soil Health Card (मृदा स्वास्थ्य कार्ड).

This card contains a table with 12 soil test parameters. Extract ALL values from the card.

The card is typically in Hindi+English and has these parameters:
1. Nitrogen (N) - in kg/ha
2. Phosphorus (P) - in kg/ha
3. Potassium (K) - in kg/ha
4. Sulphur (S) - in mg/kg
5. Zinc (Zn) - in mg/kg
6. Iron (Fe) - in mg/kg
7. Copper (Cu) - in mg/kg
8. Manganese (Mn) - in mg/kg
9. Boron (B) - in mg/kg
10. pH
11. EC (Electrical Conductivity) - in dS/m
12. Organic Carbon (OC) - in %

RULES:
1. The card may have values in a table with columns like "Result" and "Rating"
2. Extract the NUMERIC result value, not the rating text
3. Handle both Hindi and English text on the card
4. If the card is upside down or rotated, still try to read it
5. If a value is partially obscured, set confidence to "low"
6. If you cannot read a value at all, set it to null

Return ONLY this JSON structure, no other text:
{
  "confidence": 0.0-1.0,
  "card_info": {
    "farmer_name": "<if visible, else null>",
    "village": "<if visible, else null>",
    "sample_date": "<if visible, else null>"
  },
  "readings": {
    "nitrogen_kg_ha": <number or null>,
    "phosphorus_kg_ha": <number or null>,
    "potassium_kg_ha": <number or null>,
    "sulphur_mg_kg": <number or null>,
    "zinc_mg_kg": <number or null>,
    "iron_mg_kg": <number or null>,
    "copper_mg_kg": <number or null>,
    "manganese_mg_kg": <number or null>,
    "boron_mg_kg": <number or null>,
    "ph": <number or null>,
    "ec_ds_m": <number or null>,
    "organic_carbon_pct": <number or null>
  },
  "notes": "<any issues with the image>"
}
```

## Unit Conversion Logic

When receiving values from an **LCD meter** (which reports in mg/kg), convert to SHC standard units:

```python
def convert_meter_to_shc(meter_readings: dict) -> dict:
    """Convert LCD meter mg/kg readings to Soil Health Card kg/ha units for NPK."""
    shc = {}
    
    # NPK: mg/kg → kg/ha (multiply by 2.24 assuming 15cm depth, 1.12 g/cc bulk density)
    # Standard conversion: 1 mg/kg = 2.24 kg/ha (for 0-15cm depth at bulk density 1.49)
    # Simplified: commonly used factor = 2.24 for Indian soils
    CONVERSION_FACTOR = 2.24
    
    if meter_readings.get("nitrogen_mg_kg") is not None:
        shc["nitrogen"] = meter_readings["nitrogen_mg_kg"] * CONVERSION_FACTOR
    if meter_readings.get("phosphorus_mg_kg") is not None:
        shc["phosphorus"] = meter_readings["phosphorus_mg_kg"] * CONVERSION_FACTOR
    if meter_readings.get("potassium_mg_kg") is not None:
        shc["potassium"] = meter_readings["potassium_mg_kg"] * CONVERSION_FACTOR
    
    # pH: same unit, no conversion
    shc["ph"] = meter_readings.get("ph")
    
    # EC: mS/cm → dS/m (1 mS/cm = 1 dS/m, same unit different name)
    shc["ec"] = meter_readings.get("ec_ms_cm")
    
    return shc
```

## Error Handling

| Scenario | Detection | Response |
|----------|-----------|----------|
| Blurry image | `confidence < 0.5` | `"Image too blurry. Please retake with better lighting."` |
| Wrong image type | No meter/card detected | `"This doesn't appear to be a soil test device. Please upload a photo of your meter or Soil Health Card."` |
| Partial read | Some fields null | Return extracted fields + list of `missing_fields` for manual entry |
| Gemini API timeout | 30s timeout exceeded | `"Analysis taking too long. Please try again or enter values manually."` |
| Gemini API error | HTTP 500/429 | `"Service temporarily unavailable. Please enter values manually."` |
| Image too large | File > 10 MB | Reject at upload with `"Image file too large. Maximum 10 MB."` |

---

# SECTION 7 — FERTILIZER CALCULATION

## Core Formula

The fertilizer recommendation is based on the **deficit method**: calculate how much nutrient is missing to reach the "High" threshold, then calculate which fertilizer and how much is needed.

### Step 1: Calculate Nutrient Deficit

```
Deficit (kg/ha) = Target_Value - Current_Value
```

Where `Target_Value` is the lower bound of the "High" rating:
- Nitrogen: 560 kg/ha
- Phosphorus: 25 kg/ha
- Potassium: 280 kg/ha

If current value is already "High", deficit = 0 (no fertilizer needed for that nutrient).

### Step 2: Calculate Fertilizer Quantity

```
Fertilizer_Required (kg/ha) = Deficit (kg/ha) / (Nutrient_Percentage / 100)
```

### Step 3: Convert to Per-Acre

```
1 hectare = 2.471 acres
Fertilizer_Per_Acre (kg) = Fertilizer_Required (kg/ha) / 2.471
```

### Step 4: Scale to Farmer's Land

```
Total_Fertilizer (kg) = Fertilizer_Per_Acre × Land_Size_Acres
Total_Cost (₹) = Total_Fertilizer × Price_Per_Kg
```

## Worked Example

**Given:**
- Farmer's land: 5 acres
- Nitrogen (N): 320 kg/ha (Medium)
- Phosphorus (P): 8 kg/ha (Low)
- Potassium (K): 300 kg/ha (High — no action needed)

**Step 1: Calculate Deficits**
```
N deficit = 560 - 320 = 240 kg/ha
P deficit = 25 - 8  = 17 kg/ha
K deficit = 0 (already High)
```

**Step 2: Choose Fertilizer & Calculate**

For Nitrogen — use Urea (46% N):
```
Urea required = 240 / (46/100) = 240 / 0.46 = 521.74 kg/ha
Per acre = 521.74 / 2.471 = 211.15 kg/acre
Total for 5 acres = 211.15 × 5 = 1,055.75 kg
Cost = 1,055.75 × ₹5.38 = ₹5,680
```

For Phosphorus — use DAP (46% P₂O₅, 18% N):
```
DAP required = 17 / (46/100) = 17 / 0.46 = 36.96 kg/ha
Per acre = 36.96 / 2.471 = 14.96 kg/acre
Total for 5 acres = 14.96 × 5 = 74.80 kg
Cost = 74.80 × ₹27.00 = ₹2,020

Bonus N from DAP = 74.80 × 0.18 = 13.46 kg (reduces needed Urea)
Adjusted Urea total = 1,055.75 - (13.46 / 0.46 × 5 / 2.471) ≈ reduces slightly
```

**Step 3: Micronutrient Fixes**

If Zinc = 0.4 mg/kg (Deficient, < 0.6 threshold):
```
Apply Zinc Sulphate (ZnSO₄, 21% Zn) at standard dose:
Dose = 25 kg/ha = 10.12 kg/acre
Total for 5 acres = 50.6 kg
Cost = 50.6 × ₹50 = ₹2,530
```

## Edge Cases

| Case | Handling |
|------|----------|
| All nutrients already "High" | Return `"Your soil is excellent! No fertilizer needed this season."` |
| Multiple nutrients deficient | Recommend compound fertilizers first (e.g., NPK 10:26:26 if P+K both low), then top-up individual |
| pH too low (< 5.5) | Recommend lime application: `"Apply 2-4 quintal/acre lime before sowing"` |
| pH too high (> 8.5) | Recommend gypsum: `"Apply 2-3 quintal/acre gypsum"` |
| EC too high (> 4.0 dS/m) | Recommend leaching: `"Irrigate heavily to flush salts before planting"` |
| Organic Carbon very low (< 0.25%) | Recommend FYM: `"Apply 4-5 tons/acre Farm Yard Manure"` |
| Color kit input (no exact values) | Use mid-range values: if "Medium" N → assume 420 kg/ha, calculate deficit from there |
| Land size = 0 or negative | Reject: `"Please enter a valid land size"` |
| Deficit is negative (excess) | Set deficit to 0, no recommendation for that nutrient |

## Implementation Code

```python
# backend/app/services/fertilizer_calc.py

HECTARE_TO_ACRE = 2.471

TARGET_VALUES = {
    "nitrogen": 560,      # kg/ha — lower bound of "High"
    "phosphorus": 25,     # kg/ha
    "potassium": 280,     # kg/ha
}

FERTILIZER_DB = {
    "nitrogen": {"name": "Urea", "nutrient_pct": 46, "price_per_kg": 5.38},
    "phosphorus": {"name": "DAP", "nutrient_pct": 46, "price_per_kg": 27.00},
    "potassium": {"name": "MOP", "nutrient_pct": 60, "price_per_kg": 17.00},
}

MICRO_DOSES = {
    "sulphur":   {"name": "Ammonium Sulphate", "dose_kg_ha": 50, "price": 12.00},
    "zinc":      {"name": "Zinc Sulphate",     "dose_kg_ha": 25, "price": 50.00},
    "iron":      {"name": "Ferrous Sulphate",  "dose_kg_ha": 50, "price": 30.00},
    "copper":    {"name": "Copper Sulphate",   "dose_kg_ha": 5,  "price": 250.00},
    "manganese": {"name": "Manganese Sulphate","dose_kg_ha": 25, "price": 70.00},
    "boron":     {"name": "Borax",             "dose_kg_ha": 10, "price": 65.00},
}

MICRO_CRITICAL = {
    "sulphur": 10.0, "zinc": 0.6, "iron": 4.5,
    "copper": 0.2, "manganese": 2.0, "boron": 0.5
}

def compute_fertilizer_plan(soil: dict, land_acres: float) -> list[dict]:
    recommendations = []
    
    # Macronutrients
    for nutrient, target in TARGET_VALUES.items():
        current = soil.get(nutrient, 0)
        deficit = max(0, target - current)
        if deficit > 0:
            fert = FERTILIZER_DB[nutrient]
            qty_ha = deficit / (fert["nutrient_pct"] / 100)
            qty_acre = qty_ha / HECTARE_TO_ACRE
            total = qty_acre * land_acres
            cost = total * fert["price_per_kg"]
            recommendations.append({
                "fertilizer": fert["name"],
                "purpose": f"Increase {nutrient.title()} to High",
                "qty_per_acre_kg": round(qty_acre, 2),
                "total_qty_kg": round(total, 2),
                "estimated_cost": f"₹{cost:,.0f}"
            })
    
    # Micronutrients
    for micro, threshold in MICRO_CRITICAL.items():
        current = soil.get(micro)
        if current is not None and current < threshold:
            info = MICRO_DOSES[micro]
            qty_acre = info["dose_kg_ha"] / HECTARE_TO_ACRE
            total = qty_acre * land_acres
            cost = total * info["price"]
            recommendations.append({
                "fertilizer": info["name"],
                "purpose": f"Fix {micro.title()} deficiency",
                "qty_per_acre_kg": round(qty_acre, 2),
                "total_qty_kg": round(total, 2),
                "estimated_cost": f"₹{cost:,.0f}"
            })
    
    return recommendations
```

---

# SECTION 8 — FRONTEND SCREENS

## Screen Flow

```
App Launch
    │
    ▼
┌─────────────┐
│ HOME SCREEN │ ← 3 input method cards
│             │
│ [📷 Photo]  │──► Camera Screen ──► Review ──► Loading ──► Results
│ [✏️ Manual] │──► Manual Entry Form ────────► Loading ──► Results
│ [🎨 Color]  │──► Color Kit Form ──────────► Loading ──► Results
│             │
│ [🌾 Check]  │──► Crop Check Screen ──────► Suitability Result
│ [📜 History]│──► Past Results List
└─────────────┘
```

---

### Screen 1: Home Screen

**What farmer sees:**
- App logo "SoilVision 🌱" at top
- Greeting: "नमस्ते किसान!" / "Hello Farmer!"
- Language toggle (Hindi ↔ English) — top right
- 3 large tappable cards with icons:
  - 📷 **"Scan Meter / Card"** — "Take a photo of your soil test device or Soil Health Card"
  - ✏️ **"Manual Entry"** — "Type your soil test values"
  - 🎨 **"Color Kit"** — "Select Low/Medium/High from your IFFCO or Kisan kit"
- Below the cards:
  - 🌾 **"Check Specific Crop"** button — "Is my soil good for wheat? Find out"
  - 📜 **"My Past Results"** link

**Inputs:** None (navigation only)
**Buttons:** 5 navigation buttons (3 main cards + 2 secondary)
**Navigation:** Each card → respective screen

---

### Screen 2: Camera Screen

**What farmer sees:**
- Full-screen camera viewfinder
- Toggle: "Meter" or "Soil Health Card" selector at top
- Capture button at bottom center (large circular)
- Flash toggle (torch icon)
- Gallery button to pick existing photo

**Inputs:** Camera photo or gallery image
**Buttons:** Capture, Gallery, Flash toggle, Back
**Navigation:** After capture → Review Screen

---

### Screen 3: Photo Review Screen

**What farmer sees:**
- Captured photo displayed full-width
- Two buttons:
  - ✅ "Analyze This Photo" (green, large)
  - 🔄 "Retake" (secondary)
- After tapping Analyze → Loading spinner with "AI is reading your photo..."

**Inputs:** Confirm or retake
**Buttons:** Analyze, Retake
**Navigation:** Analyze → Loading → Results; Retake → Camera Screen

---

### Screen 4: Manual Entry Screen

**What farmer sees:**
- Title: "Enter Your Soil Test Values"
- Input field for **Land Size (acres)** at top
- 12 numeric input fields grouped in cards:
  - **Macronutrients Card:** N (kg/ha), P (kg/ha), K (kg/ha), OC (%)
  - **Micronutrients Card:** S (mg/kg), Zn (mg/kg), Fe (mg/kg), Cu (mg/kg), Mn (mg/kg), B (mg/kg)
  - **Soil Properties Card:** pH, EC (dS/m)
- Climate section (collapsible):
  - Temperature (°C), Humidity (%), Rainfall (mm/year)
  - Default values auto-filled based on season
- "Analyze" button at bottom

**Inputs:** 12 numeric fields + 3 climate fields + land size
**Buttons:** Analyze, Clear All, Back
**Navigation:** Analyze → Loading → Results Screen

---

### Screen 5: Color Kit Screen

**What farmer sees:**
- Title: "Select Kit Results"
- Illustration showing what a color kit looks like
- Land size input
- 3 dropdowns, each with a colored badge:
  - **Nitrogen:** 🔴 Low | 🟡 Medium | 🟢 High
  - **Phosphorus:** 🔴 Low | 🟡 Medium | 🟢 High
  - **Potassium:** 🔴 Low | 🟡 Medium | 🟢 High
- Climate section (same as Manual Entry)
- Note: "Color kits test only NPK. For full analysis, use a lab report."
- "Analyze" button

**Inputs:** 3 dropdowns + climate + land size
**Buttons:** Analyze, Back
**Navigation:** Analyze → Loading → Results

---

### Screen 6: Results Screen

**What farmer sees — 3 sections in a scrollable view:**

**Section A: Fertility Score**
- Large circular gauge showing score (0–100)
- Color-coded: Green (Excellent) / Yellow-Green (Good) / Orange (Fair) / Red (Poor)
- Text: "Your Soil Rating: Good (72/100)"
- Expandable breakdown showing each parameter's individual rating

**Section B: Recommended Crops**
- Title: "Best Crops for Your Soil"
- Ranked list of top 5 crops with:
  - Crop name + emoji (🌾 Rice)
  - Confidence bar (89%)
  - Season badge (Kharif / Rabi)
  - Tappable to see detailed suitability

**Section C: Fertilizer Plan**
- Title: "Fertilizer Recommendations for [X] acres"
- Table/card list showing:
  - Fertilizer name
  - Purpose ("Increase Nitrogen")
  - Quantity per acre + total quantity
  - Estimated cost
- Bottom: **Total Estimated Cost: ₹X,XXX**
- Buttons: "Share via WhatsApp" 📲, "Save Report" 💾, "New Analysis" 🔄

**Inputs:** None (display only)
**Buttons:** Share, Save, New Analysis, Back to Home
**Navigation:** New Analysis → Home; Share → WhatsApp intent

---

### Screen 7: Crop Check Screen

**What farmer sees:**
- Title: "Check if Your Soil Suits a Crop"
- Searchable dropdown of 25 crops (with icons)
- Mini soil input form (N, P, K, pH, EC) — or "Use last analysis" toggle
- "Check Suitability" button
- Result card showing:
  - ✅ / ❌ Suitable / Not suitable
  - Score out of 100
  - Parameter-wise comparison table
  - Specific fixes needed

**Inputs:** Crop selector + 5 soil params or last-session data
**Buttons:** Check, Back
**Navigation:** Results appear inline below the button

---

### Screen 8: History Screen

**What farmer sees:**
- List of past analysis sessions, sorted by date (newest first)
- Each entry shows:
  - Date & time
  - Input method icon (📷 / ✏️ / 🎨)
  - Fertility rating badge
  - Top recommended crop
- Tappable to re-view full results

**Inputs:** None
**Buttons:** Each item navigable, Back
**Navigation:** Tap item → full Results Screen for that session

---

# SECTION 9 — ENVIRONMENT SETUP

## Prerequisites

- Windows 10/11
- Python 3.11+ installed
- Node.js 20+ installed
- Git installed
- Android phone with Expo Go app (for frontend testing)

## Backend Setup (Windows PowerShell)

```powershell
# 1. Clone and navigate
cd d:\SoilVision

# 2. Create backend directory structure
mkdir backend\app\routers, backend\app\services, backend\app\models, backend\app\schemas, backend\app\core, backend\app\data, backend\app\prompts
mkdir backend\tests
mkdir ml\data, ml\models, ml\notebooks

# 3. Create Python virtual environment
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# 4. Install dependencies
pip install fastapi==0.115.6
pip install uvicorn[standard]==0.34.0
pip install scikit-learn==1.6.1
pip install pandas==2.2.3
pip install numpy==1.26.4
pip install google-generativeai==0.8.3
pip install sqlalchemy==2.0.36
pip install asyncpg==0.30.0
pip install python-multipart==0.0.18
pip install python-dotenv==1.0.1
pip install pydantic==2.10.4
pip install pydantic-settings==2.7.1
pip install pillow==11.1.0
pip install joblib==1.4.2
pip install aiofiles==24.1.0
pip install httpx==0.28.1
pip install pytest==8.3.4
pip install pytest-asyncio==0.25.0

# 5. Freeze requirements
pip freeze > requirements.txt

# 6. Create .env file
@"
GEMINI_API_KEY=your-key-here
# Get free API key from: https://aistudio.google.com
DATABASE_URL=sqlite:///./soilvision.db
ENVIRONMENT=development
"@ | Out-File -FilePath .env -Encoding utf8

# 7. Verify backend starts
python -m uvicorn app.main:app --reload --port 8000
# Expected: "Uvicorn running on http://127.0.0.1:8000"
```

## ML Setup (Windows PowerShell)

```powershell
# From project root
cd d:\SoilVision\ml

# Download dataset (manual: go to Kaggle URL, download, unzip to ml/data/)
# Or via Kaggle CLI:
pip install kaggle
kaggle datasets download -d atharvaingle/crop-recommendation-dataset -p data/
Expand-Archive data\crop-recommendation-dataset.zip -DestinationPath data\

# Verify dataset
python -c "import pandas as pd; df = pd.read_csv('data/Crop_recommendation.csv'); print(df.shape, df.columns.tolist())"
# Expected: (2200, 8) ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'label']

# Train model
python train.py
# Expected: Accuracy >= 0.95, model files in models/
```

## Frontend Setup (Windows PowerShell)

```powershell
# From project root
cd d:\SoilVision

# Create Expo React Native project
npx -y create-expo-app@latest frontend --template blank-typescript

cd frontend

# Install dependencies
npm install @react-navigation/native@7 @react-navigation/native-stack@7
npm install react-native-screens react-native-safe-area-context
npm install expo-camera expo-image-picker
npm install axios
npm install i18next react-i18next
npm install victory-native react-native-svg
npm install @react-native-async-storage/async-storage

# Create source directories
mkdir src\screens, src\components, src\services, src\navigation, src\i18n, src\assets, src\utils

# Start Expo dev server
npx expo start
# Expected: QR code appears, scan with Expo Go app on Android phone
```

## Full Project Directory Structure

```
d:\SoilVision\
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py           # Settings (Pydantic BaseSettings)
│   │   │   ├── database.py         # SQLAlchemy engine + session
│   │   │   └── exceptions.py       # Custom exception handlers
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── session.py          # SQLAlchemy Session model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── soil.py             # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── soil.py             # /soil/analyze, /soil/color-kit
│   │   │   ├── crops.py            # /crops/check
│   │   │   └── vision.py           # /vision/analyze
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── fertility.py        # ICAR rule-based scoring
│   │   │   ├── crop_recommender.py # Random Forest inference
│   │   │   ├── fertilizer_calc.py  # Deficit-method formulas
│   │   │   ├── vision_ai.py        # Gemini API wrapper
│   │   │   └── unit_converter.py   # mg/kg → kg/ha conversions
│   │   ├── data/
│   │   │   ├── icar_benchmarks.json
│   │   │   ├── crops_db.json
│   │   │   └── fertilizers_db.json
│   │   └── prompts/
│   │       ├── meter_prompt.txt
│   │       └── shc_prompt.txt
│   ├── tests/
│   │   ├── test_fertility.py
│   │   ├── test_crop_recommender.py
│   │   ├── test_fertilizer_calc.py
│   │   ├── test_vision.py
│   │   └── test_api.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── ml/
│   ├── data/
│   │   └── Crop_recommendation.csv
│   ├── models/
│   │   ├── crop_model.pkl
│   │   ├── label_encoder.pkl
│   │   └── scaler.pkl
│   ├── notebooks/
│   │   └── 01_eda.ipynb
│   ├── preprocess.py
│   └── train.py
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── CameraScreen.tsx
│   │   │   ├── ManualEntryScreen.tsx
│   │   │   ├── ColorKitScreen.tsx
│   │   │   ├── ResultsScreen.tsx
│   │   │   ├── CropCheckScreen.tsx
│   │   │   └── HistoryScreen.tsx
│   │   ├── components/
│   │   │   ├── FertilityGauge.tsx
│   │   │   ├── CropCard.tsx
│   │   │   ├── FertilizerTable.tsx
│   │   │   └── LanguageToggle.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── navigation/
│   │   │   └── AppNavigator.tsx
│   │   ├── i18n/
│   │   │   ├── index.ts
│   │   │   ├── en.json
│   │   │   └── hi.json
│   │   └── utils/
│   │       └── constants.ts
│   ├── app.json
│   ├── eas.json
│   └── package.json
├── docs/
│   ├── PROJECT_BRAIN.md
│   └── SOILVISION_PLAN.md
└── .gitignore
```

---

# SECTION 10 — DEPLOYMENT

## Backend Deployment to Railway

### Step 1: Create Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Copy and install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app/ ./app/
COPY ../ml/models/ ./ml/models/

# Expose port
EXPOSE 8000

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2: Railway Setup

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd d:\SoilVision\backend
railway init

# Link to Railway project
railway link

# Add PostgreSQL
railway add --plugin postgresql
# This gives you DATABASE_URL automatically

# Set environment variables
railway variables set GEMINI_API_KEY=your-gemini-api-key
# Get free API key from aistudio.google.com — no credit card needed
railway variables set ENVIRONMENT=production
railway variables set ALLOWED_ORIGINS=*

# Deploy
railway up

# Verify
# Visit https://<your-app>.railway.app/health
# Expected: {"status":"ok","version":"1.0.0","model_loaded":true}
```

### Step 3: Production Database Migration

```python
# In app/core/database.py, detect environment:
# If ENVIRONMENT == "production" → use DATABASE_URL (PostgreSQL from Railway)
# If ENVIRONMENT == "development" → use sqlite:///./soilvision.db
```

## Frontend APK Build

### Step 1: Configure EAS Build

```json
// frontend/eas.json
{
  "cli": { "version": ">= 14.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 2: Update app.json

```json
// frontend/app.json — key fields
{
  "expo": {
    "name": "SoilVision",
    "slug": "soilvision",
    "version": "1.0.0",
    "android": {
      "package": "com.soilvision.app",
      "versionCode": 1,
      "permissions": ["CAMERA"]
    },
    "extra": {
      "apiUrl": "https://<your-app>.railway.app/api/v1"
    }
  }
}
```

### Step 3: Build APK

```powershell
cd d:\SoilVision\frontend

# Login to Expo
npx eas login

# Build preview APK (no Play Store needed)
npx eas build --platform android --profile preview

# Wait for build (5-15 minutes)
# Download .apk from the URL provided
# Install on any Android phone
```

## API Key Security

| Rule | Implementation |
|------|---------------|
| Never commit API keys | `.env` in `.gitignore` |
| Production keys in Railway | `railway variables set` — encrypted at rest |
| Rate limiting | FastAPI middleware: max 30 requests/minute per IP |
| CORS | Only allow frontend domain + localhost in dev |
| Image size limit | Max 10 MB upload, enforced in endpoint |
| HTTPS only | Railway provides SSL automatically |

---

# SECTION 11 — TESTING PLAN

## A. Fertility Scoring Tests

**File:** `backend/tests/test_fertility.py`

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| All High values | N=600, P=30, K=300, OC=0.8, all micros above threshold, pH=7.0, EC=0.5 | Rating: "Excellent", Score: ≥ 90 |
| All Low values | N=100, P=5, K=50, OC=0.3, all micros below threshold, pH=4.5, EC=5.0 | Rating: "Poor", Score: ≤ 30 |
| Mixed values | N=400, P=15, K=200, OC=0.6, pH=6.8, EC=0.8 | Rating: "Good", Score: 60–79 |
| Edge: pH exactly 6.5 | pH=6.5 | Classification: "Neutral" |
| Edge: N exactly 280 | N=280 | N rating: "Medium" (boundary inclusive) |
| Edge: N exactly 560 | N=560 | N rating: "Medium" (boundary inclusive; > 560 = High) |

## B. Crop Recommender Tests

**File:** `backend/tests/test_crop_recommender.py`

| Test Case | Input (N,P,K,temp,humidity,pH,rain) | Expected Top Crop |
|-----------|-------------------------------------|-------------------|
| Rice-like soil | 80, 40, 40, 25, 80, 6.5, 200 | rice (probability > 0.5) |
| Coffee-like soil | 100, 20, 30, 25, 60, 6.5, 150 | coffee (in top 3) |
| Returns 5 results | Any valid input | len(results) == 5 |
| Probabilities sum ≤ 1 | Any valid input | sum(probs) ≤ 1.0 |
| All crops are valid names | Any valid input | Each crop name in the 22-crop list |

## C. Fertilizer Calculation Tests

**File:** `backend/tests/test_fertilizer_calc.py`

| Test Case | Input | Expected |
|-----------|-------|----------|
| N deficient, P+K high | N=200, P=30, K=300, land=5 | Only Urea recommended |
| All macros high | N=600, P=30, K=300 | Empty macronutrient recommendations |
| Zinc deficient | Zn=0.3 (< 0.6 threshold) | Zinc Sulphate recommended |
| Land size 0 | land=0 | Validation error |
| Worked example match | N=320, P=8, K=300, land=5 | Urea ~211 kg/acre, DAP ~15 kg/acre |
| Cost calculation | Known qty × known price | Matches manual math |

## D. Vision AI Tests

**File:** `backend/tests/test_vision.py` (mocked — no real Gemini calls in tests)

| Test Case | Mock Response | Expected |
|-----------|--------------|----------|
| Successful meter read | `{"confidence": 0.95, "readings": {...}}` | All fields extracted |
| Low confidence | `{"confidence": 0.3, ...}` | `success=false`, manual entry prompt |
| Partial read | Some fields null | `missing_fields` list populated |
| Invalid JSON from Gemini | Malformed string | Graceful error, suggest manual entry |
| Timeout | Simulate 31s delay | Error response with retry message |

## E. API Integration Tests

**File:** `backend/tests/test_api.py`

| Test Case | Endpoint | Method | Expected Status |
|-----------|----------|--------|-----------------|
| Health check | `/health` | GET | 200 |
| Valid soil analysis | `/api/v1/soil/analyze` | POST | 200, JSON with all 3 sections |
| Missing required field | `/api/v1/soil/analyze` (no nitrogen) | POST | 422 (Validation Error) |
| Negative value | `nitrogen: -50` | POST | 422 |
| pH out of range (15) | `ph: 15` | POST | 422 |
| Valid crop check | `/api/v1/crops/check` | POST | 200 |
| Unknown crop name | `crop: "dragon_fruit"` | POST | 404 or handled response |
| Color kit valid | `/api/v1/soil/color-kit` | POST | 200 |
| Image upload no file | `/api/v1/vision/analyze` | POST | 422 |

## F. Frontend Smoke Tests

| Screen | Test | Pass Condition |
|--------|------|----------------|
| Home | App loads | 3 input method cards visible |
| Manual Entry | Enter all 12 fields | All fields accept numeric input |
| Manual Entry | Submit with valid data | Loading spinner appears, results show |
| Camera | Open camera | Camera viewfinder renders |
| Color Kit | Select all 3 dropdowns | Analyze button becomes active |
| Results | Score gauge renders | Circular gauge shows number |
| Results | Crop list renders | 5 crop cards visible |
| Results | Fertilizer table renders | At least 1 row with cost |
| History | Load past results | List renders with dates |
| Language | Toggle Hindi/English | UI text switches language |

---

# SECTION 12 — FUTURE FEATURES

## Post-MVP Roadmap (Priority Order)

### Priority 1 — High Impact, Low Effort

| Feature | Description | Effort |
|---------|-------------|--------|
| **Weather API Integration** | Pull real-time temperature, humidity, rainfall from OpenWeatherMap using farmer's GPS location. Eliminates manual climate entry. | 2 days |
| **GPS-based State Detection** | Auto-detect farmer's state, pre-fill season and regional crop data. | 1 day |
| **PDF Report Generation** | Generate downloadable/printable PDF of analysis results. Farmers can show to local agri-office. | 2 days |
| **WhatsApp Share** | Format results as a clean WhatsApp message with crop recs and fertilizer costs. | 1 day |

### Priority 2 — Medium Impact

| Feature | Description | Effort |
|---------|-------------|--------|
| **Offline Mode** | Bundle the Random Forest model inside the app (ONNX runtime). Run crop prediction offline. Vision AI still requires internet. | 5 days |
| **Voice Input (Hindi)** | Farmer speaks nutrient values in Hindi, speech-to-text fills the form. Google Speech API. | 4 days |
| **Historical Tracking** | Show soil health trend over time (graph of fertility score across seasons). Requires user login. | 3 days |
| **Multi-language UI** | Add Tamil, Telugu, Marathi, Bengali, Gujarati. Requires i18n JSON files per language. | 4 days (per 2 languages) |

### Priority 3 — Strategic

| Feature | Description | Effort |
|---------|-------------|--------|
| **Government Scheme Matcher** | Based on soil type + crop + state, suggest applicable PM-KISAN, PMFBY, Soil Health Card scheme links. | 3 days |
| **Marketplace Integration** | Show nearby fertilizer dealers with prices. Use Google Maps API. | 5 days |
| **Crop Disease Detection** | Separate camera flow for leaf/crop photos → Gemini Vision identifies diseases. | 5 days |
| **Community Features** | Farmer-to-farmer Q&A, share results anonymously in district groups. | 10 days |
| **Water Requirement Calculator** | Based on crop + soil type + weather, estimate irrigation needs. | 3 days |
| **Yield Prediction** | Train a regression model: soil + weather + crop → estimated yield (quintal/acre). Needs more data. | 7 days |

---

# END OF SOILVISION PLAN

> **Next Step:** Begin Phase 1 (Project Setup). Follow tasks 1.1 → 1.6 in order.
> **Before starting:** Ensure `GEMINI_API_KEY` is obtained free from https://aistudio.google.com
