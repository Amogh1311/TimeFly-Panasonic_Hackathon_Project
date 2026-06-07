import requests
import random
import json
import os

# In-memory cache so we only fetch from the API once when the server boots up.
MEDIA_CACHE = []

DEFAULT_THUMBNAIL = "https://via.placeholder.com/600x300/0a0e17/ffffff?text=Media"

# Unique placeholder thumbnails for retries
PLACEHOLDER_1 = "https://via.placeholder.com/600x300/1a1f2e/ffffff?text=No+Img"
PLACEHOLDER_2 = "https://via.placeholder.com/600x300/121824/ffffff?text=Media"

def load_fallback_media():
    """Load static media from content_database.json as fallback"""
    base_dir = os.path.dirname(__file__)
    fallback_path = os.path.join(base_dir, '..', 'data', 'content_database.json')
    try:
        with open(fallback_path, 'r') as f:
            fallback = json.load(f)
        # Map to expected format - use existing tags or add defaults
        items = []
        for item in fallback:
            media_type = item.get('media_type', 'Music')
            tags = item.get('tags', [])
            
            # Ensure thumbnail_url exists, use default if missing
            thumbnail = item.get('thumbnail_url', '') or DEFAULT_THUMBNAIL
            
            # If no tags, add defaults based on media type
            if not tags:
                if media_type == 'Movie':
                    tags = ["General Entertainment", "Upbeat Entertainment", "Action", "Focused Work"]
                elif media_type == 'TV Show':
                    tags = ["General Entertainment", "Upbeat Entertainment", "Comedy", "Focused Work"]
                elif media_type == 'Documentary':
                    tags = ["Focused Work", "General Entertainment", "Educational"]
                elif media_type == 'Music':
                    tags = ["Calming Distraction", "Focused Work", "Audio Only", "Relaxing"]
                elif media_type == 'Audiobook':
                    tags = ["Audio Only", "Focused Work", "Relaxing"]
            
            items.append({
                "id": item.get("id", str(random.randint(10000, 99999))),
                "title": item.get("title", "Unknown"),
                "media_type": media_type,
                "thumbnail_url": thumbnail,
                "tags": tags
            })
        return items
    except Exception as e:
        print(f"⚠️ Failed to load fallback media: {e}")
        return []

def fetch_itunes_media(search_term, entity_type, display_type, limit=22):
    """
    Hits the public iTunes API to fetch media items.
    Returns empty list if API fails, caller will use fallback.
    """
    url = f"https://itunes.apple.com/search?term={search_term}&entity={entity_type}&limit={limit}&country=US"
    
    try:
        response = requests.get(url, timeout=5)
        results = response.json().get('results', [])
        
        formatted_items = []
        for item in results:
            title = item.get('trackName') or item.get('collectionName')
            if not title:
                continue
                
            raw_img_url = item.get('artworkUrl100', '')
            if not raw_img_url:
                high_res_img = DEFAULT_THUMBNAIL
            else:
                high_res_img = raw_img_url.replace('100x100bb', '600x600bb')
            
            genre = item.get('primaryGenreName', 'Entertainment')
            tags = [genre]
            
            # All content types get broad vibe coverage
            if display_type == "Music": 
                tags.extend(["Calming Distraction", "Focused Work", "Audio Only", "Relaxing", "Upbeat Entertainment", "General Entertainment"])
            elif display_type == "Audiobook":
                tags.extend(["Audio Only", "Focused Work", "Relaxing", "Calming Distraction", "General Entertainment"])
            elif display_type == "Movie": 
                tags.extend(["General Entertainment", "Upbeat Entertainment", "Family Entertainment", "Focused Work", "Calming Distraction"])
            elif display_type == "TV Show":
                tags.extend(["General Entertainment", "Upbeat Entertainment", "Family Entertainment", "Focused Work"])
            elif display_type == "Documentary":
                tags.extend(["Focused Work", "General Entertainment", "Educational", "Upbeat Entertainment", "Calming Distraction"])
            
            formatted_items.append({
                "id": str(item.get('trackId', random.randint(10000, 99999))),
                "title": title,
                "media_type": display_type,
                "thumbnail_url": high_res_img,
                "tags": tags
            })
            
        return formatted_items
    except Exception as e:
        print(f"⚠️ Failed to fetch {display_type} from API: {e}")
        return []

def get_all_media():
    """
    Returns the complete media catalog. Uses iTunes API if available, falls back to static data.
    """
    global MEDIA_CACHE
    
    if MEDIA_CACHE:
        return MEDIA_CACHE
    
    print("🌍 Downloading Live Media Catalog from iTunes API...")
    
    # Try iTunes API with working entity types
    movies = fetch_itunes_media("batman", "movie", "Movie", 22)
    if len(movies) == 0:
        print("ℹ️ iTunes movie API returned no results, will use fallback")
    
    music = fetch_itunes_media("lofi+chill", "song", "Music", 22)
    audiobooks = fetch_itunes_media("business+mystery", "audiobook", "Audiobook", 22)
    tv_shows = fetch_itunes_media("comedy", "tvSeason", "TV Show", 22)
    documentaries = fetch_itunes_media("nature", "movie", "Documentary", 22)
    
    MEDIA_CACHE = movies + music + audiobooks + tv_shows + documentaries
    
    # Always load fallback to ensure all media types are represented
    # This ensures Movies, TV Shows, Documentaries are available even if iTunes API fails
    fallback = load_fallback_media()
    MEDIA_CACHE = MEDIA_CACHE + fallback
    
    random.shuffle(MEDIA_CACHE)
    
    print(f"✅ Successfully loaded {len(MEDIA_CACHE)} media items!")
    return MEDIA_CACHE