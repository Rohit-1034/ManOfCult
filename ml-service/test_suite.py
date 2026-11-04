import unittest
import os
import pandas as pd
from models.content_based import ContentBasedRecommender
from models.collaborative import CollaborativeRecommender
from models.hybrid import HybridRecommender
from models.mood import MoodRecommender
from models.evaluation import ModelEvaluator
from models.suggestion import SuggestionModel

class TestCineMatchML(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data_dir = r"C:\Users\rohit\.gemini\antigravity\scratch\cinematch-ai\data"
        movies_path = os.path.join(data_dir, "movies_processed.csv")
        ratings_path = os.path.join(data_dir, "ratings_processed.csv")

        cls.movies_df = pd.read_csv(movies_path)
        cls.movies_df['genres'] = cls.movies_df['genreString'].apply(lambda s: str(s).split() if pd.notna(s) else ["Drama"])
        cls.ratings_df = pd.read_csv(ratings_path)

        cls.content_model = ContentBasedRecommender(cls.movies_df)
        cls.collab_model = CollaborativeRecommender(cls.ratings_df, cls.movies_df)
        cls.hybrid_model = HybridRecommender(cls.content_model, cls.collab_model, cls.movies_df)
        cls.mood_model = MoodRecommender(cls.content_model, cls.movies_df)
        cls.evaluator = ModelEvaluator(cls.ratings_df, cls.movies_df)
        cls.suggestion_model = SuggestionModel(cls.content_model, cls.collab_model, cls.movies_df)

    def test_modern_movies_present(self):
        titles = set(self.movies_df['title'].str.lower())
        self.assertIn("oppenheimer", titles)
        self.assertIn("dune: part two", titles)
        self.assertIn("deadpool & wolverine", titles)
        self.assertIn("superman", titles)
        modern_count = len(self.movies_df[self.movies_df['releaseYear'] >= 2020])
        self.assertGreater(modern_count, 30)

    def test_content_similar_movie(self):
        recs = self.content_model.get_similar_movies(1, top_k=5)
        self.assertEqual(len(recs), 5)
        self.assertIn("explanation", recs[0])
        self.assertGreater(recs[0]["score"], 0.0)

    def test_content_profile_recommend(self):
        recs = self.content_model.recommend_for_profile(
            favorite_genres=["Sci-Fi", "Action"],
            favorite_movie_ids=[260, 2571],
            top_k=5
        )
        self.assertEqual(len(recs), 5)
        self.assertTrue(any("Sci-Fi" in r["genres"] or "Action" in r["genres"] for r in recs))

    def test_collaborative_prediction(self):
        user_ratings = [{"movieId": 1, "rating": 5.0}, {"movieId": 318, "rating": 5.0}]
        recs = self.collab_model.predict_for_ratings(user_ratings, top_k=5)
        self.assertEqual(len(recs), 5)
        self.assertGreaterEqual(recs[0]["collaborativeScore"], 0.0)

    def test_hybrid_cold_start(self):
        recs = self.hybrid_model.recommend(
            favorite_genres=["Comedy"],
            favorite_movie_ids=[1],
            user_ratings=[{"movieId": 1, "rating": 5.0}],
            top_k=5
        )
        self.assertEqual(len(recs), 5)
        self.assertIn("Cold-Start", recs[0]["modelType"])

    def test_mood_recommendation(self):
        recs = self.mood_model.recommend(mood="excited", top_k=5)
        self.assertEqual(len(recs), 5)
        self.assertIn("Excited", recs[0]["explanation"])

    def test_suggestion_model_typeahead(self):
        suggestions = self.suggestion_model.get_typeahead_suggestions("oppen", limit=5)
        self.assertGreaterEqual(len(suggestions), 1)
        self.assertEqual(suggestions[0]["title"], "Oppenheimer")

    def test_suggestion_model_contextual(self):
        suggestions = self.suggestion_model.get_contextual_next_suggestions([200021], limit=5) # Oppenheimer
        self.assertEqual(len(suggestions), 5)
        self.assertIn("explanation", suggestions[0])

    def test_suggestion_model_curated_decks(self):
        decks = self.suggestion_model.get_curated_decks()
        self.assertIn("modernCinema", decks)
        self.assertGreaterEqual(len(decks["modernCinema"]), 5)

    def test_evaluation_held_out(self):
        report = self.evaluator.run_full_evaluation(
            content_model=self.content_model,
            collab_model=self.collab_model,
            hybrid_model=self.hybrid_model,
            k=5,
            sample_users=10
        )
        self.assertIn("metrics", report)

if __name__ == "__main__":
    unittest.main()
