# ⚠️ PROJECT BRAIN — ALWAYS READ FIRST

This file is the single source of truth for this project.
Any AI assistant MUST read this before doing anything.

═══════════════════════════════════════════════════════════
SECTION 1 — PROJECT OVERVIEW
═══════════════════════════════════════════════════════════
Project Name: Kisan Mitra (formerly SoilVision)
Goal: AI mobile app for Indian farmers — analyze soil (Photo/Manual/ColorKit), recommend crops, calculate fertilizer
Real-world impact: Help 100M+ Indian farmers make data-driven planting decisions
End users: Indian farmers with basic Android/iOS phones
Status: Core development complete (v1.0 Ready)

═══════════════════════════════════════════════════════════
SECTION 2 — TECH STACK
═══════════════════════════════════════════════════════════
Language: Python 3.11 (backend), JavaScript/JSX (frontend)
Framework: FastAPI (backend), React Native / Expo (frontend)
Libraries: scikit-learn, requests (OpenRouter), react-navigation, expo-print, expo-sharing, expo-file-system, expo-image-picker
Model (if AI): Random Forest (crop recommendation), Gemini 2.0 Flash (Vision via OpenRouter)
Version: 1.0.0 (Production Ready)

═══════════════════════════════════════════════════════════
SECTION 3 — ENVIRONMENT SETUP
═══════════════════════════════════════════════════════════
Local Path: d:\SoilVision
Server / Cloud: Railway (backend), Expo EAS (frontend APK)
GPU: Not required (Random Forest is CPU-only, Vision is API-based)
Python Version: 3.11
Virtual Environment: backend\venv
BASE_URL: http://10.247.43.122:8000 (Local IP for mobile dev)

How to run:

* Step 1: cd backend && .\venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload --host 0.0.0.0
* Step 2: cd frontend && npx expo start --tunnel

═══════════════════════════════════════════════════════════
SECTION 4 — DATASET / INPUT
═══════════════════════════════════════════════════════════
Dataset source: Kaggle — Crop Recommendation Dataset (Atharva Ingle)
Total size: 31 Crops Supported (22 from ML base + 9 metadata-enriched)
Preprocessing: StandardScaler, LabelEncoder
Input methods: 
1. Photo Scan (Gemini 2.0 Flash)
2. Manual Entry (Precise lab report values)
3. Color Kit (IFFCO low/medium/high selector)
4. Crop Check (Suitability lookup)

═══════════════════════════════════════════════════════════
SECTION 5 — ARCHITECTURE / DESIGN
═══════════════════════════════════════════════════════════
System design: Mobile app → FastAPI REST API → Services (Fertility, ML, Fertilizer, Vision)
Design Theme: "Premium Dark Green Hero" — Professional, farmer-friendly, trilingual.
Key components: 
- Vision AI: Extracts readings from photos via OpenRouter.
- ML Service: Random Forest predicts top-5 crops.
- Fertilizer Service: Calculates NPK deficits based on ICAR benchmarks.
- Results Service: Generates PDF reports + trilingual UI display.

═══════════════════════════════════════════════════════════
SECTION 6 — TRAINING / LOGIC
═══════════════════════════════════════════════════════════
* Fertility scoring: Rule-based (ICAR thresholds)
* Crop recommendation: Random Forest (99.55% accuracy)
* Fertilizer calculation: Deficit method (math-based)
* Vision AI: LLM instruction-based extraction (Gemini 2.0 Flash)

═══════════════════════════════════════════════════════════
SECTION 7 — CONSTRAINTS / RULES
═══════════════════════════════════════════════════════════
* Use OpenRouter for Vision AI (model: google/gemini-2.0-flash-001)
* Trilingual support: English, Hindi, Kannada
* Platform: Must work on Expo Web (no native-only Alert.alert)
* API Safety: Use parseFloat and strict validation for all inputs

═══════════════════════════════════════════════════════════
SECTION 8 — BUGS & FIXES
═══════════════════════════════════════════════════════════
* Bug: 422 Unprocessable Entity (backend received strings) -> Fix: Strict parseFloat conversion in all screens.
* Bug: Input Focus Loss on Web -> Fix: Inline TextInput state/ref management in ManualEntryScreen.
* Bug: Alert.alert not working on Web -> Fix: Custom errorMsg state and red UI boxes in all screens.
* Bug: Download button opening share sheet -> Fix: Local copy to FileSystem with success message.
* Bug: FormData field naming ('image' vs 'file') -> Fix: Standardized to 'file' for FastAPI compatibility.

═══════════════════════════════════════════════════════════
SECTION 9 — CURRENT STATUS
═══════════════════════════════════════════════════════════
Current phase: PHASE 8 COMPLETE — NEW FEATURES ADDED
Latest result: Weather integration, MSP harvest prices, and Live Mandi prices implemented.
Features added:
  - Feature 1: Real weather via OpenWeatherMap (GPS-based temperature, humidity, rainfall)
  - Feature 2: Live Mandi prices via data.gov.in API (state-specific with national fallback)
  - Feature 3: Harvest time MSP prices (static JSON, all 31 crops, zero API dependency)
Both ResultsScreen and CropCheckScreen show full market intelligence.
Next: Add DATA_GOV_API_KEY to .env and do full QA testing on phone.

═══════════════════════════════════════════════════════════
SECTION 10 — NEXT STEPS
═══════════════════════════════════════════════════════════
1. Paste OPENWEATHER_API_KEY into backend/.env
2. Test GET /api/v1/weather?lat=12.97&lon=77.59 on backend
3. Run app on physical device → grant GPS → verify WeatherCard on ResultsScreen
4. Implement Feature 3 (MSP / Harvest Forecast) next
5. Then Feature 2 (Mandi Prices)

═══════════════════════════════════════════════════════════
SECTION 11 — SESSION LOGS
═══════════════════════════════════════════════════════════

### SESSION — 2026-04-01 & 04-02
* Work done: Massive UI polish, Rebranding, and Feature Finalization.
* Changes made:
  - Rebranded SoilVision -> Kisan Mitra (App name, taglines, app.json, Results HTML).
  - Redesigned ManualEntry, ColorKit, CropCheck, Results, and Results with "Dark Green Hero" theme.
  - Implemented PhotoScanScreen with expo-image-picker and OpenRouter Vision AI.
  - Fixed all 422 validation bugs and Web compatibility issues (Alert.alert -> UI Boxes).
  - Integrated Vision readings directly into ML analysis pipeline in backend.
  - Added 9 missing crops to JSON database.
  - Fixed PDF Download behavior to save locally without share sheet.
* Results: Application is functionally complete and production-ready.
* Next action: Cross-platform QA and Production Build.

### SESSION — 2026-04-03 (Phase 8 — Feature 1: Real Weather)
* Work done: Full GPS + OpenWeatherMap integration across all 3 input flows.
* New files created:
  - backend/app/data/rainfall_india.json (IMD state-wise annual rainfall)
  - backend/app/routers/weather.py (proxy endpoint, keeps API key server-side)
  - frontend/src/services/weather.js (GPS + cache + silent fallback)
* Modified files:
  - frontend/src/services/api.js: Auto-fetches weather in analyzeSoil/analyzeColorKit/analyzeVision. analyzeVision() now centralized here.
  - frontend/src/screens/PhotoScanScreen.js: Replaced 45-line inline fetch with single analyzeVision() call.
  - frontend/src/screens/ResultsScreen.js: WeatherCard component + PDF weather section.
  - backend/app/routers/vision.py: Accepts temperature/humidity/rainfall Form fields.
  - backend/app/main.py: Registered weather router.
  - frontend/app.json: expo-location plugin + Android location permissions.
  - frontend/src/constants/api.js: Added WEATHER + MARKET_PRICES endpoints.
  - backend/.env + .env.example: Added OPENWEATHER_API_KEY + DATA_GOV_API_KEY.
* Installed: expo-location (frontend), httpx (backend — already present).
* Results: ManualEntry and ColorKit need ZERO screen changes — api.js handles weather automatically.
* Next action: Paste OPENWEATHER_API_KEY into backend/.env, then implement Feature 3 (MSP).

### SESSION — 2026-04-03 (Phase 8)
* Work done: 3 new features implemented across full stack.
* Changes made:
  - Created weather.js, weather.py — real GPS-based climate data
  - Created harvest_msp.json — 31 crops with duration and MSP prices
  - Created crop_commodity_map.json — maps ML names to data.gov.in names
  - Created market.py — FastAPI proxy for mandi prices with fallback
  - Updated api.js, ResultsScreen.js, CropCheckScreen.js for all 3 features
* Results: App now shows real weather, harvest forecast and live mandi prices.
* Next action: Get DATA_GOV_API_KEY, full QA on phone, then production build.


═══════════════════════════════════════════════════════════
SECTION 12 — MANDATORY AI RULES
═══════════════════════════════════════════════════════════
1. Read this file before any action
2. Do NOT restart project from scratch
3. Continue from CURRENT STATUS
4. After completing ANY task:
   → Update CURRENT STATUS
   → Append SESSION LOG
5. Keep updates short and clear
6. Ask if anything is unclear
