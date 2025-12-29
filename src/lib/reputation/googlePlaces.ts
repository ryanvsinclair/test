/**
 * GOOGLE BUSINESS PROFILE INTEGRATION
 * 
 * Handles fetching Google Places data for dealerships.
 * This is OPTIONAL context that supplements CarlyScore when connected.
 * 
 * STRICT RULE: Dealers without Google connected are NOT penalized.
 * ReputationComposite = CarlyScore when Google is not connected.
 */

import { reputationDb } from './db';

interface GooglePlacesResponse {
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: Array<{
      author_name: string;
      rating: number;
      text: string;
      time: number;
    }>;
  };
  status: string;
}

/**
 * Fetch Google Places data for a dealership
 * Returns null if Google is not connected (STRICT FALLBACK RULE)
 */
export async function fetchGooglePlacesData(placeId: string): Promise<{
  rating_avg: number;
  rating_count: number;
  raw_sample_reviews: any;
} | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn('[Google Places] GOOGLE_PLACES_API_KEY not set - dealer reputation will use CarlyScore only');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,reviews&key=${apiKey}`;

    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK' || !data.result) {
      console.error('[Google Places] API error:', data.status);
      return null;
    }

    const rating_avg = data.result.rating || 0;
    const rating_count = data.result.user_ratings_total || 0;
    const raw_sample_reviews = data.result.reviews || [];

    return {
      rating_avg,
      rating_count,
      raw_sample_reviews,
    };
  } catch (error) {
    console.error('[Google Places] Error fetching data:', error);
    return null;
  }
}

/**
 * Sync Google Places snapshot for a dealership
 * Returns false if Google is not connected (not a failure - expected behavior)
 */
export async function syncGooglePlacesSnapshot(dealershipId: string): Promise<boolean> {
  const dealership = await reputationDb.getDealership(dealershipId);

  if (!dealership || !dealership.google_place_id) {
    // Not connected - this is OK, dealer uses CarlyScore only
    return false;
  }

  const data = await fetchGooglePlacesData(dealership.google_place_id);

  if (!data) {
    console.warn(`[Google Places] Could not fetch data for dealership ${dealershipId}`);
    return false;
  }

  await reputationDb.createExternalSnapshot({
    dealership_id: dealershipId,
    source: 'GOOGLE',
    rating_avg: data.rating_avg,
    rating_count: data.rating_count,
    raw_sample_reviews: data.raw_sample_reviews,
    fetched_at: new Date(),
  });

  return true;
}
