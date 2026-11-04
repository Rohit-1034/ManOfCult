import React from 'react';
import ContentPoster from './ContentPoster';

/**
 * Reusable MoviePoster component - powered by ContentPoster for TMDB movie & TV support.
 */
export default function MoviePoster(props) {
  return <ContentPoster {...props} mediaType={props.mediaType || 'movie'} />;
}
