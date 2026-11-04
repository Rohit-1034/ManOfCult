import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
from sklearn.decomposition import TruncatedSVD

class CollaborativeRecommender:
    def __init__(self, ratings_df: pd.DataFrame, movies_df: pd.DataFrame, n_factors: int = 20):
        self.ratings_df = ratings_df.copy()
        self.movies_df = movies_df.copy().set_index('movieId')
        
        # Unique users and movies
        self.user_ids = sorted(self.ratings_df['userId'].unique())
        self.movie_ids = sorted(self.ratings_df['movieId'].unique())
        
        self.user_to_idx = {uid: i for i, uid in enumerate(self.user_ids)}
        self.idx_to_user = {i: uid for i, uid in enumerate(self.user_ids)}
        self.movie_to_idx = {mid: i for i, mid in enumerate(self.movie_ids)}
        self.idx_to_movie = {i: mid for i, mid in enumerate(self.movie_ids)}
        
        # Build user-item sparse rating matrix
        rows = [self.user_to_idx[u] for u in self.ratings_df['userId']]
        cols = [self.movie_to_idx[m] for m in self.ratings_df['movieId']]
        values = self.ratings_df['rating'].values
        
        self.rating_matrix = csr_matrix((values, (rows, cols)), shape=(len(self.user_ids), len(self.movie_ids)))
        
        # Train SVD for latent factor representation
        self.n_factors = min(n_factors, len(self.movie_ids) - 1, len(self.user_ids) - 1)
        self.svd = TruncatedSVD(n_components=self.n_factors, random_state=42)
        self.user_factors = self.svd.fit_transform(self.rating_matrix)  # shape (n_users, n_factors)
        self.item_factors = self.svd.components_.T  # shape (n_movies, n_factors)
        
        # Also fit KNN on item-vectors for item-item similarity
        self.knn = NearestNeighbors(metric='cosine', algorithm='brute', n_neighbors=25)
        self.knn.fit(self.item_factors)
        
        print(f"CollaborativeRecommender fitted with {len(self.user_ids)} users, {len(self.movie_ids)} movies, {self.n_factors} latent factors.")

    def predict_for_ratings(self, user_ratings: list, top_k: int = 10, exclude_ids: list = None) -> list:
        """
        user_ratings: list of dicts [{'movieId': 1, 'rating': 4.5}]
        Projects the active user into the latent SVD space and predicts scores for all movies.
        """
        exclude_set = set(exclude_ids or [])
        user_vector = np.zeros(len(self.movie_ids))
        
        rated_count = 0
        for r in user_ratings:
            mid = int(r.get('movieId', 0))
            rating = float(r.get('rating', 0.0))
            exclude_set.add(mid)
            if mid in self.movie_to_idx:
                user_vector[self.movie_to_idx[mid]] = rating
                rated_count += 1
                
        if rated_count == 0:
            return []
            
        # Project user vector into latent space: u_latent = user_vector @ V (or transform)
        user_latent = self.svd.transform(user_vector.reshape(1, -1)) # shape (1, n_factors)
        
        # Predicted scores: u_latent @ item_factors.T
        pred_scores = np.dot(user_latent, self.item_factors.T).flatten()
        
        # Max-min normalization
        min_v, max_v = pred_scores.min(), pred_scores.max()
        denom = (max_v - min_v) if max_v > min_v else 1.0
        normalized_scores = (pred_scores - min_v) / denom
        
        ranked_indices = np.argsort(pred_scores)[::-1]
        
        results = []
        for idx in ranked_indices:
            mid = self.idx_to_movie[idx]
            if mid in exclude_set or mid not in self.movies_df.index:
                continue
                
            movie_row = self.movies_df.loc[mid]
            score = float(normalized_scores[idx])
            
            results.append({
                "movieId": int(mid),
                "title": movie_row['title'],
                "releaseYear": int(movie_row['releaseYear']),
                "genres": movie_row['genres'] if isinstance(movie_row['genres'], list) else str(movie_row['genres']).split(),
                "voteAverage": float(movie_row['voteAverage']),
                "voteCount": int(movie_row['voteCount']),
                "overview": movie_row['overview'],
                "posterPath": movie_row['posterPath'],
                "collaborativeScore": round(score, 4),
                "score": round(score, 4),
                "explanation": "High predicted affinity based on ratings from users with matching taste patterns"
            })
            
            if len(results) >= top_k:
                break
                
        return results

    def get_all_scores_for_ratings(self, user_ratings: list) -> dict:
        """Returns dict of {movieId: normalized_collaborative_score}."""
        user_vector = np.zeros(len(self.movie_ids))
        rated_count = 0
        for r in user_ratings:
            mid = int(r.get('movieId', 0))
            rating = float(r.get('rating', 0.0))
            if mid in self.movie_to_idx:
                user_vector[self.movie_to_idx[mid]] = rating
                rated_count += 1
                
        if rated_count == 0:
            return {}
            
        user_latent = self.svd.transform(user_vector.reshape(1, -1))
        pred_scores = np.dot(user_latent, self.item_factors.T).flatten()
        
        min_v, max_v = pred_scores.min(), pred_scores.max()
        denom = (max_v - min_v) if max_v > min_v else 1.0
        normalized_scores = (pred_scores - min_v) / denom
        
        return {self.idx_to_movie[idx]: float(normalized_scores[idx]) for idx in range(len(self.movie_ids))}
