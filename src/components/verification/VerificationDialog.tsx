'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Upload, FileText, Camera, AlertCircle } from 'lucide-react';
import { verificationAPI } from '@/lib/api/marketplace';
import { VerificationSubmission } from '@/types';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
}

export function VerificationDialog({ open, onOpenChange, listingId }: VerificationDialogProps) {
  const [verification, setVerification] = useState<VerificationSubmission | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (
    type: 'carfax' | 'inspection' | 'exterior' | 'seats' | 'dashboard' | 'infotainment' | 'odometer',
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // Simulate file upload - in production, upload to storage service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fileUrls = Array.from(files).map(f => URL.createObjectURL(f));

      let update: any = {};

      if (type === 'carfax') {
        update = { documents: { carfaxReport: fileUrls[0] } };
      } else if (type === 'inspection') {
        update = { documents: { inspectionReport: fileUrls[0] } };
      } else if (type === 'exterior') {
        update = { media: { exteriorPhotos: fileUrls } };
      } else {
        update = {
          media: {
            interiorPhotos: {
              [type]: fileUrls,
            },
          },
        };
      }

      const updated = await verificationAPI.submitVerification(listingId, update);
      setVerification(updated);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const getCompletionPercentage = () => {
    if (!verification) return 0;

    let completed = 0;
    const total = 6;

    if (verification.documents.carfaxReport) completed++;
    if (verification.documents.inspectionReport) completed++;
    if (verification.media.exteriorPhotos.length >= 8) completed++;
    if ((verification.media.interiorPhotos.seats?.length || 0) >= 2) completed++;
    if ((verification.media.interiorPhotos.dashboard?.length || 0) >= 1) completed++;
    if ((verification.media.interiorPhotos.infotainment?.length || 0) >= 1 && 
        (verification.media.interiorPhotos.odometer?.length || 0) >= 1) completed++;

    return Math.round((completed / total) * 100);
  };

  const isComplete = verification?.status === 'pending_review' || verification?.status === 'approved';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">Carly Verified Listing</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Verification Progress</span>
              <span className="font-medium">{getCompletionPercentage()}%</span>
            </div>
            <Progress value={getCompletionPercentage()} />
          </div>

          {isComplete && (
            <Alert className="border-green-500/20 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Your verification submission is under review. You'll be notified once approved.
              </AlertDescription>
            </Alert>
          )}

          {/* Documents Section */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  {verification?.documents.carfaxReport ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted" />
                  )}
                  <div>
                    <p className="font-medium">Carfax Report</p>
                    <p className="text-xs text-muted-foreground">PDF or image format</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('carfax-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <input
                  id="carfax-upload"
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload('carfax', e.target.files)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  {verification?.documents.inspectionReport ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted" />
                  )}
                  <div>
                    <p className="font-medium">Inspection Report</p>
                    <p className="text-xs text-muted-foreground">PDF or image format</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('inspection-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <input
                  id="inspection-upload"
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload('inspection', e.target.files)}
                />
              </div>
            </div>
          </div>

          {/* Media Section */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photos
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  {(verification?.media.exteriorPhotos.length || 0) >= 8 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted" />
                  )}
                  <div>
                    <p className="font-medium">Exterior Photos</p>
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 photos (front, rear, sides, 360° coverage)
                    </p>
                    {verification && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {verification.media.exteriorPhotos.length} / 8 uploaded
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('exterior-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <input
                  id="exterior-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload('exterior', e.target.files)}
                />
              </div>

              <div className="p-4 border border-border rounded-lg space-y-3">
                <p className="font-medium">Interior Photos</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(verification?.media.interiorPhotos.seats?.length || 0) >= 2 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      <span className="text-sm">Seats (min 2)</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => document.getElementById('seats-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                    <input
                      id="seats-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload('seats', e.target.files)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(verification?.media.interiorPhotos.dashboard?.length || 0) >= 1 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      <span className="text-sm">Dashboard</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => document.getElementById('dashboard-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                    <input
                      id="dashboard-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('dashboard', e.target.files)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(verification?.media.interiorPhotos.infotainment?.length || 0) >= 1 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      <span className="text-sm">Infotainment</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => document.getElementById('infotainment-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                    <input
                      id="infotainment-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('infotainment', e.target.files)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(verification?.media.interiorPhotos.odometer?.length || 0) >= 1 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted" />
                      )}
                      <span className="text-sm">Odometer</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => document.getElementById('odometer-upload')?.click()}
                      disabled={uploading}
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                    <input
                      id="odometer-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('odometer', e.target.files)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isComplete && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complete all requirements to submit for verification. Your listing will be reviewed within 24-48 hours.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {isComplete ? 'Close' : 'Save & Continue Later'}
            </Button>
            {isComplete && (
              <Button
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
                  color: 'hsl(var(--foreground))'
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submitted
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
