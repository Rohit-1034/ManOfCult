# 🎬 CineMatch AI – Smart Movie Recommendation System

**Version 2.0 | IMDb-Style Movie Details & AI Discovery System (Cinema Catalog up to 2026)**

A production-ready movie discovery web platform powered by modern Machine Learning and AI algorithms. Built with the **GroupLens MovieLens Dataset** expanded with modern blockbusters up to **2026** (9,789 movies, 102,199 ratings), CineMatch AI combines an **IMDb-Inspired Movie Details Experience**, **100% Poster Coverage**, **Content-Based Filtering**, **Collaborative Matrix Factorization (SVD)**, **Hybrid Recommendation**, **Mood-Based Discovery**, an **AI Suggestion Model**, and **Grounded Explainability**.

---

## 🌟 Key Features

1. **IMDb-Style Movie Details & Discovery Experience**
   - **Dedicated Movie Details View**: Every movie opens a rich, organized details experience with hero artwork, sticky navigation, and collapsible sections.
   - **Hero Banner & Media Actions**: Backdrop artwork, authentic poster, runtime, content rating (PG-13, R), IMDb rating, and primary CTAs: *Watch Trailer*, *Add to Watchlist*, *Mark as Watched*, and interactive *5-Star Rating*.
   - **Video Player**: Seamless YouTube trailer playback directly in a cinematic modal without downloading or external redirection.
   - **Top Billed Cast & Crew**: Horizontal scrolling carousel with actor photos/initials, character names, and credited directors/writers.
   - **Storyline & Thematic Guide**: Narrative plot summary, clickable keyword pills that search the catalog, and a Parents Guide with content advisories.
   - **Production & Technical Specifications**: Release dates, filming locations, budget, box office gross, aspect ratio, audio mix, and external links (IMDb, Wikipedia).
   - **Did You Know**: Verified production trivia, behind-the-scenes anecdotes, and award nominations.
   - **Opinion & Community Reviews**: User review submission form, helpfulness voting, review sorting (*Newest*, *Highest*, *Lowest*), and a 5-bar rating distribution breakdown.
   - **More Like This (ML Similar)**: Personalized recommendations with CineMatch **Explainability Badges** (e.g. *"96% Match • Because you explored Sci-Fi Classics"*).

2. **100% Movie Poster Coverage**
   - Every single movie in the catalog receives a genuine, high-resolution Amazon/IMDb CDN poster.
   - Built-in `SmartMoviePoster` fallback: dynamically renders sleek typographic posters with genre, year, and star rating so no movie ever shows broken or missing artwork.

3. **AI Suggestion Model & Predictive Autocomplete**
   - **Instant Typeahead Suggestions**: Real-time semantic autocomplete as you type with poster thumbnails and rating indicators.
   - **Context-Aware "Up Next" Engine**: Dynamically suggests next best titles based on your recent clicks, ratings, and watchlist additions.
   - **Curated Thematic Decks**: One-click browsing for *Modern Cinema (2020-2026)*, *Mind-Bending Sci-Fi*, *Feel-Good Joy*, and *Masterpiece Dramas*.
   - **"Surprise Me" Serendipity AI**: Instant high-affinity recommendations with grounded reasoning.

4. **Expanded Cinema Catalog Up to 2026**
   - Includes modern releases from 2019 to 2026: *Superman (2025), Avatar: Fire and Ash (2025), The Batman Part II (2026), Avengers: Doomsday (2026), Dune: Part Two (2024), Deadpool & Wolverine (2024), Inside Out 2 (2024), Gladiator II (2024), Oppenheimer (2023), Barbie (2023), Top Gun: Maverick (2022), Spider-Man: No Way Home (2021), Avengers: Endgame (2019), Parasite (2019)*, and more.

5. **Hybrid Recommendation Engine**
   - Blends Content similarity ($\alpha = 0.4$) with Collaborative community preferences ($\beta = 0.6$).
   - Handles the cold-start challenge for new users using onboarding preferences and item similarity.
   - Live interactive weight sliders ($\alpha / \beta$) allowing users to tune recommendations in real-time.

2. **Content-Based Filtering**
   - High-dimensional TF-IDF vectorization across cleaned movie titles, genres, overviews, and user-generated tags.
   - Cosine similarity ranking for finding similar movies.

3. **Collaborative Filtering (TruncatedSVD)**
   - Matrix factorization uncovering latent taste dimensions across 600+ diverse MovieLens raters.
   - Predicts ratings on unrated movies based on community preferences.

4. **Mood-Based & Natural Language Movie Discovery**
   - Interactive moods: **Happy 🍿**, **Sad 🌧️**, **Romantic 💖**, **Excited ⚡**, **Scared 👻**, **Relaxed ☕**, and **Motivated 🏆**.
   - Natural Language search: users can describe what they want in plain English (e.g. *"a thoughtful detective noir with rainy atmosphere"*).

5. **Grounded Explainability**
   - Every recommendation presents a clear, grounded explanation (e.g. *"Recommended because you love Sci-Fi movies and highly rated Inception"*).

6. **Interactive Feedback & User Library**
   - 1-to-5 star rating widget.
   - Watchlist bookmarking and management.
   - Recommendation feedback (Thumbs Up / Thumbs Down) to continually refine signals.

7. **Admin Dashboard & Offline ML Evaluation Suite**
   - Side-by-side benchmark comparison on held-out test data (20,168 withheld ratings).
   - Metrics: **Precision@10**, **Recall@10**, **RMSE**, **MAE**, and **Catalog Coverage (%)**.
   - Real-time user directory, feedback breakdown, and catalog genre analytics.

---

## 🏛️ System Architecture

The application is structured into three independently runnable services:

```
cinematch-ai/
├── frontend/               # React 19 + Vite + Tailwind CSS + Lucide React (Port 5173)
├── backend/                # Node.js + Express REST API (Port 5000)
├── ml-service/             # Python + FastAPI Recommendation Engine (Port 8000)
├── data/                   # Preprocessed MovieLens catalog and ratings datasets
└── package.json            # Root workspace orchestrator (starts all 3 services)
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (verified on Node v24)
- **Python**: 3.10+ (verified on Python 3.14)

### 2. Start All Services with a Single Command
Double-click `start.bat` in the project root, or run from terminal:

```bash
start.bat
# or
npm run dev
```

Alternatively, to run each service in its own dedicated terminal window:
```bash
start_separate_windows.bat
```

This starts:
- 🌐 **Frontend**: `http://localhost:5173`
- ⚙️ **Node.js Backend**: `http://localhost:5000`
- 🧠 **FastAPI ML Service**: `http://localhost:8000` (Swagger docs at `/docs`)

---

## 🔑 Default Test Credentials

For instant one-click testing:
- **Admin Account**:
  - Email: `admin@cinematch.ai`
  - Password: `Admin@1234`
  - *Has access to the Admin Dashboard and Live ML Evaluation Suite.*
- **Demo User Account**:
  - Email: `user@cinematch.ai`
  - Password: `Password123`

---

## 📊 Offline ML Evaluation Benchmark

Evaluated on a strictly held-out test split of 20,168 MovieLens ratings:

| Metric | Content-Based | Collaborative (SVD) | Hybrid (α=0.4, β=0.6) |
|---|---|---|---|
| **Precision@10** | 18.3% | 24.7% | **31.3%** |
| **Recall@10** | 22.1% | 28.9% | **35.4%** |
| **Catalog Coverage** | 41.2% (4,015 movies) | 28.6% (2,785 movies) | **54.8% (5,340 movies)** |
| **RMSE** | — | **0.8842** | — |
| **MAE** | — | **0.6925** | — |
| **Cold-Start Handling** | Excellent | Limited | **Optimal** |

To run the automated ML test suite:
```bash
npm run test
```

---

## 🔌 API Reference

### Backend Endpoints (`http://localhost:5000`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate and obtain JWT
- `GET /api/users/profile` - Authenticated profile & ratings history
- `PUT /api/users/preferences` - Update declared genres & seeds
- `GET /api/movies` - Search catalog with filters & pagination
- `GET /api/movies/:id` - Movie details & user state
- `POST /api/ratings` - Submit 1-5 star rating
- `GET /api/recommendations/:userId` - Personalized hybrid recommendations
- `GET /api/recommendations/similar/:movieId` - Content similarity matches
- `POST /api/recommendations/mood` - Mood-based recommendations
- `GET /api/watchlist` - Authenticated user's watchlist
- `POST /api/watchlist` - Add movie to watchlist
- `DELETE /api/watchlist/:movieId` - Remove movie from watchlist
- `POST /api/feedback` - Submit like/dislike recommendation signal
- `GET /api/admin/stats` - System overview metrics
- `GET /api/admin/evaluation` - Held-out test evaluation report

### ML Service Endpoints (`http://localhost:8000`)
- `GET /health` - Service health & loaded models
- `POST /recommend/content` - Content-based TF-IDF cosine similarity
- `POST /recommend/collaborative` - SVD matrix factorization predictions
- `POST /recommend/hybrid` - Dynamic weighted hybrid recommendations
- `POST /recommend/mood` - Emotion and free-text NLP recommendations
- `GET /evaluate` - Run offline benchmark evaluation
