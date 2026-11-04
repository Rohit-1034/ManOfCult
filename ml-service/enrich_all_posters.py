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

def fetch_poster_and_stars(mid_str, imdb_id):
    if not imdb_id:
        return mid_str, None, None
    clean_id = str(imdb_id).strip().replace("tt", "").zfill(7)
    url = f"https://v3.sg.media-imdb.com/suggestion/x/tt{clean_id}.json"
    
    for attempt in range(4):
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
                    return mid_str, poster, stars
                return mid_str, None, None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                sleep_sec = 8 * (attempt + 1)
                time.sleep(sleep_sec)
            else:
                break
        except Exception:
            time.sleep(1.0)
            
    return mid_str, None, None

def main():
    print("=== CineMatch AI: Resilient 100% Poster & Stars Catalog Enrichment ===")
    
    with open(MOVIES_JSON, "r", encoding="utf-8") as f:
        movies = json.load(f)
        
    print(f"Total movies in catalog: {len(movies)}")
    
    posters = load_json(POSTERS_CACHE)
    stars = load_json(STARS_CACHE)
    print(f"Currently cached: {len(posters)} posters, {len(stars)} stars records.")
    
    to_fetch = []
    for m in movies:
        mid_str = str(m["movieId"])
        imdb_id = m.get("imdbId")
        if (mid_str not in posters or "unsplash" in str(posters.get(mid_str, ""))) and imdb_id:
            to_fetch.append((mid_str, imdb_id))
            
    print(f"Movies left to fetch: {len(to_fetch)}")
    
    if to_fetch:
        start_time = time.time()
        completed = 0
        batch_size = 100
        
        with ThreadPoolExecutor(max_workers=8) as executor:
            future_to_mid = {
                executor.submit(fetch_poster_and_stars, mid_str, imdb_id): mid_str 
                for mid_str, imdb_id in to_fetch
            }
            
            for future in as_completed(future_to_mid):
                mid_str, poster_url, stars_str = future.result()
                completed += 1
                
                if poster_url:
                    posters[mid_str] = poster_url
                if stars_str:
                    stars[mid_str] = stars_str
                    
                if completed % batch_size == 0 or completed == len(to_fetch):
                    save_json(POSTERS_CACHE, posters)
                    save_json(STARS_CACHE, stars)
                    elapsed = time.time() - start_time
                    rate = completed / elapsed if elapsed > 0 else 0
                    percent = (completed / len(to_fetch)) * 100
                    print(f"[{completed}/{len(to_fetch)}] {percent:.1f}% | {rate:.1f} mov/s | Total Valid Posters: {len(posters)}")
                    
        save_json(POSTERS_CACHE, posters)
        save_json(STARS_CACHE, stars)

    # Merge into movies_processed.json and csv
    print("Writing catalog update...")
    with_poster_count = 0
    for m in movies:
        mid_str = str(m["movieId"])
        if mid_str in posters and posters[mid_str]:
            m["posterPath"] = posters[mid_str]
            with_poster_count += 1
        elif m.get("posterPath") and "unsplash" not in m.get("posterPath"):
            with_poster_count += 1
            
        if mid_str in stars:
            m["stars"] = stars[mid_str]

    save_json(MOVIES_JSON, movies)
    df = pd.DataFrame(movies)
    df.to_csv(MOVIES_CSV, index=False)
    print(f"Updated catalog: {with_poster_count}/{len(movies)} authentic posters ({with_poster_count/len(movies)*100:.1f}%)")

if __name__ == "__main__":
    main()
