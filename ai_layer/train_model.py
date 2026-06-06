import pandas as pd
import numpy as np
import random
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

print("🧠 Generating mock flight data...")

WEATHER_OPTIONS = ['Clear Skies', 'Light Turbulence', 'Heavy Turbulence', 'Thunderstorms', 'Rain', 'Snow', 'Fog', 'Crosswinds', 'Hail', 'Volcanic Ash']
PHASE_OPTIONS = ['Boarding', 'Taxiing', 'Takeoff', 'Climbing', 'Cruising', 'Descending', 'Holding Pattern', 'Approaching', 'Landing', 'Deplaning']
PROFILE_OPTIONS = ['Business Traveler', 'Solo Leisure', 'Parent with Child', 'Elderly Passenger', 'First-Time Flyer', 'Honeymooners', 'Nervous Flyer', 'Student', 'VIP/Status', 'Group/Tour']

# 1. Generate 1000 rows of logical mock data
data = []
for _ in range(1000):
    w = random.choice(WEATHER_OPTIONS)
    p = random.choice(PHASE_OPTIONS)
    pro = random.choice(PROFILE_OPTIONS)
    
    # AI LOGIC RULES: Define what vibes make sense
    if w in ['Heavy Turbulence', 'Thunderstorms', 'Hail'] or pro == 'Nervous Flyer':
        vibe = 'Calming Distraction'
    elif pro == 'Business Traveler' and p == 'Cruising' and w in ['Clear Skies', 'Light Turbulence']:
        vibe = 'Focused Work'
    elif pro == 'Parent with Child':
        vibe = 'Family Entertainment'
    elif p in ['Takeoff', 'Landing']:
        vibe = 'Audio Only' # Screens might need to be stowed/distracting
    elif pro == 'Honeymooners':
        vibe = 'Romantic & Relaxing'
    else:
        vibe = 'General Entertainment'

    data.append({'weather': w, 'flightPhase': p, 'passengerProfile': pro, 'target_vibe': vibe})

df = pd.DataFrame(data)

# 2. Initialize Encoders (Train them on ALL possible options to prevent crashes)
le_weather = LabelEncoder().fit(WEATHER_OPTIONS)
le_phase = LabelEncoder().fit(PHASE_OPTIONS)
le_profile = LabelEncoder().fit(PROFILE_OPTIONS)

# Apply encoders to the dataset
df['weather_code'] = le_weather.transform(df['weather'])
df['phase_code'] = le_phase.transform(df['flightPhase'])
df['profile_code'] = le_profile.transform(df['passengerProfile'])

# 3. Train the Model
X = df[['weather_code', 'phase_code', 'profile_code']] # Inputs
y = df['target_vibe'] # Output

clf = DecisionTreeClassifier(max_depth=6, random_state=42)
clf.fit(X, y)

# 4. Save the Model and the Encoders so FastAPI can use them
os.makedirs('model', exist_ok=True)

# Define paths relative to this script
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, 'model', 'passenger_classifier.pkl')
encoders_path = os.path.join(base_dir, 'model', 'encoders.pkl')

joblib.dump(clf, model_path)
joblib.dump({'weather': le_weather, 'phase': le_phase, 'profile': le_profile}, encoders_path)

print(f"✅ Model trained! Saved to {model_path}")