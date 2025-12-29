'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PublishFlowData, PublishFlowStep } from '@/types/publish-flow';
import { RoadReadinessState } from '@/types';
import { assignRoadReadinessState, getStateAssignmentExplanation, validatePublishFlowData } from '@/lib/publish/state-assignment';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VehicleConditionStep } from './steps/VehicleConditionStep';
import { InspectionStep } from './steps/InspectionStep';
import { IssuesDisclosureStep } from './steps/IssuesDisclosureStep';
import { StateReviewStep } from './steps/StateReviewStep';
import { AcknowledgementStep } from './steps/AcknowledgementStep';

interface PublishFlowWizardProps {
  vehicleId: string;
  vehicleName: string;
  onPublish: (data: PublishFlowData, state: RoadReadinessState) => Promise<void>;
  onCancel: () => void;
}

export function PublishFlowWizard({
  vehicleId,
  vehicleName,
  onPublish,
  onCancel
}: PublishFlowWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const [flowData, setFlowData] = useState<PublishFlowData>({
    isRunning: null,
    isDrivable: null,
    isLegallyOperable: null,
    inspectionStatus: null,
    issueSeverity: null,
    acknowledgementConfirmed: false
  });

  // Calculate steps completion
  const steps: PublishFlowStep[] = [
    {
      number: 1,
      title: 'Vehicle Condition',
      completed: flowData.isRunning !== null && flowData.isDrivable !== null && flowData.isLegallyOperable !== null
    },
    {
      number: 2,
      title: 'Inspection',
      completed: flowData.inspectionStatus !== null
    },
    {
      number: 3,
      title: 'Known Issues',
      completed: flowData.issueSeverity !== null && (flowData.issueSeverity === 'none' || !!flowData.issueDescription)
    },
    {
      number: 4,
      title: 'Review State',
      completed: !!flowData.assignedState
    },
    {
      number: 5,
      title: 'Acknowledge',
      completed: flowData.acknowledgementConfirmed
    }
  ];

  // Update assigned state when relevant data changes
  useEffect(() => {
    if (steps[0].completed && steps[1].completed && steps[2].completed) {
      const state = assignRoadReadinessState(flowData);
      setFlowData(prev => ({ ...prev, assignedState: state }));
    }
  }, [flowData.isRunning, flowData.isDrivable, flowData.isLegallyOperable, flowData.inspectionStatus, flowData.issueSeverity]);

  const canGoNext = steps[currentStep - 1].completed;
  const canGoBack = currentStep > 1;
  const canPublish = steps.every(s => s.completed);

  const handleNext = () => {
    if (canGoNext && currentStep < 5) {
      setCurrentStep((currentStep + 1) as any);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep((currentStep - 1) as any);
    }
  };

  const handlePublish = async () => {
    const validation = validatePublishFlowData(flowData);
    
    if (!validation.valid) {
      alert('Please complete all required fields:\n' + validation.errors.join('\n'));
      return;
    }

    if (!flowData.assignedState) {
      alert('Unable to determine road readiness state. Please review your inputs.');
      return;
    }

    setIsPublishing(true);
    try {
      await onPublish(flowData, flowData.assignedState);
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('Failed to publish listing. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light tracking-tight text-foreground">
          Publish to Marketplace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {vehicleName}
        </p>
      </div>

      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    currentStep === step.number
                      ? "bg-primary text-primary-foreground"
                      : step.completed
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.completed ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 text-center",
                  currentStep === step.number
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2",
                  step.completed ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Step Content */}
      <Card className="p-6">
        {currentStep === 1 && (
          <VehicleConditionStep
            data={flowData}
            onChange={(updates) => setFlowData(prev => ({ ...prev, ...updates }))}
          />
        )}
        {currentStep === 2 && (
          <InspectionStep
            data={flowData}
            onChange={(updates) => setFlowData(prev => ({ ...prev, ...updates }))}
          />
        )}
        {currentStep === 3 && (
          <IssuesDisclosureStep
            data={flowData}
            onChange={(updates) => setFlowData(prev => ({ ...prev, ...updates }))}
          />
        )}
        {currentStep === 4 && flowData.assignedState && (
          <StateReviewStep
            data={flowData}
            assignedState={flowData.assignedState}
            explanation={getStateAssignmentExplanation(flowData, flowData.assignedState)}
          />
        )}
        {currentStep === 5 && (
          <AcknowledgementStep
            acknowledged={flowData.acknowledgementConfirmed}
            onAcknowledge={(confirmed) => {
              setFlowData(prev => ({
                ...prev,
                acknowledgementConfirmed: confirmed,
                acknowledgementTimestamp: confirmed ? new Date().toISOString() : undefined
              }));
            }}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep < 5 ? (
          <Button
            onClick={handleNext}
            disabled={!canGoNext}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handlePublish}
            disabled={!canPublish || isPublishing}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isPublishing ? 'Publishing...' : 'Publish to Marketplace'}
          </Button>
        )}
      </div>
    </div>
  );
}
