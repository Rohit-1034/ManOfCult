import os
import json
import pandas as pd

DATA_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\data"
MOVIES_JSON = os.path.join(DATA_DIR, "movies_processed.json")
MOVIES_CSV = os.path.join(DATA_DIR, "movies_processed.csv")
TMDB_CACHE = os.path.join(DATA_DIR, "tmdb_cache.json")
RAW_LINKS = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\dataset_raw\ml-latest-small\links.csv"

TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

def main():
    print("=== Applying TMDB Posters to CineMatch AI Catalog ===")
    
    with open(MOVIES_JSON, "r", encoding="utf-8") as f:
        movies = json.load(f)
        
    with open(TMDB_CACHE, "r", encoding="utf-8") as f:
        tmdb_cache = json.load(f)

    links_df = pd.read_csv(RAW_LINKS)
    links_map = {}
    for _, row in links_df.iterrows():
        mid = int(row["movieId"])
        if pd.notna(row["tmdbId"]) and int(row["tmdbId"]) > 0:
            links_map[mid] = int(row["tmdbId"])

    with_tmdb_poster = 0
    fallback_count = 0

    for m in movies:
        mid = m["movieId"]
        
        # Link TMDB ID
        if mid in links_map:
            tmdb_id = links_map[mid]
            m["tmdbId"] = tmdb_id
        elif m.get("tmdbId") and int(m["tmdbId"]) > 0:
            tmdb_id = int(m["tmdbId"])
        else:
            tmdb_id = None

        cached_info = tmdb_cache.get(str(tmdb_id)) if tmdb_id else None

        if cached_info and cached_info.get("poster_path"):
            poster_path = cached_info["poster_path"]
            backdrop_path = cached_info.get("backdrop_path")

            m["rawPosterPath"] = poster_path
            m["posterPath"] = f"{TMDB_IMAGE_BASE}/w500{poster_path}"

            if backdrop_path:
                m["rawBackdropPath"] = backdrop_path
                m["backdropPath"] = f"{TMDB_IMAGE_BASE}/original{backdrop_path}"
            else:
                m["rawBackdropPath"] = poster_path
                m["backdropPath"] = f"{TMDB_IMAGE_BASE}/original{poster_path}"

            with_tmdb_poster += 1
        else:
            # Clean fallback: explicitly null so MoviePoster shows branded fallback
            m["rawPosterPath"] = None
            m["posterPath"] = None
            m["rawBackdropPath"] = None
            m["backdropPath"] = None
            fallback_count += 1

    with open(MOVIES_JSON, "w", encoding="utf-8") as f:
        json.dump(movies, f, indent=2)

    df = pd.DataFrame(movies)
    df.to_csv(MOVIES_CSV, index=False)

    print("=" * 60)
    print("TMDB Catalog Update Complete!")
    print(f"Total Movies: {len(movies)}")
    print(f"Movies with Official TMDB Posters: {with_tmdb_poster} ({with_tmdb_poster/len(movies)*100:.1f}%)")
    print(f"Movies with Clean Branded Fallback: {fallback_count}")
    print("=" * 60)

if __name__ == "__main__":
    main()
