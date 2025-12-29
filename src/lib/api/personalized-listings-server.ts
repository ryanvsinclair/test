/**
 * Server-Side Personalized Listings API
 * AWS-Ready, Database-Backed Smart Sorting
 * 
 * This replaces the localStorage-based smart-sorting.ts with a server-side flow.
 * Scoring happens on the server using the legacy additive scoring system.
 */

import { VehicleListing } from '@/types';
import { getCachedUserPreferences } from './preferences-db';
import { getCachedUserInteractions } from './interactions-db';
import { scoreListings, sortByScore, ScoredListing } from '@/lib/ranking/legacyScoreListing';

export interface PersonalizedListingsParams {
  userId: string | null; // null for anonymous users
  filters?: {
    bodyTypes?: string[];
    makes?: string[];
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    fuelTypes?: string[];
    country?: 'CA' | 'US';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface PersonalizedListingsResponse {
  listings: VehicleListing[];
  scoredListings?: ScoredListing[]; // Include scores for debugging/transparency
  total: number;
  page: number;
  limit: number;
}

/**
 * Fetch and score listings for a user (server-side only)
 * This is the main entry point for personalized browsing
 */
export async function getPersonalizedListings(
  params: PersonalizedListingsParams
): Promise<PersonalizedListingsResponse> {
  const { userId, filters, pagination } = params;
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 24;

  try {
    // 1. Fetch candidate listings (bounded set, not full table scan)
    // TODO: Replace with actual database query with filters
    const candidateListings = await fetchCandidateListings(filters);

    // 2. If user is authenticated, fetch preferences and interactions
    let preferences = null;
    let interactions: any[] = [];

    if (userId) {
      [preferences, interactions] = await Promise.all([
        getCachedUserPreferences(userId),
        getCachedUserInteractions(userId),
      ]);
    }

    // 3. Score all candidate listings server-side
    const scoredListings = scoreListings(candidateListings, preferences, interactions);

    // 4. Sort by score descending
    const sortedListings = sortByScore(scoredListings);

    // 5. Paginate results
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    const paginatedScored = sortedListings.slice(startIdx, endIdx);
    const paginatedListings = paginatedScored.map(s => s.listing);

    return {
      listings: paginatedListings,
      scoredListings: paginatedScored, // Include for transparency
      total: sortedListings.length,
      page,
      limit,
    };
  } catch (error) {
    console.error('Failed to fetch personalized listings:', error);
    
    // Fallback: Return unscored listings
    const candidateListings = await fetchCandidateListings(filters);
    const startIdx = (page - 1) * limit;
    const endIdx = startIdx + limit;
    
    return {
      listings: candidateListings.slice(startIdx, endIdx),
      total: candidateListings.length,
      page,
      limit,
    };
  }
}

/**
 * Fetch candidate listings from database with filters
 * IMPORTANT: Must return bounded set (e.g., recently active, verified, etc.)
 * to avoid full table scans in production
 */
async function fetchCandidateListings(
  filters?: PersonalizedListingsParams['filters']
): Promise<VehicleListing[]> {
  try {
    // TODO: Replace with actual database query
    // Example with Supabase:
    // let query = supabase
    //   .from('listings')
    //   .select('*')
    //   .eq('status', 'active')
    //   .order('created_at', { ascending: false })
    //   .limit(500); // Bounded candidate set
    //
    // if (filters?.bodyTypes?.length) {
    //   query = query.in('body_type', filters.bodyTypes);
    // }
    // if (filters?.makes?.length) {
    //   query = query.in('make', filters.makes);
    // }
    // if (filters?.minPrice) {
    //   query = query.gte('price', filters.minPrice);
    // }
    // if (filters?.maxPrice) {
    //   query = query.lte('price', filters.maxPrice);
    // }
    // if (filters?.country) {
    //   query = query.eq('country', filters.country.toLowerCase());
    // }
    //
    // const { data, error } = await query;
    
    // TEMPORARY: Return empty array
    // In production, this MUST query the database
    return [];
  } catch (error) {
    console.error('Failed to fetch candidate listings:', error);
    return [];
  }
}

/**
 * Get featured/default listings (for homepage, anonymous users)
 */
export async function getFeaturedListings(
  limit: number = 12
): Promise<VehicleListing[]> {
  try {
    // TODO: Replace with actual database query
    // Example:
    // const { data, error } = await supabase
    //   .from('listings')
    //   .select('*')
    //   .eq('status', 'active')
    //   .eq('featured', true)
    //   .order('created_at', { ascending: false })
    //   .limit(limit);
    
    return [];
  } catch (error) {
    console.error('Failed to fetch featured listings:', error);
    return [];
  }
}
