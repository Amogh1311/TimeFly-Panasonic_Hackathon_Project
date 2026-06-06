import requests
import random

# In-memory cache so we only fetch from the API once when the server boots up.
MEDIA_CACHE = []

def fetch_itunes_media(search_term, entity_type, display_type, limit=22):
    """
    Hits the public iTunes API to fetch exactly the number of items requested.
    """
    url = f"https://itunes.apple.com/search?term={search_term}&entity={entity_type}&limit={limit}"
    
    try:
        response = requests.get(url, timeout=5)
        results = response.json().get('results', [])
        
        formatted_items = []
        for item in results:
            # Grab the title depending on the media type
            title = item.get('trackName') or item.get('collectionName')
            if not title:
                continue
                
            # Apple returns tiny 100x100 thumbnails. We hack the URL to get crisp 600x600 images!
            raw_img_url = item.get('artworkUrl100', '')
            high_res_img = raw_img_url.replace('100x100bb', '600x600bb')
            
            # Create AI Vibe Tags based on the media type so our ML model can filter them
            tags = [item.get('primaryGenreName', 'Entertainment')]
            
            # Add custom AI tags based on what Apple returns
            if display_type == "Music": 
                tags.extend(["Calming Distraction", "Focused Work", "Audio Only"])
            elif display_type == "Audiobook":
                tags.extend(["Audio Only", "Focused Work", "Relaxing"])
            elif display_type in ["Movie", "TV Show"]: 
                tags.extend(["General Entertainment", "Upbeat Entertainment", "Family Entertainment"])
            elif display_type == "Documentary":
                tags.extend(["Focused Work", "General Entertainment"])
            
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
    Returns the complete media catalog. Fetches exactly 110 items across 5 categories.
    """
    global MEDIA_CACHE
    
    # If we already have the data, return it instantly to prevent lag
    if MEDIA_CACHE:
        return MEDIA_CACHE
        
    print("🌍 Downloading Live Media Catalog (110 Items) from Apple API...")
    
    # Fetch 22 items per category to reach exactly 110 items
    movies = fetch_itunes_media("marvel+starwars", "movie", "Movie", 22)
    music = fetch_itunes_media("lofi+chill", "song", "Music", 22)
    audiobooks = fetch_itunes_media("business+mystery", "audiobook", "Audiobook", 22)
    
    # TV Shows use the 'tvSeason' entity in Apple's API
    tv_shows = fetch_itunes_media("comedy+drama", "tvSeason", "TV Show", 22)
    
    # Documentaries are technically movies in Apple's system, but we search specific terms
    documentaries = fetch_itunes_media("nature+history+space", "movie", "Documentary", 22)
    
    # Combine them all together
    MEDIA_CACHE = movies + music + audiobooks + tv_shows + documentaries
    
    # Shuffle the deck so the dashboard doesn't just show all movies first, then all music, etc.
    random.shuffle(MEDIA_CACHE)
    
    print(f"✅ Successfully loaded {len(MEDIA_CACHE)} live media items!")
    return MEDIA_CACHE