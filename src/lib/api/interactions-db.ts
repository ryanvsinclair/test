/**
 * Server-side User Interactions API
 * AWS-ready, database-backed interaction tracking
 */

import { UserInteraction } from '@/types';

// Type definitions matching database schema
export interface DbUserInteraction {
  id: string;
  user_id: string;
  listing_id: string;
  interaction_type: 'like' | 'hide' | 'view';
  created_at: string;
}

/**
 * Fetch all interactions for a user
 */
export async function getUserInteractions(userId: string): Promise<UserInteraction[]> {
  try {
    // TODO: Replace with actual database query
    // Example:
    // const { data, error } = await supabase
    //   .from('user_interactions')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('created_at', { ascending: false });
    
    // TEMPORARY: Return empty array
    const mockDbInteractions: DbUserInteraction[] = [];
    
    // Transform to application format
    return mockDbInteractions.map(i => ({
      id: i.id,
      userId: i.user_id,
      listing_id: i.listing_id,
      interaction_type: i.interaction_type,
      createdAt: i.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch user interactions:', error);
    return [];
  }
}

/**
 * Get interactions of specific type
 */
export async function getUserInteractionsByType(
  userId: string,
  type: 'like' | 'hide' | 'view'
): Promise<UserInteraction[]> {
  try {
    // TODO: Replace with actual database query with WHERE clause
    // Example:
    // const { data, error } = await supabase
    //   .from('user_interactions')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .eq('interaction_type', type)
    //   .order('created_at', { ascending: false });
    
    const mockDbInteractions: DbUserInteraction[] = [];
    
    return mockDbInteractions.map(i => ({
      id: i.id,
      userId: i.user_id,
      listing_id: i.listing_id,
      interaction_type: i.interaction_type,
      createdAt: i.created_at,
    }));
  } catch (error) {
    console.error(`Failed to fetch ${type} interactions:`, error);
    return [];
  }
}

/**
 * Record a new interaction
 */
export async function recordInteraction(
  userId: string,
  listingId: string,
  type: 'like' | 'hide' | 'view'
): Promise<boolean> {
  try {
    // TODO: Replace with actual database insert
    // Example:
    // const { error } = await supabase
    //   .from('user_interactions')
    //   .insert({
    //     user_id: userId,
    //     listing_id: listingId,
    //     interaction_type: type,
    //     created_at: new Date().toISOString(),
    //   });
    
    console.log('Would record interaction:', { userId, listingId, type });
    
    return true;
  } catch (error) {
    console.error('Failed to record interaction:', error);
    return false;
  }
}

/**
 * Remove an interaction (e.g., unlike)
 */
export async function removeInteraction(
  userId: string,
  listingId: string,
  type: 'like' | 'hide' | 'view'
): Promise<boolean> {
  try {
    // TODO: Replace with actual database deletion
    // Example:
    // const { error } = await supabase
    //   .from('user_interactions')
    //   .delete()
    //   .eq('user_id', userId)
    //   .eq('listing_id', listingId)
    //   .eq('interaction_type', type);
    
    console.log('Would remove interaction:', { userId, listingId, type });
    
    return true;
  } catch (error) {
    console.error('Failed to remove interaction:', error);
    return false;
  }
}

/**
 * Check if user has interacted with listing
 */
export async function hasUserInteracted(
  userId: string,
  listingId: string,
  type: 'like' | 'hide' | 'view'
): Promise<boolean> {
  try {
    // TODO: Replace with actual database query
    // Example:
    // const { data, error } = await supabase
    //   .from('user_interactions')
    //   .select('id')
    //   .eq('user_id', userId)
    //   .eq('listing_id', listingId)
    //   .eq('interaction_type', type)
    //   .single();
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get liked listing IDs (optimized for scoring)
 */
export async function getLikedListingIds(userId: string): Promise<Set<string>> {
  const likes = await getUserInteractionsByType(userId, 'like');
  return new Set(likes.map(i => i.listing_id));
}

/**
 * Get hidden listing IDs (optimized for scoring)
 */
export async function getHiddenListingIds(userId: string): Promise<Set<string>> {
  const hides = await getUserInteractionsByType(userId, 'hide');
  return new Set(hides.map(i => i.listing_id));
}

// In-memory cache for interactions (Lambda-compatible, 5 min TTL)
const interactionsCache = new Map<string, { data: UserInteraction[]; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get interactions with caching
 */
export async function getCachedUserInteractions(userId: string): Promise<UserInteraction[]> {
  const now = Date.now();
  const cached = interactionsCache.get(userId);
  
  if (cached && cached.expires > now) {
    return cached.data;
  }
  
  const interactions = await getUserInteractions(userId);
  
  interactionsCache.set(userId, {
    data: interactions,
    expires: now + CACHE_TTL,
  });
  
  return interactions;
}

/**
 * Invalidate cache for user
 */
export function invalidateInteractionsCache(userId: string): void {
  interactionsCache.delete(userId);
}
