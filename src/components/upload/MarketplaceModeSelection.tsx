'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MarketplaceMode } from '@/types';
import { CheckCircle, Wrench, Hammer, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceModeSelectionProps {
  selectedMode: MarketplaceMode | null;
  onModeSelect: (mode: MarketplaceMode) => void;
}

const modes = [
  {
    id: 'road-ready' as MarketplaceMode,
    label: 'Carly Verified',
    icon: CheckCircle,
    description: 'Inspection-backed, running, and road-ready vehicles',
    requirements: [
      'Vehicle must be running',
      'Inspection report required',
      'Only minor or no issues allowed'
    ],
    buyerExpectation: 'Buyers expect vehicles that are fully road-ready and can be driven immediately.',
    color: 'green'
  },
  {
    id: 'near-road-ready' as MarketplaceMode,
    label: 'The Hub',
    icon: Wrench,
    description: 'Running vehicles that may need minor work before full road readiness',
    requirements: [
      'Vehicle must be running',
      'Minor issues that need addressing',
      'List estimated fixes required',
      'Inspection optional but encouraged'
    ],
    buyerExpectation: 'Buyers expect running vehicles that need minor attention before being fully road-ready.',
    color: 'blue'
  },
  {
    id: 'builders-market' as MarketplaceMode,
    label: "Builder's Market",
    icon: Hammer,
    description: 'Project vehicles, non-running, uninspected, or export-only',
    requirements: [
      'Non-running vehicles',
      'OR uninspected vehicles',
      'OR intended for project use',
      'Disclosure acknowledgment required'
    ],
    buyerExpectation: 'Buyers expect project vehicles that are NOT road-ready and may require significant work.',
    color: 'purple',
    isWarning: true
  }
] as const;

export function MarketplaceModeSelection({ 
  selectedMode, 
  onModeSelect 
}: MarketplaceModeSelectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light tracking-tight text-foreground mb-2">
          Choose Marketplace Mode
        </h2>
        <p className="text-sm text-muted-foreground">
          Select the marketplace that best describes your vehicle's condition. This determines where your listing appears and what buyers expect.
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <Card
              key={mode.id}
              className={cn(
                "p-6 cursor-pointer transition-all border-2",
                isSelected
                  ? mode.color === 'green'
                    ? "border-green-500 bg-green-500/5"
                    : mode.color === 'blue'
                    ? "border-blue-500 bg-blue-500/5"
                    : "border-purple-500 bg-purple-500/5"
                  : "border-border hover:border-muted-foreground/30",
                mode.isWarning && !isSelected && "hover:border-purple-500/30"
              )}
              onClick={() => onModeSelect(mode.id)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      mode.color === 'green' ? "bg-green-500/10" :
                      mode.color === 'blue' ? "bg-blue-500/10" :
                      "bg-purple-500/10"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        mode.color === 'green' ? "text-green-600 dark:text-green-500" :
                        mode.color === 'blue' ? "text-blue-600 dark:text-blue-500" :
                        "text-purple-600 dark:text-purple-500"
                      )} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{mode.label}</h3>
                    </div>
                  </div>
                  {isSelected && (
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      mode.color === 'green' ? "bg-green-500" :
                      mode.color === 'blue' ? "bg-blue-500" :
                      "bg-purple-500"
                    )}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {mode.description}
                </p>

                {/* Requirements */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">Requirements:</p>
                  <ul className="space-y-1.5">
                    {mode.requirements.map((req, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className={cn(
                          "w-1 h-1 rounded-full mt-1.5 flex-shrink-0",
                          mode.color === 'green' ? "bg-green-500" :
                          mode.color === 'blue' ? "bg-blue-500" :
                          "bg-purple-500"
                        )} />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Buyer Expectation */}
                <div className={cn(
                  "p-3 rounded-lg space-y-1",
                  mode.color === 'green' ? "bg-green-500/5 border border-green-500/20" :
                  mode.color === 'blue' ? "bg-blue-500/5 border border-blue-500/20" :
                  "bg-purple-500/5 border border-purple-500/20"
                )}>
                  <div className="flex items-center gap-1.5">
                    <Info className={cn(
                      "w-3 h-3",
                      mode.color === 'green' ? "text-green-600 dark:text-green-500" :
                      mode.color === 'blue' ? "text-blue-600 dark:text-blue-500" :
                      "text-purple-600 dark:text-purple-500"
                    )} />
                    <p className={cn(
                      "text-xs font-medium",
                      mode.color === 'green' ? "text-green-900 dark:text-green-500" :
                      mode.color === 'blue' ? "text-blue-900 dark:text-blue-500" :
                      "text-purple-900 dark:text-purple-500"
                    )}>
                      Buyer Expectation
                    </p>
                  </div>
                  <p className={cn(
                    "text-xs",
                    mode.color === 'green' ? "text-green-700 dark:text-green-600" :
                    mode.color === 'blue' ? "text-blue-700 dark:text-blue-600" :
                    "text-purple-700 dark:text-purple-600"
                  )}>
                    {mode.buyerExpectation}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <Card className="bg-muted/30 border-muted p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Important: Mode cannot be changed after publishing
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Choose carefully. Once your listing is published, changing the marketplace mode will require admin review. 
              Make sure your vehicle meets all requirements for the selected mode.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
