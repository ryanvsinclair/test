'use client';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Shield } from 'lucide-react';

interface AcknowledgementStepProps {
  acknowledged: boolean;
  onAcknowledge: (acknowledged: boolean) => void;
}

export function AcknowledgementStep({ acknowledged, onAcknowledge }: AcknowledgementStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-foreground mb-2">
          Step 5: User Acknowledgement
        </h2>
        <p className="text-sm text-muted-foreground">
          Please review and confirm the following statement before publishing.
        </p>
      </div>

      {/* Acknowledgement Box */}
      <Card className="p-6 space-y-6 bg-muted/30 border-primary/20">
        <div className="flex items-start gap-4">
          <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-3">
                Accuracy & Transparency Commitment
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By publishing this listing, I confirm that:
              </p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>All information provided is <strong className="text-foreground">accurate and complete</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>I have <strong className="text-foreground">honestly disclosed</strong> the vehicle's condition</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>I understand the assigned marketplace category is based on the information I provided</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>I will <strong className="text-foreground">not misrepresent</strong> the vehicle's condition to buyers</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Checkbox */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="acknowledgement"
              checked={acknowledged}
              onCheckedChange={(checked) => onAcknowledge(checked === true)}
              className="mt-1"
            />
            <Label 
              htmlFor="acknowledgement" 
              className="cursor-pointer leading-relaxed text-sm font-normal"
            >
              <strong className="text-foreground">I confirm that all information provided is accurate and complete.</strong>
              {' '}I understand that providing false or misleading information may result in listing removal, account suspension, or permanent account termination.
            </Label>
          </div>
        </div>
      </Card>

      {/* Warning */}
      {!acknowledged && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-500 mb-1">
                Acknowledgement required
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-600">
                You must check the confirmation box above to proceed with publishing.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Protection Info */}
      <Card className="bg-muted/50 border-muted p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Why we require this confirmation
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This acknowledgement protects both buyers and sellers by ensuring transparency and honesty. It helps maintain trust in our marketplace and provides clear expectations for all parties. Your commitment to accuracy helps create a safer, more reliable marketplace for everyone.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
