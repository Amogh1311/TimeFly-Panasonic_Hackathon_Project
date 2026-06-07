import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from pydantic import BaseModel

# Import our SocketIO server
from app.seatsync_rooms import sio

# Import our data layer
from app.database import get_all_media

# --- NEW: AI PATH MAGIC ---
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from ai_layer.pipeline import AILayer

# Initialize FastAPI
app = FastAPI(title="TimeFly Backend API", version="1.0")

# Setup CORS so the React frontend can talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap FastAPI app with SocketIO ASGI app
sio_asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)

# ---------------------------------------------------------
# INITIALIZE THE AI BRAIN
# ---------------------------------------------------------
print("🤖 Booting up AI Engine...")
ai_engine = AILayer()

# ---------------------------------------------------------
# Pydantic Models for REST APIs
# ---------------------------------------------------------
class TelemetryPayload(BaseModel):
    weather: str
    flightPhase: str
    passengerProfile: str
    passengerAge: str

# ---------------------------------------------------------
# REST API ENDPOINTS
# ---------------------------------------------------------
@app.get("/")
def read_root():
    return {"status": "TimeFly Server is actively running! ✈️"}

# Normalize vibe names from ML model or CSV to our standard vibe tags
def normalize_vibe(vibe):
    vibe_map = {
        "Productive & Focus": "Focused Work",
        "Sleep & Relax": "Calming Distraction",
        "Casual Entertainment": "General Entertainment",
    }
    return vibe_map.get(vibe, vibe)

def get_override_vibe(telemetry):
    # 1. Safety & Stress Override (Highest Priority)
    stressful_weather = ['Heavy Turbulence', 'Thunderstorms', 'Volcanic Ash', 'Crosswinds', 'Hail']
    stressful_phase = ['Takeoff', 'Landing', 'Approaching']
    
    if telemetry.weather in stressful_weather or telemetry.flightPhase in stressful_phase:
        return "Calming Distraction"
    
    # 2. Profile-Based Override (Medium Priority)
    business_profiles = ['Business Traveler', 'VIP/Status', 'Elderly Passenger']
    if telemetry.passengerProfile in business_profiles:
        return "Focused Work"
    
    fun_profiles = ['Solo Leisure', 'Group/Tour', 'Honeymooners', 'Student']
    if telemetry.passengerProfile in fun_profiles:
        return "Upbeat Entertainment"
    
    # Parent with Child gets Family Entertainment
    if telemetry.passengerProfile == 'Parent with Child':
        return "Family Entertainment"
    
    # Nervous Flyer gets Calming Distraction (stressful flyers need calming)
    if telemetry.passengerProfile == 'Nervous Flyer':
        return "Calming Distraction"
    
    # First-Time Flyer gets General Entertainment
    if telemetry.passengerProfile == 'First-Time Flyer':
        return "General Entertainment"
    
    # 3. Default Fallback
    return "General Entertainment"

@app.post("/api/ai-recommendations")
async def get_ai_recommendations(telemetry: TelemetryPayload):
    # 1. Get the ML prediction (The "General" AI Brain)
    ai_result = ai_engine.predict_vibe(telemetry.dict())
    detected_vibe = normalize_vibe(ai_result.get("detected_vibe", "General Entertainment"))
    
    # 2. Apply Override (The "Demo-Proof" logic)
    # Override takes precedence for known profiles, otherwise use ML prediction
    override = get_override_vibe(telemetry)
    detected_vibe = override  # For demo: always use override for consistent results

    # 3. Get the Groq Greeting
    # We pass the vibe to Groq so it sounds empathetic to the specific conditions
    greeting = ai_engine._generate_groq_greeting(
        detected_vibe, 
        telemetry.weather, 
        telemetry.flightPhase, 
        telemetry.passengerProfile
    )
    
    # 4. Filter the live media
    all_media = get_all_media()
    print(f"DEBUG: Backend successfully grabbed {len(all_media)} items. Sample title: {all_media[0]['title']}")
    filtered_items = [item for item in all_media if detected_vibe in item.get("tags", [])]
            
    # Hackathon Safety Net
    if len(filtered_items) < 4:
        filtered_items = all_media[:8]

    return {
        "greeting": greeting,
        "detected_vibe": detected_vibe,
        "items": filtered_items
    }