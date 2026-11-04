import React from 'react';
import ContentCard from './ContentCard';

export default function TVShowCard(props) {
  const show = props.show || props.item || {};
  return (
    <ContentCard
      {...props}
      item={{ ...show, mediaType: 'tv' }}
    />
  );
}
