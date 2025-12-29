// Real view and save tracking system - AWS-ready

export interface ListingViewEvent {
  eventId: string;
  listingId: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
}

export interface ListingSave {
  listingId: string;
  userId: string;
  timestamp: string;
}

export interface ListingAnalytics {
  listingId: string;
  viewCount: number;
  saveCount: number;
  lastViewed?: string;
}

// In-memory storage (replace with DynamoDB/RDS in production)
const viewEventsStore = new Map<string, ListingViewEvent[]>();
const savesStore = new Map<string, Set<string>>(); // listingId -> Set of userIds
const analyticsStore = new Map<string, ListingAnalytics>();

// Session tracking to prevent duplicate views
const sessionViewsStore = new Map<string, Set<string>>(); // sessionId -> Set of listingIds

export const analyticsAPI = {
  // Record a listing view
  recordView: async (listingId: string, userId?: string, sessionId?: string): Promise<void> => {
    const effectiveSessionId = sessionId || `anon_${Date.now()}_${Math.random().toString(36)}`;
    
    // Check if this session already viewed this listing
    const sessionViews = sessionViewsStore.get(effectiveSessionId) || new Set();
    if (sessionViews.has(listingId)) {
      // Already counted this view
      return;
    }

    // Record the view event
    const viewEvent: ListingViewEvent = {
      eventId: Math.random().toString(36).substring(7),
      listingId,
      userId,
      sessionId: effectiveSessionId,
      timestamp: new Date().toISOString(),
    };

    const listingViews = viewEventsStore.get(listingId) || [];
    listingViews.push(viewEvent);
    viewEventsStore.set(listingId, listingViews);

    // Mark this listing as viewed in this session
    sessionViews.add(listingId);
    sessionViewsStore.set(effectiveSessionId, sessionViews);

    // Update aggregated count
    const analytics = analyticsStore.get(listingId) || {
      listingId,
      viewCount: 0,
      saveCount: 0,
    };
    analytics.viewCount++;
    analytics.lastViewed = viewEvent.timestamp;
    analyticsStore.set(listingId, analytics);

    console.log(`[ANALYTICS] View recorded - Listing: ${listingId}, Session: ${effectiveSessionId}, Total: ${analytics.viewCount}`);
  },

  // Save a listing (like/add to garage)
  saveListing: async (listingId: string, userId: string): Promise<void> => {
    const listingSaves = savesStore.get(listingId) || new Set();
    
    if (listingSaves.has(userId)) {
      // Already saved
      return;
    }

    listingSaves.add(userId);
    savesStore.set(listingId, listingSaves);

    // Update aggregated count
    const analytics = analyticsStore.get(listingId) || {
      listingId,
      viewCount: 0,
      saveCount: 0,
    };
    analytics.saveCount++;
    analyticsStore.set(listingId, analytics);

    console.log(`[ANALYTICS] Save recorded - Listing: ${listingId}, User: ${userId}, Total: ${analytics.saveCount}`);
  },

  // Unsave a listing
  unsaveListing: async (listingId: string, userId: string): Promise<void> => {
    const listingSaves = savesStore.get(listingId);
    
    if (!listingSaves || !listingSaves.has(userId)) {
      // Not saved
      return;
    }

    listingSaves.delete(userId);

    // Update aggregated count
    const analytics = analyticsStore.get(listingId);
    if (analytics) {
      analytics.saveCount = Math.max(0, analytics.saveCount - 1);
      analyticsStore.set(listingId, analytics);
    }

    console.log(`[ANALYTICS] Unsave recorded - Listing: ${listingId}, User: ${userId}, Total: ${analytics?.saveCount || 0}`);
  },

  // Get analytics for a listing
  getListingAnalytics: async (listingId: string): Promise<ListingAnalytics> => {
    const analytics = analyticsStore.get(listingId);
    
    if (!analytics) {
      // Initialize if doesn't exist
      const newAnalytics: ListingAnalytics = {
        listingId,
        viewCount: 0,
        saveCount: 0,
      };
      analyticsStore.set(listingId, newAnalytics);
      return newAnalytics;
    }

    return analytics;
  },

  // Get aggregated analytics for multiple listings (for seller dashboard)
  getListingsAnalytics: async (listingIds: string[]): Promise<Map<string, ListingAnalytics>> => {
    const results = new Map<string, ListingAnalytics>();

    for (const listingId of listingIds) {
      const analytics = await analyticsAPI.getListingAnalytics(listingId);
      results.set(listingId, analytics);
    }

    return results;
  },

  // Get total analytics for a seller (aggregate across all their listings)
  getSellerAnalytics: async (listingIds: string[]): Promise<{ totalViews: number; totalSaves: number }> => {
    let totalViews = 0;
    let totalSaves = 0;

    for (const listingId of listingIds) {
      const analytics = await analyticsAPI.getListingAnalytics(listingId);
      totalViews += analytics.viewCount;
      totalSaves += analytics.saveCount;
    }

    return { totalViews, totalSaves };
  },

  // Check if user has saved a listing
  isListingSaved: async (listingId: string, userId: string): Promise<boolean> => {
    const listingSaves = savesStore.get(listingId);
    return listingSaves ? listingSaves.has(userId) : false;
  },

  // Get all saved listings for a user
  getUserSavedListings: async (userId: string): Promise<string[]> => {
    const savedListings: string[] = [];

    for (const [listingId, saves] of savesStore.entries()) {
      if (saves.has(userId)) {
        savedListings.push(listingId);
      }
    }

    return savedListings;
  },

  // Initialize analytics for a new listing
  initializeListingAnalytics: async (listingId: string): Promise<void> => {
    const existing = analyticsStore.get(listingId);
    if (!existing) {
      analyticsStore.set(listingId, {
        listingId,
        viewCount: 0,
        saveCount: 0,
      });
    }
  },
};
