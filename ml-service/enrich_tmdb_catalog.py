import os
import json
import time
import urllib.request
import urllib.parse
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed

DATA_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\data"
RAW_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\dataset_raw\ml-latest-small"
MOVIES_JSON = os.path.join(DATA_DIR, "movies_processed.json")
MOVIES_CSV = os.path.join(DATA_DIR, "movies_processed.csv")
LINKS_CSV = os.path.join(RAW_DIR, "links.csv")
TMDB_CACHE = os.path.join(DATA_DIR, "tmdb_cache.json")

TMDB_API_KEY = "2dca580c2a14b55200e784d157207b4d"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

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

def fetch_tmdb_movie(tmdb_id):
    if not tmdb_id or int(tmdb_id) <= 0:
        return tmdb_id, None, None, None
    url = f"https://api.themoviedb.org/3/movie/{int(tmdb_id)}?api_key={TMDB_API_KEY}&language=en-US"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=3.5) as res:
            d = json.loads(res.read().decode("utf-8"))
            title = d.get("title")
            poster_path = d.get("poster_path")
            backdrop_path = d.get("backdrop_path")
            return tmdb_id, title, poster_path, backdrop_path
    except urllib.error.HTTPError as e:
        if e.code == 429:
            time.sleep(2.0)
    except Exception:
        pass
    return tmdb_id, None, None, None

def search_tmdb_movie(title, year):
    q = urllib.parse.quote(title)
    url = f"https://api.themoviedb.org/3/search/movie?api_key={TMDB_API_KEY}&query={q}&year={year}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=3.5) as res:
            d = json.loads(res.read().decode("utf-8"))
            results = d.get("results", [])
            if results:
                top = results[0]
                return top.get("id"), top.get("title"), top.get("poster_path"), top.get("backdrop_path")
    except Exception:
        pass
    return None, None, None, None

def main():
    print("=== CineMatch AI: Official TMDB Movie Posters & Catalog Mapping Engine ===")

    # 1. Load movies & links
    with open(MOVIES_JSON, "r", encoding="utf-8") as f:
        movies = json.load(f)

    links_df = pd.read_csv(LINKS_CSV)
    links_map = {}
    for _, row in links_df.iterrows():
        mid = int(row["movieId"])
        if pd.notna(row["tmdbId"]) and int(row["tmdbId"]) > 0:
            links_map[mid] = int(row["tmdbId"])

    tmdb_cache = load_json(TMDB_CACHE)
    print(f"Total catalog movies: {len(movies)}")
    print(f"Movies in links.csv with tmdbId: {len(links_map)}")
    print(f"Currently in TMDB cache: {len(tmdb_cache)}")

    # 2. Assign tmdbId from links.csv or search
    items_to_fetch = []
    for m in movies:
        mid = m["movieId"]
        curr_tmdb = m.get("tmdbId")

        # Map from links.csv if MovieLens movie
        if mid in links_map:
            m["tmdbId"] = links_map[mid]
            tmdb_id = links_map[mid]
        elif curr_tmdb and int(curr_tmdb) > 0:
            tmdb_id = int(curr_tmdb)
        else:
            # Search TMDB for modern movie
            print(f"Searching TMDB for: {m['title']} ({m.get('releaseYear')})...")
            found_id, title, poster, backdrop = search_tmdb_movie(m["title"], m.get("releaseYear", 2024))
            if found_id:
                m["tmdbId"] = found_id
                tmdb_id = found_id
                tmdb_cache[str(found_id)] = {
                    "title": title,
                    "poster_path": poster,
                    "backdrop_path": backdrop
                }
                print(f"  -> Found: {title} (TMDB ID: {found_id})")
            else:
                tmdb_id = None

        if tmdb_id and str(tmdb_id) not in tmdb_cache:
            items_to_fetch.append(tmdb_id)

    save_json(TMDB_CACHE, tmdb_cache)
    print(f"Unique TMDB IDs to fetch from official TMDB API: {len(items_to_fetch)}")

    # 3. Concurrently fetch all TMDB movie records
    if items_to_fetch:
        start_time = time.time()
        completed = 0
        batch_size = 200

        with ThreadPoolExecutor(max_workers=16) as executor:
            futures = {executor.submit(fetch_tmdb_movie, tid): tid for tid in items_to_fetch}

            for future in as_completed(futures):
                tid, title, poster_path, backdrop_path = future.result()
                completed += 1

                if title or poster_path:
                    tmdb_cache[str(tid)] = {
                        "title": title,
                        "poster_path": poster_path,
                        "backdrop_path": backdrop_path
                    }

                if completed % batch_size == 0 or completed == len(items_to_fetch):
                    save_json(TMDB_CACHE, tmdb_cache)
                    elapsed = time.time() - start_time
                    rate = completed / elapsed if elapsed > 0 else 0
                    pct = (completed / len(items_to_fetch)) * 100
                    print(f"[{completed}/{len(items_to_fetch)}] {pct:.1f}% | {rate:.1f} req/s | Cached: {len(tmdb_cache)}")

        save_json(TMDB_CACHE, tmdb_cache)
        print(f"Completed TMDB fetch in {time.time() - start_time:.2f}s!")

    # 4. Update movies_processed.json & csv with 100% genuine TMDB posters
    print("\nUpdating movies_processed catalog with verified TMDB official posters...")
    with_tmdb_poster = 0
    fallback_count = 0

    for m in movies:
        tmdb_id = m.get("tmdbId")
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
            # Clean fallback: explicitly set null to avoid any stock or random image!
            m["rawPosterPath"] = None
            m["posterPath"] = None
            m["rawBackdropPath"] = None
            m["backdropPath"] = None
            fallback_count += 1

    save_json(MOVIES_JSON, movies)
    df = pd.DataFrame(movies)
    df.to_csv(MOVIES_CSV, index=False)

    print("=" * 60)
    print("🎬 TMDB Catalog Enrichment Complete!")
    print(f"Total Movies: {len(movies)}")
    print(f"Movies with Official TMDB Posters: {with_tmdb_poster} ({with_tmdb_poster/len(movies)*100:.1f}%)")
    print(f"Movies with Clean Fallbacks: {fallback_count}")
    print("=" * 60)

if __name__ == "__main__":
    main()
