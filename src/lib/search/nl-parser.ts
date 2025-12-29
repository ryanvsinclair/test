/**
 * Natural Language Search Parser
 * 
 * Converts free-form text queries into structured vehicle search criteria
 * 
 * Examples:
 * - "bmw under 20k" → { make: "BMW", maxPrice: 20000 }
 * - "awd suv under 100k km" → { drivetrain: "AWD", bodyType: "SUV", maxMileage: 100000 }
 * - "toyota corolla low mileage" → { make: "Toyota", model: "Corolla", lowMileage: true }
 */

export interface ParsedSearchCriteria {
  make?: string;
  model?: string;
  bodyType?: string;
  maxPrice?: number;
  minPrice?: number;
  maxMileage?: number;
  minMileage?: number;
  mileageUnit?: 'km' | 'mi';
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  drivetrain?: 'AWD' | 'FWD' | 'RWD' | '4WD';
  transmission?: 'automatic' | 'manual';
  minYear?: number;
  maxYear?: number;
  location?: string;
  lowMileage?: boolean;
  fuelEfficient?: boolean;
  reliable?: boolean;
  luxury?: boolean;
  familyFriendly?: boolean;
  sportyCar?: boolean;
  winterReady?: boolean;
  keywords?: string[]; // Unmatched words for fallback
  intentFlags?: string[]; // Practical needs like "student car", "first car"
}

// Known vehicle makes (expandable)
const MAKES = new Set([
  'acura', 'alfa romeo', 'aston martin', 'audi', 'bentley', 'bmw', 'buick',
  'cadillac', 'chevrolet', 'chevy', 'chrysler', 'dodge', 'ferrari', 'fiat',
  'ford', 'genesis', 'gmc', 'honda', 'hyundai', 'infiniti', 'jaguar', 'jeep',
  'kia', 'lamborghini', 'land rover', 'lexus', 'lincoln', 'maserati', 'mazda',
  'mclaren', 'mercedes', 'mercedes-benz', 'mini', 'mitsubishi', 'nissan',
  'porsche', 'ram', 'rolls-royce', 'subaru', 'tesla', 'toyota', 'volkswagen',
  'vw', 'volvo'
]);

// Make aliases (including slang)
const MAKE_ALIASES: Record<string, string> = {
  'chevy': 'Chevrolet',
  'vw': 'Volkswagen',
  'benz': 'Mercedes-Benz',
  'mercedes': 'Mercedes-Benz',
  'beemer': 'BMW',
  'bimmer': 'BMW',
  'merc': 'Mercedes-Benz',
  'bimmer': 'BMW',
  'lambo': 'Lamborghini',
};

// Body types
const BODY_TYPES = new Set([
  'sedan', 'suv', 'truck', 'coupe', 'hatchback', 'wagon', 'van', 'minivan',
  'convertible', 'crossover', 'pickup'
]);

// Fuel types
const FUEL_TYPES: Record<string, 'gasoline' | 'diesel' | 'electric' | 'hybrid'> = {
  'gas': 'gasoline',
  'gasoline': 'gasoline',
  'petrol': 'gasoline',
  'diesel': 'diesel',
  'electric': 'electric',
  'ev': 'electric',
  'hybrid': 'hybrid',
  'phev': 'hybrid',
  'plug-in': 'hybrid',
};

// Drivetrain types
const DRIVETRAIN_TYPES: Record<string, 'AWD' | 'FWD' | 'RWD' | '4WD'> = {
  'awd': 'AWD',
  'fwd': 'FWD',
  'rwd': 'RWD',
  '4wd': '4WD',
  '4x4': '4WD',
  'four-wheel': '4WD',
  'all-wheel': 'AWD',
  'front-wheel': 'FWD',
  'rear-wheel': 'RWD',
};

// Transmission types
const TRANSMISSION_TYPES: Record<string, 'automatic' | 'manual'> = {
  'auto': 'automatic',
  'automatic': 'automatic',
  'manual': 'manual',
  'stick': 'manual',
  'mt': 'manual',
  'at': 'automatic',
};

/**
 * Parse natural language query into structured search criteria
 */
export function parseNaturalLanguageQuery(query: string, userCountry: 'CA' | 'US' = 'CA'): ParsedSearchCriteria {
  const criteria: ParsedSearchCriteria = {};
  const normalized = query.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  const unmatchedWords: string[] = [];
  
  // Default mileage unit based on country
  criteria.mileageUnit = userCountry === 'CA' ? 'km' : 'mi';
  
  // Price patterns (very flexible)
  const pricePatterns = [
    // "under 15k", "< 20000", "max 30k"
    /(?:under|below|max|maximum|less than|<)\s*\$?(\d+)(?:k|,?\d{3})?/i,
    // "$10-15k", "between 10k and 20k"
    /\$?(\d+)(?:k|,?\d{3})?\s*(?:-|to|and)\s*\$?(\d+)(?:k|,?\d{3})?/i,
    // "around 25k"
    /around\s*\$?(\d+)(?:k|,?\d{3})?/i,
    // Simple "$15k"
    /\$(\d+)(?:k|,?\d{3})?/i,
  ];
  
  for (const pattern of pricePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      let price1 = parseInt(match[1]);
      let price2 = match[2] ? parseInt(match[2]) : null;
      
      // Handle "k" suffix
      if (normalized.includes('k') && price1 < 1000) {
        price1 *= 1000;
      }
      if (price2 && normalized.includes('k') && price2 < 1000) {
        price2 *= 1000;
      }
      
      // Range detection
      if (price2) {
        criteria.minPrice = Math.min(price1, price2);
        criteria.maxPrice = Math.max(price1, price2);
      } else if (normalized.includes('around')) {
        // "around 25k" → 20k-30k range
        criteria.minPrice = Math.floor(price1 * 0.8);
        criteria.maxPrice = Math.ceil(price1 * 1.2);
      } else {
        criteria.maxPrice = price1;
      }
      break;
    }
  }
  
  // Qualitative price terms
  if (/\b(cheap|budget|affordable|budget[-\s]friendly)\b/i.test(normalized)) {
    if (!criteria.maxPrice) {
      criteria.maxPrice = 15000; // Default budget cap
    }
  }
  
  // Mileage patterns (flexible)
  const mileagePatterns = [
    /(?:under|below|less than|<)\s+(\d+)(?:k|,?\d{3})?\s*(km|mi|miles|kilometers)?/i,
    /(\d+)(?:k|,?\d{3})?\s*(km|mi|miles|kilometers)?\s+(?:or less|max|maximum)/i,
    /max(?:imum)?\s+mileage\s+(\d+)(?:k|,?\d{3})?\s*(km|mi|miles|kilometers)?/i,
  ];
  
  for (const pattern of mileagePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      let mileage = parseInt(match[1]);
      const unit = match[2] || (userCountry === 'CA' ? 'km' : 'mi');
      
      if (normalized.includes('k') && mileage < 1000) {
        mileage *= 1000;
      }
      
      // Normalize to km
      if (unit.startsWith('mi')) {
        mileage = Math.round(mileage * 1.60934);
        criteria.mileageUnit = 'mi';
      } else {
        criteria.mileageUnit = 'km';
      }
      
      criteria.maxMileage = mileage;
      break;
    }
  }
  
  // Qualitative mileage terms
  if (/\b(?:low|minimal|barely|hardly)[\s-]?(?:mileage|driven|used|km|miles)\b/i.test(normalized) ||
      /\b(?:mileage|driven)[\s-]?(?:low|minimal|barely)\b/i.test(normalized)) {
    criteria.lowMileage = true;
  }
  
  if (/\bhighway[\s-]driven\b/i.test(normalized)) {
    criteria.lowMileage = true; // Highway miles are better
  }
  
  // Year patterns (flexible)
  const yearPatterns = [
    /(\d{4})\s*(?:\+|or newer|and up|onwards)/i,
    /(?:newer than|after|from)\s+(\d{4})/i,
    /(\d{4})\s*-\s*(\d{4})/i,
    /(?:recent|newer|new)/i,
    /(?:last|past)\s+(\d+)\s+years?/i,
  ];
  
  const currentYear = new Date().getFullYear();
  
  for (const pattern of yearPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      if (match[0].includes('recent') || match[0].includes('newer') || match[0].includes('new')) {
        criteria.minYear = currentYear - 3; // Last 3 years
      } else if (match[0].includes('last') || match[0].includes('past')) {
        const years = parseInt(match[1]);
        criteria.minYear = currentYear - years;
      } else if (match[2]) {
        criteria.minYear = parseInt(match[1]);
        criteria.maxYear = parseInt(match[2]);
      } else {
        criteria.minYear = parseInt(match[1]);
      }
      break;
    }
  }
  
  // Drivetrain patterns (including slang)
  const drivetrainMap: Record<string, 'AWD' | 'FWD' | 'RWD' | '4WD'> = {
    'awd': 'AWD',
    'fwd': 'FWD',
    'rwd': 'RWD',
    '4wd': '4WD',
    '4x4': '4WD',
    'quattro': 'AWD', // Audi's AWD
    'xdrive': 'AWD', // BMW's AWD
    '4-wheel': '4WD',
    'four-wheel': '4WD',
    'all-wheel': 'AWD',
    'front-wheel': 'FWD',
    'rear-wheel': 'RWD',
  };
  
  for (const [key, value] of Object.entries(drivetrainMap)) {
    if (normalized.includes(key)) {
      criteria.drivetrain = value;
      break;
    }
  }
  
  // Winter capability
  if (/\b(?:winter[\s-]ready|good in snow|snow capable|winter tires|4x4)\b/i.test(normalized)) {
    criteria.winterReady = true;
    if (!criteria.drivetrain) {
      criteria.drivetrain = 'AWD'; // Prefer AWD for winter
    }
  }
  
  // Fuel type patterns (flexible)
  if (/\b(?:electric|ev|tesla[-\s]like|battery)\b/i.test(normalized)) {
    criteria.fuelType = 'electric';
  } else if (/\b(?:hybrid|phev|plug[-\s]in)\b/i.test(normalized)) {
    criteria.fuelType = 'hybrid';
  } else if (/\b(?:diesel)\b/i.test(normalized)) {
    criteria.fuelType = 'diesel';
  } else if (/\b(?:gas|gasoline|petrol)\b/i.test(normalized)) {
    criteria.fuelType = 'gasoline';
  }
  
  // Fuel efficiency
  if (/\b(?:fuel[\s-]efficient|cheap on gas|economical|good mpg|good on gas)\b/i.test(normalized)) {
    criteria.fuelEfficient = true;
  }
  
  // Make detection (including slang)
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9-]/g, '');
    if (MAKES.has(cleanWord)) {
      const make = MAKE_ALIASES[cleanWord] || cleanWord;
      criteria.make = make.charAt(0).toUpperCase() + make.slice(1);
      continue;
    }
    
    // Check body types
    if (BODY_TYPES.has(cleanWord)) {
      criteria.bodyType = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
      continue;
    }
    
    // Check fuel types
    if (FUEL_TYPES[cleanWord]) {
      criteria.fuelType = FUEL_TYPES[cleanWord];
      continue;
    }
    
    // Check drivetrain
    if (DRIVETRAIN_TYPES[cleanWord]) {
      criteria.drivetrain = DRIVETRAIN_TYPES[cleanWord];
      continue;
    }
    
    // Check transmission
    if (TRANSMISSION_TYPES[cleanWord]) {
      criteria.transmission = TRANSMISSION_TYPES[cleanWord];
      continue;
    }
    
    // Location hints
    if (/\b(?:near|in|around)\s+([a-z]+(?:\s+[a-z]+)?)/i.test(normalized)) {
      const locationMatch = normalized.match(/\b(?:near|in|around)\s+([a-z]+(?:\s+[a-z]+)?)/i);
      if (locationMatch) {
        criteria.location = locationMatch[1];
      }
      continue;
    }
    
    // Collect unmatched for potential model names
    if (cleanWord.length > 2 && 
        !['under', 'below', 'max', 'maximum', 'less', 'than', 'with', 'and', 'the', 'car', 'cars'].includes(cleanWord)) {
      unmatchedWords.push(cleanWord);
    }
  }
  
  // Practical intent patterns
  if (/\b(?:family[\s-]car|family[\s-]friendly|kids|minivan|7[\s-]seater)\b/i.test(normalized)) {
    criteria.familyFriendly = true;
    if (!criteria.bodyType) {
      criteria.bodyType = 'SUV'; // Prefer SUV for families
    }
  }
  
  if (/\b(?:student[\s-]car|first[\s-]car|beginner|learner)\b/i.test(normalized)) {
    criteria.intentFlags = criteria.intentFlags || [];
    criteria.intentFlags.push('first-car');
    if (!criteria.maxPrice) {
      criteria.maxPrice = 15000; // Budget for first car
    }
    criteria.reliable = true;
  }
  
  if (/\b(?:commuter[\s-]car|daily[\s-]driver|work[\s-]car)\b/i.test(normalized)) {
    criteria.intentFlags = criteria.intentFlags || [];
    criteria.intentFlags.push('commuter');
    criteria.fuelEfficient = true;
    criteria.reliable = true;
  }
  
  if (/\b(?:fun[\s-]car|sporty|sports[\s-]car|fast|performance)\b/i.test(normalized)) {
    criteria.sportyCar = true;
    if (!criteria.bodyType) {
      criteria.bodyType = 'Coupe';
    }
  }
  
  if (/\b(?:project[\s-]car|fixer[\s-]upper|restoration)\b/i.test(normalized)) {
    criteria.intentFlags = criteria.intentFlags || [];
    criteria.intentFlags.push('project-car');
  }
  
  // Brand groups
  if (/\b(?:luxury|premium|high[\s-]end)\b/i.test(normalized)) {
    criteria.luxury = true;
  }
  
  if (/\b(?:reliable|dependable|trustworthy)\b/i.test(normalized)) {
    criteria.reliable = true;
  }
  
  if (/\b(?:japanese|japan)\b/i.test(normalized) && !criteria.make) {
    criteria.intentFlags = criteria.intentFlags || [];
    criteria.intentFlags.push('japanese');
  }
  
  if (/\b(?:german|germany)\b/i.test(normalized) && !criteria.make) {
    criteria.intentFlags = criteria.intentFlags || [];
    criteria.intentFlags.push('german');
  }
  
  // If we have a make and unmatched words, assume first unmatched is model
  if (criteria.make && unmatchedWords.length > 0) {
    criteria.model = unmatchedWords[0].charAt(0).toUpperCase() + unmatchedWords[0].slice(1);
    unmatchedWords.shift();
  }
  
  // Store remaining keywords for fallback search
  if (unmatchedWords.length > 0) {
    criteria.keywords = unmatchedWords;
  }
  
  return criteria;
}

/**
 * Convert parsed criteria into human-readable string
 */
export function criteriaToReadableString(criteria: ParsedSearchCriteria): string {
  const parts: string[] = [];
  
  if (criteria.make) {
    parts.push(criteria.make);
    if (criteria.model) {
      parts.push(criteria.model);
    }
  }
  
  if (criteria.bodyType) {
    parts.push(criteria.bodyType);
  }
  
  if (criteria.drivetrain) {
    parts.push(criteria.drivetrain);
  }
  
  if (criteria.transmission) {
    parts.push(criteria.transmission === 'automatic' ? 'Auto' : 'Manual');
  }
  
  if (criteria.fuelType) {
    const fuelLabels = {
      gasoline: 'Gas',
      diesel: 'Diesel',
      electric: 'Electric',
      hybrid: 'Hybrid',
    };
    parts.push(fuelLabels[criteria.fuelType]);
  }
  
  if (criteria.minPrice && criteria.maxPrice) {
    parts.push(`$${criteria.minPrice.toLocaleString()}-$${criteria.maxPrice.toLocaleString()}`);
  } else if (criteria.maxPrice) {
    parts.push(`under $${criteria.maxPrice.toLocaleString()}`);
  } else if (criteria.minPrice) {
    parts.push(`over $${criteria.minPrice.toLocaleString()}`);
  }
  
  if (criteria.maxMileage) {
    const unit = criteria.mileageUnit === 'km' ? 'km' : 'mi';
    parts.push(`under ${criteria.maxMileage.toLocaleString()} ${unit}`);
  }
  
  if (criteria.lowMileage) {
    parts.push('low mileage');
  }
  
  if (criteria.fuelEfficient) {
    parts.push('fuel efficient');
  }
  
  if (criteria.reliable) {
    parts.push('reliable');
  }
  
  if (criteria.luxury) {
    parts.push('luxury');
  }
  
  if (criteria.winterReady) {
    parts.push('winter ready');
  }
  
  if (criteria.familyFriendly) {
    parts.push('family friendly');
  }
  
  if (criteria.sportyCar) {
    parts.push('sporty');
  }
  
  if (criteria.minYear) {
    if (criteria.maxYear) {
      parts.push(`${criteria.minYear}-${criteria.maxYear}`);
    } else {
      parts.push(`${criteria.minYear}+`);
    }
  }
  
  if (criteria.location) {
    parts.push(`near ${criteria.location}`);
  }
  
  if (criteria.intentFlags) {
    const intentLabels: Record<string, string> = {
      'first-car': 'first car',
      'commuter': 'commuter',
      'project-car': 'project car',
      'japanese': 'Japanese',
      'german': 'German',
    };
    criteria.intentFlags.forEach(flag => {
      if (intentLabels[flag]) {
        parts.push(intentLabels[flag]);
      }
    });
  }
  
  return parts.join(' · ');
}
