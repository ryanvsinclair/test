/**
 * BrowseLoggedIn - Personalized marketplace view
 * 
 * Full interactive experience for authenticated buyers.
 * Includes save, message, personalization, smart sorting.
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Heart, ArrowUpDown, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
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
  SelectSeparator,
} from "@/components/ui/select";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { ListingsCardGrid } from "@/components/listings/ListingsCardGrid";
import { ListingsListView } from "@/components/listings/ListingsListView";
import { getStoredViewMode, setStoredViewMode } from "@/lib/utils/view-mode";
import { RoadReadinessFilter } from "@/components/marketplace/RoadReadinessFilter";
import { 
  RoadReadinessState, 
  ROAD_READINESS_STATES 
} from "@/lib/marketplace/roadReadinessStates";

interface BrowseLoggedInProps {
  userId: string;
}

export default function BrowseLoggedIn({ userId }: BrowseLoggedInProps) {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [localHiddenIds, setLocalHiddenIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  
  // Road Readiness Filter state (default: Carly Verified ON, others OFF)
  const [showNewInventory, setShowNewInventory] = useState(false);
  const [showCarlyVerified, setShowCarlyVerified] = useState(true);
  const [showTheHub, setShowTheHub] = useState(false);
  const [showBuildersMarket, setShowBuildersMarket] = useState(false);
  
  // Pagination state
  const [pageSize, setPageSize] = useState<15 | 30 | 50>(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  
  // Browse page uses standard sorting (personalization applied when authenticated)
  const [sortOption, setSortOption] = useState<SortOption>('newest-first');
  
  // Manual filter state
  const [manualFilters, setManualFilters] = useState<ParsedSearchCriteria>({});

  // Load view mode from localStorage on mount
  useEffect(() => {
    const storedMode = getStoredViewMode();
    if (storedMode) setViewMode(storedMode);
    
    // Load road readiness filter preferences
    const storedNewInventory = localStorage.getItem('showNewInventory');
    const storedCarlyVerified = localStorage.getItem('showCarlyVerified');
    const storedTheHub = localStorage.getItem('showTheHub');
    const storedBuildersMarket = localStorage.getItem('showBuildersMarket');
    
    if (storedNewInventory !== null) setShowNewInventory(storedNewInventory === 'true');
    if (storedCarlyVerified !== null) setShowCarlyVerified(storedCarlyVerified === 'true');
    if (storedTheHub !== null) setShowTheHub(storedTheHub === 'true');
    if (storedBuildersMarket !== null) setShowBuildersMarket(storedBuildersMarket === 'true');
  }, []);

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setStoredViewMode(mode);
  };
  
  // Handle road readiness filter toggle
  const handleRoadReadinessToggle = (state: RoadReadinessState) => {
    if (state === ROAD_READINESS_STATES.NEW_INVENTORY) {
      const newValue = !showNewInventory;
      setShowNewInventory(newValue);
      localStorage.setItem('showNewInventory', String(newValue));
    } else if (state === ROAD_READINESS_STATES.CARLY_VERIFIED) {
      const newValue = !showCarlyVerified;
      setShowCarlyVerified(newValue);
      localStorage.setItem('showCarlyVerified', String(newValue));
    } else if (state === ROAD_READINESS_STATES.THE_HUB) {
      const newValue = !showTheHub;
      setShowTheHub(newValue);
      localStorage.setItem('showTheHub', String(newValue));
    } else {
      const newValue = !showBuildersMarket;
      setShowBuildersMarket(newValue);
      localStorage.setItem('showBuildersMarket', String(newValue));
    }
    
    // Reset pagination
    setCurrentPage(1);
  };

  // Parse search term on blur or Enter
  const handleSearchBlur = () => {
    if (!searchTerm.trim()) {
      setIsSearchActive(false);
      return;
    }
    const parsed = parseNaturalLanguageQuery(searchTerm);
    setManualFilters(parsed);
    setIsSearchActive(true);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    setManualFilters({});
    setIsSearchActive(false);
  };

  // Merge manual filters
  const mergedCriteria = useMemo(() => {
    return { ...manualFilters };
  }, [manualFilters]);

  // TODO: Fetch real listings from database
  // For now, return empty array
  const filteredVehicles = useMemo(() => {
    const vehicles: any[] = [];
    
    // Apply taste learning filters if enabled
    if (user?.id && user?.preferences?.refineFeedEnabled) {
      return filterHiddenListings(user.id, vehicles);
    }
    
    return vehicles.filter(v => !localHiddenIds.includes(String(v.id)));
  }, [mergedCriteria, localHiddenIds, user, showNewInventory, showCarlyVerified, showTheHub, showBuildersMarket]);

  // Apply sorting - personalization applied only when authenticated
  const sortedVehicles = useMemo(() => {
    const hasBuilderOnly = showBuildersMarket && !showCarlyVerified && !showTheHub && !showNewInventory;
    const hasNewOnly = showNewInventory && !showCarlyVerified && !showTheHub && !showBuildersMarket;
    
    return sortVehicles(
      filteredVehicles, 
      sortOption, 
      (hasBuilderOnly || hasNewOnly) ? null : (isAuthenticated ? userId : null)
    );
  }, [filteredVehicles, sortOption, userId, isAuthenticated, showCarlyVerified, showTheHub, showBuildersMarket, showNewInventory]);

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

  const criteriaText = useMemo(() => {
    if (Object.keys(manualFilters).length === 0) return "";
    return criteriaToReadableString(manualFilters);
  }, [manualFilters]);

  return (
    <section className="pt-32 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto" ref={contentRef}>
        <div className="text-center mb-8 sm:mb-12 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-3 sm:mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Browse Vehicles
          </h1>
          <p className="text-lg text-muted-foreground">
            Personalized listings curated for you
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchBlur();
                }
              }}
              onBlur={handleSearchBlur}
            />
            
            <VehicleFiltersSheet
              filters={manualFilters}
              onFiltersChange={setManualFilters}
              userCountry={user?.country || 'CA'}
              variant="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg"
            />
          </div>

          {criteriaText && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-muted-foreground">
                  Showing results for:{" "}
                  <span className="font-medium text-foreground">{criteriaText}</span>
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="h-8 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Road Readiness Filters */}
        <div className="max-w-7xl mx-auto mb-6">
          <RoadReadinessFilter
            showNewInventory={showNewInventory}
            showCarlyVerified={showCarlyVerified}
            showTheHub={showTheHub}
            showBuildersMarket={showBuildersMarket}
            onToggle={handleRoadReadinessToggle}
          />
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

        {/* Listings */}
        <div ref={listContainerRef}>
          {sortedVehicles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-light mb-2">No vehicles found</h2>
              <p className="text-muted-foreground">
                Try adjusting your filters or search criteria
              </p>
            </div>
          ) : (
            <>
              {viewMode === 'card' ? (
                <ListingsCardGrid 
                  listings={paginatedVehicles}
                  onHide={(id) => setLocalHiddenIds([...localHiddenIds, String(id)])}
                />
              ) : (
                <ListingsListView 
                  listings={paginatedVehicles}
                  onHide={(id) => setLocalHiddenIds([...localHiddenIds, String(id)])}
                />
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || isTransitioning}
                className="rounded-lg"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || isTransitioning}
                className="rounded-lg"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value) as 15 | 30 | 50)}>
              <SelectTrigger className="w-[140px] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 per page</SelectItem>
                <SelectItem value="30">30 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </section>
  );
}
