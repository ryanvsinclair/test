'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PublishFlowData } from '@/types/publish-flow';
import { AlertCircle } from 'lucide-react';

interface VehicleConditionStepProps {
  data: PublishFlowData;
  onChange: (updates: Partial<PublishFlowData>) => void;
}

export function VehicleConditionStep({ data, onChange }: VehicleConditionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-foreground mb-2">
          Step 1: Vehicle Condition
        </h2>
        <p className="text-sm text-muted-foreground">
          Answer these questions honestly to help us determine the appropriate marketplace category for your vehicle.
        </p>
      </div>

      {/* Is Running */}
      <Card className="p-5 space-y-4 bg-muted/30">
        <div>
          <Label className="text-base font-medium">
            Is the vehicle currently running?
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Can you start the engine and have it run smoothly?
          </p>
        </div>
        
        <RadioGroup
          value={data.isRunning === null ? undefined : data.isRunning ? 'yes' : 'no'}
          onValueChange={(value) => onChange({ isRunning: value === 'yes' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="running-yes" />
            <Label htmlFor="running-yes" className="font-normal cursor-pointer">
              Yes, the vehicle is running
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="running-no" />
            <Label htmlFor="running-no" className="font-normal cursor-pointer">
              No, the vehicle is not running
            </Label>
          </div>
        </RadioGroup>

        {data.isRunning === false && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-600">
              If the vehicle is not running, it cannot be Carly Verified. It will be classified as Builder's Market.
            </p>
          </div>
        )}
      </Card>

      {/* Is Drivable */}
      <Card className="p-5 space-y-4 bg-muted/30">
        <div>
          <Label className="text-base font-medium">
            Is the vehicle drivable today?
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Can you safely drive it on local roads right now?
          </p>
        </div>
        
        <RadioGroup
          value={data.isDrivable === null ? undefined : data.isDrivable ? 'yes' : 'no'}
          onValueChange={(value) => onChange({ isDrivable: value === 'yes' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="drivable-yes" />
            <Label htmlFor="drivable-yes" className="font-normal cursor-pointer">
              Yes, the vehicle is drivable
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="drivable-no" />
            <Label htmlFor="drivable-no" className="font-normal cursor-pointer">
              No, the vehicle is not drivable
            </Label>
          </div>
        </RadioGroup>

        {data.isDrivable === false && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-600">
              If the vehicle is not drivable, it will be classified as Builder's Market.
            </p>
          </div>
        )}
      </Card>

      {/* Is Legally Operable */}
      <Card className="p-5 space-y-4 bg-muted/30">
        <div>
          <Label className="text-base font-medium">
            Is the vehicle legally operable on public roads?
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Does it have valid registration, insurance, and pass safety requirements?
          </p>
        </div>
        
        <RadioGroup
          value={data.isLegallyOperable === null ? undefined : data.isLegallyOperable ? 'yes' : 'no'}
          onValueChange={(value) => onChange({ isLegallyOperable: value === 'yes' })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="legal-yes" />
            <Label htmlFor="legal-yes" className="font-normal cursor-pointer">
              Yes, it's legally operable
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="legal-no" />
            <Label htmlFor="legal-no" className="font-normal cursor-pointer">
              No, it's not legally operable
            </Label>
          </div>
        </RadioGroup>

        {data.isLegallyOperable === false && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-600">
              Vehicles that are not legally operable will be classified as Builder's Market.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
