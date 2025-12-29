// Smart City Search - CSV-based comprehensive Canada & US cities
// License: SimpleMaps Free US Cities Database (attribution required)
// Attribution: https://simplemaps.com/data/us-cities

export interface City {
  name: string;
  state: string; // Province code for Canada, State code for US
  country: 'CA' | 'US';
  displayName: string; // "Toronto, ON · Canada"
  lat?: number;
  lon?: number;
  population?: number;
}

interface CityDataset {
  metadata: {
    source: string;
    attribution: string;
    license: string;
    generated: string;
    counts: {
      canada: number;
      us: number;
      total: number;
    };
  };
  cities: {
    city: string;
    region: string;
    country: 'CA' | 'US';
    latitude: number;
    longitude: number;
    population?: number;
  }[];
}

// Normalized city name for search (lowercase, no accents, handle St./Saint)
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^saint\s/i, 'st ')
    .replace(/^st\.\s/i, 'st ')
    .trim();
}

// In-memory indexed cities cache
let citiesCache: City[] = [];
let citiesIndexed: Map<string, City[]> = new Map();
let isInitialized = false;

// Parse CSV line with proper escaping
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Initialize cities database from CSV files ONLY
async function initializeCities(): Promise<void> {
  if (isInitialized) return;

  try {
    console.log('[CITIES] Loading from CSV files...');
    
    // Load Canadian cities from CSV
    const caResponse = await fetch('/ca-cities-sample.csv');
    if (!caResponse.ok) {
      throw new Error(`Failed to load Canadian CSV: ${caResponse.status}`);
    }
    const caCSV = await caResponse.text();
    const caLines = caCSV.split('\n').filter(l => l.trim());
    
    // Load US cities from CSV
    const usResponse = await fetch('/uscities.csv');
    if (!usResponse.ok) {
      throw new Error(`Failed to load US CSV: ${usResponse.status}`);
    }
    const usCSV = await usResponse.text();
    const usLines = usCSV.split('\n').filter(l => l.trim());
    
    const cities: City[] = [];
    
    // Parse Canadian cities (skip header)
    // Schema: city,province,country,latitude,longitude,postal_prefix,search_key,region_code,is_capital,is_major_market,population_hint,timezone
    for (let i = 1; i < caLines.length; i++) {
      const parts = parseCSVLine(caLines[i]);
      if (parts.length < 8) continue;
      
      const cityName = parts[0];
      const province = parts[1];
      const regionCode = parts[7]; // region_code
      const lat = parseFloat(parts[3]) || undefined;
      const lon = parseFloat(parts[4]) || undefined;
      const population = parseInt(parts[10]) || undefined;
      
      if (!cityName || !regionCode) continue;
      
      cities.push({
        name: cityName,
        state: regionCode,
        country: 'CA',
        displayName: `${cityName}, ${regionCode} · Canada`,
        lat,
        lon,
        population,
      });
    }
    
    const caCityCount = cities.length;
    
    // Parse US cities (skip header)
    // Schema from uscities.csv: "city","city_ascii","state_id","state_name","county_fips","county_name","lat","lng","population",...
    for (let i = 1; i < usLines.length; i++) {
      const line = usLines[i];
      if (!line.trim()) continue;
      
      // Handle quoted CSV
      const match = line.match(/"([^"]*)","[^"]*","([^"]*)","[^"]*","[^"]*","[^"]*","([^"]*)","([^"]*)","([^"]*)"/);
      if (!match) continue;
      
      const cityName = match[1];
      const stateCode = match[2];
      const lat = parseFloat(match[3]) || undefined;
      const lon = parseFloat(match[4]) || undefined;
      const population = parseInt(match[5]) || undefined;
      
      if (!cityName || !stateCode) continue;
      
      cities.push({
        name: cityName,
        state: stateCode,
        country: 'US',
        displayName: `${cityName}, ${stateCode} · United States`,
        lat,
        lon,
        population,
      });
    }
    
    const usCityCount = cities.length - caCityCount;
    
    // Fail-loud if no Canadian cities loaded
    if (caCityCount === 0) {
      throw new Error('CRITICAL: 0 Canadian cities loaded from CSV. Build must fail.');
    }
    
    citiesCache = cities;
    citiesIndexed = buildPrefixIndex(citiesCache);
    isInitialized = true;
    
    console.log(`[CITIES] ✓ Loaded ${caCityCount} Canadian cities`);
    console.log(`[CITIES] ✓ Loaded ${usCityCount} US cities`);
    console.log(`[CITIES] ✓ City search index ready (${cities.length} total)`);
  } catch (error) {
    console.error('[CITIES] ✗ FAILED TO LOAD CITIES:', error);
    throw error; // Fail-loud
  }
}

// Build prefix index for O(1) lookups
function buildPrefixIndex(cities: City[]): Map<string, City[]> {
  const index = new Map<string, City[]>();
  
  cities.forEach(city => {
    const normalized = normalizeString(city.name);
    
    // Index by each prefix (up to 5 characters for performance)
    for (let i = 1; i <= Math.min(5, normalized.length); i++) {
      const prefix = normalized.substring(0, i);
      if (!index.has(prefix)) {
        index.set(prefix, []);
      }
      index.get(prefix)!.push(city);
    }
  });
  
  return index;
}

export const citiesAPI = {
  /**
   * Search cities by prefix (typeahead)
   * Returns up to 5 matching cities, ranked by population
   */
  searchCities: async (query: string): Promise<City[]> => {
    // Initialize if needed
    if (!isInitialized) {
      await initializeCities();
    }
    
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const normalizedQuery = normalizeString(query);
    
    // Use prefix index for fast lookup (up to 5 chars)
    const prefix = normalizedQuery.substring(0, Math.min(5, normalizedQuery.length));
    let candidates = citiesIndexed.get(prefix) || [];
    
    // If query is longer than 5 characters, filter further
    if (normalizedQuery.length > 5) {
      candidates = candidates.filter(city => 
        normalizeString(city.name).startsWith(normalizedQuery)
      );
    }
    
    // Rank by population (largest first)
    const ranked = candidates.sort((a, b) => (b.population || 0) - (a.population || 0));
    
    // Return top 5
    return ranked.slice(0, 5);
  },
  
  /**
   * Get city by exact match
   */
  getCityByName: async (name: string, state: string, country: 'CA' | 'US'): Promise<City | null> => {
    if (!isInitialized) {
      await initializeCities();
    }
    
    const city = citiesCache.find(c => 
      normalizeString(c.name) === normalizeString(name) &&
      c.state === state &&
      c.country === country
    );
    
    return city || null;
  },
  
  /**
   * Get all cities (for debugging/testing)
   */
  getAllCities: async (): Promise<City[]> => {
    if (!isInitialized) {
      await initializeCities();
    }
    return citiesCache;
  },
  
  /**
   * Get total city count
   */
  getCityCount: async (): Promise<{ total: number; ca: number; us: number }> => {
    if (!isInitialized) {
      await initializeCities();
    }
    
    const ca = citiesCache.filter(c => c.country === 'CA').length;
    const us = citiesCache.filter(c => c.country === 'US').length;
    
    return { total: citiesCache.length, ca, us };
  },
};
