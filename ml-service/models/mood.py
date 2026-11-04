import re
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import linear_kernel
from .content_based import ContentBasedRecommender

MOOD_MAP = {
    "happy": {
        "label": "Happy",
        "genres": ["Comedy", "Adventure", "Animation", "Musical", "Family"],
        "keywords": ["fun", "hilarious", "laugh", "feel-good", "friendship", "upbeat", "uplifting"],
        "description": "Joyful, lighthearted, and feel-good stories to boost your spirits."
    },
    "sad": {
        "label": "Sad",
        "genres": ["Drama", "Romance"],
        "keywords": ["heartbreaking", "emotional", "tearjerker", "loss", "grief", "melancholy", "touching"],
        "description": "Deeply emotional, bittersweet, and poignant tales that move the soul."
    },
    "romantic": {
        "label": "Romantic",
        "genres": ["Romance", "Comedy", "Drama"],
        "keywords": ["love", "passion", "relationship", "dating", "destiny", "crush", "sweet"],
        "description": "Heartwarming love stories, chemistry, and captivating relationships."
    },
    "excited": {
        "label": "Excited",
        "genres": ["Action", "Adventure", "Thriller", "Sci-Fi", "Action & Adventure"],
        "keywords": ["adrenaline", "explosion", "fast", "epic", "chase", "hero", "superhero"],
        "description": "High-octane spectacles, thrilling sequences, and adrenaline-pumping stakes."
    },
    "scared": {
        "label": "Scared",
        "genres": ["Horror", "Thriller", "Mystery"],
        "keywords": ["dark", "creepy", "monster", "ghost", "paranormal", "killer", "suspense", "spooky"],
        "description": "Spine-chilling scares, eerie mysteries, and psychological dread."
    },
    "relaxed": {
        "label": "Relaxed",
        "genres": ["Children", "Animation", "Comedy", "Fantasy", "Family"],
        "keywords": ["cozy", "comfort", "calm", "gentle", "peaceful", "whimsical", "warm"],
        "description": "Comfort viewing, cozy animation, and easygoing storytelling."
    },
    "motivated": {
        "label": "Motivated",
        "genres": ["Drama", "Documentary", "Action"],
        "keywords": ["inspiration", "underdog", "triumph", "courage", "determination", "success", "heroic"],
        "description": "Inspiring journeys of grit, resilience, triumph, and personal growth."
    },
    "curious": {
        "label": "Curious",
        "genres": ["Mystery", "Sci-Fi", "Sci-Fi & Fantasy", "Documentary", "Crime"],
        "keywords": ["mind-bending", "intriguing", "investigation", "puzzle", "secrets", "discovery", "philosophy", "intellectual"],
        "description": "Mind-bending mysteries, thought-provoking explorations, and enigmatic discoveries."
    }
}

class MoodRecommender:
    def __init__(self, content_model: ContentBasedRecommender, movies_df: pd.DataFrame):
        self.content_model = content_model
        self.movies_df = movies_df.copy().set_index('movieId')

    def recommend(self, mood: str = None, prompt: str = None, top_k: int = 12, exclude_ids: list = None, media_type: str = 'all') -> list:
        exclude_set = set(exclude_ids or [])
        mood_clean = (mood or "").lower().strip()
        mood_meta = MOOD_MAP.get(mood_clean)

        query_terms = []
        explanation_prefix = ""

        if mood_meta:
            query_terms.extend(mood_meta["genres"] * 3)
            query_terms.extend(mood_meta["keywords"] * 2)
            explanation_prefix = f"Perfect for your '{mood_meta['label']}' mood"

        if prompt and prompt.strip():
            # Clean prompt
            clean_prompt = re.sub(r'[^a-zA-Z0-9\s]', ' ', prompt.lower())
            query_terms.append(clean_prompt)
            if not explanation_prefix:
                explanation_prefix = f"Curated for '{prompt.strip()[:30]}...'"
            else:
                explanation_prefix += f" & your request: '{prompt.strip()[:25]}...'"

        if not query_terms:
            # Fallback
            query_terms = ["drama", "comedy", "acclaimed", "award", "popular"]
            explanation_prefix = "Recommended popular selection"

        query_string = " ".join(query_terms)
        query_vector = self.content_model.tfidf.transform([query_string])
        cosine_sim = linear_kernel(query_vector, self.content_model.tfidf_matrix).flatten()

        # Score and rank candidates with quality & poster filtering
        candidate_indices = np.argsort(cosine_sim)[::-1][:300]
        scored_candidates = []

        for idx in candidate_indices:
            row = self.content_model.unified_df.iloc[idx]
            if media_type != 'all' and row['mediaType'] != media_type:
                continue

            raw_id = row['rawId']
            if raw_id in exclude_set:
                continue

            poster_path = row['posterPath']
            # Strictly require valid poster
            if not poster_path or str(poster_path).strip() == "" or str(poster_path) == "None":
                continue

            sim_score = float(cosine_sim[idx])
            if sim_score < 0.03:
                continue

            vc = float(row['voteCount']) if pd.notna(row['voteCount']) else 0.0
            va = float(row['voteAverage']) if pd.notna(row['voteAverage']) else 5.0
            
            # Filter out completely unvetted 1-vote obscure artifacts when better candidates exist
            if vc < 2 and sim_score < 0.3:
                continue

            # Popularity & Rating Credibility
            vc_norm = min(np.log1p(vc) / np.log1p(250.0), 1.0)
            va_norm = max(min(va / 10.0, 1.0), 0.0)
            credibility = 0.5 * vc_norm + 0.5 * va_norm

            genres = row['genres'] if isinstance(row['genres'], list) else str(row['genres']).split()
            matched_genres = [g for g in genres if mood_meta and g in mood_meta["genres"]]
            genre_bonus = 0.12 if matched_genres else 0.0

            # Composite ranking score: semantic relevance + popularity + genre affinity
            final_score = (sim_score * 0.55) + (credibility * 0.35) + genre_bonus

            genre_hint = f" ({', '.join(matched_genres[:2])})" if matched_genres else ""

            scored_candidates.append({
                "final_score": final_score,
                "data": {
                    "id": str(row['contentId']),
                    "contentId": str(row['contentId']),
                    "movieId": int(raw_id) if row['mediaType'] == 'movie' and pd.notna(raw_id) else None,
                    "tmdbId": int(row['tmdbId']) if pd.notna(row['tmdbId']) else 0,
                    "mediaType": str(row['mediaType']),
                    "title": str(row['title']),
                    "releaseYear": int(row['releaseYear']) if pd.notna(row['releaseYear']) else 2020,
                    "genres": list(genres),
                    "voteAverage": float(va),
                    "voteCount": int(vc),
                    "overview": str(row['overview']) if pd.notna(row['overview']) else "",
                    "posterPath": str(poster_path),
                    "backdropPath": str(row['backdropPath']) if pd.notna(row['backdropPath']) and row['backdropPath'] else None,
                    "moodScore": round(float(final_score), 4),
                    "score": round(float(final_score), 4),
                    "explanation": f"{explanation_prefix}{genre_hint}"
                }
            })

        # Sort by composite score descending
        scored_candidates.sort(key=lambda x: x["final_score"], reverse=True)
        results = [c["data"] for c in scored_candidates[:top_k]]
        return results
