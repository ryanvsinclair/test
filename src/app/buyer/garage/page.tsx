'use client';

import { useEffect, useState } from 'react';
import { VehicleCard } from '@/components/cards/vehicle-card';
// Mock data removed - connect to real database
import { Heart, Plus, Car, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useUnits } from '@/contexts/UnitsContext';
import { Button } from '@/components/ui/button';
import { userVehiclesAPI } from '@/lib/api/user-vehicles';
import { savedVehiclesAPI } from '@/lib/api/saved-vehicles';
import { UserVehicle } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { decodeVin, isValidVinFormat } from '@/lib/vin/decoder';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { appraisalAPI } from '@/lib/api/appraisal';
import { marketplaceAPI } from '@/lib/api/marketplace';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, DollarSign, Upload, CheckCircle, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { OwnershipModules } from '@/components/garage/OwnershipModules';
import { PublishVehicleDialog } from '@/components/garage/PublishVehicleDialog';

type GarageView = 'saved' | 'owned';
type AddVehicleStep = 'vin-entry' | 'decoding' | 'review' | 'manual' | 'failed';

export default function GaragePage() {
  const router = useRouter();
  const { savedVehicleIds, isBuyer, user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { formatDistance, units } = useUnits();
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<GarageView>('saved');
  const [ownedVehicles, setOwnedVehicles] = useState<UserVehicle[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<any[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [addVehicleStep, setAddVehicleStep] = useState<AddVehicleStep>('vin-entry');
  const [vinInput, setVinInput] = useState('');
  const [vinError, setVinError] = useState('');
  const [decodeResult, setDecodeResult] = useState<any>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  
  /**
   * CRITICAL: Track which VIN was decoded to prevent stale data bugs
   * A decode result is valid ONLY if decodedVin matches current vinInput value
   * This prevents previously decoded data from being reused after VIN changes
   */
  const [decodedVin, setDecodedVin] = useState<string>('');

  /**
   * Handle VIN input changes
   * CRITICAL: Must reset decode state to prevent stale data
   * 
   * When VIN changes (even partially):
   * - Previous decode results are invalidated
   * - Decode state returns to "vin-entry"
   * - Success/error messages are cleared
   * 
   * This prevents data integrity issues where old decoded vehicle data
   * is mistakenly associated with a new/different VIN.
   */
  const handleVinInputChange = (newVin: string) => {
    const cleanVin = newVin.toUpperCase();
    setVinInput(cleanVin);
    
    // Reset decode state if VIN changed (prevents stale data bug)
    if (cleanVin !== decodedVin) {
      setAddVehicleStep('vin-entry');
      setVinError('');
      setDecodeResult(null);
      setDecodedVin('');
    }
  };
  const [selectedVehicle, setSelectedVehicle] = useState<UserVehicle | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [isAppraising, setIsAppraising] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishingVehicle, setPublishingVehicle] = useState<UserVehicle | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (isAuthenticated && user) {
        console.log('[GARAGE] Loading data for user:', user.id);
        if (activeView === 'owned') {
          console.log('[GARAGE] Loading owned vehicles for user:', user.id);
          const vehicles = await userVehiclesAPI.getUserVehicles(user.id);
          console.log('[GARAGE] Loaded vehicles:', vehicles.length);
          setOwnedVehicles(vehicles);
        } else {
          console.log('[GARAGE] Loading saved vehicles for user:', user.id);
          const saved = await savedVehiclesAPI.getSavedVehicles(user.id);
          console.log('[GARAGE] Loaded saved vehicles:', saved.length, saved);
          setSavedVehicles(saved);
        }
      } else {
        console.log('[GARAGE] No authenticated user, cannot load data');
      }
      setIsLoading(false);
    };

    loadData();
  }, [isAuthenticated, user, activeView]);

  const handleVINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVinError('');

    // Validate VIN format
    if (!isValidVinFormat(vinInput)) {
      setVinError('VIN must be exactly 17 characters and cannot contain I, O, or Q');
      return;
    }

    setIsDecoding(true);
    setAddVehicleStep('decoding');

    try {
      const result = await decodeVin(vinInput);
      
      if (!result.success) {
        setVinError(result.error);
        setAddVehicleStep('failed');
        setDecodedVin(''); // Clear decoded VIN on failure
        return;
      }

      // Convert to format expected by existing code
      setDecodeResult({
        vin: vinInput.toUpperCase(),
        year: result.data.year,
        make: result.data.make,
        model: result.data.model,
        trim: result.data.trim,
      });
      setAddVehicleStep('review');
      setDecodedVin(vinInput.toUpperCase()); // Store the VIN that was successfully decoded
    } catch (error) {
      setVinError(error instanceof Error ? error.message : 'Failed to decode VIN');
      setAddVehicleStep('failed');
      setDecodedVin(''); // Clear decoded VIN on error
    } finally {
      setIsDecoding(false);
    }
  };

  const handleConfirmVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Debug logging
    console.log('[ADD TO GARAGE] Submit triggered');
    console.log('[ADD TO GARAGE] User:', user);
    console.log('[ADD TO GARAGE] Decode Result:', decodeResult);
    
    // Validation: Check required data BEFORE attempting backend write
    if (!isAuthenticated || !user) {
      console.error('[ADD TO GARAGE] User not authenticated');
      setVinError('You must be logged in to add a vehicle');
      toast({
        title: "Authentication Required",
        description: "Please sign in to add vehicles to your garage.",
        variant: "destructive",
      });
      return;
    }
    
    if (!decodeResult) {
      console.error('[ADD TO GARAGE] Missing decode result');
      setVinError('Vehicle decode data is missing. Please try again.');
      toast({
        title: "Decode Error",
        description: "Vehicle information is missing. Please decode VIN again.",
        variant: "destructive",
      });
      return;
    }

    // Validate decode result has required fields
    if (!decodeResult.year || !decodeResult.make || !decodeResult.model) {
      console.error('[ADD TO GARAGE] Incomplete vehicle data:', { 
        year: decodeResult.year, 
        make: decodeResult.make, 
        model: decodeResult.model 
      });
      setVinError('Vehicle data incomplete. Please decode VIN again.');
      toast({
        title: "Incomplete Data",
        description: "Vehicle year, make, or model is missing. Please try decoding again.",
        variant: "destructive",
      });
      return;
    }

    setAddingVehicle(true);
    const formData = new FormData(e.currentTarget);
    
    const userInputs = {
      mileage: formData.get('mileage') ? parseInt(formData.get('mileage') as string) : undefined,
      color: formData.get('color') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };
    
    console.log('[ADD TO GARAGE] Validated payload:', { 
      userId: user.id, 
      vin: decodeResult.vin, 
      year: decodeResult.year,
      make: decodeResult.make,
      model: decodeResult.model,
      userInputs 
    });

    try {
      // Atomic backend write - await confirmation before updating UI
      const newVehicle = await userVehiclesAPI.addVehicleFromVIN(user.id, decodeResult, userInputs);
      
      console.log('[ADD TO GARAGE] Backend write successful:', {
        vehicleId: newVehicle.id,
        hasAppraisal: !!newVehicle.appraisal,
        appraisalStatus: newVehicle.appraisal?.status,
      });
      
      // Only update local state after backend confirms success
      setOwnedVehicles([...ownedVehicles, newVehicle]);
      
      // Force view to owned vehicles if not already there
      if (activeView !== 'owned') {
        setActiveView('owned');
      }
      
      // Show success message
      toast({
        title: "Vehicle Added",
        description: `${newVehicle.year} ${newVehicle.make} ${newVehicle.model} has been added to your garage.`,
      });
      
      console.log('[ADD TO GARAGE] Success - closing dialog');
      
      // Close dialog only after confirmed success
      handleCloseAddDialog();
      
    } catch (error) {
      // Map specific errors to user-friendly messages
      let errorMessage = 'Failed to add vehicle. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('already in your garage')) {
          errorMessage = 'This vehicle is already in your garage';
        } else if (error.message.includes('incomplete')) {
          errorMessage = 'Vehicle data incomplete. Please try decoding again.';
        } else if (error.message.includes('Invalid')) {
          errorMessage = 'Invalid vehicle data. Please check your information.';
        } else {
          // Use the actual error message if it's descriptive
          errorMessage = error.message || errorMessage;
        }
      }
      
      setVinError(errorMessage);
      toast({
        title: "Error Adding Vehicle",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleManualEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('[MANUAL ENTRY] Starting handleManualEntry');
    console.log('[MANUAL ENTRY] User:', user?.id);
    
    if (!isAuthenticated || !user) {
      console.error('[MANUAL ENTRY] User not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please sign in to add vehicles to your garage.",
        variant: "destructive",
      });
      return;
    }

    setAddingVehicle(true);
    const formData = new FormData(e.currentTarget);
    
    // Extract and validate data
    const year = formData.get('year') ? parseInt(formData.get('year') as string) : 0;
    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    
    console.log('[MANUAL ENTRY] Extracted data:', { year, make, model });
    
    // Client-side validation
    if (!year || year < 1900 || year > new Date().getFullYear() + 1) {
      console.error('[MANUAL ENTRY] Invalid year:', year);
      toast({
        title: "Invalid Year",
        description: "Please enter a valid vehicle year.",
        variant: "destructive",
      });
      setAddingVehicle(false);
      return;
    }
    
    if (!make || make.trim().length === 0) {
      console.error('[MANUAL ENTRY] Missing make');
      toast({
        title: "Missing Make",
        description: "Vehicle make is required.",
        variant: "destructive",
      });
      setAddingVehicle(false);
      return;
    }
    
    if (!model || model.trim().length === 0) {
      console.error('[MANUAL ENTRY] Missing model');
      toast({
        title: "Missing Model",
        description: "Vehicle model is required.",
        variant: "destructive",
      });
      setAddingVehicle(false);
      return;
    }

    try {
      const vehicleData = {
        year,
        make: make.trim(),
        model: model.trim(),
        trim: formData.get('trim') as string || undefined,
        mileage: formData.get('mileage') ? parseInt(formData.get('mileage') as string) : undefined,
        color: formData.get('color') as string || undefined,
        notes: formData.get('notes') as string || undefined,
      };
      
      console.log('[MANUAL ENTRY] Validated payload:', vehicleData);

      // Atomic backend write
      const newVehicle = await userVehiclesAPI.addVehicle(user.id, vehicleData);
      
      console.log('[MANUAL ENTRY] Backend write successful:', {
        vehicleId: newVehicle.id,
        hasAppraisal: !!newVehicle.appraisal,
        appraisalStatus: newVehicle.appraisal?.status,
      });

      // Only update local state after backend confirms success
      setOwnedVehicles([...ownedVehicles, newVehicle]);
      
      // Force view to owned vehicles if not already there
      if (activeView !== 'owned') {
        setActiveView('owned');
      }
      
      toast({
        title: "Vehicle Added",
        description: `${newVehicle.year} ${newVehicle.make} ${newVehicle.model} has been added to your garage.`,
      });
      
      console.log('[MANUAL ENTRY] Success - closing dialog');
      handleCloseAddDialog();
      
    } catch (error) {
      console.error('[MANUAL ENTRY] Operation failed:', error);
      console.error('[MANUAL ENTRY] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[MANUAL ENTRY] Error message:', error instanceof Error ? error.message : String(error));
      
      let errorMessage = 'Failed to add vehicle. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('incomplete')) {
          errorMessage = 'Vehicle data incomplete. Please fill in all required fields.';
        } else if (error.message.includes('Invalid')) {
          errorMessage = 'Invalid vehicle data. Please check your information.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast({
        title: "Error Adding Vehicle",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAddingVehicle(false);
    }
  };

  const handleCloseAddDialog = () => {
    setShowAddDialog(false);
    setAddVehicleStep('vin-entry');
    setVinInput('');
    setVinError('');
    setDecodeResult(null);
    setAddingVehicle(false);
  };

  const handleAppraise = async (vehicle: UserVehicle) => {
    if (!isAuthenticated || !user) return;
    
    setIsAppraising(true);
    try {
      const appraisal = await appraisalAPI.appraiseVehicle(vehicle);
      const updated = await userVehiclesAPI.updateVehicle(user.id, vehicle.id, { appraisal });
      
      setOwnedVehicles(ownedVehicles.map(v => v.id === vehicle.id ? updated : v));
    } catch (error) {
      console.error('Appraisal failed:', error);
    } finally {
      setIsAppraising(false);
    }
  };

  const handleEditVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !selectedVehicle) return;

    const formData = new FormData(e.currentTarget);

    try {
      const updated = await userVehiclesAPI.updateVehicle(user.id, selectedVehicle.id, {
        mileage: formData.get('mileage') ? parseInt(formData.get('mileage') as string) : undefined,
        color: formData.get('color') as string || undefined,
        notes: formData.get('notes') as string || undefined,
        trim: formData.get('trim') as string || undefined,
      });

      setOwnedVehicles(ownedVehicles.map(v => v.id === selectedVehicle.id ? updated : v));
      setShowEditDialog(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Failed to update vehicle:', error);
    }
  };

  const handleListVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !selectedVehicle) return;

    const formData = new FormData(e.currentTarget);

    try {
      const listing = await marketplaceAPI.createListing(selectedVehicle.id, user.id, {
        askingPrice: parseInt(formData.get('askingPrice') as string),
        description: formData.get('description') as string,
        visibility: formData.get('visibility') as 'public' | 'unlisted',
      });

      const updated = await userVehiclesAPI.updateVehicle(user.id, selectedVehicle.id, {
        marketplaceListingId: listing.id,
      });

      setOwnedVehicles(ownedVehicles.map(v => v.id === selectedVehicle.id ? updated : v));
      setShowListDialog(false);
      setSelectedVehicle(null);
    } catch (error) {
      console.error('Failed to create listing:', error);
    }
  };

  const renderEmptyState = () => {
    if (activeView === 'saved') {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
            <Heart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-light tracking-tight mb-2">You haven't saved any vehicles yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Browse the marketplace and save vehicles you're interested in
          </p>
          <Button 
            onClick={() => router.push('/')}
            className="rounded-lg icy-glow-hover"
          >
            Browse Vehicles
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <Car className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-light tracking-tight mb-2">You haven't added any vehicles yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Add your personal vehicles to track maintenance, mileage, and more
        </p>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="rounded-lg"
          style={{ 
            background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
            color: 'hsl(var(--foreground))'
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>
    );
  };

  const renderVehicleGrid = () => {
    if (activeView === 'saved') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedVehicles.map((savedVehicle) => (
            <VehicleCard key={savedVehicle.id} vehicle={savedVehicle.listing} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ownedVehicles.map((vehicle) => (
          <div 
            key={vehicle.id}
            className="bg-card rounded-xl overflow-hidden border border-border hover:border-accent transition-all duration-200"
          >
            <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
              <Car className="w-16 h-16 text-muted-foreground" />
              
              {/* Actions Menu */}
              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="bg-background/90 backdrop-blur-sm rounded-full">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedVehicle(vehicle);
                      setShowEditDialog(true);
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Vehicle
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleAppraise(vehicle)}
                      disabled={isAppraising}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {vehicle.appraisal ? 'Re-appraise' : 'Appraise Vehicle'}
                    </DropdownMenuItem>
                    {!vehicle.marketplaceListingId && (
                      <DropdownMenuItem onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowListDialog(true);
                      }}>
                        <Upload className="w-4 h-4 mr-2" />
                        List on Marketplace
                      </DropdownMenuItem>
                    )}
                    {vehicle.marketplaceListingId && (
                      <DropdownMenuItem>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Listed on Marketplace
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-light mb-1">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              {vehicle.trim && (
                <p className="text-sm text-muted-foreground mb-3">{vehicle.trim}</p>
              )}
              {vehicle.mileage && (
                <p className="text-sm text-muted-foreground">
                  {formatDistance(vehicle.mileage)}
                </p>
              )}
              {vehicle.color && (
                <p className="text-sm text-muted-foreground capitalize">{vehicle.color}</p>
              )}
              
              {/* Appraisal Value - Coming Soon */}
              {/* Note: Appraisal display temporarily disabled. Will be replaced by live market appraisal 
                  once Canadian Black Book / US equivalent integration is enabled. */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Estimated Value</p>
                <p className="text-lg font-medium text-muted-foreground">
                  Coming Soon
                </p>
              </div>

              {/* Listed Badge */}
              {vehicle.marketplaceListingId && (
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Listed
                  </span>
                </div>
              )}

              {/* Publish Button - Show when not published */}
              {vehicle.status !== 'PUBLISHED' && !vehicle.marketplaceListingId && (
                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setPublishingVehicle(vehicle);
                      setShowPublishDialog(true);
                    }}
                    disabled={!vehicle.vin}
                    className="w-full"
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Publish to Marketplace
                  </Button>
                </div>
              )}

              {/* Published Badge */}
              {vehicle.status === 'PUBLISHED' && vehicle.isPublic && (
                <div className="mt-4">
                  <div className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-accent/10 text-accent border border-accent/20">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Published to Marketplace
                  </div>
                </div>
              )}

              {/* Expand/Collapse Button */}
              <button
                onClick={() => {
                  const newExpanded = new Set(expandedCards);
                  if (newExpanded.has(vehicle.id)) {
                    newExpanded.delete(vehicle.id);
                  } else {
                    newExpanded.add(vehicle.id);
                  }
                  setExpandedCards(newExpanded);
                }}
                className="w-full mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {expandedCards.has(vehicle.id) ? 'Show Less' : 'Show More'}
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  expandedCards.has(vehicle.id) && "rotate-90"
                )} />
              </button>

              {/* Expandable Content - Ownership Intelligence Modules */}
              {expandedCards.has(vehicle.id) && (
                <OwnershipModules vehicle={vehicle} />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Toggle */}
          <div className="mb-12">
            <h1 className="text-4xl font-light tracking-tight mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">My Garage</h1>
            
            <div className="flex items-center justify-between">
              {/* Toggle */}
              <div className="inline-flex items-center rounded-xl border border-border bg-muted/30 p-1">
                <button
                  onClick={() => setActiveView('saved')}
                  className={cn(
                    'px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    activeView === 'saved'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Heart className="w-4 h-4 inline mr-2" />
                  Saved Vehicles
                </button>
                <button
                  onClick={() => setActiveView('owned')}
                  className={cn(
                    'px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    activeView === 'owned'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Car className="w-4 h-4 inline mr-2" />
                  My Vehicles
                </button>
              </div>

              {/* Add Vehicle Button - Only shown in My Vehicles view */}
              {activeView === 'owned' && (
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="rounded-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              )}
            </div>

            {/* Count */}
            <p className="text-muted-foreground mt-4">
              {activeView === 'saved' 
                ? `${savedVehicles.length} saved vehicle${savedVehicles.length !== 1 ? 's' : ''}`
                : `${ownedVehicles.length} owned vehicle${ownedVehicles.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl overflow-hidden border border-border">
                  <div className="aspect-[4/3] bg-muted animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (activeView === 'saved' && savedVehicles.length === 0) || (activeView === 'owned' && ownedVehicles.length === 0) ? (
            renderEmptyState()
          ) : (
            renderVehicleGrid()
          )}
        </div>
      </div>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && handleCloseAddDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">
              {addVehicleStep === 'manual' ? 'Add Vehicle Manually' : 'Add Your Vehicle'}
            </DialogTitle>
          </DialogHeader>

          {/* STEP 1: VIN ENTRY */}
          {addVehicleStep === 'vin-entry' && (
            <div className="space-y-6 mt-4">
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 mx-auto mb-4 flex items-center justify-center">
                  <Car className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-medium mb-2">Enter your VIN to get started</h3>
                <p className="text-sm text-muted-foreground">
                  We'll automatically decode your vehicle information
                </p>
              </div>

              <form onSubmit={handleVINSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN (17 characters) *</Label>
                  <Input
                    id="vin"
                    value={vinInput}
                    onChange={(e) => handleVinInputChange(e.target.value)}
                    placeholder="1HGBH41JXMN109186"
                    maxLength={17}
                    className={cn(
                      'text-center text-lg tracking-wider font-mono',
                      vinError && 'border-destructive'
                    )}
                  />
                  {vinError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{vinError}</AlertDescription>
                    </Alert>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Find your VIN on your registration, insurance card, or driver's side dashboard
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={vinInput.length !== 17}
                    className="w-full"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
                      color: 'hsl(var(--foreground))'
                    }}
                  >
                    Decode VIN
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAddVehicleStep('manual')}
                    className="w-full text-muted-foreground"
                  >
                    I don't have my VIN
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: DECODING */}
          {addVehicleStep === 'decoding' && (
            <div className="space-y-6 py-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-accent" />
              <div>
                <h3 className="text-lg font-medium mb-2">Decoding your VIN</h3>
                <p className="text-sm text-muted-foreground">
                  Retrieving vehicle information...
                </p>
              </div>
            </div>
          )}

          {/* STEP 2b: DECODE FAILED */}
          {addVehicleStep === 'failed' && (
            <div className="space-y-6 mt-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {vinError || 'Unable to decode VIN'}
                </AlertDescription>
              </Alert>

              <div className="bg-muted/30 rounded-lg p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  VIN decoding is optional. You can enter vehicle information manually.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setAddVehicleStep('vin-entry');
                    setVinError('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Try Another VIN
                </Button>
                <Button
                  onClick={() => {
                    setAddVehicleStep('manual');
                    setVinError('');
                  }}
                  className="w-full"
                >
                  Enter Manually Instead
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {addVehicleStep === 'review' && decodeResult && vinInput === decodedVin && (
            <form onSubmit={handleConfirmVehicle} className="space-y-6 mt-4">
              
              <div className="bg-accent/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">VIN decoded successfully</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VIN</span>
                    <span className="font-mono">{decodeResult.vin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Vehicle</span>
                    <span className="font-medium">
                      {decodeResult.year} {decodeResult.make} {decodeResult.model} {decodeResult.trim}
                    </span>
                  </div>
                  {decodeResult.bodyStyle && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Body Style</span>
                      <span>{decodeResult.bodyStyle}</span>
                    </div>
                  )}
                  {decodeResult.driveType && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Drive Type</span>
                      <span>{decodeResult.driveType}</span>
                    </div>
                  )}
                  {decodeResult.engine && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Engine</span>
                      <span>
                        {decodeResult.engine.displacement}
                        {decodeResult.engine.cylinders && decodeResult.engine.cylinders > 0 
                          ? ` ${decodeResult.engine.cylinders}-cyl` 
                          : ''
                        } {decodeResult.engine.fuelType}
                      </span>
                    </div>
                  )}
                  {decodeResult.transmission && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transmission</span>
                      <span>{decodeResult.transmission}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Add your details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Current Mileage</Label>
                    <Input
                      id="mileage"
                      name="mileage"
                      type="number"
                      placeholder="25000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      name="color"
                      placeholder="Midnight Silver"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Maintenance history, modifications, etc."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseAddDialog}
                  disabled={addingVehicle}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={addingVehicle}
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  {addingVehicle ? 'Adding...' : 'Add to Garage'}
                </Button>
              </div>
            </form>
          )}

          {/* MANUAL ENTRY FALLBACK */}
          {addVehicleStep === 'manual' && (
            <form onSubmit={handleManualEntry} className="space-y-6 mt-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Manual entry provides limited vehicle information. We recommend using VIN decode when possible.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    required
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    name="make"
                    required
                    placeholder="Tesla"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    name="model"
                    required
                    placeholder="Model 3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trim">Trim</Label>
                  <Input
                    id="trim"
                    name="trim"
                    placeholder="Performance"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    name="mileage"
                    type="number"
                    placeholder="25000"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    name="color"
                    placeholder="Midnight Silver"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Custom wheels, ceramic coating, etc."
                  rows={3}
                />
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddVehicleStep('vin-entry')}
                  disabled={addingVehicle}
                >
                  ← Back to VIN entry
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseAddDialog}
                    disabled={addingVehicle}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addingVehicle}
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
                      color: 'hsl(var(--foreground))'
                    }}
                  >
                    {addingVehicle ? 'Adding...' : 'Add Vehicle'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">Edit Vehicle</DialogTitle>
          </DialogHeader>

          {selectedVehicle && (
            <form onSubmit={handleEditVehicle} className="space-y-6 mt-4">
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-2">Vehicle</p>
                <p className="font-medium">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </p>
                {selectedVehicle.vin && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{selectedVehicle.vin}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-trim">Trim</Label>
                  <Input
                    id="edit-trim"
                    name="trim"
                    defaultValue={selectedVehicle.trim}
                    placeholder="Performance"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-mileage">Mileage</Label>
                    <Input
                      id="edit-mileage"
                      name="mileage"
                      type="number"
                      defaultValue={selectedVehicle.mileage}
                      placeholder="25000"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-color">Color</Label>
                    <Input
                      id="edit-color"
                      name="color"
                      defaultValue={selectedVehicle.color}
                      placeholder="Midnight Silver"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={selectedVehicle.notes}
                    placeholder="Maintenance history, modifications, etc."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedVehicle(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* List Vehicle Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-light">List on Marketplace</DialogTitle>
          </DialogHeader>

          {selectedVehicle && (
            <form onSubmit={handleListVehicle} className="space-y-6 mt-4">
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-2">Vehicle</p>
                <p className="font-medium">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.trim}
                </p>
                {selectedVehicle.mileage && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDistance(selectedVehicle.mileage)}
                  </p>
                )}
                {/* Appraisal Value - Coming Soon */}
                {/* Note: This placeholder will be replaced by live market appraisal once integration is enabled */}
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Estimated Value</p>
                  <p className="text-sm font-medium text-muted-foreground">
                    Coming Soon
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="askingPrice">Asking Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="askingPrice"
                      name="askingPrice"
                      type="number"
                      required
                      placeholder="35000"
                      className="pl-7"
                      defaultValue={selectedVehicle.appraisal?.valueHigh}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Listing Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    required
                    placeholder="Describe your vehicle's condition, features, service history, etc."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    name="visibility"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    defaultValue="public"
                  >
                    <option value="public">Public - Anyone can see this listing</option>
                    <option value="unlisted">Unlisted - Only accessible via direct link</option>
                  </select>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your vehicle will remain in your garage. You can manage the listing separately.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowListDialog(false);
                    setSelectedVehicle(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  Create Listing
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Publish Vehicle Dialog */}
      <PublishVehicleDialog
        vehicle={publishingVehicle}
        open={showPublishDialog}
        onClose={() => {
          setShowPublishDialog(false);
          setPublishingVehicle(null);
        }}
        onPublish={async (data) => {
          if (!publishingVehicle || !isAuthenticated || !user) return;
          
          try {
            // Call AWS publish API
            const updatedVehicle = await userVehiclesAPI.publishVehicle(
              user.id,
              publishingVehicle.id,
              data
            );
            
            // Refetch from AWS to get single source of truth
            const allVehicles = await userVehiclesAPI.getUserVehicles(user.id);
            setOwnedVehicles(allVehicles);
            
            // Close the dialog
            setShowPublishDialog(false);
            setPublishingVehicle(null);
            
            // Show success confirmation
            toast({
              title: "Vehicle Published",
              description: `Your ${publishingVehicle.year} ${publishingVehicle.make} ${publishingVehicle.model} is now live on the marketplace.`,
            });
          } catch (error) {
            console.error('[PUBLISH ERROR]', error);
            
            toast({
              title: "Publishing Failed",
              description: error instanceof Error ? error.message : "Unable to publish your vehicle. Please try again.",
              variant: "destructive",
            });
          }
        }}
      />
    </>
  );
}
