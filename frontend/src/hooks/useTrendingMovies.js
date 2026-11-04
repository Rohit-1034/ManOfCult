import { useState, useEffect, useCallback } from 'react';
import tmdbService from '../services/tmdbService';

/**
 * Custom hook to fetch and manage trending movies for the Hero Slider.
 * Defaults to 'week', top 8 trending movies.
 */
export function useTrendingMovies(initialTimeWindow = 'week', limit = 8) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeWindow, setTimeWindow] = useState(initialTimeWindow);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await tmdbService.getTrendingMovies(timeWindow);
      // Filter out items without valid backdrop or title
      const validMovies = (results || [])
        .filter(m => (m.backdropPath || m.posterPath) && m.title)
        .slice(0, limit);
      
      setMovies(validMovies);
    } catch (err) {
      console.error('Failed to fetch trending movies:', err);
      setError(err.message || 'Failed to fetch trending movies');
    } finally {
      setLoading(false);
    }
  }, [timeWindow, limit]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return {
    movies,
    loading,
    error,
    timeWindow,
    setTimeWindow,
    refetch: fetchTrending
  };
}

export default useTrendingMovies;
