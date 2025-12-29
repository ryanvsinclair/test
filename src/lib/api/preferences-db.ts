/**
 * Server-side User Preferences API
 * AWS-ready, database-backed preference management
 */

import { UserPreferences } from '@/types';

// Type definitions matching database schema
export interface DbUserPreferences {
  user_id: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_body_types: string[];
  preferred_makes: string[];
  preferred_fuel_types: string[];
  mileage_tolerance: 'low' | 'flexible';
  vehicle_age_preference: 'newer' | 'classic' | 'open';
  updated_at: string;
}

/**
 * Fetch user preferences from database
 * In production, this would query Supabase/RDS
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    // TODO: Replace with actual database query
    // Example:
    // const { data, error } = await supabase
    //   .from('user_preferences')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .single();
    
    // TEMPORARY: Return mock data structure
    // In production, this must query the database
    const mockDbPrefs: DbUserPreferences | null = null;
    
    if (!mockDbPrefs) {
      return null;
    }
    
    // Transform database format to application format
    return {
      budgetMin: mockDbPrefs.budget_min,
      budgetMax: mockDbPrefs.budget_max,
      preferredBodyTypes: mockDbPrefs.preferred_body_types,
      preferredMakes: mockDbPrefs.preferred_makes,
      preferredFuelTypes: mockDbPrefs.preferred_fuel_types,
      mileageTolerance: mockDbPrefs.mileage_tolerance,
      vehicleAgePreference: mockDbPrefs.vehicle_age_preference,
    };
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    return null;
  }
}

/**
 * Save user preferences to database
 */
export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<boolean> {
  try {
    // TODO: Replace with actual database mutation
    // Example:
    // const { error } = await supabase
    //   .from('user_preferences')
    //   .upsert({
    //     user_id: userId,
    //     budget_min: preferences.budgetMin,
    //     budget_max: preferences.budgetMax,
    //     preferred_body_types: preferences.preferredBodyTypes,
    //     preferred_makes: preferences.preferredMakes,
    //     preferred_fuel_types: preferences.preferredFuelTypes,
    //     mileage_tolerance: preferences.mileageTolerance,
    //     vehicle_age_preference: preferences.vehicleAgePreference,
    //     updated_at: new Date().toISOString(),
    //   });
    
    // TEMPORARY: Log would-be operation
    console.log('Would save preferences for user:', userId, preferences);
    
    return true;
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    return false;
  }
}

/**
 * Delete user preferences
 */
export async function deleteUserPreferences(userId: string): Promise<boolean> {
  try {
    // TODO: Replace with actual database deletion
    // Example:
    // const { error } = await supabase
    //   .from('user_preferences')
    //   .delete()
    //   .eq('user_id', userId);
    
    return true;
  } catch (error) {
    console.error('Failed to delete user preferences:', error);
    return false;
  }
}

// In-memory cache for preferences (Lambda-compatible, 10 min TTL)
const preferencesCache = new Map<string, { data: UserPreferences | null; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get preferences with caching
 */
export async function getCachedUserPreferences(userId: string): Promise<UserPreferences | null> {
  const now = Date.now();
  const cached = preferencesCache.get(userId);
  
  if (cached && cached.expires > now) {
    return cached.data;
  }
  
  const preferences = await getUserPreferences(userId);
  
  preferencesCache.set(userId, {
    data: preferences,
    expires: now + CACHE_TTL,
  });
  
  return preferences;
}

/**
 * Invalidate cache for user
 */
export function invalidatePreferencesCache(userId: string): void {
  preferencesCache.delete(userId);
}
