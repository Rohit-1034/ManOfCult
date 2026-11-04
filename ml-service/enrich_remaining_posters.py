import os
import json
import time
import random
import urllib.request
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed

DATA_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\data"
MOVIES_JSON = os.path.join(DATA_DIR, "movies_processed.json")
MOVIES_CSV = os.path.join(DATA_DIR, "movies_processed.csv")
POSTERS_CACHE = os.path.join(DATA_DIR, "posters_cache.json")
STARS_CACHE = os.path.join(DATA_DIR, "stars_cache.json")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
]

def load_json(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_json(filepath, data):
    tmp_path = filepath + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp_path, filepath)

def fetch_single(mid_str, imdb_id):
    if not imdb_id:
        return mid_str, None, None
    clean_id = str(imdb_id).strip().replace("tt", "").zfill(7)
    url = f"https://v3.sg.media-imdb.com/suggestion/x/tt{clean_id}.json"
    
    for attempt in range(3):
        ua = random.choice(USER_AGENTS)
        req = urllib.request.Request(url, headers={"User-Agent": ua})
        try:
            with urllib.request.urlopen(req, timeout=4.0) as response:
                data = json.loads(response.read().decode("utf-8"))
                items = data.get("d", [])
                if items:
                    item = items[0]
                    img = item.get("i")
                    poster = img.get("imageUrl") if (img and isinstance(img, dict)) else None
                    stars = item.get("s")
                    time.sleep(0.06)
                    return mid_str, poster, stars
                return mid_str, None, None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(12 * (attempt + 1))
            else:
                break
        except Exception:
            time.sleep(0.5)
            
    return mid_str, None, None

def main():
    print("=== Continuous Gentle Poster Enrichment Engine ===")
    
    movies = load_json(MOVIES_JSON)
    posters = load_json(POSTERS_CACHE)
    stars = load_json(STARS_CACHE)
    
    uncached = []
    for m in movies:
        mid_str = str(m["movieId"])
        imdb_id = m.get("imdbId")
        if (mid_str not in posters or "unsplash" in str(posters.get(mid_str, ""))) and imdb_id:
            uncached.append((mid_str, imdb_id))
            
    print(f"Uncached movies: {len(uncached)}")
    if not uncached:
        print("All movies are 100% enriched!")
        return

    # Process in chunks of 50
    chunk_size = 50
    start_time = time.time()
    total_new_posters = 0

    with ThreadPoolExecutor(max_workers=5) as executor:
        for i in range(0, len(uncached), chunk_size):
            batch = uncached[i:i + chunk_size]
            futures = {executor.submit(fetch_single, mid, imdb): mid for mid, imdb in batch}
            
            for future in as_completed(futures):
                mid, poster, star_str = future.result()
                if poster:
                    posters[mid] = poster
                    total_new_posters += 1
                if star_str:
                    stars[mid] = star_str

            save_json(POSTERS_CACHE, posters)
            save_json(STARS_CACHE, stars)
            
            # Update catalog in memory and save
            for m in movies:
                m_id = str(m["movieId"])
                if m_id in posters:
                    m["posterPath"] = posters[m_id]
                if m_id in stars:
                    m["stars"] = stars[m_id]
            save_json(MOVIES_JSON, movies)
            
            elapsed = time.time() - start_time
            done = min(i + chunk_size, len(uncached))
            print(f"Progress: [{done}/{len(uncached)}] - Total cached: {len(posters)} posters (+{total_new_posters} new)")

    # Final CSV export
    df = pd.DataFrame(movies)
    df.to_csv(MOVIES_CSV, index=False)
    print("Enrichment run complete!")

if __name__ == "__main__":
    main()
