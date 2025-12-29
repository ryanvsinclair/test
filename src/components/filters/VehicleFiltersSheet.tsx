"use client";

import { useState, useMemo, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParsedSearchCriteria } from "@/lib/search/nl-parser";
// Mock data removed - connect to real database

interface VehicleFiltersSheetProps {
  filters: ParsedSearchCriteria;
  onFiltersChange: (filters: ParsedSearchCriteria) => void;
  userCountry?: 'CA' | 'US';
  variant?: 'button' | 'icon';
  className?: string;
}

export function VehicleFiltersSheet({ 
  filters, 
  onFiltersChange, 
  userCountry = 'CA',
  variant = 'icon',
  className = ''
}: VehicleFiltersSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof ParsedSearchCriteria];
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  // Get unique makes
  const uniqueMakes = useMemo(() => {
    // TODO: Replace with real database query
    const makes = new Set<string>();
    return Array.from(makes).sort();
  }, []);

  const handleApply = (newFilters: ParsedSearchCriteria) => {
    onFiltersChange(newFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    onFiltersChange({});
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {variant === 'button' ? (
          <Button
            variant="outline"
            size="lg"
            className={className}
          >
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge 
                variant="default" 
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon"
            className={className}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <Badge 
                variant="default" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <FiltersPanel 
          initialFilters={filters}
          onApply={handleApply}
          onReset={handleReset}
          uniqueMakes={uniqueMakes}
          userCountry={userCountry}
        />
      </SheetContent>
    </Sheet>
  );
}

// Filters Panel Component
interface FiltersPanelProps {
  initialFilters: ParsedSearchCriteria;
  onApply: (filters: ParsedSearchCriteria) => void;
  onReset: () => void;
  uniqueMakes: string[];
  userCountry: 'CA' | 'US';
}

function FiltersPanel({ initialFilters, onApply, onReset, uniqueMakes, userCountry }: FiltersPanelProps) {
  const [filters, setFilters] = useState<ParsedSearchCriteria>(initialFilters);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Sync filters with initialFilters when they change
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const updateFilter = (key: keyof ParsedSearchCriteria, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    // Clear validation error for this field
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateAndApply = () => {
    const errors: Record<string, string> = {};

    // Validate price range
    if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
      errors.price = 'Min price cannot exceed max price';
    }

    // Validate year range
    if (filters.minYear && filters.maxYear && filters.minYear > filters.maxYear) {
      errors.year = 'Min year cannot exceed max year';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Normalize filters - convert "any" to undefined
    const normalizedFilters: ParsedSearchCriteria = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== 'any' && value !== undefined && value !== null && value !== '') {
        normalizedFilters[key as keyof ParsedSearchCriteria] = value as any;
      }
    });

    onApply(normalizedFilters);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-2xl font-light">Filters</SheetTitle>
      </SheetHeader>

      <ScrollArea className="h-[calc(100vh-180px)] pr-4">
        <div className="space-y-6 py-6">
          {/* Price */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Price ({userCountry === 'CA' ? 'CAD' : 'USD'})</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice || ''}
                  onChange={(e) => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice || ''}
                  onChange={(e) => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="rounded-lg"
                />
              </div>
            </div>
            {validationErrors.price && (
              <p className="text-xs text-red-500">{validationErrors.price}</p>
            )}
          </div>

          <Separator />

          {/* Mileage */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Mileage ({userCountry === 'CA' ? 'km' : 'miles'})</Label>
            <div>
              <Label className="text-xs text-muted-foreground">Max</Label>
              <Input
                type="number"
                placeholder="Any"
                value={filters.maxMileage || ''}
                onChange={(e) => updateFilter('maxMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                className="rounded-lg"
              />
            </div>
          </div>

          <Separator />

          {/* Year */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Year</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Select
                  value={filters.minYear?.toString() || 'any'}
                  onValueChange={(value) => updateFilter('minYear', value === 'any' ? undefined : parseInt(value))}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Select
                  value={filters.maxYear?.toString() || 'any'}
                  onValueChange={(value) => updateFilter('maxYear', value === 'any' ? undefined : parseInt(value))}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {validationErrors.year && (
              <p className="text-xs text-red-500">{validationErrors.year}</p>
            )}
          </div>

          <Separator />

          {/* Make */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Make</Label>
            <Select
              value={filters.make || 'any'}
              onValueChange={(value) => updateFilter('make', value === 'any' ? undefined : value)}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {uniqueMakes.map(make => (
                  <SelectItem key={make} value={make}>{make}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Body Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Body Type</Label>
            <Select
              value={filters.bodyType || 'any'}
              onValueChange={(value) => updateFilter('bodyType', value === 'any' ? undefined : value)}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="Sedan">Sedan</SelectItem>
                <SelectItem value="SUV">SUV</SelectItem>
                <SelectItem value="Coupe">Coupe</SelectItem>
                <SelectItem value="Hatchback">Hatchback</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Minivan">Minivan</SelectItem>
                <SelectItem value="Convertible">Convertible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Drivetrain */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Drivetrain</Label>
            <Select
              value={filters.drivetrain || 'any'}
              onValueChange={(value) => updateFilter('drivetrain', value === 'any' ? undefined : value as any)}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="AWD">AWD</SelectItem>
                <SelectItem value="FWD">FWD</SelectItem>
                <SelectItem value="RWD">RWD</SelectItem>
                <SelectItem value="4WD">4WD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Fuel Type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Fuel Type</Label>
            <Select
              value={filters.fuelType || 'any'}
              onValueChange={(value) => updateFilter('fuelType', value === 'any' ? undefined : value as any)}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="gasoline">Gas</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Transmission */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Transmission</Label>
            <Select
              value={filters.transmission || 'any'}
              onValueChange={(value) => updateFilter('transmission', value === 'any' ? undefined : value as any)}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ScrollArea>

      <SheetFooter className="flex-row gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onReset} className="flex-1 rounded-lg">
          Reset
        </Button>
        <Button onClick={validateAndApply} className="flex-1 rounded-lg">
          Apply Filters
        </Button>
      </SheetFooter>
    </>
  );
}
