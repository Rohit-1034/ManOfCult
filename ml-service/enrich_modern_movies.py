import os
import json
import urllib.request
import urllib.parse
import time
import pandas as pd

TMDB_API_KEY = "2dca580c2a14b55200e784d157207b4d"
DATA_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\data"
MOVIES_JSON = os.path.join(DATA_DIR, "movies_processed.json")
MOVIES_CSV = os.path.join(DATA_DIR, "movies_processed.csv")
TMDB_CACHE = os.path.join(DATA_DIR, "tmdb_cache.json")
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

def search_tmdb(title, year):
    clean_title = title.split(' (')[0].strip()
    query = urllib.parse.quote(clean_title)
    url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={query}&language=en-US"
    if year:
        url += f"&year={year}"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'CineMatchAI/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            results = data.get("results", [])
            if not results and year:
                # Retry without year filter
                url_noyear = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={query}&language=en-US"
                req2 = urllib.request.Request(url_noyear, headers={'User-Agent': 'CineMatchAI/1.0'})
                with urllib.request.urlopen(req2, timeout=10) as resp2:
                    data2 = json.loads(resp2.read().decode('utf-8'))
                    results = data2.get("results", [])
            
            if results:
                best = results[0]
                return {
                    "tmdb_id": best.get("id"),
                    "title": best.get("title"),
                    "poster_path": best.get("poster_path"),
                    "backdrop_path": best.get("backdrop_path"),
                    "release_date": best.get("release_date")
                }
    except Exception as e:
        print(f"Error querying TMDB for '{title}': {e}")
    return None

def main():
    print("=== Enriching Modern & Missing TMDB Movies ===")
    with open(MOVIES_JSON, "r", encoding="utf-8") as f:
        movies = json.load(f)
        
    with open(TMDB_CACHE, "r", encoding="utf-8") as f:
        tmdb_cache = json.load(f)

    updated_count = 0

    for m in movies:
        needs_tmdb = False
        mid = m.get("movieId")
        tmdb_id = m.get("tmdbId")
        poster = m.get("posterPath")

        if not tmdb_id or int(tmdb_id) <= 0 or not poster:
            needs_tmdb = True

        if needs_tmdb:
            title = m.get("title")
            year = m.get("releaseYear")
            print(f"Searching TMDB for: {title} ({year})...")
            result = search_tmdb(title, year)
            if result and result.get("poster_path"):
                tid = result["tmdb_id"]
                p_path = result["poster_path"]
                b_path = result.get("backdrop_path") or p_path

                m["tmdbId"] = tid
                m["rawPosterPath"] = p_path
                m["posterPath"] = f"{TMDB_IMAGE_BASE}/w500{p_path}"
                m["rawBackdropPath"] = b_path
                m["backdropPath"] = f"{TMDB_IMAGE_BASE}/original{b_path}"

                # Update cache
                tmdb_cache[str(tid)] = {
                    "id": tid,
                    "title": result["title"],
                    "poster_path": p_path,
                    "backdrop_path": b_path
                }
                print(f"  -> Found TMDB ID {tid} ('{result['title']}'): {p_path}")
                updated_count += 1
            else:
                print(f"  -> No poster found on TMDB for {title}")
            time.sleep(0.1)

    print(f"\nTotal movies updated with verified TMDB data: {updated_count}")

    with open(TMDB_CACHE, "w", encoding="utf-8") as f:
        json.dump(tmdb_cache, f, indent=2)

    with open(MOVIES_JSON, "w", encoding="utf-8") as f:
        json.dump(movies, f, indent=2)

    df = pd.DataFrame(movies)
    df.to_csv(MOVIES_CSV, index=False)
    print("Successfully saved updated movies to JSON and CSV!")

if __name__ == "__main__":
    main()
