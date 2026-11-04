import os
import json
import urllib.request
import urllib.parse
import time
import pandas as pd

TMDB_API_KEY = "2dca580c2a14b55200e784d157207b4d"
DATA_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\data"
TV_JSON = os.path.join(DATA_DIR, "tv_shows_processed.json")
TV_CSV = os.path.join(DATA_DIR, "tv_shows_processed.csv")
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

TV_GENRES = {
    10759: "Action & Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    10762: "Kids",
    9648: "Mystery",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
    37: "Western"
}

def fetch_tmdb(endpoint, params=None):
    if params is None:
        params = {}
    params["api_key"] = TMDB_API_KEY
    params["language"] = "en-US"
    query_str = urllib.parse.urlencode(params)
    url = f"https://api.themoviedb.org/3{endpoint}?{query_str}"
    
    req = urllib.request.Request(url, headers={'User-Agent': 'CineMatchAI/2.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    print("=== Seeding Authentic TMDB TV Shows Catalog ===")
    all_shows = {}

    queries = [
        # 1. Popular TV Shows (Pages 1-5)
        ("/tv/popular", {"page": 1}),
        ("/tv/popular", {"page": 2}),
        ("/tv/popular", {"page": 3}),
        ("/tv/popular", {"page": 4}),
        ("/tv/popular", {"page": 5}),

        # 2. Top Rated TV Shows
        ("/tv/top_rated", {"page": 1}),
        ("/tv/top_rated", {"page": 2}),
        ("/tv/top_rated", {"page": 3}),

        # 3. Anime (Genre 16, Japanese)
        ("/discover/tv", {"with_genres": 16, "with_original_language": "ja", "sort_by": "vote_count.desc", "page": 1}),
        ("/discover/tv", {"with_genres": 16, "with_original_language": "ja", "sort_by": "vote_count.desc", "page": 2}),

        # 4. Korean Dramas (K-Dramas)
        ("/discover/tv", {"with_original_language": "ko", "sort_by": "vote_count.desc", "page": 1}),
        ("/discover/tv", {"with_original_language": "ko", "sort_by": "vote_count.desc", "page": 2}),

        # 5. Indian Web Series & TV
        ("/discover/tv", {"with_origin_country": "IN", "sort_by": "vote_count.desc", "page": 1}),
        ("/discover/tv", {"with_origin_country": "IN", "sort_by": "vote_count.desc", "page": 2}),

        # 6. Prestige Web Series (HBO, Netflix, Apple TV+, Amazon)
        ("/discover/tv", {"with_networks": "213|1024|2739|2552", "sort_by": "popularity.desc", "page": 1}),
        ("/discover/tv", {"with_networks": "213|1024|2739|2552", "sort_by": "vote_count.desc", "page": 1}),

        # 7. Documentaries (Genre 99)
        ("/discover/tv", {"with_genres": 99, "sort_by": "vote_count.desc", "page": 1}),

        # 8. Reality Shows (Genre 10764)
        ("/discover/tv", {"with_genres": 10764, "sort_by": "popularity.desc", "page": 1}),
    ]

    for endpoint, params in queries:
        data = fetch_tmdb(endpoint, params)
        if not data or "results" not in data:
            continue
        for item in data["results"]:
            tid = item.get("id")
            if not tid or tid in all_shows:
                continue

            name = item.get("name") or item.get("original_name")
            overview = item.get("overview") or f"An acclaimed television series: {name}."
            poster = item.get("poster_path")
            backdrop = item.get("backdrop_path")
            genre_ids = item.get("genre_ids", [])
            genres = [TV_GENRES.get(gid, "Drama") for gid in genre_ids]
            if not genres:
                genres = ["Drama"]

            first_air = item.get("first_air_date") or "2020-01-01"
            year = int(first_air[:4]) if len(first_air) >= 4 and first_air[:4].isdigit() else 2020
            vote_avg = float(item.get("vote_average", 7.0))
            vote_count = int(item.get("vote_count", 100))
            pop = float(item.get("popularity", 10.0))
            lang = item.get("original_language", "en")
            countries = item.get("origin_country", [])

            # Categorization tags
            tags = ["tv", "series"]
            if 16 in genre_ids and lang == "ja":
                tags.append("anime")
            if lang == "ko":
                tags.append("k-drama")
            if "IN" in countries or lang in ["hi", "te", "ta", "ml"]:
                tags.append("indian")
            if 99 in genre_ids:
                tags.append("documentary")
            if 10764 in genre_ids:
                tags.append("reality")

            content_features = f"{name} {' '.join(genres)} {' '.join(tags)} {overview}"

            all_shows[tid] = {
                "id": f"tv_{tid}",
                "tmdbId": tid,
                "mediaType": "tv",
                "title": name,
                "originalTitle": item.get("original_name") or name,
                "overview": overview,
                "posterPath": f"{TMDB_IMAGE_BASE}/w500{poster}" if poster else None,
                "rawPosterPath": poster,
                "backdropPath": f"{TMDB_IMAGE_BASE}/original{backdrop}" if backdrop else (f"{TMDB_IMAGE_BASE}/original{poster}" if poster else None),
                "rawBackdropPath": backdrop or poster,
                "genres": genres,
                "genreString": " ".join(genres),
                "firstAirDate": first_air,
                "releaseYear": year,
                "voteAverage": vote_avg,
                "voteCount": vote_count,
                "popularity": pop,
                "originalLanguage": lang,
                "originCountry": countries,
                "tags": tags,
                "contentFeatures": content_features
            }
        time.sleep(0.1)

    shows_list = list(all_shows.values())
    print(f"Collected {len(shows_list)} authentic TMDB TV shows across categories!")

    with open(TV_JSON, "w", encoding="utf-8") as f:
        json.dump(shows_list, f, indent=2)

    df = pd.DataFrame(shows_list)
    df.to_csv(TV_CSV, index=False)
    print("Saved TV shows to tv_shows_processed.json and .csv")

if __name__ == "__main__":
    main()
