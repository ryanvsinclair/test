'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RoadReadinessState } from '@/types';
import { CheckCircle, Wrench, Hammer, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StateConfirmationProps {
  assignedState: RoadReadinessState;
  vehicleData: {
    running: boolean;
    inspectionUploaded: boolean;
    issueSeverity: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export function StateConfirmation({
  assignedState,
  vehicleData,
  onConfirm,
  onCancel
}: StateConfirmationProps) {
  const config = getStateConfig(assignedState);
  const Icon = config.icon;

  return (
    <Card className={cn("p-6 space-y-6", config.borderClass)}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          config.bgClass
        )}>
          <Icon className={cn("w-6 h-6", config.iconClass)} />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-medium text-foreground mb-1">
            Your vehicle will be listed as: {config.label}
          </h3>
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>

      {/* Why this state was assigned */}
      <Card className="bg-muted/50 border-muted p-4">
        <p className="text-xs font-medium text-foreground mb-3">
          This state was determined based on:
        </p>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className={cn(
              "w-1 h-1 rounded-full mt-1.5 flex-shrink-0",
              vehicleData.running ? "bg-green-500" : "bg-red-500"
            )} />
            <span>
              Running status: <strong>{vehicleData.running ? 'Running' : 'Not running'}</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className={cn(
              "w-1 h-1 rounded-full mt-1.5 flex-shrink-0",
              vehicleData.inspectionUploaded ? "bg-green-500" : "bg-amber-500"
            )} />
            <span>
              Inspection: <strong>{vehicleData.inspectionUploaded ? 'Uploaded' : 'Not uploaded'}</strong>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 bg-blue-500" />
            <span>
              Issue severity: <strong className="capitalize">{vehicleData.issueSeverity}</strong>
            </span>
          </li>
        </ul>
      </Card>

      {/* What this means */}
      <div className={cn("p-4 rounded-lg space-y-2", config.infoBg)}>
        <div className="flex items-center gap-2">
          <AlertCircle className={cn("w-4 h-4", config.iconClass)} />
          <p className={cn("text-sm font-medium", config.textClass)}>
            What this means:
          </p>
        </div>
        <ul className={cn("space-y-1.5 text-xs", config.textMutedClass)}>
          {config.implications.map((implication, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="mt-1">•</span>
              <span>{implication}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Go Back & Edit
        </Button>
        <Button
          onClick={onConfirm}
          className={cn("flex-1", config.buttonClass)}
        >
          Confirm & Publish
        </Button>
      </div>
    </Card>
  );
}

function getStateConfig(state: RoadReadinessState) {
  switch (state) {
    case 'carly_verified':
      return {
        label: 'Carly Verified',
        icon: CheckCircle,
        description: 'Your vehicle meets all requirements for Carly Verified status.',
        bgClass: 'bg-green-500/10',
        iconClass: 'text-green-600 dark:text-green-500',
        borderClass: 'border-green-500/20',
        infoBg: 'bg-green-500/5 border border-green-500/20',
        textClass: 'text-green-900 dark:text-green-500',
        textMutedClass: 'text-green-700 dark:text-green-600',
        buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
        implications: [
          'Your listing will receive highest ranking in browse results',
          'Buyers can schedule appointments',
          'Financing options available',
          'Full marketplace visibility'
        ]
      };
    
    case 'the_hub':
      return {
        label: 'The Hub',
        icon: Wrench,
        description: 'Your vehicle is operational but may need minor attention.',
        bgClass: 'bg-blue-500/10',
        iconClass: 'text-blue-600 dark:text-blue-500',
        borderClass: 'border-blue-500/20',
        infoBg: 'bg-blue-500/5 border border-blue-500/20',
        textClass: 'text-blue-900 dark:text-blue-500',
        textMutedClass: 'text-blue-700 dark:text-blue-600',
        buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        implications: [
          'Your listing will be ranked slightly lower than Carly Verified vehicles',
          'Buyers see clear disclosure about needed fixes',
          'Test drives available with disclaimer',
          'Good visibility in marketplace'
        ]
      };
    
    case 'builders_market':
      return {
        label: "Builder's Market",
        icon: Hammer,
        description: 'Your vehicle is classified for project use, export, or restoration.',
        bgClass: 'bg-purple-500/10',
        iconClass: 'text-purple-600 dark:text-purple-500',
        borderClass: 'border-purple-500/20',
        infoBg: 'bg-purple-500/5 border border-purple-500/20',
        textClass: 'text-purple-900 dark:text-purple-500',
        textMutedClass: 'text-purple-700 dark:text-purple-600',
        buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
        implications: [
          "Only visible when buyers enable Builder's Market filter",
          'No test drives available',
          'No financing options',
          'Clear as-is disclosure to buyers',
          'Buyers understand vehicle is not road-ready'
        ]
      };
  }
}
