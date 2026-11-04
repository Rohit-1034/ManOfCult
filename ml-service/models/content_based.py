import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

class ContentBasedRecommender:
    def __init__(self, movies_df: pd.DataFrame, tv_df: pd.DataFrame = None):
        self.movies_df = movies_df.copy().reset_index(drop=True)
        self.movie_id_to_idx = {int(mid): idx for idx, mid in enumerate(self.movies_df['movieId'])}
        self.idx_to_movie_id = {idx: int(mid) for idx, mid in enumerate(self.movies_df['movieId'])}
        
        # Prepare combined unified catalog
        unified_rows = []
        for idx, row in self.movies_df.iterrows():
            unified_rows.append({
                "contentId": f"movie_{row['movieId']}",
                "rawId": int(row['movieId']),
                "tmdbId": int(row.get('tmdbId') or row['movieId']),
                "mediaType": "movie",
                "title": str(row['title']),
                "releaseYear": int(row['releaseYear']) if pd.notna(row['releaseYear']) else 2000,
                "genres": row['genres'] if isinstance(row['genres'], list) else str(row.get('genreString', '')).split(),
                "voteAverage": float(row['voteAverage']) if pd.notna(row['voteAverage']) else 7.0,
                "voteCount": int(row['voteCount']) if pd.notna(row['voteCount']) else 100,
                "overview": str(row.get('overview', '')),
                "posterPath": row.get('posterPath'),
                "backdropPath": row.get('backdropPath'),
                "contentFeatures": str(row.get('contentFeatures', ''))
            })

        self.tv_df = None
        if tv_df is not None and not tv_df.empty:
            self.tv_df = tv_df.copy().reset_index(drop=True)
            for idx, row in self.tv_df.iterrows():
                tid = int(row['tmdbId'])
                g_list = row['genres'] if isinstance(row['genres'], list) else str(row.get('genreString', '')).split()
                unified_rows.append({
                    "contentId": f"tv_{tid}",
                    "rawId": tid,
                    "tmdbId": tid,
                    "mediaType": "tv",
                    "title": str(row['title']),
                    "releaseYear": int(row['releaseYear']) if pd.notna(row.get('releaseYear')) else 2020,
                    "genres": g_list,
                    "voteAverage": float(row['voteAverage']) if pd.notna(row.get('voteAverage')) else 7.5,
                    "voteCount": int(row['voteCount']) if pd.notna(row.get('voteCount')) else 200,
                    "overview": str(row.get('overview', '')),
                    "posterPath": row.get('posterPath'),
                    "backdropPath": row.get('backdropPath'),
                    "contentFeatures": str(row.get('contentFeatures', ''))
                })

        self.unified_df = pd.DataFrame(unified_rows)
        self.cid_to_uidx = {row["contentId"]: idx for idx, row in self.unified_df.iterrows()}
        self.uidx_to_cid = {idx: row["contentId"] for idx, row in self.unified_df.iterrows()}

        # Build TF-IDF matrix
        self.tfidf = TfidfVectorizer(
            stop_words='english',
            max_features=12000,
            ngram_range=(1, 2)
        )
        features = self.unified_df['contentFeatures'].fillna('')
        self.tfidf_matrix = self.tfidf.fit_transform(features)

        # Legacy movie-only submatrix indices for backwards compatibility
        self.movie_uidx_map = {int(m['rawId']): idx for idx, m in self.unified_df.iterrows() if m['mediaType'] == 'movie'}

        print(f"ContentBasedRecommender initialized with {self.tfidf_matrix.shape[0]} unified items ({len(self.movies_df)} movies, {len(self.tv_df) if self.tv_df is not None else 0} TV shows).")

    def get_similar_movies(self, movie_id: int, top_k: int = 10, exclude_ids: list = None):
        """Standard movie-to-movie recommendation (backward compatible)."""
        if movie_id not in self.movie_uidx_map:
            return []
        
        target_uidx = self.movie_uidx_map[movie_id]
        target_vector = self.tfidf_matrix[target_uidx]
        cosine_sim = linear_kernel(target_vector, self.tfidf_matrix).flatten()
        
        exclude_set = set(exclude_ids or [])
        exclude_set.add(movie_id)
        
        ranked_indices = np.argsort(cosine_sim)[::-1]
        source_item = self.unified_df.iloc[target_uidx]
        
        results = []
        for idx in ranked_indices:
            row = self.unified_df.iloc[idx]
            if row['mediaType'] != 'movie':
                continue
            mid = int(row['rawId'])
            if mid in exclude_set:
                continue
            
            score = float(cosine_sim[idx])
            common_genres = list(set(source_item['genres']).intersection(set(row['genres'])))
            reason = f"Similar to '{source_item['title']}' sharing {', '.join(common_genres) if common_genres else 'cinematic themes'}"
            
            results.append({
                "movieId": mid,
                "tmdbId": int(row['tmdbId']) if pd.notna(row['tmdbId']) else 0,
                "mediaType": "movie",
                "title": str(row['title']),
                "releaseYear": int(row['releaseYear']) if pd.notna(row['releaseYear']) else 2020,
                "genres": list(row['genres']) if isinstance(row['genres'], list) else str(row['genres']).split(),
                "voteAverage": float(row['voteAverage']) if pd.notna(row['voteAverage']) else 7.0,
                "voteCount": int(row['voteCount']) if pd.notna(row['voteCount']) else 100,
                "overview": str(row['overview']) if pd.notna(row['overview']) else "",
                "posterPath": str(row['posterPath']) if pd.notna(row['posterPath']) and row['posterPath'] else None,
                "backdropPath": str(row['backdropPath']) if pd.notna(row['backdropPath']) and row['backdropPath'] else None,
                "contentScore": round(score, 4),
                "score": round(score, 4),
                "explanation": reason
            })
            
            if len(results) >= top_k:
                break
                
        return results

    def get_cross_recommendations(self, content_id, source_type: str = 'movie', target_type: str = 'tv', top_k: int = 10, exclude_ids: list = None):
        """
        Cross-content recommendation engine:
        Given a Movie, recommends matching TV shows / web series, and vice-versa.
        """
        cid = f"{source_type}_{content_id}" if not str(content_id).startswith(('movie_', 'tv_')) else str(content_id)
        if cid not in self.cid_to_uidx:
            # Try raw id
            try:
                num_id = int(str(content_id).replace('movie_', '').replace('tv_', ''))
                cid = f"{source_type}_{num_id}"
            except:
                return []
                
        if cid not in self.cid_to_uidx:
            return []

        target_uidx = self.cid_to_uidx[cid]
        source_item = self.unified_df.iloc[target_uidx]
        target_vector = self.tfidf_matrix[target_uidx]
        cosine_sim = linear_kernel(target_vector, self.tfidf_matrix).flatten()

        exclude_set = set(exclude_ids or [])
        exclude_set.add(source_item['rawId'])

        ranked_indices = np.argsort(cosine_sim)[::-1]
        results = []

        for idx in ranked_indices:
            row = self.unified_df.iloc[idx]
            if target_type != 'all' and row['mediaType'] != target_type:
                continue
            if row['rawId'] in exclude_set or row['contentId'] == cid:
                continue

            score = float(cosine_sim[idx])
            common_genres = list(set(source_item['genres']).intersection(set(row['genres'])))
            genre_desc = f"{', '.join(common_genres[:3])}" if common_genres else "thematic style"
            target_label = "TV series" if row['mediaType'] == 'tv' else "movie"
            
            explanation = f"Recommended {target_label} because you liked '{source_item['title']}' (shares {genre_desc})"

            results.append({
                "id": str(row['contentId']),
                "contentId": str(row['contentId']),
                "tmdbId": int(row['tmdbId']) if pd.notna(row['tmdbId']) else 0,
                "movieId": int(row['rawId']) if row['mediaType'] == 'movie' and pd.notna(row['rawId']) else None,
                "mediaType": str(row['mediaType']),
                "title": str(row['title']),
                "releaseYear": int(row['releaseYear']) if pd.notna(row['releaseYear']) else 2020,
                "genres": list(row['genres']) if isinstance(row['genres'], list) else str(row['genres']).split(),
                "voteAverage": float(row['voteAverage']) if pd.notna(row['voteAverage']) else 7.0,
                "voteCount": int(row['voteCount']) if pd.notna(row['voteCount']) else 100,
                "overview": str(row['overview']) if pd.notna(row['overview']) else "",
                "posterPath": str(row['posterPath']) if pd.notna(row['posterPath']) and row['posterPath'] else None,
                "backdropPath": str(row['backdropPath']) if pd.notna(row['backdropPath']) and row['backdropPath'] else None,
                "score": round(float(score), 4),
                "crossScore": round(float(score), 4),
                "explanation": explanation
            })

            if len(results) >= top_k:
                break

        return results

    def recommend_for_profile(self, favorite_genres: list, favorite_movie_ids: list, top_k: int = 10, exclude_ids: list = None, target_type: str = 'movie'):
        """Recommend matching declared favorite genres and favorite titles."""
        profile_tokens = []
        if favorite_genres:
            profile_tokens.append(" ".join(favorite_genres * 3))
            
        for fid in favorite_movie_ids:
            if fid in self.movie_id_to_idx:
                fav_row = self.movies_df.iloc[self.movie_id_to_idx[fid]]
                profile_tokens.append(f"{fav_row['title']} {' '.join(fav_row['genres'] * 2)} {fav_row['keywords']}")
                
        if not profile_tokens:
            top_popular = self.unified_df[self.unified_df['mediaType'] == target_type].sort_values(by=["voteAverage", "voteCount"], ascending=False).head(top_k)
            return [{
                "movieId": int(row['rawId']),
                "tmdbId": int(row['tmdbId']),
                "mediaType": row['mediaType'],
                "title": row['title'],
                "releaseYear": int(row['releaseYear']),
                "genres": row['genres'],
                "voteAverage": float(row['voteAverage']),
                "voteCount": int(row['voteCount']),
                "overview": row['overview'],
                "posterPath": row['posterPath'],
                "contentScore": 0.5,
                "score": 0.5,
                "explanation": "Popular acclaimed title in our catalog"
            } for _, row in top_popular.iterrows()]

        query_text = " ".join(profile_tokens)
        query_vector = self.tfidf.transform([query_text])
        cosine_sim = linear_kernel(query_vector, self.tfidf_matrix).flatten()
        
        exclude_set = set(exclude_ids or []).union(set(favorite_movie_ids))
        ranked_indices = np.argsort(cosine_sim)[::-1]
        
        results = []
        for idx in ranked_indices:
            row = self.unified_df.iloc[idx]
            if target_type != 'all' and row['mediaType'] != target_type:
                continue
            mid = int(row['rawId'])
            if mid in exclude_set:
                continue
                
            score = float(cosine_sim[idx])
            matched_genres = [g for g in row['genres'] if g in (favorite_genres or [])]
            if matched_genres:
                explanation = f"Recommended because you love {', '.join(matched_genres)}"
            elif favorite_movie_ids:
                explanation = "Recommended because it shares themes with your favorite selections"
            else:
                explanation = "Matches your discovery profile"

            results.append({
                "movieId": mid,
                "tmdbId": int(row['tmdbId']) if pd.notna(row['tmdbId']) else 0,
                "mediaType": str(row['mediaType']),
                "title": str(row['title']),
                "releaseYear": int(row['releaseYear']) if pd.notna(row['releaseYear']) else 2020,
                "genres": list(row['genres']) if isinstance(row['genres'], list) else str(row['genres']).split(),
                "voteAverage": float(row['voteAverage']) if pd.notna(row['voteAverage']) else 7.0,
                "voteCount": int(row['voteCount']) if pd.notna(row['voteCount']) else 100,
                "overview": str(row['overview']) if pd.notna(row['overview']) else "",
                "posterPath": str(row['posterPath']) if pd.notna(row['posterPath']) and row['posterPath'] else None,
                "backdropPath": str(row['backdropPath']) if pd.notna(row['backdropPath']) and row['backdropPath'] else None,
                "contentScore": round(score, 4),
                "score": round(score, 4),
                "explanation": explanation
            })
            
            if len(results) >= top_k:
                break
                
        return results

    def get_all_scores_for_profile(self, favorite_genres: list, favorite_movie_ids: list) -> dict:
        """Returns dict of {movieId: normalized_content_score} across movie catalog."""
        profile_tokens = []
        if favorite_genres:
            profile_tokens.append(" ".join(favorite_genres * 3))
        for fid in favorite_movie_ids:
            if fid in self.movie_id_to_idx:
                fav_row = self.movies_df.iloc[self.movie_id_to_idx[fid]]
                profile_tokens.append(f"{fav_row['title']} {' '.join(fav_row['genres'] * 2)} {fav_row['keywords']}")
                
        if not profile_tokens:
            return {mid: 0.5 for mid in self.movie_id_to_idx}

        query_text = " ".join(profile_tokens)
        query_vector = self.tfidf.transform([query_text])
        sims = linear_kernel(query_vector, self.tfidf_matrix).flatten()
        
        movie_sims = {}
        for mid, uidx in self.movie_uidx_map.items():
            movie_sims[mid] = float(sims[uidx])
            
        vals = list(movie_sims.values())
        max_v, min_v = max(vals), min(vals)
        denom = (max_v - min_v) if max_v > min_v else 1.0
        
        return {mid: float((score - min_v) / denom) for mid, score in movie_sims.items()}
