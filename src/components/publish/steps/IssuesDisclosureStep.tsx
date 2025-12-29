'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PublishFlowData } from '@/types/publish-flow';
import { AlertCircle, Info } from 'lucide-react';

interface IssuesDisclosureStepProps {
  data: PublishFlowData;
  onChange: (updates: Partial<PublishFlowData>) => void;
}

export function IssuesDisclosureStep({ data, onChange }: IssuesDisclosureStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-foreground mb-2">
          Step 3: Known Issues Disclosure
        </h2>
        <p className="text-sm text-muted-foreground">
          Transparent disclosure helps buyers make informed decisions and builds trust.
        </p>
      </div>

      {/* Issue Severity Selection */}
      <Card className="p-5 space-y-4 bg-muted/30">
        <div>
          <Label className="text-base font-medium">
            What is the severity of known issues?
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Be honest about the vehicle's condition
          </p>
        </div>
        
        <RadioGroup
          value={data.issueSeverity || undefined}
          onValueChange={(value) => onChange({ 
            issueSeverity: value as 'none' | 'minor' | 'major',
            issueDescription: value === 'none' ? undefined : data.issueDescription
          })}
        >
          <div className="space-y-3">
            {/* No Issues */}
            <div className="flex items-start space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="none" id="severity-none" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="severity-none" className="font-medium cursor-pointer">
                  No known issues
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Vehicle is in excellent condition with no problems
                </p>
              </div>
            </div>

            {/* Minor Issues */}
            <div className="flex items-start space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="minor" id="severity-minor" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="severity-minor" className="font-medium cursor-pointer">
                  Minor issues
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Cosmetic wear, small repairs needed, or maintenance items (brakes, tires, fluids)
                </p>
              </div>
            </div>

            {/* Major Issues */}
            <div className="flex items-start space-x-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 transition-colors">
              <RadioGroupItem value="major" id="severity-major" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="severity-major" className="font-medium cursor-pointer">
                  Major issues
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Engine, transmission, frame damage, electrical problems, or safety concerns
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>

        {/* Major Issues Warning */}
        {data.issueSeverity === 'major' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-600">
              Vehicles with major issues are listed under Builder's Market and are not considered road ready.
            </p>
          </div>
        )}
      </Card>

      {/* Issue Description */}
      {data.issueSeverity && data.issueSeverity !== 'none' && (
        <Card className="p-5 space-y-4 bg-muted/30">
          <div>
            <Label htmlFor="issue-description" className="text-base font-medium">
              Describe the issues <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Provide clear details about the problems and any repairs needed
            </p>
          </div>
          
          <Textarea
            id="issue-description"
            placeholder="Example: Front brake pads need replacement within 1000km. Minor rust on rear bumper. Tire tread at 40%."
            value={data.issueDescription || ''}
            onChange={(e) => onChange({ issueDescription: e.target.value })}
            rows={5}
            className="resize-none"
          />

          {data.issueSeverity !== 'none' && !data.issueDescription && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Issue description is required
            </p>
          )}
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-muted/50 border-muted p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Why accurate disclosure matters
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Honest disclosure protects both you and buyers. It prevents disputes, builds trust, and helps buyers make confident decisions. Misrepresenting vehicle condition may result in listing removal or account suspension.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
