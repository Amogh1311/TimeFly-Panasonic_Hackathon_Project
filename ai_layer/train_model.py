import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

base_dir = os.path.dirname(__file__)
csv_path = os.path.join(base_dir, 'flight_data.csv')

if not os.path.exists(csv_path):
    raise FileNotFoundError(f"❌ Could not find {csv_path}. Please make sure your CSV data is saved there!")

print("🧠 Loading and training on REAL flight CSV data...")

# 1. Read the real CSV dataset
df = pd.read_csv(csv_path)

# Normalize column names to match the incoming frontend keys exactly
df.columns = ['weather', 'flightPhase', 'passengerProfile', 'target_vibe']

# 2. Define ALL possible categories (combining your CSV options and frontend options)
WEATHER_OPTIONS = ['Clear Skies', 'Light Rain', 'Night Flight', 'Heavy Turbulence', 'Thunderstorms', 'Rain', 'Snow', 'Fog', 'Crosswinds', 'Hail', 'Volcanic Ash']
PHASE_OPTIONS = ['Boarding', 'Taxiing', 'Takeoff', 'Climbing', 'Cruising', 'Descending', 'Holding Pattern', 'Approaching', 'Landing', 'Deplaning']
PROFILE_OPTIONS = ['Business Traveler', 'Solo Leisure', 'Solo Leisure', 'Parent with Child', 'Parent with Child', 'Elderly Passenger', 'First-Time Flyer', 'Honeymooners', 'Nervous Flyer', 'Student', 'VIP/Status', 'Group/Tour']

# 3. Fit encoders on the master lists to prevent "unseen label" errors later
le_weather = LabelEncoder().fit(WEATHER_OPTIONS)
le_phase = LabelEncoder().fit(PHASE_OPTIONS)
le_profile = LabelEncoder().fit(PROFILE_OPTIONS)

# 4. Transform the real CSV strings into numerical values
df['weather_code'] = le_weather.transform(df['weather'])
df['phase_code'] = le_phase.transform(df['flightPhase'])
df['profile_code'] = le_profile.transform(df['passengerProfile'])

# 5. Extract inputs (X) and target outputs (y) from the real data
X = df[['weather_code', 'phase_code', 'profile_code']]
y = df['target_vibe']

# 6. Train the Decision Tree Model
clf = DecisionTreeClassifier(max_depth=6, random_state=42)
clf.fit(X, y)

# 7. Save the model files
os.makedirs(os.path.join(base_dir, 'model'), exist_ok=True)
model_path = os.path.join(base_dir, 'model', 'passenger_classifier.pkl')
encoders_path = os.path.join(base_dir, 'model', 'encoders.pkl')

joblib.dump(clf, model_path)
joblib.dump({'weather': le_weather, 'phase': le_phase, 'profile': le_profile}, encoders_path)

print(f"✅ Training Complete! Model trained on real CSV rows and saved to {model_path}")