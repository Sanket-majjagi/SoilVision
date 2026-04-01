# SoilVision 🌾

AI-powered mobile application designed to provide Indian farmers with soil fertility analysis, crop recommendations, and fertilizer plans.

## Project Overview
- **Fertility Scoring:** Rule-based ICAR thresholds.
- **Crop Recommendation:** ML-based using Random Forest (Kaggle dataset).
- **Fertilizer Calculation:** Deficit-method math formulas.
- **Vision AI:** Google Gemini 1.5 Flash API for LCD meters and Soil Health Cards.

## Tech Stack
- **Backend:** FastAPI (Python 3.11)
- **Frontend:** React Native (Expo)
- **Database:** SQLite (Dev) / PostgreSQL (Prod)
- **AI:** Google Gemini 1.5 Flash

## Structure
- `/backend`: FastAPI service
- `/frontend`: React Native mobile app
- `/ml`: Model training scripts and artifacts
- `/docs`: Project planning and documentation

## License
MIT
