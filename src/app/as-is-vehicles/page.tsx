'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Vehicle, AsIsDisclosure } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Wrench,
  AlertCircle,
  Filter,
  DollarSign,
  MapPin,
  Calendar,
  Info,
  X,
  ChevronDown
} from 'lucide-react';
import { VehicleCard } from '@/components/cards/vehicle-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function AsIsVehiclesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isUnauthenticated } = useAuth();
  const { toast } = useToast();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    runningStatus: 'all',
    priceMin: '',
    priceMax: '',
    make: '',
    sortBy: 'newest'
  });

  // Check acknowledgment status on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      checkAcknowledgment();
    } else if (isUnauthenticated) {
      // Show disclaimer for non-logged-in users
      setShowDisclaimer(true);
    }
  }, [isAuthenticated, isUnauthenticated, user]);

  // Fetch vehicles after acknowledgment
  useEffect(() => {
    if (acknowledged || isUnauthenticated) {
      fetchVehicles();
    }
  }, [acknowledged, filters, isUnauthenticated]);

  const checkAcknowledgment = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await fetch(`/api/as-is-vehicles/acknowledgment?userId=${user.id}`);
      const data = await response.json();
      
      if (data.acknowledged) {
        setAcknowledged(true);
      } else {
        setShowDisclaimer(true);
      }
    } catch (error) {
      console.error('Failed to check acknowledgment:', error);
      setShowDisclaimer(true);
    }
  };

  const handleAcknowledge = async () => {
    if (isAuthenticated && user) {
      try {
        await fetch('/api/as-is-vehicles/acknowledgment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (error) {
        console.error('Failed to record acknowledgment:', error);
      }
    }
    
    setAcknowledged(true);
    setShowDisclaimer(false);
  };

  const fetchVehicles = async () => {
    setLoading(true);
    
    try {
      const queryParams = new URLSearchParams();
      if (filters.runningStatus !== 'all') queryParams.set('runningStatus', filters.runningStatus);
      if (filters.priceMin) queryParams.set('priceMin', filters.priceMin);
      if (filters.priceMax) queryParams.set('priceMax', filters.priceMax);
      if (filters.make) queryParams.set('make', filters.make);
      queryParams.set('sortBy', filters.sortBy);
      
      const response = await fetch(`/api/as-is-vehicles?${queryParams.toString()}`);
      const data = await response.json();
      
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Failed to fetch AS-IS vehicles:', error);
      toast({
        title: 'Failed to load vehicles',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-background border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-light tracking-tight text-foreground">
                  Project & As-Is Vehicles
                </h1>
                <Badge 
                  variant="outline" 
                  className="bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/30"
                >
                  Non-Running / Uninspected
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                Vehicles sold as-is, including non-running, uninspected, or vehicles with known issues. 
                Intended for project builds, export, parts, or restoration.
              </p>
            </div>
          </div>

          {/* Warning Banner */}
          <Card className="bg-amber-500/5 border-amber-500/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-500">
                  Important: These vehicles are not road-ready
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-600">
                  Vehicles in this section may not run, may not be inspected, and may have known mechanical, 
                  electrical, or structural issues. Carly does not certify or guarantee these listings. 
                  No test drives are available.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            <div className="flex items-center gap-3">
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Running Status</label>
                  <Select 
                    value={filters.runningStatus} 
                    onValueChange={(value) => setFilters({ ...filters, runningStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="not_running">Not Running</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Min Price</label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Max Price</label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Make</label>
                  <Input
                    placeholder="Any make"
                    value={filters.make}
                    onChange={(e) => setFilters({ ...filters, make: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({
                    runningStatus: 'all',
                    priceMin: '',
                    priceMax: '',
                    make: '',
                    sortBy: 'newest'
                  })}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <Wrench className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-light mb-2">No vehicles found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or check back later
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <AsIsVehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              Important Notice
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-2">
              You are about to enter the <strong>As-Is / Project Vehicles</strong> section.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Card className="bg-amber-500/5 border-amber-500/30 p-4">
              <p className="text-sm text-amber-900 dark:text-amber-500 font-medium mb-3">
                Vehicles in this section may:
              </p>
              <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-600">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Not be running or operational</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Not be inspected or certified</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Have known mechanical, electrical, or structural issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Require significant repair, restoration, or parts replacement</span>
                </li>
              </ul>
            </Card>

            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Carly does not:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Certify or guarantee these vehicles</li>
                <li>• Arrange test drives for as-is vehicles</li>
                <li>• Verify the accuracy of disclosed issues</li>
                <li>• Provide warranties or buyer protection for these listings</li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              These vehicles are intended for project builds, export, parts, restoration, 
              or buyers with mechanical expertise. Purchase at your own risk.
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.back()} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAcknowledge}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Custom Vehicle Card for AS-IS listings
function AsIsVehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow border-amber-500/20"
      onClick={() => router.push(`/as-is-vehicles/${vehicle.listingId}`)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted">
        {vehicle.images && vehicle.images[0] ? (
          <img 
            src={vehicle.images[0]} 
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wrench className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* AS-IS Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <Badge className="bg-amber-600 text-white font-medium shadow-lg">
            AS-IS
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

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-medium text-lg text-foreground mb-1">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-2xl font-light text-foreground">
            ${vehicle.price.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {vehicle.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {vehicle.year}
          </span>
        </div>

        {/* Disclosure Summary */}
        {vehicle.asIsDisclosure && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              Seller disclosure available
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
