"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Eye,
  Heart,
  MessageSquare,
  Pause,
  Play,
  Check,
  Edit,
  Upload,
  X,
  Loader2,
  Calendar,
  ArrowUpDown,
  FileSpreadsheet,
  Trash2,
  Copy,
  FileText,
  LayoutGrid,
  Search,
  ClipboardCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { VehicleCommandModal } from "@/components/dealer/VehicleCommandModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ListingData {
  listingId: string;
  stockNumber: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  mileage: number;
  photos: string[];
  status: "active" | "paused" | "pending" | "sold";
  metrics: {
    views: number;
    saves: number;
    messages: number;
    appointments: number;
  };
  /**
   * Carfax document reference - DISPLAY ONLY
   * NEVER parsed, extracted, or used to modify listing data
   */
  carfaxS3Key?: string;
  carfaxUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ListingsResponse {
  listings: ListingData[];
  counts: {
    active: number;
    paused: number;
    pending: number;
    sold: number;
    total: number;
  };
}

type StatusFilter = "all" | "active" | "paused" | "pending" | "sold";
type SortField = "updatedAt" | "createdAt" | "price" | "mileage" | "views";
type SortDirection = "asc" | "desc";

/**
 * AWS-READY LISTINGS PAGE
 *
 * Features:
 * - Loads all listings at once (single-page command center)
 * - Client-side search and filtering
 * - Advanced View persisted in localStorage
 * - Bulk actions and metrics
 */
export default function ListingsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ListingsResponse>({
    listings: [],
    counts: { active: 0, paused: 0, pending: 0, sold: 0, total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isCarfaxUploadOpen, setIsCarfaxUploadOpen] = useState(false);
  const [bulkActionPending, setBulkActionPending] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [advancedView, setAdvancedView] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("listingsAdvancedView") === "true";
    }
    return false;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState<ListingData | null>(
    null,
  );
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [soldFormData, setSoldFormData] = useState({
    customerName: "",
    saleDate: new Date().toISOString().split("T")[0],
    salePrice: 0,
    notes: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("listingsAdvancedView", advancedView.toString());
    }
  }, [advancedView]);

  useEffect(() => {
    // Render page shell immediately, fetch data after mount
    const timer = setTimeout(() => {
      fetchListings();
    }, 0);
    return () => clearTimeout(timer);
  }, [statusFilter, sortField, sortDirection]);

  async function fetchListings() {
    setLoading(true);
    try {
      // TODO: Connect to real database
      await new Promise((resolve) => setTimeout(resolve, 300));

      setData({
        listings: [],
        counts: {
          active: 0,
          paused: 0,
          pending: 0,
          sold: 0,
          total: 0,
        },
      });

      // COMMENTED OUT: Real AWS API call
      // const dealerId = 'dealer-001';
      // const params = new URLSearchParams({
      //   dealerId,
      //   sortBy: sortField,
      //   sortOrder: sortDirection,
      // });
      // if (statusFilter !== 'all') {
      //   params.set('status', statusFilter);
      // }
      // const response = await fetch(`/api/dealer/listings?${params.toString()}`);
      // if (!response.ok) {
      //   throw new Error('Failed to fetch listings');
      // }
      // const result: ListingsResponse = await response.json();
      // setData(result);
    } catch (error: any) {
      console.error("Failed to load listings:", error);
      setData({
        listings: [],
        counts: { active: 0, paused: 0, pending: 0, sold: 0, total: 0 },
      });
    } finally {
      setLoading(false);
    }
  }

  const handleOpenVehicleModal = (listing: ListingData) => {
    setSelectedListing(listing);
    setIsVehicleModalOpen(true);
  };

  const handleSaveListing = async (updatedListing: ListingData) => {
    // TODO: Call actual API endpoint
    // const response = await fetch(`/api/dealer/listings/${updatedListing.listingId}`, {
    //   method: 'PUT',
    //   body: JSON.stringify(updatedListing),
    // });

    // Update local data
    setData((prev) => ({
      ...prev,
      listings: prev.listings.map((l) =>
        l.listingId === updatedListing.listingId ? updatedListing : l,
      ),
    }));
  };

  // Data processing - MUST be before functions that use these variables
  const filteredListings =
    statusFilter === "all"
      ? data.listings
      : data.listings.filter((l) => l.status === statusFilter);

  const searchFilteredListings =
    searchQuery.trim() === ""
      ? filteredListings
      : filteredListings.filter((listing) => {
          const query = searchQuery.toLowerCase();
          return (
            listing.stockNumber.toLowerCase().includes(query) ||
            listing.vin.toLowerCase().includes(query) ||
            listing.make.toLowerCase().includes(query) ||
            listing.model.toLowerCase().includes(query) ||
            listing.year.toString().includes(query)
          );
        });

  const sortedListings = [...searchFilteredListings].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    if (sortField === "updatedAt" || sortField === "createdAt") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (sortField === "views") {
      aValue = a.metrics.views;
      bValue = b.metrics.views;
    }

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === sortedListings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedListings.map((l) => l.listingId)));
    }
  };

  const getDaysInStock = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  /**
   * Copy to clipboard with visual feedback
   */
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `${label} copied`,
        description: text,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  async function updateListingStatus(
    listingId: string,
    status: "active" | "paused" | "sold",
  ) {
    try {
      const dealerId = "dealer-001";
      const response = await fetch(
        `/api/dealer/listings?dealerId=${dealerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, status }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update listing");
      }

      await fetchListings();
    } catch (error) {
      console.error("Failed to update listing:", error);
    }
  }

  /**
   * Mark listing as sold
   * Opens confirmation modal requiring customer details
   */
  const handleMarkAsSold = (listing: ListingData) => {
    setSelectedListing(listing);
    setSoldFormData({
      customerName: "",
      saleDate: new Date().toISOString().split("T")[0],
      salePrice: listing.price,
      notes: "",
    });
    setSoldModalOpen(true);
  };

  const confirmSoldListing = async () => {
    if (!selectedListing) return;

    try {
      // TODO: Call actual API endpoint with full sale details
      // const response = await fetch(`/api/dealer/listings/${selectedListing.listingId}/sold`, {
      //   method: 'POST',
      //   body: JSON.stringify(soldFormData),
      // });

      // For now, update status only
      await updateListingStatus(selectedListing.listingId, "sold");
      setSoldModalOpen(false);
    } catch (error) {
      console.error("Failed to mark as sold:", error);
    }
  };

  /**
   * Toggle Pending/Back for Sale status
   * If active → pending
   * If pending → active
   * Disabled for sold listings
   */
  const handleTogglePending = (listing: ListingData) => {
    if (listing.status === "sold") return;

    const nextStatus = listing.status === "active" ? "pending" : "active";
    const toastMessage =
      nextStatus === "pending"
        ? "Listing is now Pending"
        : "Listing is now Active";

    updateListingStatus(listing.listingId, nextStatus);

    toast({
      title: toastMessage,
      duration: 2000,
    });
  };

  /**
   * Duplicate listing handler
   * Creates new draft listing with copied data
   * Excludes: stock number, VIN, status
   * New listing defaults to Pending
   */
  const handleDuplicateListing = (listing: ListingData) => {
    // TODO: Implement duplicate API call
    // For now, log the action
    console.log("Duplicating listing:", listing.listingId);

    toast({
      title: "Listing duplicated",
      description: "New draft created with Pending status",
      duration: 2000,
    });
  };

  /**
   * Carfax handler
   * If Carfax exists: open viewer
   * If no Carfax: open upload flow
   */
  const handleCarfaxAction = (listing: ListingData) => {
    if (listing.carfaxUrl) {
      window.open(listing.carfaxUrl, "_blank");
    } else if (listing.carfaxS3Key) {
      // TODO: Generate S3 signed URL
      console.log("Open Carfax from S3:", listing.carfaxS3Key);
    } else {
      // Open upload flow
      console.log("Open Carfax upload for:", listing.listingId);
      toast({
        title: "Carfax upload",
        description: "Upload flow coming soon",
        duration: 2000,
      });
    }
  };

  /**
   * STANDARDIZED ACTION RESOLVER
   * Five buttons, always visible, always same order:
   * 1. Edit (always enabled)
   * 2. Duplicate (always enabled)
   * 3. Carfax (always enabled - upload or view)
   * 4. Pending/Back for Sale toggle (disabled if sold)
   * 5. Sold (disabled if already sold)
   */
  const getListingActions = (listing: ListingData) => {
    const isSold = listing.status === "sold";
    const isPending = listing.status === "pending";
    const isActive = listing.status === "active";

    return {
      // 1. Edit - always enabled
      edit: {
        enabled: true,
        tooltip: "Edit listing",
        icon: Edit,
        handler: () => handleOpenVehicleModal(listing),
      },
      // 2. Duplicate - always enabled
      duplicate: {
        enabled: true,
        tooltip: "Duplicate listing",
        icon: Copy,
        handler: () => handleDuplicateListing(listing),
      },
      // 3. Carfax - always enabled, label changes
      carfax: {
        enabled: true,
        tooltip:
          listing.carfaxS3Key || listing.carfaxUrl
            ? "View Carfax"
            : "Upload Carfax",
        icon: FileText,
        handler: () => handleCarfaxAction(listing),
      },
      // 4. Pending/Back for Sale toggle - disabled if sold
      togglePending: {
        enabled: !isSold,
        tooltip: isSold
          ? "Cannot change sold listing"
          : isPending
            ? "Mark as Active"
            : "Mark as Pending",
        label: isPending ? "Back for Sale" : "Pending",
        icon: isPending ? Play : Pause,
        handler: () => handleTogglePending(listing),
      },
      // 5. Sold - disabled if already sold
      sold: {
        enabled: !isSold,
        tooltip: isSold ? "Already sold" : "Mark as sold",
        icon: Check,
        handler: () => handleMarkAsSold(listing),
      },
    };
  };

  async function bulkUpdateStatus(status: "active" | "paused" | "sold") {
    setBulkActionPending(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => updateListingStatus(id, status)),
      );
      setSelectedIds(new Set());
    } finally {
      setBulkActionPending(false);
    }
  }

  async function bulkDelete() {
    setBulkActionPending(true);
    try {
      // TODO: Implement bulk delete API
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchListings();
      setSelectedIds(new Set());
      setDeleteConfirmOpen(false);
    } finally {
      setBulkActionPending(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/50">
            Active
          </Badge>
        );
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      case "pending":
        return (
          <Badge className="bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/50">
            Pending
          </Badge>
        );
      case "sold":
        return (
          <Badge className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            Sold
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 dark:text-purple-400" />
          <p className="text-neutral-500 dark:text-neutral-400">
            Loading listings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-50">
            Listings
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your vehicle inventory
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-neutral-200 dark:border-neutral-800 pr-4">
            <LayoutGrid className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Advanced View
            </span>
            <Switch checked={advancedView} onCheckedChange={setAdvancedView} />
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsBulkUploadOpen(true)}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsCarfaxUploadOpen(true)}
          >
            <FileText className="w-4 h-4" />
            Carfax Upload
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-neutral-900 dark:border-neutral-800">
              <DialogHeader>
                <DialogTitle className="dark:text-neutral-50">
                  Add New Listing
                </DialogTitle>
                <DialogDescription className="dark:text-neutral-400">
                  Create a new vehicle listing for your inventory
                </DialogDescription>
              </DialogHeader>
              <AddListingForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* State Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          className={`p-6 cursor-pointer transition-all ${statusFilter === "active" ? "border-green-200 dark:border-green-900/40 bg-green-50/20 dark:bg-green-950/20" : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"}`}
          onClick={() =>
            setStatusFilter(statusFilter === "active" ? "all" : "active")
          }
        >
          <p className="text-sm text-green-700 dark:text-green-400">Active</p>
          <p className="text-3xl font-light mt-1 text-green-900 dark:text-green-100">
            {data.counts.active}
          </p>
        </Card>
        <Card
          className={`p-6 cursor-pointer transition-all ${statusFilter === "paused" ? "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50" : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"}`}
          onClick={() =>
            setStatusFilter(statusFilter === "paused" ? "all" : "paused")
          }
        >
          <p className="text-sm text-neutral-700 dark:text-neutral-400">
            Paused
          </p>
          <p className="text-3xl font-light mt-1 text-neutral-900 dark:text-neutral-100">
            {data.counts.paused}
          </p>
        </Card>
        <Card
          className={`p-6 cursor-pointer transition-all ${statusFilter === "pending" ? "border-orange-200 dark:border-orange-900/40 bg-orange-50/20 dark:bg-orange-950/20" : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"}`}
          onClick={() =>
            setStatusFilter(statusFilter === "pending" ? "all" : "pending")
          }
        >
          <p className="text-sm text-orange-700 dark:text-orange-400">
            Pending
          </p>
          <p className="text-3xl font-light mt-1 text-orange-900 dark:text-orange-100">
            {data.counts.pending}
          </p>
        </Card>
        <Card
          className={`p-6 cursor-pointer transition-all ${statusFilter === "sold" ? "border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50" : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"}`}
          onClick={() =>
            setStatusFilter(statusFilter === "sold" ? "all" : "sold")
          }
        >
          <p className="text-sm text-neutral-700 dark:text-neutral-400">Sold</p>
          <p className="text-3xl font-light mt-1 text-neutral-900 dark:text-neutral-100">
            {data.counts.sold}
          </p>
        </Card>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <Card className="p-4 border-purple-200 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {selectedIds.size} selected
              </p>
              <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700" />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkActionPending}
                  onClick={() => bulkUpdateStatus("active")}
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkActionPending}
                  onClick={() => bulkUpdateStatus("paused")}
                >
                  <Pause className="w-4 h-4 mr-1.5" />
                  Pause
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkActionPending}
                  onClick={() => bulkUpdateStatus("sold")}
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Mark Sold
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkActionPending}
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </Card>
      )}

      {/* Listings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-50">
              {statusFilter === "all"
                ? "All Listings"
                : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Listings`}
              <Badge variant="outline" className="ml-2">
                {sortedListings.length}
              </Badge>
            </h2>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <Input
              type="text"
              placeholder="Search by stock #, VIN, make, model, or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {sortedListings.length === 0 ? (
          <Card className="p-12 text-center">
            <Eye className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
              {searchQuery
                ? "No listings match your search"
                : "No listings yet"}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Add your first listing or upload inventory in bulk."}
            </p>
          </Card>
        ) : advancedView ? (
          <Card className="border-neutral-200 dark:border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-card/95 dark:bg-card/95 backdrop-blur-sm">
                  <tr className="text-xs">
                    <th className="text-left p-2 w-8">
                      <Checkbox
                        checked={
                          selectedIds.size === sortedListings.length &&
                          sortedListings.length > 0
                        }
                        onCheckedChange={selectAll}
                      />
                    </th>
                    <th className="text-left p-2 w-12 font-medium text-neutral-700 dark:text-neutral-300">
                      Photo
                    </th>
                    <th className="text-left p-2 font-medium text-neutral-700 dark:text-neutral-300">
                      Status
                    </th>
                    <th className="text-left p-2 font-medium text-neutral-700 dark:text-neutral-300">
                      Stock #
                    </th>
                    <th className="text-left p-2 font-medium text-neutral-700 dark:text-neutral-300">
                      Year
                    </th>
                    <th className="text-left p-2 font-medium text-neutral-700 dark:text-neutral-300">
                      Make
                    </th>
                    <th className="text-left p-2 font-medium text-neutral-700 dark:text-neutral-300">
                      Model
                    </th>
                    <th className="text-left p-2 font-medium text-neutral-700 dark:text-neutral-300">
                      Trim
                    </th>
                    <th
                      className="text-right p-2 font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => handleSort("mileage")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Mileage
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="text-right p-2 font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => handleSort("price")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Price
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="text-left p-2 font-medium text-neutral-700 dark:text-neutral-300">
                      VIN
                    </th>
                    <th className="text-right p-2 font-medium text-neutral-700 dark:text-neutral-300">
                      Days
                    </th>
                    <th
                      className="text-right p-2 font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400"
                      onClick={() => handleSort("views")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Metrics
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="text-right p-2 font-medium text-neutral-700 dark:text-neutral-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {sortedListings.map((listing) => (
                    <tr
                      key={listing.listingId}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition text-xs h-12 cursor-pointer"
                      onClick={() => handleOpenVehicleModal(listing)}
                    >
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(listing.listingId)}
                          onCheckedChange={() =>
                            toggleSelection(listing.listingId)
                          }
                        />
                      </td>
                      <td className="p-2">
                        {listing.photos[0] ? (
                          <img
                            src={listing.photos[0]}
                            alt={`${listing.year} ${listing.make} ${listing.model}`}
                            className="w-12 h-9 rounded object-cover"
                          />
                        ) : (
                          <div className="w-12 h-9 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Eye className="w-4 h-4 text-neutral-400 dark:text-neutral-600" />
                          </div>
                        )}
                      </td>
                      <td className="p-2">{getStatusBadge(listing.status)}</td>
                      <td
                        className="p-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(listing.stockNumber, "Stock #");
                        }}
                      >
                        <span className="font-medium text-neutral-900 dark:text-neutral-50 underline decoration-dotted">
                          {listing.stockNumber}
                        </span>
                      </td>
                      <td className="p-2 text-neutral-700 dark:text-neutral-300">
                        {listing.year}
                      </td>
                      <td className="p-2 text-neutral-700 dark:text-neutral-300">
                        {listing.make}
                      </td>
                      <td className="p-2 text-neutral-700 dark:text-neutral-300">
                        {listing.model}
                      </td>
                      <td className="p-2 text-neutral-600 dark:text-neutral-400">
                        {listing.trim || "—"}
                      </td>
                      <td className="p-2 text-right text-neutral-700 dark:text-neutral-300">
                        {listing.mileage.toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-medium text-neutral-900 dark:text-neutral-50">
                        ${listing.price.toLocaleString()}
                      </td>
                      <td
                        className="p-2 text-neutral-600 dark:text-neutral-400 font-mono text-[10px] cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(listing.vin, "VIN");
                        }}
                      >
                        <span className="underline decoration-dotted">
                          {listing.vin.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="p-2 text-right text-neutral-600 dark:text-neutral-400">
                        {getDaysInStock(listing.createdAt)}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-end gap-2 text-[10px]">
                          <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                            <Eye className="w-3 h-3" />
                            {listing.metrics.views}
                          </span>
                          <span className="flex items-center gap-0.5 text-pink-600 dark:text-pink-400">
                            <Heart className="w-3 h-3" />
                            {listing.metrics.saves}
                          </span>
                          <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400">
                            <MessageSquare className="w-3 h-3" />
                            {listing.metrics.messages}
                          </span>
                        </div>
                      </td>
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        {/* COMPACT VIEW - Same standardized layout, smaller buttons */}
                        <div className="flex items-center justify-end gap-0.5">
                          <TooltipProvider>
                            {(() => {
                              const actions = getListingActions(listing);
                              return (
                                <>
                                  {/* 1. Edit - Always enabled */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={actions.edit.handler}
                                        >
                                          <actions.edit.icon className="w-3.5 h-3.5" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.edit.tooltip}
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* 2. Duplicate - Always enabled */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={actions.duplicate.handler}
                                        >
                                          <actions.duplicate.icon className="w-3.5 h-3.5" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.duplicate.tooltip}
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* 3. Carfax - Always enabled */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={actions.carfax.handler}
                                        >
                                          <actions.carfax.icon className="w-3.5 h-3.5" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.carfax.tooltip}
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* 4. Pending/Back for Sale Toggle */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          disabled={
                                            !actions.togglePending.enabled
                                          }
                                          onClick={
                                            actions.togglePending.handler
                                          }
                                        >
                                          <actions.togglePending.icon className="w-3.5 h-3.5" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.togglePending.tooltip}
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* 5. Sold - Disabled if already sold */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          disabled={!actions.sold.enabled}
                                          onClick={actions.sold.handler}
                                        >
                                          <actions.sold.icon className="w-3.5 h-3.5" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.sold.tooltip}
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              );
                            })()}
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="border-neutral-200 dark:border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="text-left p-4 w-12">
                      <Checkbox
                        checked={
                          selectedIds.size === sortedListings.length &&
                          sortedListings.length > 0
                        }
                        onCheckedChange={selectAll}
                      />
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      Vehicle
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      Stock #
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      VIN
                    </th>
                    <th
                      className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                      onClick={() => handleSort("price")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Price
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                      onClick={() => handleSort("mileage")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Mileage
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="text-center p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      Status
                    </th>
                    <th
                      className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition"
                      onClick={() => handleSort("views")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Metrics
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {sortedListings.map((listing) => (
                    <tr
                      key={listing.listingId}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition cursor-pointer"
                      onClick={() => handleOpenVehicleModal(listing)}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(listing.listingId)}
                          onCheckedChange={() =>
                            toggleSelection(listing.listingId)
                          }
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {listing.photos[0] ? (
                            <img
                              src={listing.photos[0]}
                              alt={`${listing.year} ${listing.make} ${listing.model}`}
                              className="w-16 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-16 h-12 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                              <Eye className="w-6 h-6 text-neutral-400 dark:text-neutral-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-50">
                              {listing.year} {listing.make} {listing.model}
                            </p>
                            {listing.trim && (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {listing.trim}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p
                          className="text-sm text-neutral-900 dark:text-neutral-50 font-medium cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition underline decoration-dotted"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(listing.stockNumber, "Stock #");
                          }}
                        >
                          {listing.stockNumber}
                        </p>
                      </td>
                      <td className="p-4">
                        <p
                          className="text-sm text-neutral-600 dark:text-neutral-400 font-mono cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded transition underline decoration-dotted"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(listing.vin, "VIN");
                          }}
                        >
                          {listing.vin}
                        </p>
                      </td>
                      <td className="p-4 text-right text-neutral-900 dark:text-neutral-50 font-medium">
                        ${listing.price.toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-neutral-600 dark:text-neutral-400">
                        {listing.mileage.toLocaleString()} mi
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          {getStatusBadge(listing.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-3 text-sm">
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Eye className="w-3.5 h-3.5" />
                            {listing.metrics.views}
                          </span>
                          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <Heart className="w-3.5 h-3.5" />
                            {listing.metrics.saves}
                          </span>
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {listing.metrics.messages}
                          </span>
                          <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {listing.metrics.appointments}
                          </span>
                        </div>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        {/* STANDARDIZED ACTION LAYOUT - Five buttons, always visible */}
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            {(() => {
                              const actions = getListingActions(listing);
                              return (
                                <>
                                  {/* 1. Edit - Always enabled */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={actions.edit.handler}
                                        >
                                          <actions.edit.icon className="w-4 h-4" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.edit.tooltip}
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* 2. Duplicate - Always enabled */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={actions.duplicate.handler}
                                        >
                                          <actions.duplicate.icon className="w-4 h-4" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.duplicate.tooltip}
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* 3. Carfax - Always enabled */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={actions.carfax.handler}
                                        >
                                          <actions.carfax.icon className="w-4 h-4" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.carfax.tooltip}
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* 4. Pending/Back for Sale Toggle */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          disabled={
                                            !actions.togglePending.enabled
                                          }
                                          onClick={
                                            actions.togglePending.handler
                                          }
                                        >
                                          <actions.togglePending.icon className="w-4 h-4" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.togglePending.tooltip}
                                    </TooltipContent>
                                  </Tooltip>

                                  {/* 5. Sold - Disabled if already sold */}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          disabled={!actions.sold.enabled}
                                          onClick={actions.sold.handler}
                                        >
                                          <actions.sold.icon className="w-4 h-4" />
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {actions.sold.tooltip}
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              );
                            })()}
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-3xl dark:bg-neutral-900 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="dark:text-neutral-50">
              Bulk Upload Inventory
            </DialogTitle>
            <DialogDescription className="dark:text-neutral-400">
              Upload your vehicle inventory via CSV or Excel file
            </DialogDescription>
          </DialogHeader>
          <BulkUploadForm onClose={() => setIsBulkUploadOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Carfax Upload Dialog */}
      <Dialog open={isCarfaxUploadOpen} onOpenChange={setIsCarfaxUploadOpen}>
        <DialogContent className="max-w-3xl dark:bg-neutral-900 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="dark:text-neutral-50">
              Bulk Carfax Upload
            </DialogTitle>
            <DialogDescription className="dark:text-neutral-400">
              Upload Carfax reports for your inventory
            </DialogDescription>
          </DialogHeader>
          <CarfaxUploadForm onClose={() => setIsCarfaxUploadOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} listing(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The listings will be permanently
              removed from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {bulkActionPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sold Confirmation Modal */}
      <AlertDialog open={soldModalOpen} onOpenChange={setSoldModalOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Sold</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedListing &&
                `${selectedListing.year} ${selectedListing.make} ${selectedListing.model}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={soldFormData.customerName}
                onChange={(e) =>
                  setSoldFormData((prev) => ({
                    ...prev,
                    customerName: e.target.value,
                  }))
                }
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="saleDate">Sale Date *</Label>
              <Input
                id="saleDate"
                type="date"
                value={soldFormData.saleDate}
                onChange={(e) =>
                  setSoldFormData((prev) => ({
                    ...prev,
                    saleDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="salePrice">Sale Price *</Label>
              <Input
                id="salePrice"
                type="number"
                value={soldFormData.salePrice}
                onChange={(e) =>
                  setSoldFormData((prev) => ({
                    ...prev,
                    salePrice: parseInt(e.target.value),
                  }))
                }
                placeholder="Enter final sale price"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={soldFormData.notes}
                onChange={(e) =>
                  setSoldFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Additional details about the sale"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSoldListing}
              disabled={
                !soldFormData.customerName ||
                !soldFormData.saleDate ||
                !soldFormData.salePrice
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vehicle Command Modal */}
      {selectedListing && (
        <VehicleCommandModal
          listing={selectedListing}
          open={isVehicleModalOpen}
          onClose={() => {
            setIsVehicleModalOpen(false);
            setSelectedListing(null);
          }}
          onSave={handleSaveListing}
        />
      )}
    </div>
  );
}

function BulkUploadForm({ onClose }: { onClose: () => void }) {
  const [uploadType, setUploadType] = useState<"inventory" | "photos">(
    "inventory",
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidationResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const dealerId = "dealer-001";
      const formData = new FormData();
      formData.append("file", file);

      const endpoint =
        uploadType === "inventory"
          ? `/api/dealer/listings/bulk-upload?dealerId=${dealerId}`
          : `/api/dealer/photos/bulk-upload?dealerId=${dealerId}`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setValidationResult(result);
        return;
      }

      setValidationResult(result);

      if (result.success) {
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setValidationResult({ error: "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Upload Type Selector */}
      <Tabs
        value={uploadType}
        onValueChange={(v) => setUploadType(v as "inventory" | "photos")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventory CSV</TabsTrigger>
          <TabsTrigger value="photos">Photos ZIP</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">
              Upload inventory spreadsheet
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Supported: CSV, XLS, XLSX
            </p>
            <Input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="max-w-xs mx-auto"
            />
            {file && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                ✓ {file.name} ready to upload
              </p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Required Columns:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-400">
              <div>• Stock Number</div>
              <div>• VIN</div>
              <div>• Year</div>
              <div>• Make</div>
              <div>• Model</div>
              <div>• Price</div>
              <div>• Mileage</div>
              <div>• Trim (optional)</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="space-y-4 mt-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-12 text-center">
            <Upload className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">
              Upload vehicle photos ZIP
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Organize by folder or filename
            </p>
            <Input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="max-w-xs mx-auto"
            />
            {file && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                ✓ {file.name} ready to upload
              </p>
            )}
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
              Photo Organization:
            </p>
            <div className="space-y-2 text-xs text-purple-700 dark:text-purple-400">
              <div>
                <strong>Method 1 (Preferred):</strong> Folder-based
                <div className="mt-1 pl-4 space-y-0.5 font-mono text-[11px]">
                  <div>STK-10234/front.jpg</div>
                  <div>STK-10234/side.jpg</div>
                  <div>1HGCM82633A004352/interior.jpg</div>
                </div>
              </div>
              <div>
                <strong>Method 2:</strong> Filename prefix
                <div className="mt-1 pl-4 space-y-0.5 font-mono text-[11px]">
                  <div>STK-10234_front.jpg</div>
                  <div>1HGCM82633A004352_side.jpg</div>
                </div>
              </div>
              <div className="pt-2 border-t border-purple-200 dark:border-purple-900">
                Unmatched photos will be sent to review queue
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Validation Results */}
      {validationResult && (
        <div
          className={`rounded-lg p-4 ${
            validationResult.success
              ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
              : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
          }`}
        >
          {validationResult.success ? (
            <div className="text-sm space-y-1">
              <p className="font-medium text-green-900 dark:text-green-300">
                ✓ Upload successful
              </p>
              {validationResult.validation && (
                <p className="text-green-700 dark:text-green-400">
                  {validationResult.validation.rowCount} listings imported
                </p>
              )}
              {validationResult.result && (
                <div className="text-green-700 dark:text-green-400">
                  <p>{validationResult.result.matched} photos matched</p>
                  {validationResult.result.unmatched > 0 && (
                    <p>
                      {validationResult.result.unmatched} photos pending review
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm space-y-1">
              <p className="font-medium text-red-900 dark:text-red-300">
                Validation errors:
              </p>
              {validationResult.validation?.errors.map(
                (err: string, i: number) => (
                  <p key={i} className="text-red-700 dark:text-red-400">
                    • {err}
                  </p>
                ),
              )}
              {validationResult.validation?.warnings.length > 0 && (
                <>
                  <p className="font-medium text-orange-900 dark:text-orange-300 pt-2">
                    Warnings:
                  </p>
                  {validationResult.validation.warnings.map(
                    (warn: string, i: number) => (
                      <p
                        key={i}
                        className="text-orange-700 dark:text-orange-400"
                      >
                        • {warn}
                      </p>
                    ),
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          className="flex-1"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Process
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CarfaxUploadForm({ onClose }: { onClose: () => void }) {
  const [uploadType, setUploadType] = useState<
    "single" | "bulk-zip" | "bulk-csv"
  >("single");
  const [file, setFile] = useState<File | null>(null);
  const [carfaxUrl, setCarfaxUrl] = useState("");
  const [stockNumber, setStockNumber] = useState("");
  const [vin, setVin] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const dealerId = "dealer-001";

      if (uploadType === "single") {
        // Single upload
        if (!file && !carfaxUrl) {
          setUploadResult({ error: "Please provide a file or URL" });
          return;
        }

        const formData = new FormData();
        if (file) {
          formData.append("file", file);
        }
        if (carfaxUrl) {
          formData.append("url", carfaxUrl);
        }
        if (stockNumber) {
          formData.append("stockNumber", stockNumber);
        }
        if (vin) {
          formData.append("vin", vin);
        }

        const response = await fetch(
          `/api/dealer/carfax/upload?dealerId=${dealerId}`,
          {
            method: "POST",
            body: formData,
          },
        );

        const result = await response.json();
        setUploadResult(result);

        if (result.success) {
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 2000);
        }
      } else {
        // Bulk upload
        if (!file) {
          setUploadResult({ error: "Please select a file" });
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const type = uploadType === "bulk-zip" ? "zip" : "csv";
        const response = await fetch(
          `/api/dealer/carfax/bulk-upload?dealerId=${dealerId}&type=${type}`,
          {
            method: "POST",
            body: formData,
          },
        );

        const result = await response.json();
        setUploadResult(result);

        if (result.success) {
          setTimeout(() => {
            onClose();
            window.location.reload();
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Carfax upload failed:", error);
      setUploadResult({ error: "Upload failed. Please try again." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Upload Type Selector */}
      <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single</TabsTrigger>
          <TabsTrigger value="bulk-zip">Bulk ZIP</TabsTrigger>
          <TabsTrigger value="bulk-csv">Bulk CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4 mt-4">
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">
              Important: Carfax Display Only
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-400">
              Carfax reports are attached as documents only. They are never
              parsed or used to modify listing data. All vehicle attributes
              remain dealer-declared.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock-number">Stock Number or VIN</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="stock-number"
                  placeholder="STK-10234"
                  value={stockNumber}
                  onChange={(e) => setStockNumber(e.target.value)}
                />
                <Input
                  placeholder="VIN (optional)"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  maxLength={17}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carfax-file">Upload Carfax PDF</Label>
              <Input
                id="carfax-file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
              />
              {file && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ {file.name} ready to upload
                </p>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-neutral-500 dark:text-neutral-400">
                  Or
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carfax-url">Public Carfax URL</Label>
              <Input
                id="carfax-url"
                type="url"
                placeholder="https://www.carfax.com/..."
                value={carfaxUrl}
                onChange={(e) => setCarfaxUrl(e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bulk-zip" className="space-y-4 mt-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-12 text-center">
            <FileText className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">
              Upload ZIP of Carfax PDFs
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Name files by stock number or VIN
            </p>
            <Input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              className="max-w-xs mx-auto"
            />
            {file && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                ✓ {file.name} ready to upload
              </p>
            )}
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-300">
              Filename Formats:
            </p>
            <div className="space-y-1 text-xs text-purple-700 dark:text-purple-400 font-mono">
              <div>STK-10234.pdf</div>
              <div>STK-10234_carfax.pdf</div>
              <div>1HGCM82633A004352.pdf</div>
              <div>carfax_STK-10234.pdf</div>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-400 pt-2 border-t border-purple-200 dark:border-purple-900">
              Files that don't match any listing will be flagged for manual
              assignment.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="bulk-csv" className="space-y-4 mt-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg p-12 text-center">
            <FileSpreadsheet className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mx-auto mb-4" />
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-1">
              Upload CSV with Carfax URLs
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Link public Carfax reports to listings
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="max-w-xs mx-auto"
            />
            {file && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                ✓ {file.name} ready to upload
              </p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Required CSV Columns:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-400">
              <div>• stock_number (or vin)</div>
              <div>• carfax_url</div>
            </div>
            <div className="pt-2 border-t border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-mono">
                STK-10234,https://www.carfax.com/...
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Result */}
      {uploadResult && (
        <div
          className={`rounded-lg p-4 ${
            uploadResult.success
              ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
              : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
          }`}
        >
          {uploadResult.success ? (
            <div className="text-sm space-y-1">
              <p className="font-medium text-green-900 dark:text-green-300">
                ✓ Upload successful
              </p>
              {uploadResult.match && (
                <p className="text-green-700 dark:text-green-400">
                  Matched to listing via{" "}
                  {uploadResult.match.matchType.replace("_", " ")}
                </p>
              )}
              {uploadResult.result && (
                <div className="text-green-700 dark:text-green-400">
                  <p>{uploadResult.result.matched} Carfax reports matched</p>
                  {uploadResult.result.unmatched > 0 && (
                    <p>
                      {uploadResult.result.unmatched} reports pending manual
                      assignment
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-900 dark:text-red-300">
              {uploadResult.error || "Upload failed"}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button
          className="flex-1"
          onClick={handleUpload}
          disabled={
            uploading || (uploadType === "single" && !file && !carfaxUrl)
          }
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Carfax
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AddListingForm({ onClose }: { onClose: () => void }) {
  const [vehicleStatus, setVehicleStatus] = useState<"new" | "used" | null>(
    null,
  );

  const [vin, setVin] = useState("");
  const [stockNumber, setStockNumber] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [price, setPrice] = useState("");
  const [mileage, setMileage] = useState("");

  const [vinDecodeState, setVinDecodeState] = useState<
    "idle" | "decoding" | "success" | "failed"
  >("idle");
  const [vinDecodeError, setVinDecodeError] = useState("");
  const [decodedVin, setDecodedVin] = useState("");

  const [inspectionMethod, setInspectionMethod] = useState<
    "upload" | "checklist" | null
  >(null);
  const [inspectionFile, setInspectionFile] = useState<File | null>(null);
  const [checklistCompleted, setChecklistCompleted] = useState(false);

  const [accidentHistory, setAccidentHistory] = useState<
    "yes" | "no" | "unknown" | null
  >(null);
  const [mechanicalIssues, setMechanicalIssues] = useState<string[]>([]);
  const [cosmeticCondition, setCosmeticCondition] = useState<
    "excellent" | "good" | "fair" | null
  >(null);

  const [newVehicleConfirmed, setNewVehicleConfirmed] = useState(false);

  const [buildersProjectType, setBuildersProjectType] = useState<string[]>([]);
  const [buildersKnownIssues, setBuildersKnownIssues] = useState("");
  const [buildersMissingComponents, setBuildersMissingComponents] =
    useState("");
  const [buildersAsIsAcknowledged, setBuildersAsIsAcknowledged] =
    useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [video360Interior, setVideo360Interior] = useState<File | null>(null);
  const [video360Exterior, setVideo360Exterior] = useState<File | null>(null);
  const [walkaroundVideo, setWalkaroundVideo] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [qualificationResult, setQualificationResult] = useState<{
    marketplace: "carly_verified" | "hub" | "builders_market";
    reasons: string[];
    improvements?: string[];
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!vehicleStatus) newErrors.push("Vehicle status is required");
    if (!vin || vin.length !== 17)
      newErrors.push("Valid 17-character VIN required");
    if (vinDecodeState !== "success") newErrors.push("VIN must be decoded");
    if (!stockNumber) newErrors.push("Stock number required");
    if (!year || !make || !model) newErrors.push("Year, make, model required");
    if (!price) newErrors.push("Price required");
    if (!mileage) newErrors.push("Mileage required");
    if (photos.length === 0) newErrors.push("At least one photo required");

    if (buildersProjectType.length > 0 || buildersAsIsAcknowledged) {
      if (buildersProjectType.length === 0) {
        newErrors.push("Builder project type required");
      }
      if (!buildersAsIsAcknowledged) {
        newErrors.push("As-Is acknowledgment required");
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const determineMarketplace = () => {
    const reasons: string[] = [];
    const improvements: string[] = [];

    if (buildersProjectType.length > 0 || buildersAsIsAcknowledged) {
      return {
        marketplace: "builders_market",
        reasons: ["Vehicle marked as project or as-is"],
      };
    }

    const hasValidVin = vinDecodeState === "success" && vin === decodedVin;
    const hasPhotos = photos.length > 0;

    if (vehicleStatus === "new") {
      if (
        hasValidVin &&
        newVehicleConfirmed &&
        Number(mileage) <= 500 &&
        hasPhotos
      ) {
        return {
          marketplace: "carly_verified",
          reasons: ["New vehicle with valid declaration"],
        };
      }
      improvements.push("Confirm new vehicle declaration");
    }

    if (vehicleStatus === "used") {
      const hasInspection =
        (inspectionMethod === "upload" && inspectionFile) ||
        (inspectionMethod === "checklist" && checklistCompleted);

      if (hasValidVin && hasInspection && hasPhotos) {
        return {
          marketplace: "carly_verified",
          reasons: ["Used vehicle with inspection"],
        };
      }
      improvements.push("Complete inspection");
    }

    return {
      marketplace: "hub",
      reasons: ["General marketplace eligibility"],
      improvements,
    };
  };

  return (
    <div className="space-y-6 py-4">
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border rounded">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-700">
              • {e}
            </p>
          ))}
        </div>
      )}

      {!showConfirmation && (
        <Button
          className="w-full"
          onClick={() => {
            if (validateForm()) {
              const result = determineMarketplace();
              setQualificationResult(result);
              setShowConfirmation(true);
            }
          }}
        >
          Review & Qualify Listing
        </Button>
      )}

      {showConfirmation && qualificationResult && (
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          Confirm & Create Listing
        </Button>
      )}
    </div>
  );
}
