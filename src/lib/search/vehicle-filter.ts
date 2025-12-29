/**
 * Vehicle Search Filter
 * 
 * Applies parsed search criteria to vehicle listings
 * Returns filtered and ranked results
 */

import { Vehicle } from '@/types';
import { ParsedSearchCriteria } from './nl-parser';

export interface SearchResult {
  vehicle: Vehicle;
  matchScore: number;
  matchedCriteria: string[];
}

/**
 * Filter vehicles based on parsed search criteria
 */
export function filterVehicles(
  vehicles: Vehicle[],
  criteria: ParsedSearchCriteria,
  userLocation?: { city?: string; state?: string; country?: 'CA' | 'US' }
): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Determine if we should use soft or hard constraints
  const hasHardConstraints = !!(
    criteria.make || 
    criteria.model || 
    criteria.maxPrice || 
    criteria.maxMileage
  );
  
  for (const vehicle of vehicles) {
    let matchScore = 0;
    const matchedCriteria: string[] = [];
    let failedHardConstraint = false;
    
    // Make (hard constraint)
    if (criteria.make) {
      if (vehicle.make.toLowerCase() === criteria.make.toLowerCase()) {
        matchScore += 10;
        matchedCriteria.push('make');
      } else {
        failedHardConstraint = true;
      }
    }
    
    // Model (hard constraint if specified)
    if (criteria.model) {
      if (vehicle.model.toLowerCase().includes(criteria.model.toLowerCase())) {
        matchScore += 8;
        matchedCriteria.push('model');
      } else {
        failedHardConstraint = true;
      }
    }
    
    // Body type (soft preference for intent-based searches)
    if (criteria.bodyType) {
      if (vehicle.bodyType.toLowerCase() === criteria.bodyType.toLowerCase()) {
        matchScore += hasHardConstraints ? 5 : 7;
        matchedCriteria.push('bodyType');
      }
    }
    
    // Price constraints
    if (criteria.maxPrice !== undefined) {
      if (vehicle.price <= criteria.maxPrice) {
        // Higher score for prices closer to max (sweet spot at 80%)
        const priceRatio = vehicle.price / criteria.maxPrice;
        matchScore += 7 * (1 - Math.abs(priceRatio - 0.8));
        matchedCriteria.push('price');
      } else {
        failedHardConstraint = true;
      }
    }
    
    if (criteria.minPrice !== undefined) {
      if (vehicle.price < criteria.minPrice) {
        failedHardConstraint = true;
      } else {
        matchScore += 3;
      }
    }
    
    // Mileage constraints
    if (criteria.maxMileage !== undefined) {
      if (vehicle.mileage <= criteria.maxMileage) {
        // Higher score for lower mileage
        const mileageRatio = vehicle.mileage / criteria.maxMileage;
        matchScore += 6 * (1 - mileageRatio);
        matchedCriteria.push('mileage');
      } else {
        failedHardConstraint = true;
      }
    }
    
    // Low mileage preference (soft boost)
    if (criteria.lowMileage) {
      if (vehicle.mileage < 50000) {
        matchScore += 4;
        matchedCriteria.push('lowMileage');
      }
    }
    
    // Fuel type
    if (criteria.fuelType) {
      if (vehicle.fuelType === criteria.fuelType) {
        matchScore += 4;
        matchedCriteria.push('fuelType');
      }
    }
    
    // Fuel efficiency (soft preference)
    if (criteria.fuelEfficient) {
      // Prioritize electric, hybrid, then small efficient cars
      if (vehicle.fuelType === 'electric') {
        matchScore += 5;
        matchedCriteria.push('fuelEfficient');
      } else if (vehicle.fuelType === 'hybrid') {
        matchScore += 4;
        matchedCriteria.push('fuelEfficient');
      } else if (vehicle.bodyType === 'Sedan' || vehicle.bodyType === 'Hatchback') {
        matchScore += 2;
        matchedCriteria.push('fuelEfficient');
      }
    }
    
    // Transmission
    if (criteria.transmission) {
      if (vehicle.transmission === criteria.transmission) {
        matchScore += 3;
        matchedCriteria.push('transmission');
      }
    }
    
    // Year constraints
    if (criteria.minYear !== undefined) {
      if (vehicle.year >= criteria.minYear) {
        matchScore += 3;
        matchedCriteria.push('year');
      } else {
        failedHardConstraint = true;
      }
    }
    
    if (criteria.maxYear !== undefined) {
      if (vehicle.year > criteria.maxYear) {
        failedHardConstraint = true;
      }
    }
    
    // Luxury preference (soft)
    if (criteria.luxury) {
      const luxuryBrands = ['bmw', 'mercedes-benz', 'audi', 'lexus', 'porsche', 'tesla', 'land rover', 'jaguar'];
      if (luxuryBrands.includes(vehicle.make.toLowerCase())) {
        matchScore += 5;
        matchedCriteria.push('luxury');
      }
    }
    
    // Reliable preference (soft)
    if (criteria.reliable) {
      const reliableBrands = ['toyota', 'honda', 'mazda', 'subaru', 'lexus'];
      if (reliableBrands.includes(vehicle.make.toLowerCase())) {
        matchScore += 5;
        matchedCriteria.push('reliable');
      }
    }
    
    // Winter ready (soft boost for AWD/4WD)
    if (criteria.winterReady) {
      if (vehicle.features?.some(f => 
        f.toLowerCase().includes('awd') || 
        f.toLowerCase().includes('4wd') ||
        f.toLowerCase().includes('quattro') ||
        f.toLowerCase().includes('xdrive')
      )) {
        matchScore += 4;
        matchedCriteria.push('winterReady');
      }
    }
    
    // Family friendly (soft boost for SUVs/minivans with space)
    if (criteria.familyFriendly) {
      if (vehicle.bodyType === 'SUV' || vehicle.bodyType === 'Minivan') {
        matchScore += 5;
        matchedCriteria.push('familyFriendly');
      }
    }
    
    // Sporty preference (soft boost for performance cars)
    if (criteria.sportyCar) {
      if (vehicle.bodyType === 'Coupe' || 
          vehicle.model.toLowerCase().includes('sport') ||
          vehicle.features?.some(f => f.toLowerCase().includes('sport'))) {
        matchScore += 5;
        matchedCriteria.push('sportyCar');
      }
    }
    
    // Intent flags (brand group filters)
    if (criteria.intentFlags) {
      if (criteria.intentFlags.includes('japanese')) {
        const japaneseBrands = ['toyota', 'honda', 'mazda', 'nissan', 'subaru', 'lexus', 'acura', 'infiniti'];
        if (japaneseBrands.includes(vehicle.make.toLowerCase())) {
          matchScore += 6;
          matchedCriteria.push('japanese');
        }
      }
      
      if (criteria.intentFlags.includes('german')) {
        const germanBrands = ['bmw', 'mercedes-benz', 'audi', 'volkswagen', 'porsche'];
        if (germanBrands.includes(vehicle.make.toLowerCase())) {
          matchScore += 6;
          matchedCriteria.push('german');
        }
      }
      
      // First car intent - boost affordable, reliable options
      if (criteria.intentFlags.includes('first-car')) {
        const reliableBrands = ['toyota', 'honda', 'mazda'];
        if (reliableBrands.includes(vehicle.make.toLowerCase()) && vehicle.price < 20000) {
          matchScore += 5;
          matchedCriteria.push('firstCar');
        }
      }
      
      // Commuter intent - boost fuel efficiency
      if (criteria.intentFlags.includes('commuter')) {
        if (vehicle.fuelType === 'electric' || vehicle.fuelType === 'hybrid') {
          matchScore += 4;
          matchedCriteria.push('commuter');
        }
      }
    }
    
    // Location proximity (soft boost)
    if (criteria.location && userLocation) {
      const vehicleLocation = vehicle.location.toLowerCase();
      const searchLocation = criteria.location.toLowerCase();
      
      if (vehicleLocation.includes(searchLocation)) {
        matchScore += 5;
        matchedCriteria.push('location');
      }
    }
    
    // Keyword fallback search
    if (criteria.keywords && criteria.keywords.length > 0) {
      const searchText = [
        vehicle.make,
        vehicle.model,
        vehicle.bodyType,
        vehicle.description,
        vehicle.features.join(' '),
      ].join(' ').toLowerCase();
      
      let keywordMatches = 0;
      for (const keyword of criteria.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }
      
      if (keywordMatches > 0) {
        matchScore += keywordMatches * 2;
        matchedCriteria.push('keywords');
      }
    }
    
    // Skip if failed hard constraints
    if (failedHardConstraint && hasHardConstraints) {
      continue;
    }
    
    // Include if we have some match OR no specific criteria
    if (matchScore > 0 || Object.keys(criteria).length === 0) {
      results.push({
        vehicle,
        matchScore,
        matchedCriteria,
      });
    }
  }
  
  // Sort by match score (descending)
  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    // Tie-breaker: newer vehicles first
    if (b.vehicle.year !== a.vehicle.year) {
      return b.vehicle.year - a.vehicle.year;
    }
    // Second tie-breaker: lower mileage
    return a.vehicle.mileage - b.vehicle.mileage;
  });
  
  return results;
}

/**
 * Simple text-based fallback filter (when parsing produces no criteria)
 */
export function fallbackTextSearch(vehicles: Vehicle[], searchTerm: string): Vehicle[] {
  if (!searchTerm.trim()) return vehicles;
  
  const search = searchTerm.toLowerCase();
  return vehicles.filter(vehicle => {
    return (
      vehicle.make.toLowerCase().includes(search) ||
      vehicle.model.toLowerCase().includes(search) ||
      vehicle.location.toLowerCase().includes(search) ||
      vehicle.bodyType.toLowerCase().includes(search) ||
      vehicle.description.toLowerCase().includes(search)
    );
  });
}
