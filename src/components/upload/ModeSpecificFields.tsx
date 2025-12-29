'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MarketplaceMode, IssueSeverity, IntendedUse } from '@/types';
import { Upload, FileText, AlertCircle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ESTIMATED_FIXES_OPTIONS, INTENDED_USE_OPTIONS } from '@/lib/api/vehicle-upload';

interface ModeSpecificFieldsProps {
  marketplaceMode: MarketplaceMode;
  running: boolean;
  onRunningChange: (running: boolean) => void;
  issueSeverity: IssueSeverity;
  onIssueSeverityChange: (severity: IssueSeverity) => void;
  inspectionFile: File | null;
  onInspectionFileChange: (file: File | null) => void;
  estimatedFixes: string[];
  onEstimatedFixesChange: (fixes: string[]) => void;
  intendedUse: IntendedUse[];
  onIntendedUseChange: (uses: IntendedUse[]) => void;
  disclosureAcknowledged: boolean;
  onDisclosureAcknowledgedChange: (acknowledged: boolean) => void;
}

export function ModeSpecificFields({
  marketplaceMode,
  running,
  onRunningChange,
  issueSeverity,
  onIssueSeverityChange,
  inspectionFile,
  onInspectionFileChange,
  estimatedFixes,
  onEstimatedFixesChange,
  intendedUse,
  onIntendedUseChange,
  disclosureAcknowledged,
  onDisclosureAcknowledgedChange
}: ModeSpecificFieldsProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleInspectionDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        onInspectionFileChange(file);
      }
    }
  };

  const handleInspectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onInspectionFileChange(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Running Condition - All Modes */}
      <Card className="p-6 space-y-4">
        <div>
          <Label className="text-base font-medium">Is the vehicle currently running?</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {marketplaceMode === 'road-ready' && 'Required: Must be running for Road Ready'}
            {marketplaceMode === 'near-road-ready' && 'Required: Must be running for Near Road Ready'}
            {marketplaceMode === 'builders-market' && 'Select the current running status'}
          </p>
        </div>
        
        <RadioGroup value={running ? 'yes' : 'no'} onValueChange={(value) => onRunningChange(value === 'yes')}>
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
        
        {marketplaceMode !== 'builders-market' && !running && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-xs text-destructive">
              Non-running vehicles must be listed in Builder's Market
            </p>
          </div>
        )}
      </Card>

      {/* Issue Severity - All Modes */}
      <Card className="p-6 space-y-4">
        <div>
          <Label className="text-base font-medium">Issue Severity</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {marketplaceMode === 'road-ready' && 'Road Ready: Only "None" or "Minor" allowed'}
            {marketplaceMode === 'near-road-ready' && 'Near Road Ready: Must be "Minor"'}
            {marketplaceMode === 'builders-market' && 'Select the severity of known issues'}
          </p>
        </div>
        
        <RadioGroup value={issueSeverity} onValueChange={(value) => onIssueSeverityChange(value as IssueSeverity)}>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="severity-none" />
              <Label htmlFor="severity-none" className="font-normal cursor-pointer">
                None - No known issues
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="minor" id="severity-minor" />
              <Label htmlFor="severity-minor" className="font-normal cursor-pointer">
                Minor - Small issues that don't affect drivability
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="moderate" id="severity-moderate" />
              <Label htmlFor="severity-moderate" className="font-normal cursor-pointer">
                Moderate - Issues that may affect performance
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="major" id="severity-major" />
              <Label htmlFor="severity-major" className="font-normal cursor-pointer">
                Major - Significant issues requiring repair
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="critical" id="severity-critical" />
              <Label htmlFor="severity-critical" className="font-normal cursor-pointer">
                Critical - Safety or mechanical failures
              </Label>
            </div>
          </div>
        </RadioGroup>
        
        {marketplaceMode === 'road-ready' && (issueSeverity === 'moderate' || issueSeverity === 'major' || issueSeverity === 'critical') && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-xs text-destructive">
              Road Ready vehicles can only have "None" or "Minor" issues
            </p>
          </div>
        )}
        
        {marketplaceMode === 'near-road-ready' && issueSeverity !== 'minor' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-xs text-destructive">
              Near Road Ready vehicles must have "Minor" issue severity
            </p>
          </div>
        )}
      </Card>

      {/* Inspection Upload - Road Ready (Required) & Near Road Ready (Optional) */}
      {(marketplaceMode === 'road-ready' || marketplaceMode === 'near-road-ready') && (
        <Card className="p-6 space-y-4">
          <div>
            <Label className="text-base font-medium">
              Inspection Report {marketplaceMode === 'road-ready' && <span className="text-destructive">*</span>}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {marketplaceMode === 'road-ready' 
                ? 'Required: Upload a PDF or image of the vehicle inspection' 
                : 'Optional but encouraged: Upload inspection to increase buyer confidence'}
            </p>
          </div>
          
          {!inspectionFile ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-border",
                "hover:border-primary/50 cursor-pointer"
              )}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleInspectionDrop}
              onClick={() => document.getElementById('inspection-upload')?.click()}
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Drop inspection file here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PDF or image files only
              </p>
              <input
                id="inspection-upload"
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={handleInspectionChange}
              />
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{inspectionFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(inspectionFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onInspectionFileChange(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Estimated Fixes - Near Road Ready (Required) */}
      {marketplaceMode === 'near-road-ready' && (
        <Card className="p-6 space-y-4">
          <div>
            <Label className="text-base font-medium">
              Estimated Fixes Required <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Select all fixes needed before the vehicle is fully road-ready
            </p>
          </div>
          
          <div className="space-y-3">
            {ESTIMATED_FIXES_OPTIONS.map((fix) => (
              <div key={fix} className="flex items-center space-x-2">
                <Checkbox
                  id={`fix-${fix}`}
                  checked={estimatedFixes.includes(fix)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onEstimatedFixesChange([...estimatedFixes, fix]);
                    } else {
                      onEstimatedFixesChange(estimatedFixes.filter(f => f !== fix));
                    }
                  }}
                />
                <Label htmlFor={`fix-${fix}`} className="font-normal cursor-pointer text-sm">
                  {fix}
                </Label>
              </div>
            ))}
          </div>
          
          {estimatedFixes.length === 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-xs text-destructive">
                You must select at least one estimated fix
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Intended Use - Builder's Market */}
      {marketplaceMode === 'builders-market' && (
        <Card className="p-6 space-y-4">
          <div>
            <Label className="text-base font-medium">Intended Use</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Select how this vehicle is intended to be used
            </p>
          </div>
          
          <div className="space-y-3">
            {INTENDED_USE_OPTIONS.map((use) => (
              <div key={use} className="flex items-center space-x-2">
                <Checkbox
                  id={`use-${use}`}
                  checked={intendedUse.includes(use)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onIntendedUseChange([...intendedUse, use]);
                    } else {
                      onIntendedUseChange(intendedUse.filter(u => u !== use));
                    }
                  }}
                />
                <Label htmlFor={`use-${use}`} className="font-normal cursor-pointer text-sm capitalize">
                  {use.replace('-', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Builder's Market Disclosure */}
      {marketplaceMode === 'builders-market' && (
        <Card className="p-6 space-y-4 bg-purple-500/5 border-purple-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-3 flex-1">
              <div>
                <p className="text-sm font-medium text-purple-900 dark:text-purple-500 mb-2">
                  Important Disclosure
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-400 leading-relaxed">
                  By listing in Builder's Market, you acknowledge that this vehicle is not road-ready and may not be legally drivable. 
                  Buyers understand this vehicle is intended for project use, export, restoration, parts, or track use only.
                </p>
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox
                  id="disclosure"
                  checked={disclosureAcknowledged}
                  onCheckedChange={(checked) => onDisclosureAcknowledgedChange(checked === true)}
                />
                <Label htmlFor="disclosure" className="font-normal cursor-pointer text-sm text-purple-900 dark:text-purple-500">
                  I acknowledge that this vehicle is not road-ready and may not be legally drivable <span className="text-destructive">*</span>
                </Label>
              </div>
              
              {!disclosureAcknowledged && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2 mt-3">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-destructive">
                    You must acknowledge this disclosure to list in Builder's Market
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
