from __future__ import annotations
import os
"""
backend/app/services/crop_recommender.py
Random Forest crop recommendation service.
Loads trained model artifacts from ml/models/.
Feature names warning fix: uses pd.DataFrame with named columns.
"""

from pathlib import Path
import joblib
import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Model artifact paths — resolved relative to project root
# ---------------------------------------------------------------------------
_MODELS_DIR = Path(__file__).resolve().parents[3] / "ml" / "models"

# Feature column names — must match exactly what the scaler was fitted with
_FEATURE_COLS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


class CropRecommender:
    """
    Loads the trained Random Forest model at startup and exposes a predict() method.
    Singleton pattern — instantiated once in app/main.py and stored in app.state.
    """

    def __init__(self) -> None:
        model_path = os.path.join(_MODELS_DIR, "crop_model.pkl")
        scaler_path = os.path.join(_MODELS_DIR, "scaler.pkl")
        le_path = os.path.join(_MODELS_DIR, "label_encoder.pkl")

        if not all(os.path.exists(p) for p in [model_path, scaler_path, le_path]):
            raise FileNotFoundError(
                f"Model artifacts not found in {_MODELS_DIR}. "
                "Run ml/train.py first to generate them."
            )

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.le = joblib.load(le_path)

    def predict(
        self,
        n: float,
        p: float,
        k: float,
        temperature: float,
        humidity: float,
        ph: float,
        rainfall: float,
        top_n: int = 5,
    ) -> list[dict]:
        """
        Predict top-N crops for the given soil and climate parameters.

        Fix for sklearn feature names warning: input is a named DataFrame
        so StandardScaler (fitted with feature names) does not raise warnings.

        Returns:
            List of dicts: [{"crop": str, "probability": float}, ...]
            sorted by probability descending, length == top_n.
        """
        # Build named DataFrame — eliminates the sklearn feature_names_in_ warning
        features = pd.DataFrame(
            [[n, p, k, temperature, humidity, ph, rainfall]],
            columns=_FEATURE_COLS,
        )

        features_scaled = self.scaler.transform(features)
        probabilities = self.model.predict_proba(features_scaled)[0]

        top_indices = np.argsort(probabilities)[::-1][:top_n]

        results = []
        for rank_idx, model_idx in enumerate(top_indices):
            crop_name = self.le.inverse_transform([model_idx])[0]
            prob = round(float(probabilities[model_idx]), 4)
            results.append({
                "crop": crop_name,
                "probability": prob,
            })

        return results


# ---------------------------------------------------------------------------
# Module-level singleton — import and use this in services/routers
# ---------------------------------------------------------------------------
_recommender_instance: CropRecommender | None = None


def get_recommender() -> CropRecommender:
    """
    Lazy singleton loader.
    Called once at startup; subsequent calls return the cached instance.
    """
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = CropRecommender()
    return _recommender_instance
