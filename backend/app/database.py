import json
import os

# Get the absolute path to the data folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'content_database.json')

def load_content_database():
    """Reads the JSON file and returns the list of media items."""
    try:
        with open(DB_PATH, 'r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"❌ Error: Database file not found at {DB_PATH}")
        return []

# Load it into memory when the server starts
MEDIA_CATALOG = load_content_database()

def get_all_media():
    return MEDIA_CATALOG