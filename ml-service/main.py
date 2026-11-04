import os
import json
import urllib.request
import pandas as pd
from typing import List, Optional, Dict, Any, Union
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from models.content_based import ContentBasedRecommender
from models.collaborative import CollaborativeRecommender
from models.hybrid import HybridRecommender
from models.mood import MoodRecommender, MOOD_MAP
from models.evaluation import ModelEvaluator
from models.suggestion import SuggestionModel

app = FastAPI(
    title="CineMatch AI - Recommendation & Suggestion Inference Engine",
    description="Intelligent hybrid, content-based, collaborative, cross-content, mood-based, and typeahead movie & TV discovery engine.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\data"
movies_path = os.path.join(DATA_DIR, "movies_processed.csv")
tv_path = os.path.join(DATA_DIR, "tv_shows_processed.csv")
ratings_path = os.path.join(DATA_DIR, "ratings_processed.csv")

print("Initializing CineMatch ML Service models...")
movies_df = pd.read_csv(movies_path)
movies_df['genres'] = movies_df['genreString'].apply(lambda s: str(s).split() if pd.notna(s) else ["Drama"])

tv_df = None
if os.path.exists(tv_path):
    try:
        tv_df = pd.read_csv(tv_path)
        tv_df['genres'] = tv_df['genreString'].apply(lambda s: str(s).split() if pd.notna(s) else ["Drama"])
        print(f"Loaded {len(tv_df)} TV shows into ML catalog.")
    except Exception as e:
        print(f"Warning: could not load tv_shows_processed.csv: {e}")

ratings_df = pd.read_csv(ratings_path)

content_model = ContentBasedRecommender(movies_df, tv_df)
collab_model = CollaborativeRecommender(ratings_df, movies_df)
hybrid_model = HybridRecommender(content_model, collab_model, movies_df, alpha=0.4, beta=0.6)
mood_model = MoodRecommender(content_model, movies_df)
evaluator = ModelEvaluator(ratings_df, movies_df)
suggestion_model = SuggestionModel(content_model, collab_model, movies_df)

print("CineMatch ML Service ready!")

# Request Schemas
class RatingItem(BaseModel):
    movieId: int
    rating: float

class ContentRecommendRequest(BaseModel):
    movieId: Optional[int] = None
    contentId: Optional[Union[int, str]] = None
    mediaType: Optional[str] = "movie"
    targetType: Optional[str] = "movie"
    favoriteGenres: Optional[List[str]] = Field(default_factory=list)
    favoriteMovies: Optional[List[int]] = Field(default_factory=list)
    topK: Optional[int] = 10
    excludeIds: Optional[List[Any]] = Field(default_factory=list)

class CrossRecommendRequest(BaseModel):
    contentId: Union[int, str]
    sourceType: Optional[str] = "movie"  # "movie" or "tv"
    targetType: Optional[str] = "tv"     # "tv" or "movie" or "all"
    topK: Optional[int] = 10
    excludeIds: Optional[List[Any]] = Field(default_factory=list)

class CollaborativeRecommendRequest(BaseModel):
    userId: Optional[int] = None
    ratings: Optional[List[RatingItem]] = Field(default_factory=list)
    topK: Optional[int] = 10
    excludeIds: Optional[List[int]] = Field(default_factory=list)

class HybridRecommendRequest(BaseModel):
    favoriteGenres: Optional[List[str]] = Field(default_factory=list)
    favoriteMovies: Optional[List[int]] = Field(default_factory=list)
    ratings: Optional[List[RatingItem]] = Field(default_factory=list)
    topK: Optional[int] = 12
    excludeIds: Optional[List[int]] = Field(default_factory=list)
    alpha: Optional[float] = 0.4
    beta: Optional[float] = 0.6

class MoodRecommendRequest(BaseModel):
    mood: Optional[str] = None
    prompt: Optional[str] = None
    mediaType: Optional[str] = "all"  # "all", "movie", or "tv"
    topK: Optional[int] = 12
    excludeIds: Optional[List[Any]] = Field(default_factory=list)

class ContextualSuggestRequest(BaseModel):
    recentMovieIds: Optional[List[int]] = Field(default_factory=list)
    limit: Optional[int] = 6

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CineMatch AI ML Service",
        "movieCatalogSize": len(movies_df),
        "tvCatalogSize": len(tv_df) if tv_df is not None else 0,
        "unifiedCatalogSize": len(content_model.unified_df),
        "ratingsCount": len(ratings_df),
        "modelsLoaded": [
            "Content-Based (Movies & TV)",
            "Cross-Content Recommender (Movie <-> TV)",
            "Collaborative (SVD)",
            "Hybrid",
            "Mood AI (8 Moods)",
            "Smart Suggestion Engine"
        ]
    }

@app.post("/recommend/content")
def recommend_content(req: ContentRecommendRequest):
    try:
        mid = req.movieId or req.contentId
        if mid is not None:
            # If targetType is different from source mediaType, run cross recommendation
            if req.targetType and req.targetType != req.mediaType:
                recs = content_model.get_cross_recommendations(
                    content_id=mid,
                    source_type=req.mediaType or "movie",
                    target_type=req.targetType,
                    top_k=req.topK or 10,
                    exclude_ids=req.excludeIds
                )
            else:
                try:
                    num_id = int(str(mid).replace('movie_', '').replace('tv_', ''))
                    recs = content_model.get_similar_movies(
                        movie_id=num_id,
                        top_k=req.topK or 10,
                        exclude_ids=req.excludeIds
                    )
                except:
                    recs = []
        else:
            recs = content_model.recommend_for_profile(
                favorite_genres=req.favoriteGenres or [],
                favorite_movie_ids=req.favoriteMovies or [],
                top_k=req.topK or 10,
                exclude_ids=req.excludeIds,
                target_type=req.targetType or "movie"
            )
        return {"recommendations": recs, "count": len(recs), "algorithm": "Content-Based Filtering"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/cross")
def recommend_cross(req: CrossRecommendRequest):
    """Cross-Content Recommendation: Movie to TV, or TV to Movie."""
    try:
        recs = content_model.get_cross_recommendations(
            content_id=req.contentId,
            source_type=req.sourceType or "movie",
            target_type=req.targetType or "tv",
            top_k=req.topK or 10,
            exclude_ids=req.excludeIds
        )
        return {
            "recommendations": recs,
            "count": len(recs),
            "algorithm": f"Cross-Content Recommendation ({req.sourceType.upper()} -> {req.targetType.upper()})",
            "sourceId": req.contentId,
            "sourceType": req.sourceType,
            "targetType": req.targetType
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/collaborative")
def recommend_collaborative(req: CollaborativeRecommendRequest):
    try:
        user_ratings = [{"movieId": r.movieId, "rating": r.rating} for r in req.ratings] if req.ratings else []
        recs = collab_model.predict_for_ratings(
            user_ratings=user_ratings,
            top_k=req.topK or 10,
            exclude_ids=req.excludeIds
        )
        return {"recommendations": recs, "count": len(recs), "algorithm": "Collaborative Filtering (SVD)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/hybrid")
def recommend_hybrid(req: HybridRecommendRequest):
    try:
        user_ratings = [{"movieId": r.movieId, "rating": r.rating} for r in req.ratings] if req.ratings else []
        recs = hybrid_model.recommend(
            favorite_genres=req.favoriteGenres,
            favorite_movie_ids=req.favoriteMovies,
            user_ratings=user_ratings,
            top_k=req.topK or 12,
            exclude_ids=req.excludeIds,
            alpha=req.alpha,
            beta=req.beta
        )
        return {
            "recommendations": recs,
            "count": len(recs),
            "algorithm": f"Hybrid Recommendation (α={req.alpha}, β={req.beta})"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/mood")
def recommend_mood(req: MoodRecommendRequest):
    try:
        recs = mood_model.recommend(
            mood=req.mood,
            prompt=req.prompt,
            top_k=req.topK or 12,
            exclude_ids=req.excludeIds,
            media_type=req.mediaType or "all"
        )
        return {
            "recommendations": recs,
            "count": len(recs),
            "algorithm": "Mood-Based AI Recommendation",
            "mood": req.mood,
            "prompt": req.prompt,
            "mediaType": req.mediaType or "all"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend/moods")
def list_moods():
    """Returns list of 8 supported moods with labels and descriptions."""
    return {
        "moods": [
            {"id": k, "label": v["label"], "description": v["description"], "genres": v["genres"]}
            for k, v in MOOD_MAP.items()
        ]
    }

# --- Suggestion Model Endpoints ---

@app.get("/recommend/typeahead")
def get_typeahead_suggestions(q: str = "", limit: int = 6):
    try:
        suggestions = suggestion_model.get_typeahead_suggestions(query=q, limit=limit)
        return {"suggestions": suggestions, "query": q, "count": len(suggestions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/recommend/suggest")
def get_contextual_suggestions(req: ContextualSuggestRequest):
    try:
        suggestions = suggestion_model.get_contextual_next_suggestions(
            recent_movie_ids=req.recentMovieIds or [],
            limit=req.limit or 6
        )
        return {
            "suggestions": suggestions,
            "count": len(suggestions),
            "algorithm": "Context-Aware Up-Next Suggestion Engine"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend/curated-decks")
def get_curated_decks():
    try:
        decks = suggestion_model.get_curated_decks()
        return {"decks": decks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/evaluate")
def run_evaluation(k: int = 10, sample_users: int = 35):
    try:
        report = evaluator.run_full_evaluation(
            content_model=content_model,
            collab_model=collab_model,
            hybrid_model=hybrid_model,
            k=k,
            sample_users=sample_users
        )
        return {"evaluationReport": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
