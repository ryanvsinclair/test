'use client';

import { Vehicle, User } from '@/types';
import { Heart, MapPin, Gauge, Calendar, X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { formatVehicleMileage } from '@/lib/units';
import { generateVehicleTags, getTagStyle } from '@/lib/smart-tags';
import { useRouter } from 'next/navigation';
import { analyticsAPI } from '@/lib/api/analytics';
import { hideListing } from '@/lib/api/taste-learning';
import { WarrantyDisplay } from '@/components/cards/warranty-display';
import { calculateWarrantyEstimates, getWarrantySummaryText } from '@/lib/warranty-estimator';
import { DealerBannerOverlay } from '@/components/dealer/DealerBannerOverlay';
import { ImageCarouselPopup } from '@/components/ui/image-carousel-popup';
import { generateImageAlt, buildListingSlug } from '@/lib/seo/listing-seo';
import { RoadReadinessBadge } from '@/components/listing/MarketplaceModeBadge';
import { ROAD_READINESS_STATES } from '@/lib/marketplace/roadReadinessStates';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSave?: (vehicleId: string) => void;
  isSaved?: boolean;
  onClick?: () => void;
  showSaveButton?: boolean;
  onHide?: (vehicleId: string) => void; // Callback when vehicle is hidden
}

export function VehicleCard({ vehicle, onSave, isSaved, onClick, showSaveButton = true, onHide }: VehicleCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isBuyer, isLoggedOut, isSaved: isVehicleSaved, saveVehicle, unsaveVehicle, user } = useAuth();
  const router = useRouter();
  const [localVehicle, setLocalVehicle] = useState(vehicle);
  const [isHiding, setIsHiding] = useState(false);
  const [showImageCarousel, setShowImageCarousel] = useState(false);
  const [isHoveringPhoto, setIsHoveringPhoto] = useState(false);
  const [isHoveringBody, setIsHoveringBody] = useState(false);
  
  // Use isSaved prop if provided, otherwise check auth context
  const saved = isSaved !== undefined ? isSaved : isVehicleSaved(vehicle.id);
  
  // Check if user has refineFeedEnabled
  const showHideButton = user?.preferences?.refineFeedEnabled && isBuyer && !isLoggedOut;
  
  // Load analytics on mount
  useEffect(() => {
    const loadAnalytics = async () => {
      const analytics = await analyticsAPI.getListingAnalytics(vehicle.id);
      setLocalVehicle({
        ...vehicle,
        viewCount: analytics.viewCount,
        saveCount: analytics.saveCount,
      });
    };
    
    loadAnalytics();
  }, [vehicle.id]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If logged out, redirect to login
    if (isLoggedOut) {
      router.push(`/?redirect=/listings/${vehicle.id}`);
      return;
    }

    // Only buyers can save
    if (!isBuyer || !user) {
      return;
    }

    try {
      if (saved) {
        await unsaveVehicle(vehicle.id);
        await analyticsAPI.unsaveListing(vehicle.id, user.id);
        // Optimistic update
        setLocalVehicle({
          ...localVehicle,
          saveCount: Math.max(0, (localVehicle.saveCount || 0) - 1),
        });
      } else {
        await saveVehicle(vehicle.id);
        await analyticsAPI.saveListing(vehicle.id, user.id);
        // Optimistic update
        setLocalVehicle({
          ...localVehicle,
          saveCount: (localVehicle.saveCount || 0) + 1,
        });
      }
      onSave?.(vehicle.id);
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const handleHide = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    setIsHiding(true);

    // Extract vehicle attributes for taste learning
    const vehicleAttributes = {
      make: vehicle.make,
      model: vehicle.model,
      bodyType: vehicle.bodyType,
      year: vehicle.year,
      priceRange: vehicle.price < 20000 ? 'under-20k' : vehicle.price < 40000 ? '20k-40k' : 'over-40k',
      mileageRange: vehicle.mileage < 50000 ? 'low' : vehicle.mileage < 100000 ? 'medium' : 'high',
      fuelType: vehicle.fuelType,
      dealerType: vehicle.sellerType,
      certified: vehicle.condition === 'certified',
    };

    try {
      hideListing(user.id, vehicle.listingId, vehicleAttributes);
      
      // Trigger fade-out, then notify parent
      setTimeout(() => {
        onHide?.(vehicle.id);
      }, 300);
    } catch (error) {
      console.error('Failed to hide vehicle:', error);
      setIsHiding(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/listings/${vehicle.id}`);
    }
  };

  const tags = generateVehicleTags(localVehicle);

  return (
    <div
      className={cn(
        "group cursor-pointer bg-card dark:bg-card rounded-xl overflow-hidden border border-border dark:border-neutral-800 block relative w-full",
        "transition-all hover:border-accent/50 dark:hover:border-blue-700/50",
        "hover:z-10 hover:-translate-y-0.5",
        "shadow-sm hover:shadow-md",
        "dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_0_1px_rgba(59,130,246,0.35),0_0_18px_rgba(59,130,246,0.25)]",
        "motion-reduce:hover:transform-none motion-reduce:hover:shadow-sm",
        isHiding && "opacity-0 scale-95"
      )}
      style={{
        transition: 'transform 180ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 180ms ease, border-color 120ms ease'
      }}
    >
      {/* Image Container - 4:3 aspect ratio */}
      <div 
        className="relative aspect-[4/3] bg-muted overflow-hidden cursor-zoom-in"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowImageCarousel(true);
        }}
        onMouseEnter={() => setIsHoveringPhoto(true)}
        onMouseLeave={() => setIsHoveringPhoto(false)}
      >
        <img
          src={localVehicle.images?.[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80'}
          alt={generateImageAlt(localVehicle, 0)}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
            'group-hover:scale-105'
          )}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Photo Hover Overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-150",
            isHoveringPhoto ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <span className="text-white text-sm font-light tracking-wide">
            Expand photos
          </span>
        </div>

        {/* Dealer Banner Overlay */}
        {localVehicle.dealerId && (
          <DealerBannerOverlay 
            dealerId={localVehicle.dealerId} 
            position="bottom-right"
            showDefault={true}
          />
        )}

        {/* Marketplace Mode Badge - Top Left */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
          <RoadReadinessBadge 
            state={localVehicle.roadReadinessState || (localVehicle.marketplaceMode?.replace(/-/g, '_') as any) || ROAD_READINESS_STATES.CARLY_VERIFIED} 
            size="sm" 
          />
        </div>

        {/* Top Right Buttons */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-1.5 sm:gap-2 z-10">
          {/* Hide Button - Only show when toggle is enabled */}
          {showHideButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleHide(e);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/90 transition-all duration-200 hover:scale-110 group/hide"
              title="Hide this listing"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground group-hover/hide:text-white transition-colors" />
            </button>
          )}

          {/* Save Button - Only show for logged-in buyers or logged-out users */}
          {showSaveButton && !(!isLoggedOut && !isBuyer) && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave(e);
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-all duration-200 hover:scale-110 icy-hover"
              title={isLoggedOut ? "Sign in to save" : saved ? "Remove from garage" : "Save to garage"}
            >
              <Heart
                className={cn(
                  'w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200',
                  saved ? 'fill-current heart-active' : 'text-foreground'
                )}
              />
            </button>
          )}
        </div>
      </div>

      {/* Image Carousel Popup */}
      <ImageCarouselPopup
        images={localVehicle.images || ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80']}
        open={showImageCarousel}
        onOpenChange={setShowImageCarousel}
        initialIndex={0}
      />

      {/* Content */}
      <div 
        className="p-4 sm:p-5 space-y-2 sm:space-y-3 relative cursor-pointer"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHoveringBody(true)}
        onMouseLeave={() => setIsHoveringBody(false)}
      >
        {/* Body Hover Overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-150 rounded-b-xl",
            isHoveringBody ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <span className="text-white text-sm font-light tracking-wide">
            Expand listing
          </span>
        </div>
        {/* Title and Price */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {localVehicle.year} {localVehicle.make} {localVehicle.model}
          </h3>
          
          {/* Status Tags - Small, subtle pills */}
          {tags.status.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {tags.status.map((tag) => {
                const style = getTagStyle(tag, 'status');
                return (
                  <span
                    key={tag}
                    className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium uppercase tracking-wide"
                    style={{
                      backgroundColor: style.bgColor,
                      color: style.textColor,
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
          
          <p className="text-xl sm:text-2xl font-light tracking-tight text-foreground">
            ${typeof localVehicle.price === 'number' ? localVehicle.price.toLocaleString() : '0'}
          </p>
        </div>

        {/* Details */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground dark:text-neutral-400">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{formatVehicleMileage(localVehicle.mileage, localVehicle.location)}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{localVehicle.year}</span>
          </div>
        </div>

        {/* Smart Tags - More expressive */}
        {tags.smart.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {tags.smart.map((tag) => {
              const style = getTagStyle(tag, 'smart');
              return (
                <span
                  key={tag}
                  className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium"
                  style={{
                    backgroundColor: style.bgColor,
                    color: style.textColor,
                  }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        {/* Warranty Summary - Collapsed View */}
        {(() => {
          const estimates = calculateWarrantyEstimates({
            make: localVehicle.make,
            model: localVehicle.model,
            year: localVehicle.year,
            currentMileage: localVehicle.mileage,
            fuelType: localVehicle.fuelType,
            inServiceDate: undefined,
            location: localVehicle.location,
          });

          const summaryText = getWarrantySummaryText(estimates);

          if (summaryText) {
            return (
              <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">{summaryText}</span>
              </div>
            );
          }

          return null;
        })()}

        {/* Location */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground dark:text-neutral-400 pt-2 border-t border-border dark:border-neutral-800">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate">{localVehicle.location}</span>
        </div>
      </div>
    </div>
  );
}

export default VehicleCard;
