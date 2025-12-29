'use client';

import { MarketplaceMode } from '@/types';
import { Wrench, CheckCircle, Hammer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceModeToggleProps {
  mode: MarketplaceMode;
  onModeChange: (mode: MarketplaceMode) => void;
}

const modes = [
  {
    id: 'road-ready' as MarketplaceMode,
    label: 'Road Ready',
    icon: CheckCircle,
    description: 'Inspected, running vehicles ready for daily use'
  },
  {
    id: 'near-road-ready' as MarketplaceMode,
    label: 'Near Road Ready',
    icon: Wrench,
    description: 'Running vehicles that may need minor fixes'
  },
  {
    id: 'builders-market' as MarketplaceMode,
    label: "Builder's Market",
    icon: Hammer,
    description: 'Project vehicles, export, restoration, parts'
  }
] as const;

export function MarketplaceModeToggle({ mode, onModeChange }: MarketplaceModeToggleProps) {
  return (
    <div className="w-full">
      {/* Toggle Buttons */}
      <div className="inline-flex items-center bg-muted/50 rounded-xl p-1 border border-border">
        {modes.map((modeOption) => {
          const Icon = modeOption.icon;
          const isActive = mode === modeOption.id;
          
          return (
            <button
              key={modeOption.id}
              onClick={() => onModeChange(modeOption.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{modeOption.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contextual Description */}
      <div className="mt-3">
        {mode === 'road-ready' && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Road Ready:</span> Showing inspected vehicles that are running and ready for daily use. 
            These vehicles have uploaded inspections and minimal issues.
          </p>
        )}
        {mode === 'near-road-ready' && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Near Road Ready:</span> Showing running vehicles that may need minor fixes before daily use. 
            These vehicles are operational but might require some attention.
          </p>
        )}
        {mode === 'builders-market' && (
          <p className="text-xs text-purple-700 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
            <span className="font-medium text-purple-900 dark:text-purple-500">Builder's Market:</span> Showing project vehicles including non-running, 
            uninspected, or vehicles intended for export, restoration, parts, or track use. These are not road-ready vehicles.
          </p>
        )}
      </div>
    </div>
  );
}
