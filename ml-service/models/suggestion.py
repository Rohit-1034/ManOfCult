import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import linear_kernel

class SuggestionModel:
    def __init__(self, content_model, collab_model, movies_df: pd.DataFrame):
        self.content_model = content_model
        self.collab_model = collab_model
        self.movies_df = movies_df.copy().set_index('movieId')
        self.movies_list = movies_df.to_dict(orient='records')
        print(f"SuggestionModel initialized with {len(self.movies_list)} movies.")

    def get_typeahead_suggestions(self, query: str, limit: int = 6) -> list:
        """
        Instant smart typeahead suggestions as user types:
        Matches title prefix, exact phrase, and content features.
        """
        if not query or not query.strip():
            # Return trending recent movies
            recent_modern = [m for m in self.movies_list if m.get('releaseYear', 0) >= 2022]
            recent_modern.sort(key=lambda x: (x.get('voteAverage', 0) * x.get('voteCount', 0)), reverse=True)
            return recent_modern[:limit]

        q = query.strip().lower()
        title_exact = []
        title_prefix = []
        title_contains = []
        theme_matches = []

        for m in self.movies_list:
            t = str(m.get('title', '')).lower()
            kw = str(m.get('keywords', '') if pd.notna(m.get('keywords')) else '').lower()
            genres = m.get('genres', []) if isinstance(m.get('genres'), list) else str(m.get('genres', '')).split()
            if t == q:
                title_exact.append(m)
            elif t.startswith(q):
                title_prefix.append(m)
            elif q in t:
                title_contains.append(m)
            elif q in kw or any(q in str(g).lower() for g in genres):
                theme_matches.append(m)

        # Sort each tier by popularity
        key_fn = lambda x: (x.get('voteAverage', 0) * x.get('voteCount', 0))
        title_prefix.sort(key=key_fn, reverse=True)
        title_contains.sort(key=key_fn, reverse=True)
        theme_matches.sort(key=key_fn, reverse=True)

        merged = title_exact + title_prefix + title_contains + theme_matches
        
        # Deduplicate
        seen = set()
        results = []
        for item in merged:
            mid = item['movieId']
            if mid not in seen:
                seen.add(mid)
                results.append({
                    "movieId": mid,
                    "title": item['title'],
                    "releaseYear": int(item.get('releaseYear', 2000)),
                    "genres": item.get('genres', []),
                    "voteAverage": float(item.get('voteAverage', 0.0)),
                    "posterPath": item.get('posterPath', ''),
                    "overview": item.get('overview', '')
                })
            if len(results) >= limit:
                break

        return results

    def get_contextual_next_suggestions(self, recent_movie_ids: list, user_ratings: list = None, limit: int = 5) -> list:
        """
        Given the movies user recently viewed, rated, or added to watchlist,
        suggests the top 'Up Next' serendipitous recommendations.
        """
        if not recent_movie_ids:
            # Fallback to recent modern hits (2023-2026)
            modern_hits = [m for m in self.movies_list if m.get('releaseYear', 0) >= 2023]
            modern_hits.sort(key=lambda x: x.get('voteAverage', 0), reverse=True)
            return modern_hits[:limit]

        # Use the most recent 3 items as seed context
        seed_ids = [int(mid) for mid in recent_movie_ids[-3:]]
        exclude_set = set([int(mid) for mid in recent_movie_ids])

        # Aggregate similarity from content model
        candidate_scores = {}
        for sid in seed_ids:
            sims = self.content_model.get_similar_movies(sid, top_k=15, exclude_ids=list(exclude_set))
            for sim in sims:
                mid = sim['movieId']
                if mid in exclude_set:
                    continue
                score = sim['score']
                candidate_scores[mid] = candidate_scores.get(mid, 0.0) + score

        # Rank candidates
        sorted_candidates = sorted(candidate_scores.items(), key=lambda x: x[1], reverse=True)
        results = []
        for mid, agg_score in sorted_candidates:
            if mid in self.movies_df.index:
                row = self.movies_df.loc[mid]
                results.append({
                    "movieId": int(mid),
                    "title": row['title'],
                    "releaseYear": int(row['releaseYear']),
                    "genres": row['genres'] if isinstance(row['genres'], list) else str(row['genres']).split(),
                    "voteAverage": float(row['voteAverage']),
                    "voteCount": int(row['voteCount']),
                    "overview": row['overview'],
                    "posterPath": row['posterPath'],
                    "suggestionScore": round(float(agg_score), 4),
                    "explanation": f"Suggested next based on your recent activity with '{self.movies_df.loc[seed_ids[-1]]['title']}'."
                })
            if len(results) >= limit:
                break

        return results

    def get_curated_decks(self) -> dict:
        """Returns thematic curated decks including modern 2019-2026 cinema."""
        modern_2020s = [m for m in self.movies_list if m.get('releaseYear', 0) >= 2020]
        modern_2020s.sort(key=lambda x: x.get('releaseYear', 0), reverse=True)

        sci_fi_hits = [m for m in self.movies_list if 'Sci-Fi' in m.get('genres', []) and m.get('voteAverage', 0) >= 4.0]
        sci_fi_hits.sort(key=lambda x: x.get('voteAverage', 0) * x.get('voteCount', 0), reverse=True)

        feel_good = [m for m in self.movies_list if any(g in ['Comedy', 'Animation'] for g in m.get('genres', [])) and m.get('voteAverage', 0) >= 4.2]
        feel_good.sort(key=lambda x: x.get('voteAverage', 0) * x.get('voteCount', 0), reverse=True)

        gripping_dramas = [m for m in self.movies_list if 'Drama' in m.get('genres', []) and m.get('voteAverage', 0) >= 4.3]
        gripping_dramas.sort(key=lambda x: x.get('voteCount', 0), reverse=True)

        return {
            "modernCinema": modern_2020s[:10],
            "mindBendingSciFi": sci_fi_hits[:10],
            "feelGoodJoy": feel_good[:10],
            "masterpieceDramas": gripping_dramas[:10]
        }
