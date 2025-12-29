/**
 * Taste Learning System
 * Manages user interactions (likes, hides, views) using listingId references
 * 
 * Core Principle: Users store only listing IDs, never full listing objects
 * This enables scalability to millions of users referencing the same listings
 */

import { UserVehicleInteraction, UserHiddenVehicles, UserLikedVehicles } from '@/types';

// Local storage keys
const HIDDEN_LISTINGS_KEY = 'user_hidden_listings';
const LIKED_LISTINGS_KEY = 'user_liked_listings';
const INTERACTIONS_KEY = 'user_listing_interactions';

/**
 * Get hidden listing IDs for current user
 */
export function getHiddenListings(userId: string): number[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(`${HIDDEN_LISTINGS_KEY}_${userId}`);
  if (!stored) return [];
  
  try {
    const data: UserHiddenVehicles = JSON.parse(stored);
    return data.hiddenListingIds || [];
  } catch {
    return [];
  }
}

/**
 * Get liked listing IDs for current user
 */
export function getLikedListings(userId: string): number[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(`${LIKED_LISTINGS_KEY}_${userId}`);
  if (!stored) return [];
  
  try {
    const data: UserLikedVehicles = JSON.parse(stored);
    return data.likedListingIds || [];
  } catch {
    return [];
  }
}

/**
 * Hide a listing (add listing ID to hidden list)
 */
export function hideListing(
  userId: string,
  listingId: number,
  vehicleAttributes?: UserVehicleInteraction['vehicleAttributes']
): void {
  if (typeof window === 'undefined') return;
  
  // Update hidden listings list
  const hiddenListings = getHiddenListings(userId);
  if (!hiddenListings.includes(listingId)) {
    const updated: UserHiddenVehicles = {
      userId,
      hiddenListingIds: [...hiddenListings, listingId],
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`${HIDDEN_LISTINGS_KEY}_${userId}`, JSON.stringify(updated));
  }
  
  // Record interaction
  recordInteraction(userId, listingId, 'hidden', vehicleAttributes);
}

/**
 * Unhide a listing (remove listing ID from hidden list)
 */
export function unhideListing(userId: string, listingId: number): void {
  if (typeof window === 'undefined') return;
  
  const hiddenListings = getHiddenListings(userId);
  const updated: UserHiddenVehicles = {
    userId,
    hiddenListingIds: hiddenListings.filter(id => id !== listingId),
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem(`${HIDDEN_LISTINGS_KEY}_${userId}`, JSON.stringify(updated));
}

/**
 * Reset all hidden listings for user
 */
export function resetHiddenListings(userId: string): void {
  if (typeof window === 'undefined') return;
  
  const updated: UserHiddenVehicles = {
    userId,
    hiddenListingIds: [],
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem(`${HIDDEN_LISTINGS_KEY}_${userId}`, JSON.stringify(updated));
}

/**
 * Like a listing (add listing ID to liked list)
 */
export function likeListing(
  userId: string,
  listingId: number,
  vehicleAttributes?: UserVehicleInteraction['vehicleAttributes']
): void {
  if (typeof window === 'undefined') return;
  
  const likedListings = getLikedListings(userId);
  if (!likedListings.includes(listingId)) {
    const updated: UserLikedVehicles = {
      userId,
      likedListingIds: [...likedListings, listingId],
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`${LIKED_LISTINGS_KEY}_${userId}`, JSON.stringify(updated));
  }
  
  // Record interaction
  recordInteraction(userId, listingId, 'liked', vehicleAttributes);
}

/**
 * Unlike a listing (remove listing ID from liked list)
 */
export function unlikeListing(userId: string, listingId: number): void {
  if (typeof window === 'undefined') return;
  
  const likedListings = getLikedListings(userId);
  const updated: UserLikedVehicles = {
    userId,
    likedListingIds: likedListings.filter(id => id !== listingId),
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem(`${LIKED_LISTINGS_KEY}_${userId}`, JSON.stringify(updated));
}

/**
 * Record user interaction with a listing (lightweight event log)
 */
export function recordInteraction(
  userId: string,
  listingId: number,
  interactionType: 'liked' | 'hidden' | 'viewed',
  vehicleAttributes?: UserVehicleInteraction['vehicleAttributes']
): void {
  if (typeof window === 'undefined') return;
  
  const interaction: UserVehicleInteraction = {
    userId,
    listingId,
    interactionType,
    timestamp: new Date().toISOString(),
    vehicleAttributes
  };
  
  // Get existing interactions
  const stored = localStorage.getItem(`${INTERACTIONS_KEY}_${userId}`);
  const interactions: UserVehicleInteraction[] = stored ? JSON.parse(stored) : [];
  
  // Add new interaction
  interactions.push(interaction);
  
  // Keep last 500 interactions to prevent storage bloat
  const trimmed = interactions.slice(-500);
  
  localStorage.setItem(`${INTERACTIONS_KEY}_${userId}`, JSON.stringify(trimmed));
}

/**
 * Get all interactions for user
 */
export function getUserInteractions(userId: string): UserVehicleInteraction[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(`${INTERACTIONS_KEY}_${userId}`);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Calculate preference score for a vehicle based on user interactions
 * Returns score between 0-1 (higher = better match)
 */
export function calculateTasteScore(
  userId: string,
  vehicleAttributes: UserVehicleInteraction['vehicleAttributes']
): number {
  const interactions = getUserInteractions(userId);
  
  if (interactions.length === 0) return 0.5; // Neutral for new users
  
  let score = 0.5;
  let matches = 0;
  
  // Analyze hidden listings to reduce similar listings
  const hiddenInteractions = interactions.filter(i => i.interactionType === 'hidden');
  hiddenInteractions.forEach(interaction => {
    if (!interaction.vehicleAttributes) return;
    
    let similarity = 0;
    let factors = 0;
    
    // Compare attributes
    if (vehicleAttributes?.make && interaction.vehicleAttributes.make === vehicleAttributes.make) {
      similarity += 1;
      factors += 1;
    }
    if (vehicleAttributes?.bodyType && interaction.vehicleAttributes.bodyType === vehicleAttributes.bodyType) {
      similarity += 1;
      factors += 1;
    }
    if (vehicleAttributes?.priceRange && interaction.vehicleAttributes.priceRange === vehicleAttributes.priceRange) {
      similarity += 0.5;
      factors += 1;
    }
    if (vehicleAttributes?.fuelType && interaction.vehicleAttributes.fuelType === vehicleAttributes.fuelType) {
      similarity += 0.5;
      factors += 1;
    }
    
    if (factors > 0) {
      const similarityRatio = similarity / factors;
      score -= similarityRatio * 0.15; // Reduce score for similar vehicles
      matches++;
    }
  });
  
  // Analyze liked listings to boost similar listings
  const likedInteractions = interactions.filter(i => i.interactionType === 'liked');
  likedInteractions.forEach(interaction => {
    if (!interaction.vehicleAttributes) return;
    
    let similarity = 0;
    let factors = 0;
    
    if (vehicleAttributes?.make && interaction.vehicleAttributes.make === vehicleAttributes.make) {
      similarity += 1;
      factors += 1;
    }
    if (vehicleAttributes?.bodyType && interaction.vehicleAttributes.bodyType === vehicleAttributes.bodyType) {
      similarity += 1;
      factors += 1;
    }
    if (vehicleAttributes?.priceRange && interaction.vehicleAttributes.priceRange === vehicleAttributes.priceRange) {
      similarity += 0.5;
      factors += 1;
    }
    if (vehicleAttributes?.fuelType && interaction.vehicleAttributes.fuelType === vehicleAttributes.fuelType) {
      similarity += 0.5;
      factors += 1;
    }
    
    if (factors > 0) {
      const similarityRatio = similarity / factors;
      score += similarityRatio * 0.2; // Boost score for similar vehicles
      matches++;
    }
  });
  
  // Clamp score between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Filter out hidden listings from a vehicle list
 * Uses listingId for comparison
 */
export function filterHiddenListings<T extends { listingId: number }>(
  userId: string,
  vehicles: T[]
): T[] {
  const hiddenIds = getHiddenListings(userId);
  return vehicles.filter(vehicle => !hiddenIds.includes(vehicle.listingId));
}

/**
 * Check if a listing is liked by user
 */
export function isListingLiked(userId: string, listingId: number): boolean {
  const likedIds = getLikedListings(userId);
  return likedIds.includes(listingId);
}

/**
 * Check if a listing is hidden by user
 */
export function isListingHidden(userId: string, listingId: number): boolean {
  const hiddenIds = getHiddenListings(userId);
  return hiddenIds.includes(listingId);
}
