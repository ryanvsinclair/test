"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Shield, ChevronDown, Info } from 'lucide-react';
import { calculateWarrantyEstimates, hasAnyActiveWarranty, allWarrantiesExpired, WarrantyEstimate } from '@/lib/warranty-estimator';
import { formatVehicleMileage } from '@/lib/units';

interface WarrantyDisplayProps {
  make: string;
  model: string;
  year: number;
  currentMileage: number; // in kilometers
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  location?: string;
  inServiceDate?: Date;
  variant?: 'compact' | 'full';
}

export function WarrantyDisplay({
  make,
  model,
  year,
  currentMileage,
  fuelType,
  location,
  inServiceDate,
  variant = 'compact',
}: WarrantyDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  const estimates = calculateWarrantyEstimates({
    make,
    model,
    year,
    currentMileage,
    fuelType,
    inServiceDate,
  });

  // Don't show if no warranties at all
  if (estimates.length === 0) {
    return null;
  }

  const getWarrantyTypeLabel = (type: WarrantyEstimate['type']): string => {
    switch (type) {
      case 'bumper':
        return 'Bumper-to-Bumper';
      case 'powertrain':
        return 'Powertrain';
      case 'battery':
        return fuelType === 'electric' ? 'EV Battery' : 'Hybrid Battery';
    }
  };

  // VIEW A — CARD GRID VIEW (PRE-EXPANSION)
  // Simple badge: shows if ANY coverage is active
  if (variant === 'compact') {
    const hasActive = hasAnyActiveWarranty(estimates);
    const allExpired = allWarrantiesExpired(estimates);
    
    if (allExpired) {
      return (
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          No factory warranty remaining
        </div>
      );
    }
    
    if (!hasActive) {
      return null;
    }
    
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group">
            <Shield className="w-4 h-4" />
            <div className="flex items-center gap-1">
              <span>Factory warranty available</span>
              {!inServiceDate && (
                <Badge variant="outline" className="bg-blue-950/20 text-blue-400 border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 text-xs">
                  Estimated
                </Badge>
              )}
            </div>
            <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Factory Warranty Coverage
            </DialogTitle>
            <DialogDescription>
              {year} {make} {model}
            </DialogDescription>
          </DialogHeader>

          {/* VIEW B — EXPANDED / INLINE PREVIEW */}
          {/* Show only active coverages */}
          <div className="space-y-3 mt-4">
            {estimates
              .filter(estimate => estimate.status === 'active')
              .map((estimate) => (
                <Card key={estimate.type} className="p-4 border-neutral-200 dark:border-neutral-800 dark:bg-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                        {getWarrantyTypeLabel(estimate.type)}
                      </h4>
                      <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
                        <p>
                          {estimate.inServiceDateKnown ? (
                            <>
                              <span className="font-medium">~{estimate.timeRemainingMonths} months</span> or{' '}
                            </>
                          ) : (
                            <>
                              <span className="font-medium">
                                ~{estimate.timeRangeMonths![0]}–{estimate.timeRangeMonths![1]} months
                              </span> or{' '}
                            </>
                          )}
                          <span className="font-medium">
                            ~{formatVehicleMileage(estimate.mileageRemaining, location)}
                          </span>{' '}
                          remaining
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>

          {/* Show notice if all coverages expired */}
          {allWarrantiesExpired(estimates) && (
            <div className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No factory warranty remaining
            </div>
          )}

          <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 mt-4 flex gap-3">
            <Info className="w-5 h-5 text-neutral-500 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              Estimated using manufacturer warranty terms. 
              {!inServiceDate && ` Exact in-service date may vary. `}
              Contact dealer or check CARFAX for confirmation.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // VIEW C — FULL LISTING DETAIL PAGE
  // Show ALL coverages (active + expired) with full transparency
  return (
    <Card className="border-neutral-200 dark:border-neutral-800 dark:bg-card">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950/20 dark:bg-blue-950/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Factory Warranty</h3>
              {!inServiceDate && (
                <Badge variant="outline" className="bg-blue-950/20 text-blue-400 border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 text-xs mt-1">
                  Estimated
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {estimates.map((estimate) => (
            <div key={estimate.type} className="border-l-2 border-blue-200 dark:border-blue-800 pl-4">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {getWarrantyTypeLabel(estimate.type)}
              </h4>
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                {estimate.status === 'active' ? (
                  <p>
                    {estimate.inServiceDateKnown ? (
                      <>
                        ~<span className="font-medium">{estimate.timeRemainingMonths} months</span> or ~
                      </>
                    ) : (
                      <>
                        ~<span className="font-medium">
                          {estimate.timeRangeMonths![0]}–{estimate.timeRangeMonths![1]} months
                        </span> or ~
                      </>
                    )}
                    <span className="font-medium">
                      {formatVehicleMileage(estimate.mileageRemaining, location)}
                    </span>{' '}
                    remaining
                  </p>
                ) : (
                  <div>
                    <p className="font-medium text-neutral-700 dark:text-neutral-300">Expired</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Coverage expired due to time or mileage limits
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 mt-4 flex gap-3">
          <Info className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Estimated using manufacturer warranty terms. 
            {!inServiceDate && ` Exact in-service date may vary. `}
            Contact dealer or check CARFAX for confirmation.
          </p>
        </div>
      </div>
    </Card>
  );
}
