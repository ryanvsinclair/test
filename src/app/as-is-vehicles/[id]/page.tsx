'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Wrench,
  AlertCircle,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Mail,
  ChevronLeft,
  Info,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AsIsVehicleDetailPageProps {
  params: { id: string };
}

export default function AsIsVehicleDetailPage({ params }: AsIsVehicleDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchVehicle();
  }, [params.id]);

  const fetchVehicle = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/as-is-vehicles?listingId=${params.id}`);
      const data = await response.json();
      
      if (data.vehicle) {
        setVehicle(data.vehicle);
      } else {
        toast({
          title: 'Vehicle not found',
          variant: 'destructive'
        });
        router.push('/as-is-vehicles');
      }
    } catch (error) {
      console.error('Failed to fetch vehicle:', error);
      toast({
        title: 'Failed to load vehicle',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = () => {
    if (!vehicle) return;
    
    toast({
      title: 'Contact seller',
      description: 'Messaging system will open here'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-[16/10] w-full rounded-xl mb-4" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-20 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/as-is-vehicles')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to As-Is Vehicles
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[16/10] bg-muted rounded-xl overflow-hidden">
                {vehicle.images && vehicle.images[currentImageIndex] ? (
                  <img
                    src={vehicle.images[currentImageIndex]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Wrench className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* AS-IS Badge Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge className="bg-amber-600 text-white font-medium shadow-lg">
                    AS-IS VEHICLE
                  </Badge>
                  {vehicle.runningStatus === 'not_running' && (
                    <Badge variant="destructive" className="font-medium shadow-lg">
                      NOT RUNNING
                    </Badge>
                  )}
                  {vehicle.inspectionStatus === 'not_inspected' && (
                    <Badge variant="outline" className="bg-background/90 font-medium shadow-lg">
                      NOT INSPECTED
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {vehicle.images && vehicle.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {vehicle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-amber-600'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <Card className="p-6 space-y-6">
              <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {vehicle.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {vehicle.year}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Specifications */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Gauge className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mileage</p>
                      <p className="text-sm font-medium">{vehicle.mileage.toLocaleString()} km</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Cog className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Transmission</p>
                      <p className="text-sm font-medium capitalize">{vehicle.transmission}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fuel Type</p>
                      <p className="text-sm font-medium capitalize">{vehicle.fuelType}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Running Status</p>
                      <p className="text-sm font-medium capitalize">{vehicle.runningStatus || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {vehicle.description}
                </p>
              </div>

              {/* Seller Disclosures */}
              {vehicle.asIsDisclosure && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Seller Disclosures
                    </h3>
                    <Card className="bg-amber-500/5 border-amber-500/30 p-4">
                      <ul className="space-y-2 text-sm">
                        {vehicle.asIsDisclosure.notRunning && (
                          <li className="flex items-center gap-2 text-amber-900 dark:text-amber-500">
                            <X className="w-4 h-4" />
                            Vehicle is not running
                          </li>
                        )}
                        {vehicle.asIsDisclosure.mechanicalIssues && (
                          <li className="flex items-center gap-2 text-amber-900 dark:text-amber-500">
                            <X className="w-4 h-4" />
                            Known mechanical issues
                          </li>
                        )}
                        {vehicle.asIsDisclosure.electricalIssues && (
                          <li className="flex items-center gap-2 text-amber-900 dark:text-amber-500">
                            <X className="w-4 h-4" />
                            Known electrical issues
                          </li>
                        )}
                        {vehicle.asIsDisclosure.structuralDamage && (
                          <li className="flex items-center gap-2 text-amber-900 dark:text-amber-500">
                            <X className="w-4 h-4" />
                            Structural or accident damage
                          </li>
                        )}
                        {vehicle.asIsDisclosure.notInspected && (
                          <li className="flex items-center gap-2 text-amber-900 dark:text-amber-500">
                            <X className="w-4 h-4" />
                            Vehicle has not been inspected
                          </li>
                        )}
                        {vehicle.asIsDisclosure.exportOnly && (
                          <li className="flex items-center gap-2 text-amber-900 dark:text-amber-500">
                            <X className="w-4 h-4" />
                            Export-only
                          </li>
                        )}
                        {vehicle.asIsDisclosure.forParts && (
                          <li className="flex items-center gap-2 text-amber-900 dark:text-amber-500">
                            <X className="w-4 h-4" />
                            For parts / restoration
                          </li>
                        )}
                      </ul>
                      {vehicle.asIsDisclosure.customDescription && (
                        <p className="mt-3 text-xs text-amber-700 dark:text-amber-600 leading-relaxed">
                          {vehicle.asIsDisclosure.customDescription}
                        </p>
                      )}
                    </Card>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Right Column - Pricing & Actions */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card className="p-6 space-y-4 sticky top-6">
              <div>
                <p className="text-3xl font-light text-foreground mb-1">
                  ${vehicle.price.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">As-Is Price</p>
              </div>

              <Separator />

              {/* Warning */}
              <Card className="bg-amber-500/5 border-amber-500/30 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-500">
                      This vehicle is sold as-is
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-600 space-y-1">
                      <li>• May not be road-ready</li>
                      <li>• No test drives available</li>
                      <li>• Not certified by Carly</li>
                      <li>• Purchase at your own risk</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Contact Seller Button */}
              <Button 
                onClick={handleContactSeller}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                size="lg"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Seller (As-Is Vehicle)
              </Button>

              {/* Seller Info */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Listed by</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {vehicle.sellerName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{vehicle.sellerName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{vehicle.sellerType}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">
                    About As-Is Vehicles
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    These vehicles are intended for project builds, export, parts, or buyers with 
                    mechanical expertise. Verify all details with the seller before purchasing.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
