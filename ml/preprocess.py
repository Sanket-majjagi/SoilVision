"""
ml/preprocess.py
Run from the ml/ directory: python preprocess.py
Outputs: models/label_encoder.pkl, models/scaler.pkl
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "Crop_recommendation.csv")
MODELS_PATH = os.path.join(os.path.dirname(__file__), "models")


def load_and_preprocess():
    df = pd.read_csv(DATA_PATH)
    print(f"Dataset loaded: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"Columns: {df.columns.tolist()}")
    print(f"Crops (22): {sorted(df['label'].unique().tolist())}")

    # Features and target
    X = df[["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]]
    y = df["label"]

    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split 80/20, stratified
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    print(f"Train size: {X_train.shape[0]} | Test size: {X_test.shape[0]}")

    # Save artifacts
    os.makedirs(MODELS_PATH, exist_ok=True)
    joblib.dump(le, os.path.join(MODELS_PATH, "label_encoder.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_PATH, "scaler.pkl"))
    print("Saved: label_encoder.pkl, scaler.pkl")

    return X_train, X_test, y_train, y_test, le


if __name__ == "__main__":
    load_and_preprocess()
    print("Preprocessing complete.")
