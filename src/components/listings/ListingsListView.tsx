'use client';

import { Vehicle } from '@/types';
import { Heart, MapPin, Gauge, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { formatVehicleMileage } from '@/lib/units';
import { generateVehicleTags, getTagStyle } from '@/lib/smart-tags';
import { useRouter } from 'next/navigation';
import { analyticsAPI } from '@/lib/api/analytics';
import { hideListing } from '@/lib/api/taste-learning';
import { calculateWarrantyEstimates, getWarrantySummaryText } from '@/lib/warranty-estimator';
import { Shield } from 'lucide-react';

interface ListingsListViewProps {
  vehicles: Vehicle[];
  showSaveButton?: boolean;
  onHide?: (vehicleId: string) => void;
}

export function ListingsListView({ vehicles, showSaveButton = true, onHide }: ListingsListViewProps) {
  return (
    <div className="space-y-2">
      {vehicles.map((vehicle) => (
        <ListingRow 
          key={vehicle.id} 
          vehicle={vehicle}
          showSaveButton={showSaveButton}
          onHide={onHide}
        />
      ))}
    </div>
  );
}

interface ListingRowProps {
  vehicle: Vehicle;
  showSaveButton?: boolean;
  onHide?: (vehicleId: string) => void;
}

function ListingRow({ vehicle, showSaveButton = true, onHide }: ListingRowProps) {
  const { isBuyer, isLoggedOut, isSaved: isVehicleSaved, saveVehicle, unsaveVehicle, user } = useAuth();
  const router = useRouter();
  const [isHiding, setIsHiding] = useState(false);
  const [localVehicle, setLocalVehicle] = useState(vehicle);

  const saved = isVehicleSaved(vehicle.id);
  const showHideButton = user?.preferences?.refineFeedEnabled && isBuyer && !isLoggedOut;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoggedOut) {
      router.push(`/?redirect=/listings/${vehicle.id}`);
      return;
    }

    if (!isBuyer || !user) {
      return;
    }

    try {
      if (saved) {
        await unsaveVehicle(vehicle.id);
        await analyticsAPI.unsaveListing(vehicle.id, user.id);
        setLocalVehicle({
          ...localVehicle,
          saveCount: Math.max(0, (localVehicle.saveCount || 0) - 1),
        });
      } else {
        await saveVehicle(vehicle.id);
        await analyticsAPI.saveListing(vehicle.id, user.id);
        setLocalVehicle({
          ...localVehicle,
          saveCount: (localVehicle.saveCount || 0) + 1,
        });
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    }
  };

  const handleHide = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    setIsHiding(true);

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
      
      setTimeout(() => {
        onHide?.(vehicle.id);
      }, 300);
    } catch (error) {
      console.error('Failed to hide vehicle:', error);
      setIsHiding(false);
    }
  };

  const handleRowClick = () => {
    router.push(`/listings/${vehicle.id}`);
  };

  const tags = generateVehicleTags(localVehicle);

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "group flex items-center gap-5 p-5 bg-card dark:bg-card rounded-lg border border-border dark:border-neutral-800 cursor-pointer relative",
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
      {/* Thumbnail - Larger & Taller */}
      <div className="flex-shrink-0 w-40 h-28 rounded-lg overflow-hidden bg-muted">
        <img
          src={localVehicle.images?.[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80'}
          alt={`${localVehicle.year} ${localVehicle.make} ${localVehicle.model}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Vehicle Info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-center self-center">
        {/* Title */}
        <div className="md:col-span-1">
          <h3 className="font-semibold text-foreground truncate">
            {localVehicle.year} {localVehicle.make} {localVehicle.model}
          </h3>
          
          {/* Status Tags */}
          {tags.status.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-1">>
              {tags.status.map((tag) => {
                const style = getTagStyle(tag, 'status');
                return (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-medium"
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
          
          {/* Smart Tags */}
          {tags.smart.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {tags.smart.slice(0, 2).map((tag) => {
                const style = getTagStyle(tag, 'smart');
                return (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-lg font-medium"
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
        </div>

        {/* Price & Warranty */}
        <div className="md:col-span-1 space-y-2">
          <p className="text-xl font-bold text-foreground">
            ${localVehicle.price.toLocaleString()}
          </p>
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
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {summaryText}
                  </span>
                </div>
              );
            }
            
            // Show "No warranty remaining" if all expired
            if (estimates.length > 0) {
              return (
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    No warranty remaining
                  </span>
                </div>
              );
            }
            
            return null;
          })()}
        </div>

        {/* Mileage */}
        <div className="md:col-span-1 flex items-center gap-2.5 text-sm text-muted-foreground dark:text-neutral-400">
          <Gauge className="w-4 h-4" />
          <span>{formatVehicleMileage(localVehicle.mileage, localVehicle.location)}</span>
        </div>

        {/* Location */}
        <div className="md:col-span-1 flex items-center gap-2.5 text-sm text-muted-foreground dark:text-neutral-400">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{localVehicle.location}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-2 self-center">
        {/* Hide Button */}
        {showHideButton && (
          <button
            onClick={handleHide}
            className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-destructive/90 hover:border-destructive transition-all duration-200 hover:scale-110 group/hide"
            title="Hide this listing"
          >
            <X className="w-4 h-4 text-foreground group-hover/hide:text-white transition-colors" />
          </button>
        )}

        {/* Save Button */}
        {showSaveButton && !(!isLoggedOut && !isBuyer) && (
          <button
            onClick={handleSave}
            className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-all duration-200 hover:scale-110"
            title={isLoggedOut ? "Sign in to save" : saved ? "Remove from garage" : "Save to garage"}
          >
            <Heart
              className={cn(
                'w-4 h-4 transition-all duration-200',
                saved ? 'fill-current heart-active' : 'text-foreground'
              )}
            />
          </button>
        )}

        {/* View Details */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick();
          }}
          className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-all duration-200"
          title="View details"
        >
          <ExternalLink className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}
