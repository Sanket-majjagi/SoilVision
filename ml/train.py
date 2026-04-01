"""
ml/train.py
Run from the ml/ directory: python train.py
Trains Random Forest on Crop Recommendation Dataset.
Outputs: models/crop_model.pkl, models/label_encoder.pkl, models/scaler.pkl
Expected accuracy: >= 0.95
"""
import os
import sys

# Allow importing preprocess from the same directory
sys.path.insert(0, os.path.dirname(__file__))

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

from preprocess import load_and_preprocess

MODELS_PATH = os.path.join(os.path.dirname(__file__), "models")


def train():
    print("=" * 60)
    print("SoilVision — Crop Recommendation Model Training")
    print("=" * 60)

    # Step 1: Load and preprocess data
    X_train, X_test, y_train, y_test, le = load_and_preprocess()

    # Step 2: Train Random Forest with plan-specified hyperparameters
    print("\nTraining RandomForestClassifier...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features="sqrt",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    print("Training complete.")

    # Step 3: Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nAccuracy: {accuracy:.4f}  (target >= 0.95)")

    if accuracy < 0.90:
        print("WARNING: Accuracy below minimum threshold of 0.90!")
    elif accuracy >= 0.95:
        print("SUCCESS: Accuracy meets the >= 0.95 target.")
    else:
        print("INFO: Accuracy is acceptable (>= 0.90) but below 0.95 target.")

    print("\nPer-class Classification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # Step 4: Save model
    os.makedirs(MODELS_PATH, exist_ok=True)
    model_path = os.path.join(MODELS_PATH, "crop_model.pkl")
    joblib.dump(model, model_path)
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"Saved: crop_model.pkl  ({size_mb:.2f} MB)  (target < 5 MB)")

    # Step 5: Quick smoke test — predict for rice-like soil
    print("\nSmoke test (rice-like soil: N=80, P=40, K=40, temp=25, hum=80, pH=6.5, rain=200):")
    scaler = joblib.load(os.path.join(MODELS_PATH, "scaler.pkl"))
    test_input = np.array([[80, 40, 40, 25, 80, 6.5, 200]])
    test_scaled = scaler.transform(test_input)
    probabilities = model.predict_proba(test_scaled)[0]
    top_indices = np.argsort(probabilities)[::-1][:5]
    for rank, idx in enumerate(top_indices, 1):
        crop = le.inverse_transform([idx])[0]
        prob = probabilities[idx]
        print(f"  #{rank}: {crop:15s}  probability = {prob:.4f}")

    print("\n" + "=" * 60)
    print("All artifacts saved to ml/models/")
    print("  - crop_model.pkl")
    print("  - label_encoder.pkl")
    print("  - scaler.pkl")
    print("=" * 60)

    return accuracy


if __name__ == "__main__":
    train()
