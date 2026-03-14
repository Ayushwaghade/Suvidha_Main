"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type StarRatingProps = {
  rating: number;
  totalStars?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: number;
};

export function StarRating({
  rating,
  totalStars = 5,
  interactive = false,
  onRatingChange,
  size = 16,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleRating = (rate: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(rate);
    }
  };

  const handleMouseEnter = (rate: number) => {
    if (interactive) {
      setHoverRating(rate);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", interactive && "cursor-pointer")}>
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        const currentRating = hoverRating || rating;
        return (
          <Star
            key={index}
            className={cn(
              'transition-colors',
              starValue <= currentRating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300',
              interactive && 'hover:text-yellow-400'
            )}
            style={{ width: size, height: size }}
            onClick={() => handleRating(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
    </div>
  );
}
