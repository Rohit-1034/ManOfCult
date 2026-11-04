import axios from 'axios';

const ML_SERVICE_URL = 'http://127.0.0.1:8000';
const BACKEND_URL = 'http://localhost:5000/api';

export const recommendationService = {
  // Cross-Content Recommendations (Movie -> TV or TV -> Movie)
  async getCrossRecommendations({ contentId, sourceType = 'movie', targetType = 'tv', topK = 10, excludeIds = [] }) {
    try {
      const res = await axios.post(`${ML_SERVICE_URL}/recommend/cross`, {
        contentId,
        sourceType,
        targetType,
        topK,
        excludeIds
      });
      return res.data.recommendations || [];
    } catch (err) {
      console.warn('Cross recommendation fetch error:', err.message);
      return [];
    }
  },

  // 8-Mood Recommendations
  async getMoodRecommendations({ mood, prompt = '', mediaType = 'all', topK = 12, excludeIds = [] }) {
    // 1. Try Backend API Proxy first
    try {
      const res = await axios.post(`${BACKEND_URL}/recommendations/mood`, {
        mood,
        prompt,
        mediaType,
        topK,
        excludeIds
      }, { timeout: 6000 });
      return res.data.recommendations || [];
    } catch (backendErr) {
      // 2. Fallback to direct ML Service
      try {
        const res = await axios.post(`${ML_SERVICE_URL}/recommend/mood`, {
          mood,
          prompt,
          mediaType,
          topK,
          excludeIds
        }, { timeout: 6000 });
        return res.data.recommendations || [];
      } catch (err) {
        console.warn('Mood recommendation fetch error:', err.message);
        return [];
      }
    }
  },

  // List 8 supported moods
  async getMoods() {
    try {
      const res = await axios.get(`${BACKEND_URL}/recommendations/moods`, { timeout: 3000 });
      return res.data.moods || [];
    } catch (e) {
      try {
        const res = await axios.get(`${ML_SERVICE_URL}/recommend/moods`, { timeout: 3000 });
        return res.data.moods || [];
      } catch (err) {
        return [
          { id: 'happy', label: 'Happy & Upbeat', description: 'Joyful, feel-good stories' },
          { id: 'curious', label: 'Curious & Mind-Bending', description: 'Mind-bending mysteries & discoveries' },
          { id: 'excited', label: 'Excited & Hyped', description: 'High-octane spectacles and thrills' },
          { id: 'romantic', label: 'Romantic & Sweet', description: 'Love and captivating chemistry' },
          { id: 'motivated', label: 'Motivated & Inspired', description: 'Inspiring underdog journeys' },
          { id: 'relaxed', label: 'Cozy & Relaxed', description: 'Comfort viewing and cozy stories' },
          { id: 'scared', label: 'Spooky & Thrilled', description: 'Spine-chilling scares & mysteries' },
          { id: 'sad', label: 'Melancholic & Deep', description: 'Deeply emotional tales' }
        ];
      }
    }
  },

  // Content-Based Recommendations
  async getContentRecommendations(payload) {
    try {
      const res = await axios.post(`${ML_SERVICE_URL}/recommend/content`, payload);
      return res.data.recommendations || [];
    } catch (err) {
      console.warn('Content recommendation error:', err.message);
      return [];
    }
  },

  // Hybrid Recommendations
  async getHybridRecommendations(payload) {
    try {
      const res = await axios.post(`${BACKEND_URL}/recommendations/hybrid`, payload);
      return res.data.recommendations || [];
    } catch (err) {
      // Direct ML service fallback
      try {
        const res = await axios.post(`${ML_SERVICE_URL}/recommend/hybrid`, payload);
        return res.data.recommendations || [];
      } catch (e) {
        return [];
      }
    }
  },

  // Typeahead suggestions
  async getTypeaheadSuggestions(query, limit = 6) {
    try {
      const res = await axios.get(`${ML_SERVICE_URL}/recommend/typeahead`, { params: { q: query, limit } });
      return res.data.suggestions || [];
    } catch (err) {
      return [];
    }
  },

  // Curated Decks
  async getCuratedDecks() {
    try {
      const res = await axios.get(`${ML_SERVICE_URL}/recommend/curated-decks`);
      return res.data.decks || [];
    } catch (err) {
      return [];
    }
  }
};

export default recommendationService;
