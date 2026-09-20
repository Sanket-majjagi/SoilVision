# 🌱 Kisan Mitra (formerly SoilVision) 🌾

AI-powered mobile application designed to provide Indian farmers with soil fertility analysis, crop recommendations, and fertilizer plans.

## 🚀 Key Features
- **Photo Scan:** Image analysis via Vision AI (Gemini 2.0 Flash) for soil meters and health cards.
- **Manual Entry:** Precise input of 12+ soil parameters from lab reports.
- **Color Kit Analysis:** Supports IFFCO/lab color kit (Low/Medium/High) selection.
- **Crop Suitability:** Verify if a specific crop matches your current soil profile.
- **Fertility Scoring:** Rule-based ICAR thresholds for 12+ nutrients.
- **Crop Recommendation:** ML-based using Random Forest, supporting 31+ crops.
- **Fertilizer Calculation:** Mathematical deficit-method for precise NPK planning.
- **PDF Reports:** Download professional trilingual reports for lab or record keeping.

## 🛠️ Tech Stack
- **Backend:** FastAPI (Python 3.11)
- **Frontend:** React Native (Expo)
- **Vision AI:** Gemini 2.0 Flash (via OpenRouter)
- **ML Model:** Random Forest Classifier (Accuracy 99.55%)
- **Data:** ICAR Soil Health Benchmarks + Kaggle 22-Crop Dataset

## 📂 Project Structure
- `/backend`: FastAPI REST service with domain-driven services (Vision, ML, Fert).
- `/frontend`: React Native mobile app with premium "Dark Green Hero" design.
- `/ml`: Model training scripts, preprocessing, and serialized pickle artifacts.
- `/docs`: Comprehensive project brain, plans, and technical documentation.

## 🏃 How to Run
1. **Backend:** 
   `cd backend && .\venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload`
2. **Frontend:**
   `cd frontend && npx expo start`

## ⚖️ License
MIT
