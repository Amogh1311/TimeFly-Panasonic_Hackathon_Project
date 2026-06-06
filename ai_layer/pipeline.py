import joblib
import os
from groq import Groq
from dotenv import load_dotenv

# Force Python to load the .env file so Groq can find the API key
load_dotenv()

class AILayer:
    def __init__(self):
        # Load the trained Decision Tree brain and translation dictionaries
        base_dir = os.path.dirname(__file__)
        self.model = joblib.load(os.path.join(base_dir, 'model/passenger_classifier.pkl'))
        self.encoders = joblib.load(os.path.join(base_dir, 'model/encoders.pkl'))
        
        # Initialize the Groq LLM Client
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            print("⚠️ WARNING: GROQ_API_KEY not found in .env file!")
        self.groq_client = Groq(api_key=api_key)

    def predict_vibe(self, telemetry):
        """
        Takes live JSON telemetry, asks the ML model for a vibe, 
        and asks Groq to write a custom greeting.
        """
        try:
            # Safely grab data
            w_raw = telemetry.get('weather', 'Clear Skies')
            p_raw = telemetry.get('flightPhase', 'Cruising')
            pro_raw = telemetry.get('passengerProfile', 'Business Traveler')

            # 1. Ask the ML Model for the vibe
            w_code = self.encoders['weather'].transform([w_raw])[0]
            p_code = self.encoders['phase'].transform([p_raw])[0]
            pro_code = self.encoders['profile'].transform([pro_raw])[0]
            
            prediction = self.model.predict([[w_code, p_code, pro_code]])
            vibe = prediction[0]
            
            # 2. Ask Groq to write a dynamic greeting!
            greeting = self._generate_groq_greeting(vibe, w_raw, p_raw, pro_raw)
            
            return {
                "detected_vibe": vibe,
                "greeting": greeting
            }
            
        except Exception as e:
            print(f"AI Prediction Error: {e}")
            return {"detected_vibe": "General Entertainment", "greeting": "Here are some top picks for your flight!"}

    def _generate_groq_greeting(self, vibe, weather, phase, profile):
        """Passes the flight context to Llama-3 to generate empathy."""
        
        # The prompt that tells the LLM how to act
        prompt = f"""
        You are TimeFly, an empathetic AI. 
        Current State:
        - Weather: {weather}
        - Flight Phase: {phase}
        - Passenger Profile: {profile}
        - Selected Vibe: {vibe}

        Task: Write a concise, human-sounding sentence. 
        You MUST mention the current weather,Flight Phase and the passenger profile in your response 
        to show you are actively listening to the flight telemetry.
        """
        
        try:
            response = self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant", # Extremely fast model, perfect for quick UI text
                temperature=0.7,        # A little creativity, but not crazy
                max_tokens=60,          # Keeps the response short so it fits in the UI
            )
            
            # Clean up the output string and return it
            return response.choices[0].message.content.strip().replace('"', '')
            
        except Exception as e:
            print(f"Groq API Error: {e}")
            # Fallback if the internet drops or Groq rate limits you during the demo
            return f"Because of the {weather}, we've curated a {vibe} selection for you."