/**
 * Smart Sorting System
 * Lightweight client-side scoring and sorting based on user preferences and interactions
 * No ML, no heavy computation - just simple additive scoring
 */

import { Vehicle, User, UserPreferences } from '@/types';
import { getLikedListings, getHiddenListings, getUserInteractions } from './taste-learning';

export type SortOption =
  // Smart sorting
  | 'recommended'
  | 'best-match'
  | 'similar-to-liked'
  | 'avoiding-hidden'
  // Standard sorting
  | 'price-low-high'
  | 'price-high-low'
  | 'mileage-low-high'
  | 'newest-first'
  | 'oldest-first';

export interface SortOptionConfig {
  value: SortOption;
  label: string;
  description?: string;
  isSmart?: boolean;
}

export const SMART_SORT_OPTIONS: SortOptionConfig[] = [
  {
    value: 'recommended',
    label: 'Recommended for you',
    description: 'Based on your activity',
    isSmart: true,
  },
  {
    value: 'best-match',
    label: 'Best match to your preferences',
    description: 'Personalized',
    isSmart: true,
  },
  {
    value: 'similar-to-liked',
    label: 'Similar to vehicles you liked',
    description: 'Based on your likes',
    isSmart: true,
  },
  {
    value: 'avoiding-hidden',
    label: 'Avoiding your hidden patterns',
    description: 'Less of what you hide',
    isSmart: true,
  },
];

export const STANDARD_SORT_OPTIONS: SortOptionConfig[] = [
  { value: 'price-low-high', label: 'Price: Low → High' },
  { value: 'price-high-low', label: 'Price: High → Low' },
  { value: 'mileage-low-high', label: 'Mileage: Low → High' },
  { value: 'newest-first', label: 'Newest Listings' },
  { value: 'oldest-first', label: 'Oldest Listings' },
];

/**
 * Calculate smart score for a vehicle based on user profile and interactions
 * Returns score between 0-1 (higher = better match)
 */
export function calculateSmartScore(
  vehicle: Vehicle,
  user: User | null,
  scoringMode: 'recommended' | 'best-match' | 'similar-to-liked' | 'avoiding-hidden' = 'recommended'
): number {
  if (!user) return 0.5; // Neutral for logged-out users

  let score = 0.5; // Base neutral score

  // Get user's listing interactions
  const likedListingIds = getLikedListings(user.id);
  const hiddenListingIds = getHiddenListings(user.id);
  const preferences = user.preferences;

  // === LIKED LISTINGS BOOST ===
  if (likedListingIds.includes(vehicle.listingId)) {
    score += 0.3;
  }

  // === HIDDEN LISTINGS PENALTY ===
  if (hiddenListingIds.includes(vehicle.listingId)) {
    score -= 0.4;
  }

  // === PREFERENCE MATCHING ===
  if (preferences) {
    // Budget match
    if (preferences.budgetComfortRange) {
      const { min, max } = preferences.budgetComfortRange;
      if (min && vehicle.price < min) {
        score -= 0.1;
      }
      if (max && vehicle.price > max) {
        score -= 0.15;
      }
      if (min && max && vehicle.price >= min && vehicle.price <= max) {
        score += 0.15;
      }
    }

    // Body type match
    if (preferences.preferredBodyTypes && preferences.preferredBodyTypes.length > 0) {
      if (preferences.preferredBodyTypes.includes(vehicle.bodyType)) {
        score += 0.15;
      }
    }

    // Make match
    if (preferences.preferredMakes && preferences.preferredMakes.length > 0) {
      if (preferences.preferredMakes.includes(vehicle.make)) {
        score += 0.2;
      }
    }

    // Fuel type match
    if (preferences.fuelTypePreference && preferences.fuelTypePreference.length > 0) {
      if (preferences.fuelTypePreference.includes(vehicle.fuelType)) {
        score += 0.1;
      }
    }

    // Mileage tolerance
    if (preferences.mileageTolerance) {
      const semantic = preferences.mileageTolerance.semantic;
      const currentYear = new Date().getFullYear();
      const vehicleAge = currentYear - vehicle.year;
      const expectedMileage = vehicleAge * (user.country === 'CA' ? 15000 : 12000);
      const ratio = vehicle.mileage / expectedMileage;

      if (semantic === 'low' && ratio <= 0.7) {
        score += 0.1;
      } else if (semantic === 'flexible') {
        // No penalty for flexible users
      } else if (ratio > 1.6) {
        score -= 0.1;
      }
    }

    // Vehicle age preference
    if (preferences.vehicleAgePreference) {
      const semantic = preferences.vehicleAgePreference.semantic;
      const currentYear = new Date().getFullYear();
      const vehicleAge = currentYear - vehicle.year;

      if (semantic === 'newer' && vehicleAge <= 3) {
        score += 0.1;
      } else if (semantic === 'classic' && vehicleAge >= 10) {
        score += 0.1;
      }
    }
  }

  // === SIMILARITY TO LIKED VEHICLES ===
  if (scoringMode === 'similar-to-liked' || scoringMode === 'recommended') {
    const interactions = getUserInteractions(user.id);
    const likedInteractions = interactions.filter(i => i.interactionType === 'liked');

    let similarityBoost = 0;
    likedInteractions.forEach(interaction => {
      if (!interaction.vehicleAttributes) return;

      let matches = 0;
      let total = 0;

      if (interaction.vehicleAttributes.make === vehicle.make) {
        matches++;
      }
      total++;

      if (interaction.vehicleAttributes.bodyType === vehicle.bodyType) {
        matches++;
      }
      total++;

      if (interaction.vehicleAttributes.fuelType === vehicle.fuelType) {
        matches += 0.5;
      }
      total++;

      const similarity = matches / total;
      similarityBoost += similarity * 0.05;
    });

    score += Math.min(similarityBoost, 0.15); // Cap boost
  }

  // === AVOID HIDDEN PATTERNS ===
  if (scoringMode === 'avoiding-hidden' || scoringMode === 'recommended') {
    const interactions = getUserInteractions(user.id);
    const hiddenInteractions = interactions.filter(i => i.interactionType === 'hidden');

    let avoidancePenalty = 0;
    hiddenInteractions.forEach(interaction => {
      if (!interaction.vehicleAttributes) return;

      let matches = 0;
      let total = 0;

      if (interaction.vehicleAttributes.make === vehicle.make) {
        matches++;
      }
      total++;

      if (interaction.vehicleAttributes.bodyType === vehicle.bodyType) {
        matches++;
      }
      total++;

      const similarity = matches / total;
      avoidancePenalty += similarity * 0.08;
    });

    score -= Math.min(avoidancePenalty, 0.2); // Cap penalty
  }

  // Clamp score between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Sort vehicles based on selected sort option
 */
export function sortVehicles(
  vehicles: Vehicle[],
  sortOption: SortOption,
  user: User | null
): Vehicle[] {
  const sorted = [...vehicles];

  switch (sortOption) {
    // === SMART SORTING ===
    case 'recommended':
      return sorted.sort((a, b) => {
        const scoreA = calculateSmartScore(a, user, 'recommended');
        const scoreB = calculateSmartScore(b, user, 'recommended');
        return scoreB - scoreA; // Higher score first
      });

    case 'best-match':
      return sorted.sort((a, b) => {
        const scoreA = calculateSmartScore(a, user, 'best-match');
        const scoreB = calculateSmartScore(b, user, 'best-match');
        return scoreB - scoreA;
      });

    case 'similar-to-liked':
      return sorted.sort((a, b) => {
        const scoreA = calculateSmartScore(a, user, 'similar-to-liked');
        const scoreB = calculateSmartScore(b, user, 'similar-to-liked');
        return scoreB - scoreA;
      });

    case 'avoiding-hidden':
      return sorted.sort((a, b) => {
        const scoreA = calculateSmartScore(a, user, 'avoiding-hidden');
        const scoreB = calculateSmartScore(b, user, 'avoiding-hidden');
        return scoreB - scoreA;
      });

    // === STANDARD SORTING ===
    case 'price-low-high':
      return sorted.sort((a, b) => a.price - b.price);

    case 'price-high-low':
      return sorted.sort((a, b) => b.price - a.price);

    case 'mileage-low-high':
      return sorted.sort((a, b) => a.mileage - b.mileage);

    case 'newest-first':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

    case 'oldest-first':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

    default:
      return sorted;
  }
}
