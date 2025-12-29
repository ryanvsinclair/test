"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Heart, ArrowUpDown, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Mock data removed - connect to real database
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { parseNaturalLanguageQuery, criteriaToReadableString, ParsedSearchCriteria } from "@/lib/search/nl-parser";
import { filterVehicles } from "@/lib/search/vehicle-filter";
import { VehicleFiltersSheet } from "@/components/filters/VehicleFiltersSheet";
import { filterHiddenListings } from "@/lib/api/taste-learning";
import { 
  sortVehicles, 
  SortOption, 
  STANDARD_SORT_OPTIONS 
} from "@/lib/api/smart-sorting";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { ListingsCardGrid } from "@/components/listings/ListingsCardGrid";
import { ListingsListView } from "@/components/listings/ListingsListView";
import { getStoredViewMode, setStoredViewMode } from "@/lib/utils/view-mode";

export default function ExplorePage() {
  const {
  isLoading,
  isAuthenticated,
  isUnauthenticated,
  user
} = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [localHiddenIds, setLocalHiddenIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  
  // Pagination state
  const [pageSize, setPageSize] = useState<15 | 30 | 50>(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  
  // Explore page uses standard sorting only (no smart sorting for unauthenticated users)
  const [sortOption, setSortOption] = useState<SortOption>('newest-first');
  
  // Manual filter state
  const [manualFilters, setManualFilters] = useState<ParsedSearchCriteria>({});

  // Load stored view mode on mount
  useEffect(() => {
    setViewMode(getStoredViewMode());
  }, []);

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setStoredViewMode(mode);
  };
  
  // Merge manual filters with parsed search criteria
  const mergedCriteria = useMemo(() => {
    const userCountry = user?.country || 'CA';
    
    // Parse search term if present
    let searchCriteria: ParsedSearchCriteria = {};
    if (searchTerm.trim()) {
      searchCriteria = parseNaturalLanguageQuery(searchTerm, userCountry);
    }
    
    // Merge manual filters (manual filters override search)
    return {
      ...searchCriteria,
      ...manualFilters,
      mileageUnit: manualFilters.mileageUnit || searchCriteria.mileageUnit || (userCountry === 'CA' ? 'km' : 'mi'),
    };
  }, [searchTerm, manualFilters, user]);

  // Parse and filter vehicles using merged criteria
  const filteredVehicles = useMemo(() => {
    const hasCriteria = Object.keys(mergedCriteria).some(
      key => key !== 'keywords' && key !== 'mileageUnit' && mergedCriteria[key as keyof typeof mergedCriteria] !== undefined
    );

    if (!hasCriteria) {
      // TODO: Connect to real database
      let vehicles: any[] = [];
      if (user?.id && user?.preferences?.refineFeedEnabled) {
        vehicles = filterHiddenListings(user.id, vehicles);
      }
      // Also filter locally hidden vehicles
      vehicles = vehicles.filter(v => !localHiddenIds.includes(v.id));
      
      return vehicles;
    }

    const userCountry = user?.country || 'CA';
    // TODO: Connect to real database
    const results: any[] = [];

    // Filter out hidden vehicles
    let vehicles = results.map(r => r.vehicle);
    if (user?.id && user?.preferences?.refineFeedEnabled) {
      vehicles = filterHiddenListings(user.id, vehicles);
    }
    // Also filter locally hidden vehicles
    vehicles = vehicles.filter(v => !localHiddenIds.includes(v.id));

    return vehicles;
  }, [mergedCriteria, user, localHiddenIds]);

  // Apply sorting - Explore page uses standard sorting only (no personalization)
  const sortedVehicles = useMemo(() => {
    return sortVehicles(filteredVehicles, sortOption, null);
  }, [filteredVehicles, sortOption]);

  // Pagination logic
  const totalPages = Math.ceil(sortedVehicles.length / pageSize);
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedVehicles.slice(startIndex, endIndex);
  }, [sortedVehicles, currentPage, pageSize]);

  // Reset to page 1 when filters, search, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [mergedCriteria, sortOption]);

  // Handle page size change
  const handlePageSizeChange = (newSize: 15 | 30 | 50) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Handle page navigation with smooth transition
  const handlePageChange = (newPage: number) => {
    if (isTransitioning || newPage < 1 || newPage > totalPages) return;

    // Check motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // 1. Lock container height to prevent layout shift during scroll
    const listContainer = listContainerRef.current;
    const originalHeight = listContainer ? listContainer.scrollHeight : null;
    const originalOverflow = listContainer ? listContainer.style.overflow : null;
    
    if (listContainer && originalHeight) {
      listContainer.style.height = `${originalHeight}px`;
      listContainer.style.overflow = 'hidden';
    }

    // 2. IMMEDIATE: Scroll to top BEFORE any state change
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });

    // 3. Let scroll animation complete
    const scrollDuration = prefersReducedMotion ? 0 : 400;
    
    setTimeout(() => {
      setIsTransitioning(true);
      
      // 4. Update page data while height is still locked
      setTimeout(() => {
        setCurrentPage(newPage);
        
        // 5. Wait for render, then unlock height
        setTimeout(() => {
          if (listContainer) {
            listContainer.style.height = '';
            listContainer.style.overflow = originalOverflow || '';
          }
          setIsTransitioning(false);
        }, 50);
      }, 50);
    }, scrollDuration);
  };

  // Generate criteria text for display
  const criteriaText = useMemo(() => {
    const hasCriteria = Object.keys(mergedCriteria).some(
      key => key !== 'keywords' && key !== 'mileageUnit' && mergedCriteria[key as keyof typeof mergedCriteria] !== undefined
    );
    return hasCriteria ? criteriaToReadableString(mergedCriteria) : null;
  }, [mergedCriteria]);

  const handleVehicleHide = (vehicleId: string) => {
    setLocalHiddenIds(prev => [...prev, vehicleId]);
  };

  return (
    <section className="pt-32 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto" ref={contentRef}>
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-3 sm:mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Explore Vehicles
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse thousands of verified listings
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Try: cheap reliable car, family suv under 30k, or beemer low mileage"
              className="micro-depth icy-focus h-14 pl-12 pr-14 rounded-xl text-lg transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchActive(true)}
              onBlur={() => setTimeout(() => setIsSearchActive(false), 200)}
            />
            
            <VehicleFiltersSheet
              filters={manualFilters}
              onFiltersChange={setManualFilters}
              userCountry={user?.country || 'CA'}
              variant="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
            />
          </div>

          {/* Smart search indicator */}
          {criteriaText && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-muted-foreground">
                  Showing results for:{" "}
                  <span className="font-medium text-foreground">{criteriaText}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sort Controls & View Toggle */}
        <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="text-sm text-muted-foreground">
            {sortedVehicles.length} {sortedVehicles.length === 1 ? 'vehicle' : 'vehicles'}
            {totalPages > 1 && (
              <span className="ml-2 text-xs">
                • Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />
            
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="flex-1 sm:flex-initial sm:w-[280px] rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <SelectValue placeholder="Sort by..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                {/* Explore page: Standard sorting only (no smart options) */}
                <SelectGroup>
                  <SelectLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-2">
                    Sort By
                  </SelectLabel>
                  {STANDARD_SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isUnauthenticated && (
          <div className="max-w-2xl mx-auto mb-12 p-4 rounded-xl bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent-glow))' }}>
                <Heart className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Sign in to save favorites and message sellers</p>
                <p className="text-xs text-muted-foreground">Get personalized recommendations and access to exclusive features</p>
              </div>
              <Link href="/">
                <Button size="sm" className="rounded-lg" style={{ background: 'linear-gradient(135deg, hsl(var(--accent-primary)), hsl(var(--accent-secondary)))', color: 'hsl(var(--foreground))' }}>
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Listings with transition effect */}
        <div 
          ref={listContainerRef}
          className="transition-opacity duration-300"
          style={{ opacity: isTransitioning ? 0.4 : 1 }}
        >
          {viewMode === 'card' ? (
            <ListingsCardGrid
              vehicles={paginatedVehicles}
              showSaveButton={isAuthenticated}
              onHide={handleVehicleHide}
            />
          ) : (
            <ListingsListView
              vehicles={paginatedVehicles}
              showSaveButton={isAuthenticated}
              onHide={handleVehicleHide}
            />
          )}
        </div>

        {sortedVehicles.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent-glow))' }}>
              <Search className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-light">No vehicles found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search criteria or filters to find more results
            </p>
            <Button variant="outline" onClick={() => setManualFilters({})} className="rounded-lg">
              Reset Filters
            </Button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && sortedVehicles.length > 0 && (
          <div className="mt-12 space-y-6">
            {/* Page Size Selector */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <div className="flex items-center gap-1">
                {([15, 30, 50] as const).map((size) => (
                  <Button
                    key={size}
                    onClick={() => handlePageSizeChange(size)}
                    disabled={isTransitioning}
                    variant={pageSize === size ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg min-w-[60px]"
                  >
                    {size}
                  </Button>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>

            {/* Navigation Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isTransitioning}
                size="lg"
                variant="outline"
                className="rounded-xl h-12 px-6 gap-2 w-full sm:w-auto"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </Button>

              <div className="flex items-center justify-center min-w-[140px] px-4 py-3 rounded-xl border border-border bg-card">
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isTransitioning}
                size="lg"
                variant="outline"
                className="rounded-xl h-12 px-6 gap-2 w-full sm:w-auto"
                aria-label="Next page"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
