import numpy as np
import pandas as pd
from .content_based import ContentBasedRecommender
from .collaborative import CollaborativeRecommender

class HybridRecommender:
    def __init__(self, content_model: ContentBasedRecommender, collab_model: CollaborativeRecommender, movies_df: pd.DataFrame, alpha: float = 0.4, beta: float = 0.6):
        self.content_model = content_model
        self.collab_model = collab_model
        self.movies_df = movies_df.copy().set_index('movieId')
        self.alpha = alpha
        self.beta = beta

    def recommend(self, favorite_genres: list = None, favorite_movie_ids: list = None, user_ratings: list = None, top_k: int = 12, exclude_ids: list = None, alpha: float = None, beta: float = None) -> list:
        a = alpha if alpha is not None else self.alpha
        b = beta if beta is not None else self.beta
        
        favorite_genres = favorite_genres or []
        favorite_movie_ids = favorite_movie_ids or []
        user_ratings = user_ratings or []
        exclude_set = set(exclude_ids or [])
        exclude_set.update(favorite_movie_ids)
        for r in user_ratings:
            exclude_set.add(int(r.get('movieId', 0)))

        # Cold-start check (PRD Section 7.3: users with insufficient rating history < 3)
        if len(user_ratings) < 3:
            print("Cold-start active: falling back to onboarding preferences & content filtering.")
            content_recs = self.content_model.recommend_for_profile(
                favorite_genres=favorite_genres,
                favorite_movie_ids=favorite_movie_ids,
                top_k=top_k,
                exclude_ids=list(exclude_set)
            )
            for r in content_recs:
                r['hybridScore'] = r['contentScore']
                r['collaborativeScore'] = 0.0
                r['modelType'] = 'Content-Based (Cold-Start)'
            return content_recs

        # Hybrid weighting
        content_scores = self.content_model.get_all_scores_for_profile(favorite_genres, favorite_movie_ids)
        collab_scores = self.collab_model.get_all_scores_for_ratings(user_ratings)

        combined = []
        for mid, movie_row in self.movies_df.iterrows():
            if mid in exclude_set:
                continue

            c_score = content_scores.get(mid, 0.3)
            cf_score = collab_scores.get(mid, 0.3)
            
            hybrid_score = (a * c_score) + (b * cf_score)
            
            # Grounded explanation
            reasons = []
            matched_genres = [g for g in (movie_row['genres'] if isinstance(movie_row['genres'], list) else str(movie_row['genres']).split()) if g in favorite_genres]
            if matched_genres:
                reasons.append(f"matches your {', '.join(matched_genres)} taste")
            if cf_score > 0.6:
                reasons.append("highly rated by viewers with similar tastes")
            elif c_score > 0.6:
                reasons.append("shares creative themes with your favorites")
            
            explanation = f"Recommended because it {' and '.join(reasons)}." if reasons else "Selected for your cinematic preferences."

            combined.append({
                "movieId": int(mid),
                "title": movie_row['title'],
                "releaseYear": int(movie_row['releaseYear']),
                "genres": movie_row['genres'] if isinstance(movie_row['genres'], list) else str(movie_row['genres']).split(),
                "voteAverage": float(movie_row['voteAverage']),
                "voteCount": int(movie_row['voteCount']),
                "overview": movie_row['overview'],
                "posterPath": movie_row['posterPath'],
                "contentScore": round(float(c_score), 4),
                "collaborativeScore": round(float(cf_score), 4),
                "hybridScore": round(float(hybrid_score), 4),
                "score": round(float(hybrid_score), 4),
                "modelType": f"Hybrid (α={a}, β={b})",
                "explanation": explanation
            })

        combined.sort(key=lambda x: x['hybridScore'], reverse=True)
        return combined[:top_k]
