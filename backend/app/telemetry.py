def process_telemetry_for_ml(raw_telemetry):
    """
    Translates Amogh's React JSON into a format Siddhant's ML model likes.
    """
    # Extract the raw strings
    weather = raw_telemetry.weather.lower()
    phase = raw_telemetry.flightPhase.lower()
    profile = raw_telemetry.passengerProfile.lower()
    
    # Example Logic: If there is turbulence, we want to force calming vibes
    needs_calming = "turbulence" in weather
    
    # We will pass these cleaned features to Siddhant's model tomorrow
    features = {
        "is_turbulent": needs_calming,
        "is_cruising": "cruising" in phase,
        "is_business": "business" in profile,
        "age": int(raw_telemetry.passengerAge)
    }
    
    return features