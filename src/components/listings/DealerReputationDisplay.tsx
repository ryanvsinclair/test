'use client';

import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DealerReputationDisplayProps {
  dealerId: string;
  dealerName?: string;
  location?: string;
  onClick?: () => void;
}

// Mock dealer reputation data - in production, fetch from API
const DEALER_REPUTATION: Record<string, {
  averageRating?: number;
  totalReviews?: number;
  verifiedDealer?: boolean;
  carlyRating?: number;
  isNewDealer?: boolean;
}> = {
  'seller1': {
    averageRating: 4.7,
    totalReviews: 189,
    verifiedDealer: true,
    carlyRating: 8.5,
  },
  'seller3': {
    averageRating: 4.9,
    totalReviews: 342,
    verifiedDealer: true,
    carlyRating: 9.2,
  },
  'seller5': {
    averageRating: 4.4,
    totalReviews: 87,
    verifiedDealer: true,
  },
  'seller7': {
    isNewDealer: true,
    verifiedDealer: true,
  },
  'seller8': {
    averageRating: 4.6,
    totalReviews: 156,
    verifiedDealer: true,
    carlyRating: 8.2,
  },
  'seller9': {
    averageRating: 4.8,
    totalReviews: 203,
    verifiedDealer: true,
    carlyRating: 8.9,
  },
};

export function DealerReputationDisplay({ dealerId, dealerName, location, onClick }: DealerReputationDisplayProps) {
  const reputation = DEALER_REPUTATION[dealerId];

  // Empty state for dealers not in mock data
  if (!reputation) {
    return (
      <p className="text-sm text-muted-foreground">Dealer</p>
    );
  }

  // New dealer state
  if (reputation.isNewDealer) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">New dealer on Carly</p>
      </div>
    );
  }

  // Dealer with reviews
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        className="flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {/* Carly Stars (convert from /10 to /5) */}
        {reputation.carlyRating ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => {
              const carlyOutOfFive = reputation.carlyRating! / 2;
              const filled = i < Math.floor(carlyOutOfFive);
              const partial = i === Math.floor(carlyOutOfFive) && carlyOutOfFive % 1 !== 0;
              
              return (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    filled
                      ? 'fill-yellow-500 text-yellow-500'
                      : partial
                      ? 'fill-yellow-500/50 text-yellow-500'
                      : 'text-muted-foreground/30'
                  }`}
                />
              );
            })}
          </>
        ) : (
          <>
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-sm font-medium">{reputation.averageRating?.toFixed(1)}</span>
          </>
        )}
        <span className="text-xs text-muted-foreground">
          ({reputation.totalReviews})
        </span>
      </button>
      
      {reputation.carlyRating && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                className="hover:opacity-80 transition-opacity"
              >
                <Badge 
                  variant="secondary" 
                  className="text-xs h-5 px-1.5 bg-accent/10 text-accent border-accent/20 cursor-pointer"
                >
                  Carly {reputation.carlyRating}
                </Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">Carly Rating</p>
                <p className="text-xs text-muted-foreground">
                  Based on response time, customer satisfaction, inventory accuracy, and platform engagement.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
