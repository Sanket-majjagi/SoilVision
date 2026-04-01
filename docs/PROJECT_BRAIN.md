# ⚠️ PROJECT BRAIN — ALWAYS READ FIRST

This file is the single source of truth for this project.
Any AI assistant MUST read this before doing anything.

═══════════════════════════════════════════════════════════
SECTION 1 — PROJECT OVERVIEW
═══════════════════════════════════════════════════════════
Project Name: SoilVision
Goal: AI mobile app for Indian farmers — analyze soil, recommend crops, calculate fertilizer
Real-world impact: Help 100M+ Indian farmers make data-driven planting decisions
End users: Indian farmers with basic Android phones

═══════════════════════════════════════════════════════════
SECTION 2 — TECH STACK
═══════════════════════════════════════════════════════════
Language: Python 3.11 (backend), TypeScript (frontend)
Framework: FastAPI (backend), React Native / Expo (frontend)
Libraries: scikit-learn, google-generativeai, sqlalchemy, pydantic, react-navigation, axios, i18next
Model (if AI): Random Forest (crop recommendation), Gemini 1.5 Flash (vision, free tier)
Version: 1.0.0 (MVP)

═══════════════════════════════════════════════════════════
SECTION 3 — ENVIRONMENT SETUP
═══════════════════════════════════════════════════════════
Local Path: d:\SoilVision
Server / Cloud: Railway (backend), Expo EAS (frontend APK)
GPU: Not required (Random Forest is CPU-only, Vision is API-based)
Python Version: 3.11
Virtual Environment: backend\venv

How to run:

* Step 1: cd backend && .\venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload
* Step 2: cd frontend && npx expo start

═══════════════════════════════════════════════════════════
SECTION 4 — DATASET / INPUT
═══════════════════════════════════════════════════════════
Dataset source: Kaggle — Crop Recommendation Dataset (Atharva Ingle)
Total size: 2200 rows × 8 columns
Train/Val/Test split: 80/20 (stratified)
Preprocessing: StandardScaler, LabelEncoder for 22 crop classes
Special handling: 3 input methods (photo, manual, color kit)

═══════════════════════════════════════════════════════════
SECTION 5 — ARCHITECTURE / DESIGN
═══════════════════════════════════════════════════════════
System design: Mobile app → FastAPI REST API → Services (Fertility, ML, Fertilizer, Vision)
Model architecture: RandomForestClassifier (100 trees, max_depth=20)
Key components: Fertility Scorer (ICAR rules), Crop Recommender (RF), Fertilizer Calculator (math), Vision AI (Gemini)
Flow: Photo/Manual/ColorKit → API → Score + Crops + Fertilizer Plan → Display

═══════════════════════════════════════════════════════════
SECTION 6 — TRAINING / LOGIC
═══════════════════════════════════════════════════════════
Loss function: N/A (Random Forest uses Gini impurity)
Optimizer: N/A (tree-based model)
Hyperparameters: n_estimators=100, max_depth=20, min_samples_split=5, min_samples_leaf=2
Training strategy: Single train with 80/20 split, target accuracy ≥ 95%

═══════════════════════════════════════════════════════════
SECTION 7 — CONSTRAINTS / RULES
═══════════════════════════════════════════════════════════

* Fertility scoring MUST be rule-based (ICAR thresholds), NOT ML
* Crop recommendation MUST use Random Forest on the Kaggle dataset
* Fertilizer calculation MUST use math formulas (deficit method), NOT ML
* Vision AI MUST use Google Gemini 1.5 Flash API free tier (no custom training, no cost)
  API key obtained free from aistudio.google.com
* Frontend MUST be React Native with Expo

═══════════════════════════════════════════════════════════
SECTION 8 — BUGS & FIXES
═══════════════════════════════════════════════════════════
Bug: N/A (project not started)
Fix: N/A

(Keep appending)

═══════════════════════════════════════════════════════════
SECTION 9 — CURRENT STATUS
═══════════════════════════════════════════════════════════
Current phase: PHASE 2 COMPLETE — ML Model Trained
Latest result: Random Forest accuracy 99.55% on 440 test samples (22 crops)
What is working: ML model trained, all 3 artifacts saved (crop_model.pkl 3.11MB, label_encoder.pkl, scaler.pkl). Dataset verified 2200 rows. All JSON databases created (icar_benchmarks, crops_db, fertilizers_db)
What is broken: Minor sklearn feature names warning in smoke test — fix in Phase 3

═══════════════════════════════════════════════════════════
SECTION 10 — NEXT STEPS
═══════════════════════════════════════════════════════════
1. Phase 3: Build FastAPI backend core — fertility scorer, crop recommender service, fertilizer calculator
2. Phase 3: Create all API endpoints and Pydantic schemas
3. Phase 3: Fix sklearn feature names warning in crop_recommender.py
4. Phase 4: Vision AI Integration (Gemini 1.5 Flash API wrapper)

═══════════════════════════════════════════════════════════
SECTION 11 — SESSION LOGS
═══════════════════════════════════════════════════════════

### SESSION — 2026-03-28 19:50 IST

* Work done: Complete project plan written
* Changes made: Created SOILVISION_PLAN.md (12 sections, 1521 lines), Updated PROJECT_BRAIN.md
* Results: Plan covers Phases, Architecture, DB Design, API, ML, Vision AI, Fertilizer Calc, Frontend, Setup, Deploy, Testing, Future
* Issues: None
* Next action: Begin Phase 1 — Project Setup

### SESSION — 2026-03-30 10:00 IST

* Work done: Executed Phase 1: Project Setup (tasks 1.1 to 1.6)
* Changes made: Created .gitignore, README.md, backend venv, initialized Expo project, folder structure, .env.example, and database.py logic.
* Results: Project structure is complete and ready for Development.
* Issues: None.
* Next action: Phase 2 — Data & ML Preparation.

### SESSION — 2026-03-30 10:35 IST

* Work done: Phase 2 complete — ML training
* Changes made: Created ml/preprocess.py, ml/train.py, ml/notebooks/01_eda.ipynb, all 3 JSON databases, trained and saved Random Forest model
* Results: Accuracy 99.55%, all 22 crops, model 3.11MB
* Issues: Minor sklearn feature names warning — fix in Phase 3
* Next action: Begin Phase 3 — Backend Core

(NEVER DELETE OLD LOGS)

### SESSION — 2026-03-30 09:14 IST

* Work done: Updated Vision AI from paid Claude API to free Gemini 1.5 Flash API
* Changes made: Replaced anthropic library with google-generativeai throughout plan and brain
* Results: Project now has zero cost — fully buildable by a student with no budget
* Issues: None
* Next action: Begin Phase 1 — Project Setup

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
