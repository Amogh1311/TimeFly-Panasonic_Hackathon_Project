from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from pydantic import BaseModel

# Import our SocketIO server
from app.seatsync_rooms import sio

# NEW: Import our data layer and telemetry parser!
from app.database import get_all_media
from app.telemetry import process_telemetry_for_ml

# Initialize FastAPI
app = FastAPI(title="TimeFly Backend API", version="1.0")

# Setup CORS so the React frontend (running on localhost:5173) can talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wrap FastAPI app with SocketIO ASGI app
sio_asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)

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

@app.post("/api/ai-recommendations")
async def get_ai_recommendations(telemetry: TelemetryPayload):
    """
    This endpoint takes the flight data and asks Siddhant's ML model
    what media to show the passenger.
    """
    print(f"📊 Received Telemetry: {telemetry.flightPhase} | {telemetry.weather}")
    
    # 1. Parse the incoming React data
    ml_features = process_telemetry_for_ml(telemetry)
    
    # 2. Fetch the entire media catalog
    all_media = get_all_media()
    
    # 3. [TOMORROW: Siddhant's ML Model will filter 'all_media' based on 'ml_features']
    # For tonight, we write a simple fallback logic block!
    
    recommended_items = []
    detected_vibe = "Standard Curated Selection"
    greeting = f"Enjoy your {telemetry.flightPhase} phase."

    if ml_features["is_turbulent"]:
        greeting = "We noticed some heavy turbulence. Here are some calming options."
        detected_vibe = "Calming Distraction"
        # Filter for tags matching "Turbulence" or "Relaxing"
        recommended_items = [
            item for item in all_media 
            if "Turbulence" in item.get("tags", []) or "Relaxing" in item.get("tags", [])
        ]
    else:
        greeting = f"Clear skies ahead! Here are some great picks for a {telemetry.passengerProfile}."
        detected_vibe = "Engaging Entertainment"
        # Filter for tags matching "Action", "Comedy", or "Upbeat"
        recommended_items = [
            item for item in all_media 
            if "Action" in item.get("tags", []) or "Comedy" in item.get("tags", []) or "Upbeat" in item.get("tags", [])
        ]

    # Return the clean payload to Amogh's frontend!
    return {
        "greeting": greeting,
        "detected_vibe": detected_vibe,
        "items": recommended_items[:4] # Only send the top 4 items
    }