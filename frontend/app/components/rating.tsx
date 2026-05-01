'use client';

import { Star, StarHalf } from 'lucide-react';

import { cn } from '~/lib/utils';

const MAX_STARS = 5;

type RatingValue = 1 | 2 | 3 | 4 | 5;

interface RatingProps {
  rate: number;
  className?: string;
  showScore?: boolean;
  description?: string;
  onRate?: (value: RatingValue) => void;
  disabled?: boolean;
  ariaLabelForStar?: (value: RatingValue) => string;
}

const Rating = ({
  rate,
  className,
  showScore,
  description,
  onRate,
  disabled,
  ariaLabelForStar,
}: RatingProps) => {
  const interactive = typeof onRate === "function";
  if (!interactive && !rate) return;

  const renderStars = () => {
    const fullStars = Math.floor(rate);
    const hasHalfStar = !interactive && rate % 1 >= 0.5;
    const emptyStars = MAX_STARS - fullStars - (hasHalfStar ? 1 : 0);

    const stars = [];

    const wrap = (index: RatingValue, node: React.ReactNode) => {
      if (!interactive) return node;
      return (
        <button
          key={`rating-star-btn-${index}`}
          type="button"
          disabled={disabled}
          onClick={() => onRate?.(index)}
          aria-label={ariaLabelForStar?.(index) ?? `${index}`}
          aria-pressed={rate === index}
          className="cursor-pointer rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {node}
        </button>
      );
    };

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        wrap(
          (i + 1) as RatingValue,
          <Star
            key={`rating-star-full-${i}`}
            className="fill-foreground stroke-foreground"
          />,
        ),
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="rating-half-star" className="relative">
          <StarHalf className="absolute top-0 right-0 fill-foreground stroke-foreground" />
          <StarHalf className="absolute top-0 left-0 -scale-x-100 fill-foreground/15 stroke-foreground/15" />
        </div>,
      );
    }

    for (let i = 0; i < emptyStars; i++) {
      const starIndex = (fullStars + (hasHalfStar ? 1 : 0) + i + 1) as RatingValue;
      stars.push(
        wrap(
          starIndex,
          <Star
            key={`rating-star-empty-${i}`}
            className="fill-foreground/15 stroke-foreground/15"
          />,
        ),
      );
    }

    return stars;
  };

  // If only score is shown (no description), use horizontal layout
  if (showScore && !description) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 [&_svg]:size-5 [&>div]:size-5',
          className,
        )}
      >
        {renderStars()}
        <span className="text-sm font-semibold">{rate.toFixed(1)}</span>
      </div>
    );
  }

  // If description is provided, use vertical layout
  if (description) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex items-center gap-2 [&_svg]:size-5 [&>div]:size-5">
          {renderStars()}
          {showScore && (
            <span className="text-sm font-semibold">{rate.toFixed(1)}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    );
  }

  // Default: just stars
  return (
    <div
      className={cn(
        'flex items-center gap-1 [&_svg]:size-5 [&>div]:size-5',
        className,
      )}
    >
      {renderStars()}
    </div>
  );
};

export { Rating };
