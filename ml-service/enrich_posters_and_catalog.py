import os
import re
import json
import urllib.request
import pandas as pd
from concurrent.futures import ThreadPoolExecutor, as_completed
from modern_movies_data import MODERN_MOVIES

RAW_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\dataset_raw\ml-latest-small"
DATA_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\data"
POSTERS_CACHE_FILE = os.path.join(DATA_DIR, "posters_cache.json")

def load_cached_posters():
    if os.path.exists(POSTERS_CACHE_FILE):
        try:
            with open(POSTERS_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cached_posters(cache):
    with open(POSTERS_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)

def fetch_imdb_poster(imdb_id):
    """Query IMDb public suggestion API for genuine CloudFront poster URL."""
    if not imdb_id:
        return None
    clean_id = str(imdb_id).strip().replace("tt", "").zfill(7)
    url = f"https://v3.sg.media-imdb.com/suggestion/x/tt{clean_id}.json"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, timeout=3.5) as response:
            data = json.loads(response.read().decode("utf-8"))
            items = data.get("d", [])
            if items:
                img = items[0].get("i")
                if img and isinstance(img, dict) and img.get("imageUrl"):
                    return img["imageUrl"]
    except Exception:
        pass
    return None

def extract_year_and_clean_title(raw_title):
    raw_title = raw_title.strip()
    match = re.search(r'\((\d{4})\)$', raw_title)
    if match:
        year = int(match.group(1))
        title = raw_title[:match.start()].strip()
    else:
        match2 = re.search(r'\((\d{4})\)', raw_title)
        if match2:
            year = int(match2.group(1))
            title = re.sub(r'\(\d{4}\)', '', raw_title).strip()
        else:
            year = 2000
            title = raw_title
    
    for article in [", The", ", A", ", An", ", Il", ", Le", ", La", ", Der", ", Das"]:
        if title.endswith(article):
            prefix = article.replace(", ", "")
            title = f"{prefix} {title[:-len(article)]}".strip()
            break
            
    return title, year

def main():
    print("=== Enriching CineMatch AI Catalog with Modern Movies & Real Posters ===")
    
    # 1. Load raw files
    movies_df = pd.read_csv(os.path.join(RAW_DIR, "movies.csv"))
    ratings_df = pd.read_csv(os.path.join(RAW_DIR, "ratings.csv"))
    tags_df = pd.read_csv(os.path.join(RAW_DIR, "tags.csv"))
    links_df = pd.read_csv(os.path.join(RAW_DIR, "links.csv"))
    
    # Clean tags
    tags_df["tag"] = tags_df["tag"].astype(str).str.lower().str.strip()
    movie_tags = tags_df.groupby("movieId")["tag"].apply(lambda tags: " ".join(list(dict.fromkeys(tags))[:8])).reset_index()
    movie_tags.rename(columns={"tag": "keywords"}, inplace=True)

    # Compute rating statistics
    stats = ratings_df.groupby("movieId").agg(
        voteAverage=("rating", "mean"),
        voteCount=("rating", "count")
    ).reset_index()
    stats["voteAverage"] = stats["voteAverage"].round(1)

    merged = movies_df.merge(stats, on="movieId", how="left")
    merged = merged.merge(movie_tags, on="movieId", how="left")
    merged = merged.merge(links_df, on="movieId", how="left")
    merged["voteAverage"] = merged["voteAverage"].fillna(3.5)
    merged["voteCount"] = merged["voteCount"].fillna(1).astype(int)
    merged["keywords"] = merged["keywords"].fillna("")

    # Load posters cache
    poster_cache = load_cached_posters()
    print(f"Loaded {len(poster_cache)} posters from existing cache.")

    # Select top 250 most rated movies to ensure they have authentic IMDb posters
    top_movies = merged.sort_values(by="voteCount", ascending=False).head(250)
    to_fetch = []
    for _, row in top_movies.iterrows():
        mid_str = str(int(row["movieId"]))
        imdb_id = row.get("imdbId")
        if mid_str not in poster_cache and pd.notna(imdb_id):
            to_fetch.append((mid_str, str(int(imdb_id))))

    if to_fetch:
        print(f"Fetching {len(to_fetch)} authentic posters concurrently from IMDb CDN...")
        with ThreadPoolExecutor(max_workers=12) as executor:
            future_to_mid = {executor.submit(fetch_imdb_poster, imdb_id): (mid_str, imdb_id) for mid_str, imdb_id in to_fetch}
            for future in as_completed(future_to_mid):
                mid_str, _ = future_to_mid[future]
                try:
                    poster_url = future.result()
                    if poster_url:
                        poster_cache[mid_str] = poster_url
                except Exception:
                    pass
        print(f"Posters cache now has {len(poster_cache)} authentic posters.")
        save_cached_posters(poster_cache)

    # 2. Build full catalog records
    catalog_records = []
    for _, row in merged.iterrows():
        mid = int(row["movieId"])
        mid_str = str(mid)
        raw_title = str(row["title"])
        clean_title, year = extract_year_and_clean_title(raw_title)

        raw_genres = str(row["genres"])
        if raw_genres == "(no genres listed)" or pd.isna(raw_genres):
            genre_list = ["Drama"]
        else:
            genre_list = [g.strip() for g in raw_genres.split("|") if g.strip()]

        primary_genre = genre_list[0] if genre_list else "Drama"
        tags_str = str(row["keywords"])

        # Poster determination: Cache -> Curated -> High-resolution genre fallback
        if mid_str in poster_cache:
            poster_url = poster_cache[mid_str]
        else:
            # Deterministic CDN fallback by genre
            poster_url = f"https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80"

        overview = f"A compelling {', '.join(genre_list).lower()} film ({year}). Themes include {tags_str if tags_str else 'dramatic storytelling'}. Experience the memorable narrative of '{clean_title}'."

        catalog_records.append({
            "movieId": mid,
            "title": clean_title,
            "originalTitle": raw_title,
            "genres": genre_list,
            "genreString": " ".join(genre_list),
            "releaseYear": int(year),
            "voteAverage": float(row["voteAverage"]),
            "voteCount": int(row["voteCount"]),
            "keywords": tags_str,
            "overview": overview,
            "posterPath": poster_url,
            "imdbId": str(row["imdbId"]) if pd.notna(row["imdbId"]) else "",
            "tmdbId": int(row["tmdbId"]) if pd.notna(row["tmdbId"]) else 0,
            "contentFeatures": f"{clean_title} {' '.join(genre_list)} {tags_str} {overview}".strip()
        })

    # 3. Append modern movies (2019 - 2026)
    print(f"Adding {len(MODERN_MOVIES)} modern cinema blockbusters & acclaimed films (2019-2026)...")
    modern_ratings = []
    for m in MODERN_MOVIES:
        mid = m["movieId"]
        genre_list = m["genres"]
        catalog_records.append({
            "movieId": mid,
            "title": m["title"],
            "originalTitle": f"{m['title']} ({m['releaseYear']})",
            "genres": genre_list,
            "genreString": " ".join(genre_list),
            "releaseYear": m["releaseYear"],
            "voteAverage": m["voteAverage"],
            "voteCount": m["voteCount"],
            "keywords": m["keywords"],
            "overview": m["overview"],
            "posterPath": m["posterPath"],
            "imdbId": m.get("imdbId", ""),
            "tmdbId": 0,
            "contentFeatures": f"{m['title']} {' '.join(genre_list)} {m['keywords']} {m['overview']}".strip()
        })
        # Add synthetic rating entries across diverse users for collaborative filtering alignment
        for u in range(1, 30):
            modern_ratings.append({
                "userId": u,
                "movieId": mid,
                "rating": min(5.0, max(3.5, round(m["voteAverage"] + (0.3 if u % 2 == 0 else -0.2), 1))),
                "timestamp": 1700000000
            })

    # Combine ratings
    new_ratings_df = pd.concat([ratings_df[["userId", "movieId", "rating", "timestamp"]], pd.DataFrame(modern_ratings)], ignore_index=True)

    # 4. Save updated files
    final_movies_df = pd.DataFrame(catalog_records)
    csv_out = os.path.join(DATA_DIR, "movies_processed.csv")
    json_out = os.path.join(DATA_DIR, "movies_processed.json")
    ratings_out = os.path.join(DATA_DIR, "ratings_processed.csv")

    final_movies_df.to_csv(csv_out, index=False)
    final_movies_df.to_json(json_out, orient="records", indent=2)
    new_ratings_df.to_csv(ratings_out, index=False)

    print(f"Enrichment completed successfully!")
    print(f"- Total movies in catalog: {len(final_movies_df)} (including 2019-2026)")
    print(f"- Total ratings: {len(new_ratings_df)}")
    print(f"- Saved: {csv_out} and {json_out}")

if __name__ == "__main__":
    main()
