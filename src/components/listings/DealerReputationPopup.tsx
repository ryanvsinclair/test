'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, MapPin, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DealerReputationPopupProps {
  open: boolean;
  onClose: () => void;
  dealerId: string;
  dealerName: string;
  location?: string;
}

// Mock dealer reputation data - matches DealerReputationDisplay
const DEALER_REPUTATION_FULL = {
  'seller1': {
    averageRating: 4.7,
    totalReviews: 189,
    carlyRating: 8.5,
    location: 'Toronto, ON',
    googleReviews: 167,
    carlyReviews: 22,
    responsiveness: 9.1,
    accuracy: 8.3,
    communication: 8.9,
    reviews: [
      {
        author: 'Sarah M.',
        rating: 5,
        text: 'Excellent experience from start to finish. The team was professional, transparent, and made the whole process stress-free.',
        date: '2 weeks ago',
        verified: true,
      },
      {
        author: 'James K.',
        rating: 5,
        text: 'Found exactly what I was looking for. Great communication and no surprises during the purchase.',
        date: '3 weeks ago',
        verified: true,
      },
      {
        author: 'Maria L.',
        rating: 4,
        text: 'Good selection of vehicles. Delivery was slightly delayed but they kept me updated throughout.',
        date: '1 month ago',
        verified: false,
      },
      {
        author: 'David T.',
        rating: 5,
        text: 'Highly recommend! They went above and beyond to ensure I was satisfied with my purchase.',
        date: '1 month ago',
        verified: true,
      },
    ],
  },
  'seller3': {
    averageRating: 4.9,
    totalReviews: 342,
    carlyRating: 9.2,
    location: 'Vancouver, BC',
    googleReviews: 310,
    carlyReviews: 32,
    responsiveness: 9.5,
    accuracy: 9.0,
    communication: 9.3,
    reviews: [
      {
        author: 'Emily R.',
        rating: 5,
        text: 'Outstanding service! They made buying a car easy and enjoyable. Would definitely buy from them again.',
        date: '1 week ago',
        verified: true,
      },
      {
        author: 'Michael P.',
        rating: 5,
        text: 'Very knowledgeable staff and fair pricing. No pressure sales tactics.',
        date: '2 weeks ago',
        verified: true,
      },
    ],
  },
};

export function DealerReputationPopup({
  open,
  onClose,
  dealerId,
  dealerName,
  location,
}: DealerReputationPopupProps) {
  const reputation = DEALER_REPUTATION_FULL[dealerId as keyof typeof DEALER_REPUTATION_FULL];

  if (!reputation) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-2xl font-light mb-2">{dealerName}</DialogTitle>
          {location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}

          {/* Overall Rating */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-4">
              {/* Carly Stars (convert from /10 to /5) */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const carlyOutOfFive = reputation.carlyRating / 2;
                  const filled = i < Math.floor(carlyOutOfFive);
                  const partial = i === Math.floor(carlyOutOfFive) && carlyOutOfFive % 1 !== 0;
                  
                  return (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        filled
                          ? 'fill-yellow-500 text-yellow-500'
                          : partial
                          ? 'fill-yellow-500/50 text-yellow-500'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  );
                })}
              </div>
              
              {reputation.carlyRating && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="secondary" 
                        className="h-7 px-3 bg-accent/10 text-accent border-accent/20 cursor-help"
                      >
                        Carly {reputation.carlyRating}
                      </Badge>
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
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{reputation.totalReviews} total reviews</p>
              <p className="text-xs">
                {reputation.googleReviews} Google · {reputation.carlyReviews} Carly
              </p>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(dealerName + ' ' + (location || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-1"
              >
                View all reviews on Google →
              </a>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-6 py-6">
          <div className="space-y-8">
            {/* Source Attribution */}
            <div className="p-4 bg-muted/20 rounded-lg border border-muted">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Reputation includes <span className="font-medium text-foreground">{reputation.googleReviews} Google reviews</span> (baseline) and <span className="font-medium text-foreground">{reputation.carlyReviews} Carly verified reviews</span>. Google reviews provide historical context. Carly reputation is calculated from verified behavior and real interactions.
              </p>
            </div>

            {/* Reputation Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Reputation Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Responsiveness</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">How quickly the dealer responds to inquiries</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-light">{reputation.responsiveness}/10</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Accuracy</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">How accurate vehicle listings match reality</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-light">{reputation.accuracy}/10</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Communication</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Quality of communication throughout the process</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-2xl font-light">{reputation.communication}/10</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Reviews */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
              <div className="space-y-4">
                {reputation.reviews.map((review, idx) => (
                  <div key={idx} className="p-4 bg-muted/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{review.author}</p>
                        {/* Buyer verification badges intentionally hidden until feature launch */}
                        {/* {review.verified && (
                          <Badge variant="secondary" className="text-xs h-5 px-2">
                            Verified Buyer
                          </Badge>
                        )} */}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{review.text}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
