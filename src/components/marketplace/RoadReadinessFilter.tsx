'use client';

import { CheckCircle, Wrench, Hammer, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  RoadReadinessState, 
  ROAD_READINESS_STATES,
  labelForState 
} from '@/lib/marketplace/roadReadinessStates';

interface RoadReadinessFilterProps {
  showNewInventory: boolean;
  showCarlyVerified: boolean;
  showTheHub: boolean;
  showBuildersMarket: boolean;
  onToggle: (state: RoadReadinessState) => void;
}

export function RoadReadinessFilter({
  showNewInventory,
  showCarlyVerified,
  showTheHub,
  showBuildersMarket,
  onToggle
}: RoadReadinessFilterProps) {
  const filters = [
    {
      state: ROAD_READINESS_STATES.CARLY_VERIFIED,
      label: labelForState(ROAD_READINESS_STATES.CARLY_VERIFIED),
      icon: CheckCircle,
      active: showCarlyVerified,
      color: 'green'
    },
    {
      state: ROAD_READINESS_STATES.NEW_INVENTORY,
      label: labelForState(ROAD_READINESS_STATES.NEW_INVENTORY),
      icon: Sparkles,
      active: showNewInventory,
      color: 'slate'
    },
    {
      state: ROAD_READINESS_STATES.THE_HUB,
      label: labelForState(ROAD_READINESS_STATES.THE_HUB),
      icon: Wrench,
      active: showTheHub,
      color: 'blue'
    },
    {
      state: ROAD_READINESS_STATES.BUILDERS_MARKET,
      label: labelForState(ROAD_READINESS_STATES.BUILDERS_MARKET),
      icon: Hammer,
      active: showBuildersMarket,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Show:</span>
        <div className="flex gap-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.state}
                onClick={() => onToggle(filter.state)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  filter.active
                    ? filter.color === 'green'
                      ? "bg-green-500 text-white border-green-600"
                      : filter.color === 'slate'
                      ? "bg-slate-500 text-white border-slate-600"
                      : filter.color === 'blue'
                      ? "bg-blue-500 text-white border-blue-600"
                      : "bg-purple-500 text-white border-purple-600"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Context Messages */}
      {!showCarlyVerified && showTheHub && !showBuildersMarket && (
        <p className="text-[0.85rem] text-muted-foreground/70 leading-relaxed mt-2">
          The Hub is Carly's central marketplace for vehicles in generally good condition.
          Listings are curated, but availability, condition, and outcomes are never guaranteed.
        </p>
      )}
      
      {showCarlyVerified && showTheHub && !showBuildersMarket && (
        <p className="text-xs text-muted-foreground">
          Showing Carly Verified and The Hub vehicles
        </p>
      )}
      
      {showCarlyVerified && !showTheHub && !showBuildersMarket && (
        <p className="text-xs text-muted-foreground">
          Showing only Carly Verified vehicles (highest quality)
        </p>
      )}
      
      {showBuildersMarket && (
        <p className="text-xs text-purple-700 dark:text-purple-400">
          ⚠️ Including builder's market vehicles (non-road-ready)
        </p>
      )}
    </div>
  );
}
