'use client';

import { useState, useEffect } from 'react';
import { Vehicle, DealerInfo } from '@/types';
import { dealerInventoryAPI } from '@/lib/api/dealer-inventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  MapPin, 
  Star, 
  MessageSquare, 
  ExternalLink,
  Clock,
  Shield,
  CheckCircle2,
  Heart,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DealerProfilePopupProps {
  open: boolean;
  onClose: () => void;
  dealerInfo: DealerInfo;
  dealerId: string;
  currentVehicleId: string;
  onVehicleSelect: (vehicleId: string) => void;
  onMessageDealer: () => void;
  defaultTab?: 'profile' | 'reputation';
}

// Mock dealer reputation data
const DEALER_REPUTATION_FULL: Record<string, {
  averageRating: number;
  totalReviews: number;
  carlyRating: number;
  googleReviews: number;
  carlyReviews: number;
  responsiveness: number;
  accuracy: number;
  communication: number;
  reviews: Array<{
    author: string;
    rating: number;
    text: string;
    date: string;
    verified: boolean;
  }>;
}> = {
  'seller1': {
    averageRating: 4.7,
    totalReviews: 189,
    carlyRating: 8.5,
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

export function DealerProfilePopup({
  open,
  onClose,
  dealerInfo,
  dealerId,
  currentVehicleId,
  onVehicleSelect,
  onMessageDealer,
  defaultTab = 'profile'
}: DealerProfilePopupProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState('< 1 hour');
  const [activeTab, setActiveTab] = useState<'profile' | 'reputation'>(defaultTab);
  
  const reputation = DEALER_REPUTATION_FULL[dealerId as keyof typeof DEALER_REPUTATION_FULL];

  // Sync activeTab with defaultTab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  useEffect(() => {
    if (open) {
      loadDealerInventory();
    }
  }, [open, dealerId, currentVehicleId]);

  const loadDealerInventory = async () => {
    setLoading(true);
    
    try {
      // Fetch similar vehicles first, then other active listings
      const [similarVehicles, allInventory, dealerResponseTime] = await Promise.all([
        dealerInventoryAPI.getSimilarDealerVehicles(currentVehicleId, dealerId, 8),
        dealerInventoryAPI.getDealerInventory({
          dealerId,
          excludeVehicleId: currentVehicleId,
          status: 'active',
          sortBy: 'newest',
          limit: 12
        }),
        dealerInventoryAPI.getDealerResponseTime(dealerId)
      ]);

      // Merge similar vehicles first, then fill with other inventory
      const uniqueVehicles = [...similarVehicles];
      const similarIds = new Set(similarVehicles.map(v => v.id));
      
      for (const vehicle of allInventory) {
        if (!similarIds.has(vehicle.id) && uniqueVehicles.length < 8) {
          uniqueVehicles.push(vehicle);
        }
      }

      setVehicles(uniqueVehicles);
      setResponseTime(dealerResponseTime);
    } catch (error) {
      console.error('Failed to load dealer inventory:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleClick = (vehicleId: string) => {
    onVehicleSelect(vehicleId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 sm:rounded-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-[48%] data-[state=open]:slide-in-from-bottom-[48%] sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-top-[48%]"
        aria-describedby="dealer-profile-description"
      >
        {/* Fixed Header */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex-shrink-0 border-b">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Store className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <DialogTitle className="text-xl sm:text-2xl font-light">
                  <span className="truncate">{dealerInfo.dealershipName}</span>
                </DialogTitle>
                <Shield className="w-4 h-4 text-accent flex-shrink-0" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  <span className="truncate">{dealerInfo.city}, {dealerInfo.region}</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex flex-col gap-2">
              <Button 
                onClick={onMessageDealer}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Message Dealer
              </Button>
            </div>
          </div>

          {/* Mobile Message Button */}
          <div className="sm:hidden mt-3">
            <Button 
              onClick={onMessageDealer}
              className="w-full gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Message Dealer
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-light">{vehicles.length + 1}</p>
              <p className="text-xs text-muted-foreground">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light">{responseTime}</p>
              <p className="text-xs text-muted-foreground">Avg Response Time</p>
            </div>
          </div>

        </DialogHeader>

        {/* Tabs and Scrollable Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'profile' | 'reputation')} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full grid grid-cols-2 mx-4 sm:mx-6 mt-4 flex-shrink-0">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="reputation">Reputation</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            <TabsContent value="profile" className="mt-0 space-y-8">
              {/* Dealer Context Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">About This Dealer</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {(dealerInfo.dealershipType === 'USED' || dealerInfo.dealershipType === 'local_used') && 
                        'Quality pre-owned vehicles from a trusted local dealer. Specializing in reliable, inspected used cars with comprehensive service history.'
                      }
                      {(dealerInfo.dealershipType === 'NEW' || dealerInfo.dealershipType === 'branded_new') && 
                        'Authorized dealer offering new and certified pre-owned vehicles. Factory-trained technicians and genuine parts guarantee.'
                      }
                      {dealerInfo.dealershipType === 'independent_mixed' && 
                        'Quality pre-owned vehicles from a trusted local dealer. Specializing in reliable, inspected used cars with comprehensive service history.'
                      }
                    </p>
                  </div>

                  {/* Hours */}
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Today's Hours</p>
                      <p className="text-sm text-muted-foreground">
                        {dealerInfo.openingTime} - {dealerInfo.closingTime}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dealer Inventory Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">More From This Dealer</h3>
                  <p className="text-sm text-muted-foreground">
                    {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} available
                  </p>
                </div>

            {/* ALWAYS RENDER - Section is mandatory regardless of inventory count */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="w-full aspect-[4/3] rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {vehicles.map(vehicle => (
                  <div
                    key={vehicle.id}
                    onClick={() => handleVehicleClick(vehicle.id)}
                    className="group cursor-pointer bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      <img
                        src={vehicle.images[0]}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {vehicle.isSaved && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-card/95 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                          </div>
                        </div>
                      )}
                      {vehicle.status !== 'active' && (
                        <Badge 
                          className="absolute top-2 left-2"
                          variant={vehicle.status === 'sold' ? 'secondary' : 'outline'}
                        >
                          {vehicle.status}
                        </Badge>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2">
                      <h4 className="font-semibold text-sm line-clamp-1">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                        {vehicle.trim && ` ${vehicle.trim}`}
                      </h4>
                      <div className="flex items-baseline justify-between">
                        <p className="text-xl font-light">
                          ${vehicle.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(vehicle.mileage / 1000).toFixed(0)}K mi
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="flex-1 text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVehicleClick(vehicle.id);
                          }}
                        >
                          View Listing
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="font-medium text-muted-foreground mb-1">
                  No other vehicles available
                </p>
                <p className="text-sm text-muted-foreground">
                  This is the only active listing from this dealer
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reputation" className="mt-0 space-y-8">
          {reputation ? (
            <>
              {/* Carly Rating Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  {/* Carly Stars */}
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
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{reputation.totalReviews} total reviews</p>
                  <p className="text-xs">
                    {reputation.googleReviews} Google · {reputation.carlyReviews} Carly
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(dealerInfo.dealershipName + ' ' + dealerInfo.city + ', ' + dealerInfo.region)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    View all reviews on Google →
                  </a>
                </div>
              </div>

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
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No reputation data available</p>
            </div>
          )}
        </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
