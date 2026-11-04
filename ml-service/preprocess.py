import os
import re
import json
import pandas as pd
import numpy as np

RAW_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\dataset_raw\ml-latest-small"
OUTPUT_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Curated high quality poster backdrops and posters for famous MovieLens movies
CURATED_POSTERS = {
    1: {"poster": "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg", "overview": "Led by Woody, Andy's toys live happily in his room until Andy's birthday brings Buzz Lightyear onto the scene. Woody fears losing his place in Andy's heart, but circumstance soon turns rivals into friends on an unforgettable adventure."},
    2: {"poster": "https://image.tmdb.org/t/p/w500/vgpXsq5vxRIqpDTcVagZim9IPgu.jpg", "overview": "When siblings Judy and Peter discover an enchanted board game, they inadvertently release Alan Parrish, who has been trapped within its wild realm for decades."},
    3: {"poster": "https://image.tmdb.org/t/p/w500/1FSAnEvrd5DYqY8GQ9oq9wio3qu.jpg", "overview": "A family feud brews in a small town between two grumpy retirees whose lifelong competition intensifies when a captivating new neighbor arrives."},
    6: {"poster": "https://image.tmdb.org/t/p/w500/rrBuGu0Pjq7Y2JWxGqaZyo44nQW.jpg", "overview": "A master criminal and a dedicated detective play an intense game of cat and mouse through the streets of Los Angeles, realizing how much they mirror one another."},
    10: {"poster": "https://image.tmdb.org/t/p/w500/5c0ovjT41KnYI6crW9IfZOnkZzL.jpg", "overview": "James Bond must stop a renegade former 00-agent from using a satellite-based electromagnetic weapon to devastate the world financial economy."},
    47: {"poster": "https://image.tmdb.org/t/p/w500/69Sns8WoET6CfaYlIkHbla4l7nC.jpg", "overview": "Two homicide detectives, a rookie and a veteran near retirement, hunt for a serial killer who stages grisly crimes based on the seven deadly sins."},
    50: {"poster": "https://image.tmdb.org/t/p/w500/bUPHpAinqv29G487mnVe79Um4Z1.jpg", "overview": "Following a deadly boat fire at a Los Angeles harbor, sole survivor Verbal Kint spins an elaborate tale of five career criminals brought together by the mythic Keyser Söze."},
    110: {"poster": "https://image.tmdb.org/t/p/w500/or1gBugydmjToAEqDpHTj7X0vRl.jpg", "overview": "Sir William Wallace leads a passionate rebellion against the English monarch who has seized the Scottish crown and oppressed its people."},
    260: {"poster": "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", "overview": "Princess Leia is held hostage by the sinister imperial forces. Young Luke Skywalker and Han Solo join an eccentric Jedi knight in a desperate galactic rescue mission."},
    296: {"poster": "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", "overview": "A burger-loving hit man, his philosophical partner, a boxer, and two diner bandits intertwine in four tales of violence, dark humor, and redemption."},
    318: {"poster": "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg", "overview": "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at Shawshank prison where his quiet tenacity shines."},
    356: {"poster": "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", "overview": "The heartwarming tale of Forrest Gump, a gentle soul with an IQ of 75, who witnesses and unwittingly influences key historic events of the late 20th century."},
    527: {"poster": "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg", "overview": "German industrialist Oskar Schindler arrives in Krakow looking to make money, but soon uses his factory to shelter over a thousand Jewish refugees during WWII."},
    589: {"poster": "https://image.tmdb.org/t/p/w500/5M0j0B18abtBI5PswMYgfd7hg09.jpg", "overview": "A cyborg, identical to the one that failed to kill Sarah Connor, is dispatched to protect her teenage son John from an even deadlier shape-shifting Terminator."},
    593: {"poster": "https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg", "overview": "A young FBI cadet confides in imprisoned cannibalistic psychologist Dr. Hannibal Lecter to gain insight into capturing another elusive serial killer."},
    858: {"poster": "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", "overview": "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son in post-war New York."},
    1196: {"poster": "https://image.tmdb.org/t/p/w500/nNAeTmF4FFbNxSJWPUmmox9If86.jpg", "overview": "After the Galactic Empire discovers the hidden rebel base, Darth Vader pursues Luke Skywalker and friends across cloud cities and asteroidal belts."},
    1198: {"poster": "https://image.tmdb.org/t/p/w500/ceG9VzoRAVGwivFU407W8pnHgum.jpg", "overview": "Archaeology professor Indiana Jones is recruited by the US Army to find the legendary Ark of the Covenant before Nazi forces can harness its power."},
    1210: {"poster": "https://image.tmdb.org/t/p/w500/mDCBQNJUZvA009Cgq4V3Zz371tW.jpg", "overview": "Luke Skywalker leads an alliance assault to dismantle the second Death Star while facing Darth Vader and the Emperor in an ultimate moral confrontation."},
    2571: {"poster": "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", "overview": "A computer hacker learns from mysterious rebels about the true simulated nature of his reality and his destined role in the war against machine controllers."},
    2959: {"poster": "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", "overview": "An insomniac office worker looking for a way to change his life crosses paths with a charismatic soap maker and forms an underground fight club that spirals out of control."},
    4993: {"poster": "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg", "overview": "Young hobbit Frodo Baggins inherits the One Ring and embarks with a heroic fellowship on an epic quest to destroy it in the fires of Mount Doom."},
    5952: {"poster": "https://image.tmdb.org/t/p/w500/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg", "overview": "Frodo and Sam continue their trek to Mordor guided by the treacherous Gollum, while Aragorn, Legolas, and Gimli unite Rohan against Saruman's armies."},
    7153: {"poster": "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg", "overview": "The final battle for Middle-earth begins as Frodo reaches Mount Doom, while Aragorn leads the armies of men in a heroic stand at the Black Gate."},
    58559: {"poster": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", "overview": "Batman raises the stakes in his war on crime with the help of Lieutenant Jim Gordon and DA Harvey Dent, until the anarchic Joker plunges Gotham City into chaos."},
    79132: {"poster": "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", "overview": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO."},
}

# Stylized genre fallback posters
GENRE_POSTERS = {
    "Action": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80",
    "Adventure": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80",
    "Animation": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80",
    "Children": "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&q=80",
    "Comedy": "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=500&q=80",
    "Crime": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80",
    "Documentary": "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&q=80",
    "Drama": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80",
    "Fantasy": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80",
    "Film-Noir": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80",
    "Horror": "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&q=80",
    "Musical": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
    "Mystery": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80",
    "Romance": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&q=80",
    "Sci-Fi": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80",
    "Thriller": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80",
    "War": "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=500&q=80",
    "Western": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80",
}
DEFAULT_POSTER = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80"

def extract_year_and_clean_title(raw_title):
    raw_title = raw_title.strip()
    match = re.search(r'\((\d{4})\)$', raw_title)
    if match:
        year = int(match.group(1))
        title = raw_title[:match.start()].strip()
    else:
        # Check if year is in another parenthetical format or missing
        match2 = re.search(r'\((\d{4})\)', raw_title)
        if match2:
            year = int(match2.group(1))
            title = re.sub(r'\(\d{4}\)', '', raw_title).strip()
        else:
            year = None
            title = raw_title
    
    # Clean common MovieLens suffix formatting like "Godfather, The" -> "The Godfather"
    for article in [", The", ", A", ", An", ", Il", ", Le", ", La", ", Der", ", Das"]:
        if title.endswith(article):
            prefix = article.replace(", ", "")
            title = f"{prefix} {title[:-len(article)]}".strip()
            break
            
    return title, year

def generate_overview(title, genres, year, tags_str):
    genres_formatted = ", ".join(genres) if genres else "General"
    year_str = f" ({year})" if year else ""
    if tags_str:
        return f"A compelling {genres_formatted.lower()} film{year_str}. Themes include {tags_str}. Experience the story of '{title}' as high-stakes drama and memorable characters unfold."
    return f"A classic {genres_formatted.lower()} cinematic experience{year_str}. Follow the captivating journey and dramatic events in '{title}'."

def main():
    print("Loading raw MovieLens files...")
    movies_df = pd.read_csv(os.path.join(RAW_DIR, "movies.csv"))
    ratings_df = pd.read_csv(os.path.join(RAW_DIR, "ratings.csv"))
    tags_df = pd.read_csv(os.path.join(RAW_DIR, "tags.csv"))
    links_df = pd.read_csv(os.path.join(RAW_DIR, "links.csv"))
    
    print(f"Loaded {len(movies_df)} movies, {len(ratings_df)} ratings, {len(tags_df)} tags.")

    # 1. Clean tags: aggregate per movie
    tags_df["tag"] = tags_df["tag"].astype(str).str.lower().str.strip()
    movie_tags = tags_df.groupby("movieId")["tag"].apply(lambda tags: " ".join(list(dict.fromkeys(tags))[:8])).reset_index()
    movie_tags.rename(columns={"tag": "keywords"}, inplace=True)

    # 2. Compute rating statistics per movie
    stats = ratings_df.groupby("movieId").agg(
        voteAverage=("rating", "mean"),
        voteCount=("rating", "count")
    ).reset_index()
    stats["voteAverage"] = stats["voteAverage"].round(1)

    # 3. Merge data
    merged = movies_df.merge(stats, on="movieId", how="left")
    merged = merged.merge(movie_tags, on="movieId", how="left")
    merged = merged.merge(links_df, on="movieId", how="left")

    merged["voteAverage"] = merged["voteAverage"].fillna(0.0)
    merged["voteCount"] = merged["voteCount"].fillna(0).astype(int)
    merged["keywords"] = merged["keywords"].fillna("")

    # 4. Extract year, clean titles, extract genres list
    records = []
    for _, row in merged.iterrows():
        mid = int(row["movieId"])
        raw_title = str(row["title"])
        clean_title, year = extract_year_and_clean_title(raw_title)
        
        raw_genres = str(row["genres"])
        if raw_genres == "(no genres listed)" or pd.isna(raw_genres):
            genre_list = ["Drama"]
        else:
            genre_list = [g.strip() for g in raw_genres.split("|") if g.strip()]

        primary_genre = genre_list[0] if genre_list else "Drama"
        tags_str = str(row["keywords"])

        # Determine poster and overview
        if mid in CURATED_POSTERS:
            poster_url = CURATED_POSTERS[mid]["poster"]
            overview = CURATED_POSTERS[mid]["overview"]
        else:
            poster_url = GENRE_POSTERS.get(primary_genre, DEFAULT_POSTER)
            overview = generate_overview(clean_title, genre_list, year, tags_str)

        records.append({
            "movieId": mid,
            "title": clean_title,
            "originalTitle": raw_title,
            "genres": genre_list,
            "genreString": " ".join(genre_list),
            "releaseYear": year if year else 2000,
            "voteAverage": float(row["voteAverage"]),
            "voteCount": int(row["voteCount"]),
            "keywords": tags_str,
            "overview": overview,
            "posterPath": poster_url,
            "imdbId": str(row["imdbId"]) if pd.notna(row["imdbId"]) else "",
            "tmdbId": int(row["tmdbId"]) if pd.notna(row["tmdbId"]) else 0,
            # Search / NLP representation: title + genres + keywords + overview
            "contentFeatures": f"{clean_title} {' '.join(genre_list)} {tags_str} {overview}".strip()
        })

    processed_df = pd.DataFrame(records)
    
    # Save CSV and JSON
    csv_out = os.path.join(OUTPUT_DIR, "movies_processed.csv")
    json_out = os.path.join(OUTPUT_DIR, "movies_processed.json")
    ratings_out = os.path.join(OUTPUT_DIR, "ratings_processed.csv")

    processed_df.to_csv(csv_out, index=False)
    processed_df.to_json(json_out, orient="records", indent=2)
    ratings_df[["userId", "movieId", "rating", "timestamp"]].to_csv(ratings_out, index=False)

    print(f"Preprocessing completed successfully!")
    print(f"- Processed movies: {len(processed_df)} -> {csv_out}")
    print(f"- Processed ratings: {len(ratings_df)} -> {ratings_out}")
    print(f"- JSON Catalog: {json_out}")

if __name__ == "__main__":
    main()
