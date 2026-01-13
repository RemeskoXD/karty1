import React from 'react';
import { Suit } from '../types';

export const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export const DiamondIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
     <path d="M12 2L2 12l10 10 10-10L12 2z"/>
  </svg>
);

// Using Clover shape for Clubs/Žaludy
export const ClubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.38 10.97c1.37-1.48 1.4-3.79.03-5.16-1.37-1.37-3.59-1.37-4.96 0-.32.32-.57.69-.76 1.1C13.25 4.88 11.2 3.5 8.95 4.1c-1.8.48-3.08 2.09-3.15 3.95-.01.37.04.74.15 1.09-1.74.45-3.06 1.99-3.06 3.86 0 2.21 1.79 4 4 4 .27 0 .54-.03.79-.08C8.5 18.78 10.1 20 12 20v4h.01V20c1.89 0 3.48-1.21 4.3-2.92.26.05.53.08.81.08 2.21 0 4-1.79 4-4 0-1.04-.4-1.99-1.06-2.7L19.38 10.97z" />
  </svg>
);

// Using Spade shape for Spades/Listy
export const SpadeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C9 7 5 9 5 13c0 2.76 2.24 5 5 5v3h4v-3c2.76 0 5-2.24 5-5 0-4-4-6-7-11z" />
  </svg>
);

export const JokerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12,2L14.5,9H22L16,13.5L18.5,21L12,16.5L5.5,21L8,13.5L2,9H9.5L12,2M12,5.8L10.5,10.5H5.8L9.6,13.3L8.2,17.8L12,15L15.8,17.8L14.4,13.3L18.2,10.5H13.5L12,5.8Z" />
  </svg>
);

export const getSuitIcon = (suit: Suit, className?: string, isJoker?: boolean) => {
  if (isJoker) return <JokerIcon className={className} />;

  switch (suit) {
    case Suit.Hearts: return <HeartIcon className={`text-red-500 ${className}`} />;
    case Suit.Diamonds: return <DiamondIcon className={`text-orange-500 ${className}`} />;
    case Suit.Clubs: return <ClubIcon className={`text-slate-800 ${className}`} />;
    case Suit.Spades: return <SpadeIcon className={`text-green-700 ${className}`} />;
    default: return null;
  }
};