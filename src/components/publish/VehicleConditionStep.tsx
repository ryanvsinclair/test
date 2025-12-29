'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleConditionStepProps {
  isRunning: boolean | null;
  isDrivable: boolean | null;
  isLegallyOperable: boolean | null;
  onUpdate: (field: 'isRunning' | 'isDrivable' | 'isLegallyOperable', value: boolean) => void;
}

export function VehicleConditionStep({
  isRunning,
  isDrivable,
  isLegallyOperable,
  onUpdate
}: VehicleConditionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light tracking-tight text-foreground mb-2">
          Vehicle Condition
        </h2>
        <p className="text-sm text-muted-foreground">
          Answer these questions about your vehicle's current condition. Your answers determine marketplace eligibility.
        </p>
      </div>

      {/* Is Running */}
      <Card className="p-6 space-y-4">
        <div>
          <Label className="text-base font-medium">
            Is the vehicle currently running? <span className="text-destructive">*</span>
          </Label>
        </div>
        
        <RadioGroup 
          value={isRunning === null ? undefined : String(isRunning)} 
          onValueChange={(value) => onUpdate('isRunning', value === 'true')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="running-yes" />
            <Label htmlFor="running-yes" className="font-normal cursor-pointer">
              Yes, the vehicle is currently running
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="running-no" />
            <Label htmlFor="running-no" className="font-normal cursor-pointer">
              No, the vehicle is not running
            </Label>
          </div>
        </RadioGroup>
        
        {isRunning === false && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-600">
              If the vehicle is not running, it cannot be Road Ready and will be classified as Builder's Market.
            </p>
          </div>
        )}
      </Card>

      {/* Is Drivable */}
      <Card className="p-6 space-y-4">
        <div>
          <Label className="text-base font-medium">
            Is the vehicle drivable today? <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Can you safely drive this vehicle right now without repairs?
          </p>
        </div>
        
        <RadioGroup 
          value={isDrivable === null ? undefined : String(isDrivable)} 
          onValueChange={(value) => onUpdate('isDrivable', value === 'true')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="drivable-yes" />
            <Label htmlFor="drivable-yes" className="font-normal cursor-pointer">
              Yes, it is safe to drive
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="drivable-no" />
            <Label htmlFor="drivable-no" className="font-normal cursor-pointer">
              No, it requires repairs before driving
            </Label>
          </div>
        </RadioGroup>
        
        {isDrivable === false && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-600">
              If the vehicle is not drivable, it will be classified as Builder's Market.
            </p>
          </div>
        )}
      </Card>

      {/* Is Legally Operable */}
      <Card className="p-6 space-y-4">
        <div>
          <Label className="text-base font-medium">
            Is the vehicle legally operable on public roads? <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Does it have current registration, insurance eligibility, and pass safety/emissions requirements?
          </p>
        </div>
        
        <RadioGroup 
          value={isLegallyOperable === null ? undefined : String(isLegallyOperable)} 
          onValueChange={(value) => onUpdate('isLegallyOperable', value === 'true')}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="legal-yes" />
            <Label htmlFor="legal-yes" className="font-normal cursor-pointer">
              Yes, it is legally operable
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="legal-no" />
            <Label htmlFor="legal-no" className="font-normal cursor-pointer">
              No, it does not meet legal requirements
            </Label>
          </div>
        </RadioGroup>
        
        {isLegallyOperable === false && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-600">
              Vehicles that are not legally operable will be classified as Builder's Market.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
