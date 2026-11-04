import React, { useState } from 'react';
import { moviesAPI } from '../api';

export default function ReviewsSection({ movieId, reviewsData, onReviewSubmitted, user, onRequireAuth }) {
  const [filter, setFilter] = useState('newest'); // newest, highest, lowest
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [localHelpfulVotes, setLocalHelpfulVotes] = useState({});

  const reviews = reviewsData?.reviews || [];
  const total = reviewsData?.total || 0;
  const avg = reviewsData?.averageScore || 0;
  const distribution = reviewsData?.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (filter === 'highest') return b.rating - a.rating;
    if (filter === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const handleStartReview = () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setIsWriting(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setErrorMsg('Please enter your review text.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await moviesAPI.submitReview(movieId, {
        rating,
        headline: headline.trim() || `${rating} Stars Review`,
        review: reviewText.trim(),
        containsSpoilers
      });
      setIsWriting(false);
      setHeadline('');
      setReviewText('');
      if (onReviewSubmitted) onReviewSubmitted(res.data.summary);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteHelpful = async (reviewId) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      const res = await moviesAPI.voteHelpful(movieId, reviewId);
      setLocalHelpfulVotes(prev => ({
        ...prev,
        [reviewId]: res.data.review.helpfulCount
      }));
    } catch (err) {
      console.error('Failed to vote review:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reviews Header & Score Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-cinema-darker/60 border border-cinema-border/60 rounded-2xl p-6">
        {/* Left: Overall score */}
        <div className="flex items-center space-x-5">
          <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-cinema-purple/30 to-cinema-accent/20 border border-cinema-purple/40 text-center">
            <span className="text-3xl font-extrabold text-white">{avg > 0 ? avg : '—'}</span>
            <span className="text-xs text-yellow-400 font-semibold tracking-wide">★★★★★</span>
            <span className="text-[10px] text-gray-400 mt-0.5">{total} {total === 1 ? 'review' : 'reviews'}</span>
          </div>

          {/* Rating Distribution Bars */}
          <div className="space-y-1.5 flex-1 min-w-[160px]">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star] || 0;
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={star} className="flex items-center space-x-2 text-xs">
                  <span className="w-5 text-gray-400 text-right">{star}★</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-500 to-cinema-accent rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-[11px] text-gray-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Write Review CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleStartReview}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cinema-purple to-cinema-accent hover:from-purple-600 hover:to-indigo-500 text-white font-semibold shadow-lg hover:shadow-cinema-accent/30 transition-all flex items-center justify-center space-x-2"
          >
            <span>✍</span>
            <span>Write a Review</span>
          </button>
        </div>
      </div>

      {/* Review Writing Form Modal / Card */}
      {isWriting && (
        <form onSubmit={handleSubmitReview} className="bg-cinema-card border border-cinema-accent/50 rounded-2xl p-6 shadow-2xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-white">Share Your Review</h4>
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="text-gray-400 hover:text-white text-sm"
            >
              Cancel ✕
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
              Your Rating (1 to 5 Stars)
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-transform hover:scale-125 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-600'
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="text-sm font-semibold text-gray-300 ml-2">{rating} out of 5</span>
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
              Headline Summary
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Masterful pacing and visual storytelling"
              className="w-full px-4 py-2.5 rounded-xl bg-cinema-darker border border-cinema-border text-white text-sm focus:border-cinema-accent focus:outline-none"
            />
          </div>

          {/* Review Body */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
              Detailed Thoughts
            </label>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What made this movie memorable? Discuss directing, acting, sound, or thematic depth..."
              className="w-full px-4 py-2.5 rounded-xl bg-cinema-darker border border-cinema-border text-white text-sm focus:border-cinema-accent focus:outline-none resize-none"
            />
          </div>

          {/* Spoilers checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="spoilerCheck"
              checked={containsSpoilers}
              onChange={(e) => setContainsSpoilers(e.target.checked)}
              className="rounded bg-cinema-darker border-cinema-border text-cinema-accent focus:ring-0"
            />
            <label htmlFor="spoilerCheck" className="text-xs text-gray-300 cursor-pointer">
              This review contains plot spoilers
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsWriting(false)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-xl bg-cinema-accent hover:bg-cinema-accent/80 text-white font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews Filter Row */}
      <div className="flex items-center justify-between border-b border-cinema-border/50 pb-3">
        <h4 className="text-sm font-bold text-gray-300">
          Audience Feedback ({sortedReviews.length})
        </h4>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500">Sort by:</span>
          {['newest', 'highest', 'lowest'].map((sortType) => (
            <button
              key={sortType}
              onClick={() => setFilter(sortType)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                filter === sortType
                  ? 'bg-cinema-accent text-white font-semibold'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {sortType}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {sortedReviews.length === 0 ? (
        <div className="text-center py-10 bg-cinema-darker/30 rounded-2xl border border-cinema-border/40">
          <p className="text-gray-400 text-sm">No written reviews yet for this title.</p>
          <p className="text-xs text-gray-500 mt-1">Be the first to share your perspective with the CineMatch community!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((rev) => {
            const helpfulCount = localHelpfulVotes[rev.id] !== undefined ? localHelpfulVotes[rev.id] : rev.helpfulCount || 0;
            return (
              <div
                key={rev.id}
                className="bg-cinema-darker/50 border border-cinema-border/50 hover:border-cinema-border rounded-xl p-5 space-y-3 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                      {rev.username ? rev.username.slice(0, 2) : 'CM'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{rev.username || 'Verified Cinephile'}</p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
                    <span>★</span>
                    <span>{rev.rating}/5</span>
                  </div>
                </div>

                {rev.containsSpoilers && (
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-red-900/40 border border-red-500/40 text-red-300">
                    ⚠️ SPOILER WARNING
                  </span>
                )}

                <h5 className="text-sm font-bold text-gray-100">{rev.headline}</h5>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{rev.review}</p>

                <div className="pt-2 flex items-center justify-between border-t border-cinema-border/30 text-xs">
                  <span className="text-gray-500">
                    Was this review helpful?
                  </span>
                  <button
                    onClick={() => handleVoteHelpful(rev.id)}
                    className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  >
                    <span>👍 Helpful</span>
                    <span className="text-cinema-accent font-semibold ml-1">({helpfulCount})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
