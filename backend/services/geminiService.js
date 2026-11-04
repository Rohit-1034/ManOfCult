const axios = require('axios');
const db = require('../db');

const TMDB_API_KEY = process.env.TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = process.env.TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

// In-memory cache for Gemini queries to minimize API latency
const geminiCache = new Map();
const GEMINI_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCached(key) {
  const item = geminiCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    geminiCache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  geminiCache.set(key, { data, expiresAt: Date.now() + GEMINI_CACHE_TTL });
}

/**
 * Searches TMDB for authentic poster, backdrop, rating, and metadata.
 */
async function enrichWithTMDB(title, mediaType = 'movie', year = null) {
  try {
    const endpoint = mediaType === 'tv' ? '/search/tv' : '/search/movie';
    const params = {
      api_key: TMDB_API_KEY,
      query: title,
      language: 'en-US'
    };
    if (year) {
      if (mediaType === 'tv') params.first_air_date_year = year;
      else params.year = year;
    }

    const res = await axios.get(`${TMDB_BASE_URL}${endpoint}`, { params, timeout: 5000, family: 4 });
    const results = res.data.results || [];
    if (results.length > 0) {
      const top = results[0];
      const isMovie = mediaType !== 'tv';
      const releaseDate = isMovie ? top.release_date : top.first_air_date;
      const releaseYear = releaseDate ? parseInt(releaseDate.slice(0, 4)) : (year || 2022);

      return {
        tmdbId: top.id,
        title: isMovie ? (top.title || title) : (top.name || title),
        mediaType: mediaType,
        releaseYear: releaseYear,
        voteAverage: typeof top.vote_average === 'number' ? Math.round(top.vote_average * 10) / 10 : 7.5,
        voteCount: top.vote_count || 100,
        overview: top.overview || '',
        posterPath: top.poster_path ? `${TMDB_IMAGE_BASE}/w500${top.poster_path}` : null,
        rawPosterPath: top.poster_path,
        backdropPath: top.backdrop_path ? `${TMDB_IMAGE_BASE}/original${top.backdrop_path}` : null,
        rawBackdropPath: top.backdrop_path
      };
    }
  } catch (err) {
    // Silently proceed to fallback
  }

  // Fallback to local database search
  const local = db.getAllMovies().find(m => m.title && m.title.toLowerCase().includes(title.toLowerCase()));
  if (local) {
    return {
      tmdbId: local.tmdbId,
      title: local.title,
      mediaType: 'movie',
      releaseYear: local.releaseYear,
      voteAverage: local.voteAverage,
      voteCount: local.voteCount,
      overview: local.overview,
      posterPath: local.posterPath,
      backdropPath: local.backdropPath
    };
  }

  return null;
}

/**
 * Generate Mood Recommendations using Google Gemini 1.5 / 2.0 Flash API.
 */
async function generateMoodRecommendations({ mood, prompt = '', mediaType = 'all', topK = 12, userApiKey = null }) {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      reason: 'NO_API_KEY',
      message: 'No Google Gemini API key configured'
    };
  }

  const cacheKey = `gemini_${mood || 'none'}_${prompt || 'none'}_${mediaType}_${topK}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return { success: true, fromCache: true, ...cached };
  }

  const systemInstruction = `You are CineMatch Gemini AI, a master film curator and emotional cinema psychologist.
The user is asking for movie & TV show recommendations based on their mood and state of mind.
Given their emotional mood and/or description:
1. Analyze their emotional state, desired tone, and cinematic vibes.
2. Select 10-12 real, acclaimed, emotionally resonant movies or TV series.
3. For each title, write a personalized, empathetic 1-2 sentence explanation tailored specifically to their mood.
4. Output strictly valid JSON matching this schema:
{
  "detectedMood": "string (e.g. Melancholic & Reflective)",
  "emotionalSummary": "string (1 concise paragraph analyzing the vibe)",
  "recommendations": [
    {
      "title": "Exact Title of Movie or TV Show",
      "mediaType": "movie" | "tv",
      "releaseYear": 2021,
      "reason": "Personalized 1-2 sentence reason connecting this film to their mood",
      "emotionalTone": "e.g. Heartwarming / Mind-Bending / Cathartic"
    }
  ]
}`;

  const userQuery = `User State:
Mood: ${mood || 'Not specified'}
Vibe Description: "${prompt || 'Suggest movies matching my mood'}"
Format Preference: ${mediaType === 'all' ? 'Movies and TV Shows' : mediaType === 'movie' ? 'Movies Only' : 'TV Shows and Web Series'}
Quantity: ${topK}`;

  // Models to attempt: modern gemini-3.5-flash series first
  const models = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];
  let geminiData = null;
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\n${userQuery}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      };

      const response = await axios.post(url, payload, { timeout: 12000, family: 4 });
      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0) {
        const textResponse = candidates[0].content?.parts?.[0]?.text;
        if (textResponse) {
          geminiData = JSON.parse(textResponse);
          break;
        }
      }
    } catch (err) {
      lastError = err.response?.data || err.message;
      // Try next model if 404 or model not found
      continue;
    }
  }

  if (!geminiData || !Array.isArray(geminiData.recommendations)) {
    return {
      success: false,
      reason: 'API_ERROR',
      message: typeof lastError === 'string' ? lastError : JSON.stringify(lastError)
    };
  }

  // Enrich each recommended title with authentic TMDB posters, ratings, backdrops
  const enrichedPromises = geminiData.recommendations.map(async (rec) => {
    const tmdbData = await enrichWithTMDB(rec.title, rec.mediaType || 'movie', rec.releaseYear);
    if (!tmdbData || !tmdbData.posterPath) return null;

    const rawId = tmdbData.tmdbId;
    const mediaType = tmdbData.mediaType;

    return {
      id: `${mediaType}_${rawId}`,
      contentId: `${mediaType}_${rawId}`,
      tmdbId: rawId,
      movieId: mediaType === 'movie' ? rawId : null,
      mediaType: mediaType,
      title: tmdbData.title,
      releaseYear: tmdbData.releaseYear,
      voteAverage: tmdbData.voteAverage,
      voteCount: tmdbData.voteCount,
      overview: tmdbData.overview,
      posterPath: tmdbData.posterPath,
      backdropPath: tmdbData.backdropPath,
      explanation: rec.reason || `Recommended by Gemini AI for your ${mood || 'selected'} mood`,
      emotionalTone: rec.emotionalTone || 'Resonant',
      score: 0.95,
      aiPowered: true,
      aiEngine: 'Google Gemini AI'
    };
  });

  const enrichedList = (await Promise.all(enrichedPromises)).filter(Boolean);

  const finalResult = {
    detectedMood: geminiData.detectedMood || mood,
    emotionalSummary: geminiData.emotionalSummary || '',
    recommendations: enrichedList,
    count: enrichedList.length,
    algorithm: 'Google Gemini 3.5 Flash AI',
    aiPowered: true
  };

  setCached(cacheKey, finalResult);
  return { success: true, ...finalResult };
}

/**
 * Universal Natural Language AI Movie & TV Show Suggestions
 * Powered by Google Gemini AI
 */
async function generateSmartSuggestions({ query, mediaType = 'all', topK = 10, userApiKey = null }) {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      reason: 'NO_API_KEY',
      message: 'No Google Gemini API key configured'
    };
  }

  const cacheKey = `gemini_smart_suggest_${(query || '').toLowerCase().trim()}_${mediaType}_${topK}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return { success: true, fromCache: true, ...cached };
  }

  const systemInstruction = `You are CineMatch AI, an elite film scholar and binge-watching curator powered by Google Gemini.
The user is asking for tailored movie or TV show suggestions in natural language.
Analyze their request, intent, style, pacing, tone, and genre taste.
Select ${topK} genuinely outstanding and real movies or TV shows that directly satisfy their request.
Rules:
1. ONLY recommend real movies, TV shows, anime, or web series. Never fabricate fictional titles.
2. For each recommendation, provide a compelling 1-2 sentence reason detailing why it is the perfect match.
3. Include an emotional tone or key hook.
4. Output strictly valid JSON matching this schema:
{
  "queryAnalysis": "1-2 sentence understanding of what the user is looking for",
  "keyThemes": ["theme1", "theme2", "theme3"],
  "recommendations": [
    {
      "title": "Exact Title of Film or TV Series",
      "mediaType": "movie" | "tv",
      "releaseYear": 2021,
      "reason": "Why this movie/show matches their exact request",
      "hook": "e.g. Mind-bending plot twist / Heartfelt chemistry / High-stakes heist"
    }
  ]
}`;

  const userPrompt = `User Request: "${query || 'Recommend the highest rated must-watch movies'}"
Format: ${mediaType === 'all' ? 'Movies and TV Shows' : mediaType === 'movie' ? 'Movies Only' : 'TV Shows and Web Series'}
Quantity: ${topK}`;

  const models = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];

  let geminiData = null;
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      };

      const response = await axios.post(url, payload, { timeout: 14000, family: 4 });
      const candidates = response.data?.candidates;
      if (candidates && candidates.length > 0) {
        const textResponse = candidates[0].content?.parts?.[0]?.text;
        if (textResponse) {
          geminiData = JSON.parse(textResponse);
          break;
        }
      }
    } catch (err) {
      lastError = err.response?.data || err.message;
      continue;
    }
  }

  if (!geminiData || !Array.isArray(geminiData.recommendations)) {
    return {
      success: false,
      reason: 'API_ERROR',
      message: typeof lastError === 'string' ? lastError : JSON.stringify(lastError)
    };
  }

  // Enrich with authentic TMDB data (posters, backdrops, ratings, overviews)
  const enrichedPromises = geminiData.recommendations.map(async (rec) => {
    const tmdbData = await enrichWithTMDB(rec.title, rec.mediaType || 'movie', rec.releaseYear);
    if (!tmdbData || !tmdbData.posterPath) return null;

    const rawId = tmdbData.tmdbId;
    const mediaType = tmdbData.mediaType;

    return {
      id: `${mediaType}_${rawId}`,
      contentId: `${mediaType}_${rawId}`,
      tmdbId: rawId,
      movieId: mediaType === 'movie' ? rawId : null,
      mediaType: mediaType,
      title: tmdbData.title,
      releaseYear: tmdbData.releaseYear,
      voteAverage: tmdbData.voteAverage,
      voteCount: tmdbData.voteCount,
      overview: tmdbData.overview,
      posterPath: tmdbData.posterPath,
      backdropPath: tmdbData.backdropPath,
      explanation: rec.reason || `Handpicked by CineMatch AI for "${query}"`,
      hook: rec.hook || 'Must-watch recommendation',
      score: 0.96,
      aiPowered: true,
      aiEngine: 'Google Gemini 3.5 Flash'
    };
  });

  const enrichedList = (await Promise.all(enrichedPromises)).filter(Boolean);

  const finalResult = {
    query: query,
    queryAnalysis: geminiData.queryAnalysis || '',
    keyThemes: geminiData.keyThemes || [],
    recommendations: enrichedList,
    count: enrichedList.length,
    algorithm: 'Google Gemini 3.5 Flash AI Suggester',
    aiPowered: true
  };

  setCached(cacheKey, finalResult);
  return { success: true, ...finalResult };
}

module.exports = {
  generateMoodRecommendations,
  generateSmartSuggestions
};
