'use client';

import { useState, useEffect } from 'react';
import { UserVehicle } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Upload, 
  FileText,
  Camera,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnits } from '@/contexts/UnitsContext';
import { decodeVin } from '@/lib/vin/decoder';
// TODO: Migrate getVehicleOptions, getPackagesForTrim, getBrandStandardPackages to separate service
import { vinDecoderAPI } from '@/lib/api/vin-decoder';

type PublishStep = 'confirm' | 'mileage' | 'trim' | 'photos' | 'documents' | 'review';

interface PublishVehicleDialogProps {
  vehicle: UserVehicle | null;
  open: boolean;
  onClose: () => void;
  onPublish: (data: PublishData) => void;
}

interface PublishData {
  mileage: number;
  trim?: string;
  trimSource?: 'vin' | 'user_selected';
  packages: Array<{
    name: string;
    source: 'vin' | 'trim' | 'brand_standard';
    confidenceLevel: 'verified' | 'unverified';
  }>;
  photos: File[]; // Standard listing - any photos
  carlyCertified?: boolean;
  carlyCertifiedData?: {
    exteriorPhotos: File[]; // 8 angles for 360 walkaround
    interiorPhotos: InteriorPhotos;
    carfaxReport: File;
    inspectionReport: File;
  };
}

interface InteriorPhotos {
  dashboard?: File;
  frontInterior?: File;
  driverSeat?: File;
  passengerSeat?: File;
  rearSeats?: File;
  trunk?: File;
}

const CARLY_EXTERIOR_ANGLES = [
  { key: 'front', label: 'Front' },
  { key: 'frontLeft', label: 'Front-left angle' },
  { key: 'left', label: 'Left side' },
  { key: 'rearLeft', label: 'Rear-left angle' },
  { key: 'rear', label: 'Rear' },
  { key: 'rearRight', label: 'Rear-right angle' },
  { key: 'right', label: 'Right side' },
  { key: 'frontRight', label: 'Front-right angle' },
] as const;

const CARLY_INTERIOR_PHOTOS = [
  { key: 'dashboard', label: 'Dashboard (vehicle ON)' },
  { key: 'frontInterior', label: 'Steering wheel + center console' },
  { key: 'driverSeat', label: 'Front driver seat' },
  { key: 'passengerSeat', label: 'Front passenger seat' },
  { key: 'rearSeats', label: 'Rear seats (both sides)' },
  { key: 'trunk', label: 'Trunk / cargo area' },
] as const;

export function PublishVehicleDialog({ vehicle, open, onClose, onPublish }: PublishVehicleDialogProps) {
  const { formatDistance, units } = useUnits();
  const [currentStep, setCurrentStep] = useState<PublishStep>('confirm');
  const [mileage, setMileage] = useState(vehicle?.mileage?.toString() || '');
  const [selectedTrim, setSelectedTrim] = useState(vehicle?.trim || '');
  const [trimSource, setTrimSource] = useState<'vin' | 'user_selected'>('vin');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  
  // Available options from VIN decode
  const [availableTrims, setAvailableTrims] = useState<string[]>([]);
  const [availablePackages, setAvailablePackages] = useState<string[]>([]);
  const [packageSource, setPackageSource] = useState<'vin' | 'trim' | 'brand_standard'>('vin');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [trimConfidence, setTrimConfidence] = useState<'confirmed' | 'needs_selection'>('needs_selection');
  
  // Standard listing photos (optional)
  const [standardPhotos, setStandardPhotos] = useState<File[]>([]);
  
  // Carly Certified toggle and data
  const [wantsCarlyCertified, setWantsCarlyCertified] = useState(false);
  const [carlyExteriorPhotos, setCarlyExteriorPhotos] = useState<Record<string, File>>({});
  const [carlyInteriorPhotos, setCarlyInteriorPhotos] = useState<InteriorPhotos>({});
  const [carfaxReport, setCarfaxReport] = useState<File | undefined>();
  const [inspectionReport, setInspectionReport] = useState<File | undefined>();

  // Fetch vehicle-specific trims and packages when dialog opens
  useEffect(() => {
    if (!vehicle || !open) return;

    const fetchVehicleOptions = async () => {
      setLoadingOptions(true);
      try {
        const options = await vinDecoderAPI.getVehicleOptions(
          vehicle.year,
          vehicle.make,
          vehicle.model
        );
        setAvailableTrims(options.trims);
        
        // Priority 1: VIN-confirmed packages
        if (options.packages.length > 0) {
          setAvailablePackages(options.packages);
          setPackageSource('vin');
        } else {
          // Priority 3: Brand-standard fallback
          const brandPackages = vinDecoderAPI.getBrandStandardPackages(vehicle.make);
          setAvailablePackages(brandPackages);
          setPackageSource('brand_standard');
        }
        
        // Check if vehicle has trim from VIN decode
        if (vehicle.trim) {
          setSelectedTrim(vehicle.trim);
          setTrimSource('vin');
          setTrimConfidence('confirmed');
        } else {
          setTrimConfidence('needs_selection');
        }
      } catch (error) {
        console.error('Failed to fetch vehicle options:', error);
        setAvailableTrims([]);
        setAvailablePackages([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchVehicleOptions();
  }, [vehicle, open]);

  // Reload packages when trim changes
  useEffect(() => {
    if (!vehicle || !selectedTrim) return;

    const fetchPackagesForTrim = async () => {
      try {
        // Priority 2: Trim-specific packages
        const packages = await vinDecoderAPI.getPackagesForTrim(
          vehicle.year,
          vehicle.make,
          vehicle.model,
          selectedTrim
        );
        
        if (packages.length > 0) {
          setAvailablePackages(packages);
          setPackageSource('trim');
        } else {
          // Priority 3: Brand-standard fallback
          const brandPackages = vinDecoderAPI.getBrandStandardPackages(vehicle.make);
          setAvailablePackages(brandPackages);
          setPackageSource('brand_standard');
        }
      } catch (error) {
        console.error('Failed to fetch packages for trim:', error);
        // Fallback to brand-standard on error
        const brandPackages = vinDecoderAPI.getBrandStandardPackages(vehicle.make);
        setAvailablePackages(brandPackages);
        setPackageSource('brand_standard');
      }
    };

    fetchPackagesForTrim();
  }, [selectedTrim, vehicle]);

  if (!vehicle) return null;

  const steps: PublishStep[] = ['confirm', 'mileage', 'trim', 'photos', 'documents', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handlePublish = () => {
    const publishData: PublishData = {
      mileage: parseInt(mileage),
      trim: selectedTrim,
      trimSource: trimSource,
      packages: selectedPackages.map(pkg => ({
        name: pkg,
        source: packageSource,
        confidenceLevel: packageSource === 'vin' ? 'verified' : 'unverified',
      })),
      photos: standardPhotos,
    };

    if (wantsCarlyCertified && isCarlyCertified) {
      publishData.carlyCertified = true;
      publishData.carlyCertifiedData = {
        exteriorPhotos: Object.values(carlyExteriorPhotos),
        interiorPhotos: carlyInteriorPhotos,
        carfaxReport: carfaxReport!,
        inspectionReport: inspectionReport!,
      };
    }

    onPublish(publishData);
    onClose();
  };

  const maskVIN = (vin: string) => {
    if (!vin || vin.length < 8) return vin;
    return `${vin.slice(0, 4)}***${vin.slice(-4)}`;
  };

  const isCarlyPhotosComplete = () => {
    const hasAllExteriorAngles = CARLY_EXTERIOR_ANGLES.every(
      ({ key }) => carlyExteriorPhotos[key]
    );
    const hasAllInteriorPhotos = CARLY_INTERIOR_PHOTOS.every(
      ({ key }) => carlyInteriorPhotos[key as keyof InteriorPhotos]
    );
    return hasAllExteriorAngles && hasAllInteriorPhotos;
  };

  const isCarlyCertified = 
    wantsCarlyCertified && 
    isCarlyPhotosComplete() && 
    carfaxReport && 
    inspectionReport;

  const canProceed = () => {
    switch (currentStep) {
      case 'confirm':
        return true;
      case 'mileage':
        const mileageNum = parseInt(mileage);
        return mileage && !isNaN(mileageNum) && mileageNum >= (vehicle.mileage || 0);
      case 'trim':
        return selectedTrim.trim().length > 0; // Trim is now REQUIRED
      case 'photos':
        // Standard photos are optional
        // If user wants Carly Certified, they need complete photos
        if (wantsCarlyCertified) {
          return isCarlyPhotosComplete();
        }
        return true; // Standard listing can proceed without photos
      case 'documents':
        // If user wants Carly Certified, documents are required
        if (wantsCarlyCertified) {
          return carfaxReport && inspectionReport;
        }
        return true; // Standard listing doesn't require documents
      case 'review':
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light">
            Publish to Marketplace
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  index <= currentStepIndex ? "bg-accent" : "bg-muted"
                )}
              />
            </div>
          ))}
        </div>

        {/* Step 1: Vehicle Confirmation */}
        {currentStep === 'confirm' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Confirm Vehicle Details</h3>
              <div className="p-6 rounded-lg border border-border bg-muted/20 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="text-lg font-medium">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                </div>
                {vehicle.vin && (
                  <div>
                    <p className="text-sm text-muted-foreground">VIN</p>
                    <p className="font-mono text-sm">{maskVIN(vehicle.vin)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Mileage Confirmation */}
        {currentStep === 'mileage' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Current Mileage</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mileage">
                    Mileage ({units === 'imperial' ? 'miles' : 'km'})
                  </Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="Enter current mileage"
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Pre-filled from your last update — adjust if needed
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Trim & Packages */}
        {currentStep === 'trim' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Trim & Packages</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="trim" className="text-base">
                    Trim Level <span className="text-destructive">*</span>
                  </Label>
                  
                  {/* VIN-confirmed trim message */}
                  {trimConfidence === 'confirmed' && selectedTrim && (
                    <div className="mt-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="font-medium text-accent">VIN-Confirmed: {selectedTrim}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        This trim was automatically identified from the VIN. You can edit if needed.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTrimConfidence('needs_selection');
                          setTrimSource('user_selected');
                        }}
                        className="mt-2 ml-6 h-7 text-xs"
                      >
                        Change Trim
                      </Button>
                    </div>
                  )}

                  {/* Trim selection when not confirmed or being edited */}
                  {trimConfidence === 'needs_selection' && (
                    <>
                      <p className="text-sm text-muted-foreground mb-3 mt-2">
                        We couldn't determine the exact trim from the VIN. Please select the correct trim.
                      </p>
                      
                      {loadingOptions ? (
                        <div className="p-4 rounded-lg border border-border bg-muted/10 text-sm text-muted-foreground">
                          Loading available trims...
                        </div>
                      ) : availableTrims.length > 0 ? (
                        <div className="space-y-2">
                          {availableTrims.map((trim) => (
                            <label
                              key={trim}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                selectedTrim === trim
                                  ? "border-accent bg-accent/10"
                                  : "border-border hover:bg-muted/50"
                              )}
                            >
                              <input
                                type="radio"
                                name="trim"
                                value={trim}
                                checked={selectedTrim === trim}
                                onChange={(e) => {
                                  setSelectedTrim(e.target.value);
                                  setTrimSource('user_selected');
                                }}
                                className="w-4 h-4 accent-accent"
                              />
                              <span className="text-sm font-medium">{trim}</span>
                            </label>
                          ))}
                          <div className="mt-2">
                            <label className="text-sm text-muted-foreground">
                              Or enter custom trim:
                            </label>
                            <Input
                              id="trim"
                              value={!availableTrims.includes(selectedTrim) ? selectedTrim : ''}
                              onChange={(e) => {
                                setSelectedTrim(e.target.value);
                                setTrimSource('user_selected');
                              }}
                              placeholder="e.g., Custom trim not listed"
                              className="mt-2"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg border-2 border-destructive/20 bg-destructive/5">
                          <p className="text-sm font-medium text-destructive mb-2">
                            Unable to verify vehicle trims for this VIN
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Please enter the trim manually to continue.
                          </p>
                          <Input
                            id="trim"
                            value={selectedTrim}
                            onChange={(e) => {
                              setSelectedTrim(e.target.value);
                              setTrimSource('user_selected');
                            }}
                            placeholder="e.g., Premium, Sport, Limited"
                            className="mt-3"
                          />
                        </div>
                      )}
                      
                      {!selectedTrim && (
                        <p className="text-sm text-destructive mt-2">
                          Trim level is required to continue
                        </p>
                      )}
                    </>
                  )}
                </div>
                
                <div>
                  <Label className="text-base">Available Packages (Optional)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select any packages or options included with your vehicle
                  </p>
                  
                  {loadingOptions ? (
                    <div className="p-4 rounded-lg border border-border bg-muted/10 text-sm text-muted-foreground">
                      Loading available packages...
                    </div>
                  ) : availablePackages.length > 0 ? (
                    <>
                      {/* Package source indicator */}
                      {packageSource === 'brand_standard' && (
                        <div className="mb-3 p-3 rounded-lg bg-muted/30 border border-border">
                          <p className="text-xs text-muted-foreground">
                            Common packages for this brand (not VIN-verified)
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {availablePackages.map((pkg) => (
                          <label key={pkg} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                            <Checkbox
                              checked={selectedPackages.includes(pkg)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPackages([...selectedPackages, pkg]);
                                } else {
                                  setSelectedPackages(selectedPackages.filter(p => p !== pkg));
                                }
                              }}
                            />
                            <span className="text-sm">{pkg}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-lg border border-border bg-muted/10">
                      <p className="text-sm text-muted-foreground">
                        No known packages available for this vehicle.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Photos */}
        {currentStep === 'photos' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Vehicle Photos</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Add photos to showcase your vehicle (optional for standard listing)
              </p>
              
              {/* Standard Photos Upload */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <Label>Photos (Optional)</Label>
                </div>
                <div className="p-4 rounded-lg border-2 border-dashed border-border bg-muted/10">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setStandardPhotos(Array.from(e.target.files));
                      }
                    }}
                    className="mb-2"
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload any photos of your vehicle
                  </p>
                  {standardPhotos.length > 0 && (
                    <p className="text-sm text-accent mt-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {standardPhotos.length} photos uploaded
                    </p>
                  )}
                </div>
              </div>

              {/* Carly Certified Section */}
              <div className="p-6 rounded-lg border-2 border-accent/20 bg-accent/5">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-accent mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-lg mb-1">Carly Certified (Optional Upgrade)</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get premium visibility, verified badge, and increased buyer trust by meeting our certification requirements
                    </p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={wantsCarlyCertified}
                        onCheckedChange={(checked) => setWantsCarlyCertified(checked as boolean)}
                      />
                      <span className="text-sm font-medium">I want Carly Certified status</span>
                    </label>
                  </div>
                </div>

                {wantsCarlyCertified && (
                  <div className="mt-6 space-y-6 pt-6 border-t border-accent/20">
                    {/* Exterior Photos - 360 Walkaround */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Camera className="w-4 h-4 text-muted-foreground" />
                        <Label className="font-medium">Exterior Photos - 360° Walkaround (Required)</Label>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Upload photos from all 8 angles below
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {CARLY_EXTERIOR_ANGLES.map(({ key, label }) => (
                          <div key={key} className="p-3 rounded-lg border border-border bg-background">
                            <div className="flex items-center justify-between mb-2">
                              <Label htmlFor={key} className="text-sm font-normal">
                                {label}
                              </Label>
                              {carlyExteriorPhotos[key] && (
                                <CheckCircle2 className="w-4 h-4 text-accent" />
                              )}
                            </div>
                            <Input
                              id={key}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setCarlyExteriorPhotos({
                                    ...carlyExteriorPhotos,
                                    [key]: e.target.files[0],
                                  });
                                }
                              }}
                              className="text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interior Photos Checklist */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Camera className="w-4 h-4 text-muted-foreground" />
                        <Label className="font-medium">Interior Photos (Required)</Label>
                      </div>
                      <div className="space-y-3">
                        {CARLY_INTERIOR_PHOTOS.map(({ key, label }) => (
                          <div key={key} className="p-3 rounded-lg border border-border bg-background">
                            <div className="flex items-center justify-between mb-2">
                              <Label htmlFor={`interior-${key}`} className="text-sm font-normal">
                                {label}
                              </Label>
                              {carlyInteriorPhotos[key as keyof InteriorPhotos] && (
                                <CheckCircle2 className="w-4 h-4 text-accent" />
                              )}
                            </div>
                            <Input
                              id={`interior-${key}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setCarlyInteriorPhotos({
                                    ...carlyInteriorPhotos,
                                    [key]: e.target.files[0],
                                  });
                                }
                              }}
                              className="text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Documents */}
        {currentStep === 'documents' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Documents are optional for standard listings
              </p>

              {/* Carly Certified Section */}
              {!wantsCarlyCertified && (
                <div className="mb-6 p-6 rounded-lg border-2 border-accent/20 bg-accent/5">
                  <div className="flex items-start gap-3 mb-4">
                    <ShieldCheck className="w-6 h-6 text-accent mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-lg mb-1">Carly Certified (Optional Upgrade)</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Uploading verification documents qualifies your vehicle for premium marketplace visibility
                      </p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={wantsCarlyCertified}
                          onCheckedChange={(checked) => setWantsCarlyCertified(checked as boolean)}
                        />
                        <span className="text-sm font-medium">I want Carly Certified status</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {wantsCarlyCertified && (
                <div className="p-6 rounded-lg border-2 border-accent/20 bg-accent/5">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-accent" />
                    <h4 className="font-medium">Carly Certified Requirements</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Both documents are required for certification
                  </p>

                  <div className="space-y-4">
                    {/* Carfax Report */}
                    <div className="p-4 rounded-lg border border-border bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="carfax" className="font-medium">Carfax Report (Required)</Label>
                        {carfaxReport && <CheckCircle2 className="w-4 h-4 text-accent ml-auto" />}
                      </div>
                      <Input
                        id="carfax"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setCarfaxReport(e.target.files[0]);
                          }
                        }}
                      />
                    </div>

                    {/* Inspection Report */}
                    <div className="p-4 rounded-lg border border-border bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <Label htmlFor="inspection" className="font-medium">Inspection Report (Required)</Label>
                        {inspectionReport && <CheckCircle2 className="w-4 h-4 text-accent ml-auto" />}
                      </div>
                      <Input
                        id="inspection"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setInspectionReport(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Certification Status Preview */}
                  {isCarlyCertified && (
                    <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-accent" />
                        <div>
                          <p className="font-medium text-accent">Carly Certified Complete</p>
                          <p className="text-sm text-muted-foreground">
                            Your listing will receive premium visibility and buyer trust
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {currentStep === 'review' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Review & Publish</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border bg-muted/10">
                  <p className="text-sm text-muted-foreground mb-1">Vehicle</p>
                  <p className="font-medium">
                    {vehicle.year} {vehicle.make} {vehicle.model} {selectedTrim}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/10">
                  <p className="text-sm text-muted-foreground mb-1">Mileage</p>
                  <p className="font-medium">{formatDistance(parseInt(mileage))}</p>
                </div>

                {selectedPackages.length > 0 && (
                  <div className="p-4 rounded-lg border border-border bg-muted/10">
                    <p className="text-sm text-muted-foreground mb-1">Packages</p>
                    <p className="text-sm">{selectedPackages.join(', ')}</p>
                    {packageSource === 'brand_standard' && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Common brand packages (not VIN-verified)
                      </p>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-lg border border-border bg-muted/10">
                  <p className="text-sm text-muted-foreground mb-1">Photos</p>
                  <p className="text-sm">
                    {wantsCarlyCertified 
                      ? `${Object.keys(carlyExteriorPhotos).length} exterior, ${Object.keys(carlyInteriorPhotos).length} interior`
                      : standardPhotos.length > 0 
                        ? `${standardPhotos.length} photos`
                        : 'No photos uploaded'
                    }
                  </p>
                </div>

                {isCarlyCertified && (
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-accent" />
                      <p className="font-medium text-accent">Carly Certified</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/20">
                  <Checkbox id="confirm" />
                  <label htmlFor="confirm" className="text-sm leading-relaxed cursor-pointer">
                    I confirm that all information provided is accurate and that I have the right to sell this vehicle
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep === 'review' ? (
            <Button onClick={handlePublish} disabled={!canProceed()}>
              <Check className="w-4 h-4 mr-2" />
              Publish Listing
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
