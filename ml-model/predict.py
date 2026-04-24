"""
===================================
  BRAINBALANCE — ENHANCED PYTHON ML MODEL
  predict.py (v2)

  This script:
  1. Loads the trained model (or trains it with expanded dataset)
  2. Reads user input from the command line (sent by Node.js)
  3. Predicts stress level and burnout risk using ensemble models
  4. Prints the result as JSON so Node.js can read it

  Features: sleep, work, screen, mood, exercise, caffeine, deadlines, social, sleepQuality
===================================
"""

import sys
import json
import os
import numpy as np

# --- SKLEARN IMPORTS ---
<<<<<<< HEAD
# scikit-learn is the ML library we use
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib   # for saving/loading the trained model


# Get the absolute path to the model file (script directory)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'stress_model.pkl')

#  EXPANDED TRAINING DATA (80+ samples)
#  Format: [sleep, work, screen, mood, exercise, caffeine, deadlines, social, sleepQuality] → stress label
# -------------------------------------------------------

TRAINING_DATA = [
    # [sleep, work, screen, mood, exercise, caffeine, deadlines, social, sleepQuality, LABEL]

    # --- LOW STRESS ---
    [8,  6,  2, 5, 1, 1, 2, 3, 5, 'Low'],
    [7,  7,  3, 4, 1, 2, 3, 2, 4, 'Low'],
    [8,  5,  1, 5, 1, 1, 1, 4, 5, 'Low'],
    [7,  6,  2, 4, 0, 2, 3, 2, 4, 'Low'],
    [9,  4,  2, 5, 1, 0, 1, 5, 5, 'Low'],
    [8,  6,  1, 5, 1, 1, 2, 3, 5, 'Low'],
    [7,  5,  2, 4, 1, 2, 2, 4, 4, 'Low'],
    [8,  7,  3, 4, 1, 1, 3, 2, 4, 'Low'],
    [9,  5,  1, 5, 1, 0, 1, 5, 5, 'Low'],
    [7,  6,  2, 5, 1, 1, 2, 3, 4, 'Low'],
    [8,  5,  2, 4, 1, 2, 2, 4, 5, 'Low'],
    [7,  7,  3, 4, 1, 1, 3, 3, 4, 'Low'],
    [8,  6,  2, 5, 1, 0, 2, 4, 5, 'Low'],
    [7,  5,  1, 5, 1, 1, 1, 5, 5, 'Low'],
    [8,  6,  3, 4, 1, 2, 3, 2, 4, 'Low'],
    [9,  4,  1, 5, 1, 0, 1, 4, 5, 'Low'],
    [7,  6,  2, 4, 1, 1, 2, 3, 4, 'Low'],
    [8,  5,  2, 5, 1, 1, 2, 3, 5, 'Low'],
    [7,  7,  2, 4, 1, 2, 3, 2, 4, 'Low'],
    [8,  6,  1, 5, 1, 0, 1, 5, 5, 'Low'],

    # --- MEDIUM STRESS ---
    [6,  8,  4, 3, 0, 3, 5, 2, 3, 'Medium'],
    [6,  9,  5, 3, 0, 4, 6, 1, 3, 'Medium'],
    [5,  9,  6, 3, 0, 3, 6, 1, 2, 'Medium'],
    [7,  8,  4, 3, 1, 2, 5, 2, 3, 'Medium'],
    [6, 10,  5, 2, 0, 3, 7, 1, 2, 'Medium'],
    [5, 10,  6, 2, 0, 4, 6, 1, 2, 'Medium'],
    [7,  8,  3, 3, 0, 3, 5, 2, 3, 'Medium'],
    [6,  9,  5, 3, 1, 2, 5, 1, 3, 'Medium'],
    [5,  9,  4, 3, 0, 3, 6, 2, 2, 'Medium'],
    [6,  8,  5, 2, 0, 4, 5, 1, 3, 'Medium'],
    [7,  9,  4, 3, 0, 3, 6, 1, 3, 'Medium'],
    [6,  8,  4, 3, 1, 2, 4, 2, 3, 'Medium'],
    [5,  9,  5, 3, 0, 3, 6, 1, 2, 'Medium'],
    [6, 10,  4, 2, 0, 4, 7, 1, 2, 'Medium'],
    [7,  8,  5, 3, 0, 3, 5, 2, 3, 'Medium'],
    [6,  9,  4, 3, 0, 2, 5, 2, 3, 'Medium'],
    [5,  8,  6, 3, 0, 3, 5, 1, 2, 'Medium'],
    [6,  9,  5, 2, 1, 3, 6, 1, 3, 'Medium'],
    [7,  8,  4, 3, 0, 2, 5, 2, 3, 'Medium'],
    [6,  9,  5, 3, 0, 3, 6, 1, 3, 'Medium'],
    [5,  8,  4, 3, 0, 4, 5, 2, 2, 'Medium'],
    [6, 10,  5, 2, 0, 3, 7, 1, 2, 'Medium'],
    [7,  8,  3, 3, 1, 2, 4, 3, 3, 'Medium'],
    [6,  9,  6, 3, 0, 3, 6, 1, 3, 'Medium'],
    [5,  9,  5, 2, 0, 4, 6, 1, 2, 'Medium'],

    # --- HIGH STRESS ---
    [4, 12,  7, 1, 0, 5, 9, 0, 1, 'High'],
    [3, 14,  8, 1, 0, 6, 10, 0, 1, 'High'],
    [4, 13,  9, 2, 0, 5, 8, 0, 1, 'High'],
    [5, 12,  7, 1, 0, 4, 9, 1, 2, 'High'],
    [3, 15,  8, 1, 0, 6, 10, 0, 1, 'High'],
    [4, 11,  8, 1, 0, 5, 8, 0, 2, 'High'],
    [3, 12,  7, 2, 0, 6, 9, 0, 1, 'High'],
    [4, 13,  8, 1, 0, 5, 9, 0, 1, 'High'],
    [3, 14,  9, 1, 0, 7, 10, 0, 1, 'High'],
    [5, 12,  7, 1, 0, 5, 8, 0, 2, 'High'],
    [4, 11,  8, 2, 0, 4, 8, 1, 2, 'High'],
    [3, 13,  9, 1, 0, 6, 9, 0, 1, 'High'],
    [4, 14,  7, 1, 0, 5, 10, 0, 1, 'High'],
    [3, 12,  8, 1, 0, 7, 9, 0, 1, 'High'],
    [5, 11,  7, 2, 0, 4, 8, 0, 2, 'High'],
    [4, 13,  8, 1, 0, 5, 9, 0, 1, 'High'],
    [3, 14,  9, 1, 0, 6, 10, 0, 1, 'High'],
    [4, 12,  7, 2, 0, 5, 8, 0, 2, 'High'],
    [3, 15,  8, 1, 0, 7, 10, 0, 1, 'High'],
    [4, 12,  8, 1, 0, 5, 9, 0, 1, 'High'],
    [5, 11,  7, 1, 0, 4, 8, 1, 2, 'High'],
    [3, 13,  9, 1, 0, 6, 9, 0, 1, 'High'],
    [4, 14,  8, 2, 0, 5, 10, 0, 1, 'High'],
    [3, 12,  7, 1, 0, 6, 9, 0, 1, 'High'],
    [4, 13,  8, 1, 0, 5, 8, 0, 2, 'High'],
]
>>>>>>> e3819d18a5234c6b369ecb517c164f4dd5a1ef17


def train_model():
    """
    Train an ensemble classifier (Random Forest + Logistic Regression)
    on the expanded 9-feature dataset.
    """
    X = np.array([[row[i] for i in range(9)] for row in TRAINING_DATA])
    y = np.array([row[9] for row in TRAINING_DATA])

    # Scale features for Logistic Regression
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Build ensemble
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    lr = LogisticRegression(max_iter=1000, random_state=42)

    model = VotingClassifier(
        estimators=[('rf', rf), ('lr', lr)],
        voting='soft'  # Use predicted probabilities for better accuracy
    )
    model.fit(X_scaled, y)

    # Save model and scaler
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print("Model v2 trained and saved.", file=sys.stderr)
    return model, scaler


def load_or_train_model():
    """Load saved model if it exists, otherwise train a new one."""
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        return joblib.load(MODEL_PATH), joblib.load(SCALER_PATH)
    else:
        return train_model()


def predict_burnout(stress_level, score=None):
    """Map stress level to burnout risk."""
    mapping = {
        'Low':    'Low Risk',
        'Medium': 'Moderate Risk',
        'High':   'High Risk',
    }
    return mapping.get(stress_level, 'Unknown')


def main():
    # Read the JSON input sent by Node.js from the command line
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    try:
        user_input = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        sys.exit(1)

    # Extract feature values (9 features now)
    features = np.array([[
        user_input.get('sleep', 7),
        user_input.get('work', 8),
        user_input.get('screen', 3),
        user_input.get('mood', 3),
        user_input.get('exercise', 0),
        user_input.get('caffeine', 2),
        user_input.get('deadlines', 5),
        user_input.get('social', 2),
        user_input.get('sleepQuality', 3),
    ]])

    # Load or train the model
    model, scaler = load_or_train_model()

    # Scale features
    features_scaled = scaler.transform(features)

    # Make prediction
    stress_level = model.predict(features_scaled)[0]
    burnout_risk = predict_burnout(stress_level)

    # Get confidence (probability of predicted class)
    probabilities = model.predict_proba(features_scaled)[0]
    confidence = float(max(probabilities))

    # Calculate a simple stress score for charting
    score = 0
    inp = user_input
    if inp.get('sleep', 7) < 5: score += 3
    elif inp.get('sleep', 7) < 7: score += 1
    if inp.get('work', 8) > 10: score += 3
    elif inp.get('work', 8) > 8: score += 1
    if inp.get('screen', 3) > 6: score += 2
    elif inp.get('screen', 3) > 4: score += 1
    if inp.get('mood', 3) <= 2: score += 3
    elif inp.get('mood', 3) == 3: score += 1
    if inp.get('exercise', 0) == 0: score += 1
    if inp.get('caffeine', 2) > 4: score += 2
    if inp.get('deadlines', 5) >= 8: score += 2
    if inp.get('sleepQuality', 3) <= 2: score += 2

    # Return result as JSON
    result = {
        "stress_level": stress_level,
        "burnout_risk": burnout_risk,
        "confidence": round(confidence, 2),
        "score": score
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
