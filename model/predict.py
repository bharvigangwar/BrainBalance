"""
===================================
  BRAINBALANCE — PYTHON ML MODEL
  predict.py

  This script:
  1. Loads the trained model (or trains it if not saved yet)
  2. Reads user input from the command line (sent by Node.js)
  3. Predicts stress level and burnout risk
  4. Prints the result as JSON so Node.js can read it
===================================
"""

import sys
import json
import os
import numpy as np

# --- SKLEARN IMPORTS ---
# scikit-learn is the ML library we use
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib   # for saving/loading the trained model


# Get the absolute path to the model file (script directory)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'stress_model.pkl')

# -------------------------------------------------------
#  TRAINING DATA
#  In a real project you'd load this from a CSV file.
#  Here we define a small dataset to train the model.
#  Format: [sleep, work_hours, screen_time, mood, exercise]
# -------------------------------------------------------

TRAINING_DATA = [
    # [sleep, work, screen, mood, exercise] → stress label
    [8, 6,  2, 5, 1, 'Low'],
    [7, 7,  3, 4, 1, 'Low'],
    [8, 5,  1, 5, 1, 'Low'],
    [7, 6,  2, 4, 0, 'Low'],
    [9, 4,  2, 5, 1, 'Low'],
    [6, 8,  4, 3, 0, 'Medium'],
    [6, 9,  5, 3, 0, 'Medium'],
    [5, 9,  6, 3, 0, 'Medium'],
    [7, 8,  4, 3, 1, 'Medium'],
    [6, 10, 5, 2, 0, 'Medium'],
    [4, 12, 7, 1, 0, 'High'],
    [3, 14, 8, 1, 0, 'High'],
    [4, 13, 9, 2, 0, 'High'],
    [5, 12, 7, 1, 0, 'High'],
    [3, 15, 8, 1, 0, 'High'],
    [5, 10, 6, 2, 0, 'Medium'],
    [8, 8,  3, 4, 1, 'Low'],
    [6, 11, 7, 2, 0, 'High'],
    [7, 7,  4, 3, 1, 'Low'],
    [4, 11, 8, 1, 0, 'High'],
]



def train_model():
    """
    Train a Random Forest classifier on our dataset.
    Random Forest = many decision trees working together — 
    it's simple, interpretable, and works great for tabular data.
    """
    # Separate features (X) from labels (y)
    X = np.array([[row[0], row[1], row[2], row[3], row[4]] for row in TRAINING_DATA])
    y = np.array([row[5] for row in TRAINING_DATA])

    # Train the model
    model = RandomForestClassifier(n_estimators=50, random_state=42)
    model.fit(X, y)

    # Save the model so we don't retrain every time
    joblib.dump(model, MODEL_PATH)
    print("Model trained and saved.", file=sys.stderr)
    return model


def load_or_train_model():
    """Load saved model if it exists, otherwise train a new one."""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
    else:
        return train_model()


def predict_burnout(stress_level):
    """
    Map stress level to burnout risk.
    Simple rule: high stress = high burnout risk, etc.
    """
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

    # Extract feature values
    features = np.array([[
        user_input.get('sleep', 7),
        user_input.get('work', 8),
        user_input.get('screen', 3),
        user_input.get('mood', 3),
        user_input.get('exercise', 0),
    ]])

    # Load or train the model
    model = load_or_train_model()

    # Make prediction
    stress_level = model.predict(features)[0]
    burnout_risk = predict_burnout(stress_level)

    # Return result as JSON — Node.js will read this
    result = {
        "stress_level": stress_level,
        "burnout_risk": burnout_risk
    }
    print(json.dumps(result))


# Run the main function when script is called
if __name__ == '__main__':
    main()
