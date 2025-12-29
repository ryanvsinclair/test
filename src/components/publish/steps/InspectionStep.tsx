'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PublishFlowData } from '@/types/publish-flow';
import { Upload, FileText, X, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspectionStepProps {
  data: PublishFlowData;
  onChange: (updates: Partial<PublishFlowData>) => void;
}

export function InspectionStep({ data, onChange }: InspectionStepProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        onChange({ 
          inspectionFile: file,
          inspectionStatus: 'uploaded'
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange({ 
        inspectionFile: e.target.files[0],
        inspectionStatus: 'uploaded'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-foreground mb-2">
          Step 2: Inspection & Documentation
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload a valid inspection document to qualify for Road Ready status.
        </p>
      </div>

      {/* Upload or Skip */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Choose one option:</Label>

        {/* Upload Option */}
        {!data.inspectionFile && data.inspectionStatus !== 'none' && (
          <Card className="p-5 bg-muted/30">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-border",
                "hover:border-primary/50 cursor-pointer"
              )}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('inspection-upload')?.click()}
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Upload Inspection Document
              </p>
              <p className="text-xs text-muted-foreground">
                PDF or image files only • Drag and drop or click to browse
              </p>
              <input
                id="inspection-upload"
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </Card>
        )}

        {/* File Uploaded */}
        {data.inspectionFile && (
          <Card className="p-4 bg-green-500/5 border-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{data.inspectionFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(data.inspectionFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange({ inspectionFile: undefined, inspectionStatus: null })}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* OR Divider */}
        {!data.inspectionFile && data.inspectionStatus !== 'none' && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">OR</span>
            </div>
          </div>
        )}

        {/* Skip Option */}
        {!data.inspectionFile && data.inspectionStatus !== 'none' && (
          <Card className="p-5 bg-muted/30">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onChange({ inspectionStatus: 'none' })}
            >
              Inspection is pending / unavailable
            </Button>
          </Card>
        )}

        {/* Inspection Pending Confirmation */}
        {data.inspectionStatus === 'none' && (
          <Card className="p-4 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-500">
                  Without an inspection, your vehicle cannot be listed as Carly Verified.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-600">
                  Your listing may be classified as The Hub or Builder's Market based on other factors.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-700 hover:text-amber-800"
                  onClick={() => onChange({ inspectionStatus: null })}
                >
                  Go back and upload inspection
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Info Box */}
      <Card className="bg-muted/50 border-muted p-4">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              What qualifies as a valid inspection?
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Official vehicle inspection report from certified mechanic</li>
              <li>• Recent inspection (within 6 months)</li>
              <li>• Government safety inspection certificate</li>
              <li>• Pre-purchase inspection report</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
