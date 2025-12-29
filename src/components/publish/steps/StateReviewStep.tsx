'use client';

import { Card } from '@/components/ui/card';
import { PublishFlowData, StateAssignmentExplanation } from '@/types/publish-flow';
import { RoadReadinessState } from '@/types';
import { CheckCircle, Wrench, Hammer, Info, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StateReviewStepProps {
  data: PublishFlowData;
  assignedState: RoadReadinessState;
  explanation: StateAssignmentExplanation;
}

export function StateReviewStep({ data, assignedState, explanation }: StateReviewStepProps) {
  const config = getStateConfig(assignedState);
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-foreground mb-2">
          Step 4: Final State Review
        </h2>
        <p className="text-sm text-muted-foreground">
          Review the marketplace category assigned to your vehicle based on the information provided.
        </p>
      </div>

      {/* Assigned State Card */}
      <Card className={cn("p-6 space-y-6", config.borderClass)}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center",
            config.bgClass
          )}>
            <Icon className={cn("w-7 h-7", config.iconClass)} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-medium text-foreground mb-1">
              Your vehicle will be listed as: {config.label}
            </h3>
            <p className="text-sm text-muted-foreground">
              {explanation.reason}
            </p>
          </div>
        </div>

        {/* Requirements Summary */}
        <div className={cn("p-4 rounded-lg space-y-3", config.infoBg)}>
          <p className={cn("text-sm font-medium", config.textClass)}>
            Based on your responses:
          </p>
          <ul className="space-y-2">
            {explanation.requirements.map((req, index) => (
              <li key={index} className={cn("text-xs flex items-start gap-2", config.textMutedClass)}>
                <span className="mt-0.5">{req.startsWith('✓') ? '✓' : '✗'}</span>
                <span>{req.substring(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* What This Means */}
      <Card className="p-5 bg-muted/30">
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              What this means for your listing
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          {assignedState === 'carly_verified' && (
            <>
              <p>✓ Your listing will receive <strong>highest ranking</strong> in browse results</p>
              <p>✓ Buyers can <strong>schedule appointments</strong></p>
              <p>✓ <strong>Financing options</strong> available</p>
              <p>✓ <strong>Full marketplace visibility</strong></p>
            </>
          )}
          {assignedState === 'the_hub' && (
            <>
              <p>• Your listing will be <strong>ranked slightly lower</strong> than Carly Verified vehicles</p>
              <p>• Buyers see <strong>clear disclosure</strong> about needed fixes</p>
              <p>• Appointments available <strong>with disclaimer</strong></p>
              <p>• <strong>Good visibility</strong> in marketplace</p>
            </>
          )}
          {assignedState === 'builders_market' && (
            <>
              <p>⚠️ Only visible when buyers <strong>explicitly enable Builder's Market filter</strong></p>
              <p>⚠️ <strong>No appointments</strong> available</p>
              <p>⚠️ <strong>No financing options</strong></p>
              <p>⚠️ Clear <strong>as-is disclosure</strong> to buyers</p>
              <p>ℹ️ Buyers understand vehicle is <strong>not road-ready</strong></p>
            </>
          )}
        </div>
      </Card>

      {/* Improvement Steps (if not carly verified) */}
      {assignedState !== 'carly_verified' && explanation.improvementSteps && explanation.improvementSteps.length > 0 && (
        <Card className="p-5 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-start gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-500 mb-1">
                To reach {assignedState === 'builders_market' ? 'The Hub' : 'Carly Verified'} status:
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-blue-700 dark:text-blue-600">
            {explanation.improvementSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Important Notice */}
      <Card className="bg-muted/50 border-muted p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              You cannot manually override this classification
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The marketplace category is automatically determined based on your vehicle's condition to ensure transparency and buyer protection. If you believe this classification is incorrect, please review your responses in previous steps.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function getStateConfig(state: RoadReadinessState) {
  switch (state) {
    case 'carly_verified':
      return {
        label: 'Carly Verified',
        icon: CheckCircle,
        bgClass: 'bg-green-500/10',
        iconClass: 'text-green-600 dark:text-green-500',
        borderClass: 'border-green-500/20 bg-green-500/5',
        infoBg: 'bg-green-500/10 border border-green-500/20',
        textClass: 'text-green-900 dark:text-green-500',
        textMutedClass: 'text-green-700 dark:text-green-600'
      };
    
    case 'the_hub':
      return {
        label: 'The Hub',
        icon: Wrench,
        bgClass: 'bg-amber-500/10',
        iconClass: 'text-amber-600 dark:text-amber-500',
        borderClass: 'border-amber-500/20 bg-amber-500/5',
        infoBg: 'bg-amber-500/10 border border-amber-500/20',
        textClass: 'text-amber-900 dark:text-amber-500',
        textMutedClass: 'text-amber-700 dark:text-amber-600'
      };
    
    case 'builders_market':
      return {
        label: "Builder's Market",
        icon: Hammer,
        bgClass: 'bg-red-500/10',
        iconClass: 'text-red-600 dark:text-red-500',
        borderClass: 'border-red-500/20 bg-red-500/5',
        infoBg: 'bg-red-500/10 border border-red-500/20',
        textClass: 'text-red-900 dark:text-red-500',
        textMutedClass: 'text-red-700 dark:text-red-600'
      };
  }
}
