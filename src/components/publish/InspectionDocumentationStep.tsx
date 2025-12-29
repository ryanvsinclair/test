'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InspectionDocumentationStepProps {
  inspectionStatus: 'verified' | 'uploaded' | 'none' | null;
  inspectionFile: File | null;
  onInspectionStatusChange: (status: 'verified' | 'uploaded' | 'none') => void;
  onInspectionFileChange: (file: File | null) => void;
}

export function InspectionDocumentationStep({
  inspectionStatus,
  inspectionFile,
  onInspectionStatusChange,
  onInspectionFileChange
}: InspectionDocumentationStepProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        onInspectionFileChange(file);
        onInspectionStatusChange('uploaded');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onInspectionFileChange(e.target.files[0]);
      onInspectionStatusChange('uploaded');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light tracking-tight text-foreground mb-2">
          Inspection & Documentation
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload your vehicle inspection or confirm inspection status. This affects marketplace classification.
        </p>
      </div>

      {/* Inspection Status */}
      <Card className="p-6 space-y-4">
        <div>
          <Label className="text-base font-medium">
            Inspection Status <span className="text-destructive">*</span>
          </Label>
        </div>
        
        <RadioGroup 
          value={inspectionStatus || undefined} 
          onValueChange={(value) => onInspectionStatusChange(value as any)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="verified" id="inspection-verified" />
            <Label htmlFor="inspection-verified" className="font-normal cursor-pointer">
              Inspection verified by third-party service
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="uploaded" id="inspection-uploaded" />
            <Label htmlFor="inspection-uploaded" className="font-normal cursor-pointer">
              I will upload an inspection document
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="inspection-none" />
            <Label htmlFor="inspection-none" className="font-normal cursor-pointer">
              No inspection available
            </Label>
          </div>
        </RadioGroup>
      </Card>

      {/* Upload Area - Show when "uploaded" selected */}
      {inspectionStatus === 'uploaded' && (
        <Card className="p-6 space-y-4">
          <div>
            <Label className="text-base font-medium">
              Upload Inspection Document <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              PDF or image files accepted
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
              onDrop={handleDrop}
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
                onChange={handleFileChange}
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

      {/* Warning for No Inspection */}
      {inspectionStatus === 'none' && (
        <Card className="bg-amber-500/5 border-amber-500/30 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-500 mb-2">
                Without an inspection, your vehicle cannot be listed as Road Ready
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-600 leading-relaxed">
                Vehicles without inspection documentation are classified as Near Road Ready or Builder's Market 
                depending on other condition factors. Consider uploading an inspection to achieve Road Ready status.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
