# 🌱 Kisan Mitra (formerly SoilVision) 🌾

An AI-powered mobile application that gives Indian farmers soil fertility analysis, crop recommendations, and fertilizer plans — in **English, Hindi, and Kannada**.

## 🚀 Key Features
- **Photo Scan:** Vision AI (Gemini 2.0 Flash via OpenRouter) reads soil meter photos and soil health cards
- **Manual Entry:** Direct input of 12+ soil parameters from lab reports
- **Color Kit Analysis:** Supports IFFCO/lab color kit (Low/Medium/High) selection
- **Crop Suitability Check:** Verifies if a specific crop matches the current soil profile
- **Fertility Scoring:** Rule-based ICAR-standard thresholds across 12+ nutrients
- **Crop Recommendation:** ML-based (Random Forest, 99.55% accuracy) across 31 crops
- **Fertilizer Calculation:** Deficit-method math for precise NPK planning
- **Trilingual PDF Reports:** Downloadable reports for lab or record-keeping in English, Hindi, and Kannada
- **Live Market & Weather Data:** Mandi price lookups (data.gov.in) and weather integration (OpenWeather)

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.11) |
| Frontend | React Native (Expo) |
| Vision AI | Gemini 2.0 Flash (via OpenRouter) |
| ML Model | Random Forest Classifier — 22-crop dataset, 99.55% accuracy |
| Market Data | data.gov.in Mandi API |
| Weather Data | OpenWeather API |
| Data Sources | ICAR Soil Health Benchmarks, Kaggle Crop Recommendation Dataset |

## 📂 Project Structure

## ⚙️ Setup & Installation

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1      # Windows
# source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
cp .env.example .env             # then fill in your own API keys
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npx expo start
```

**Required API keys** (add to `backend/.env` — see `.env.example`):
- `GEMINI_API_KEY` — free tier at [aistudio.google.com](https://aistudio.google.com)
- `OPENWEATHER_API_KEY` — free tier at [openweathermap.org](https://openweathermap.org)
- `DATA_GOV_API_KEY` — free at [data.gov.in](https://data.gov.in)

## 🖼️ Screenshots
*(add 2–4 screenshots here — home screen, photo scan, results/report)*

## ⚖️ License
MIT
