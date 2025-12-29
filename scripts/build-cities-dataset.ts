/**
 * CSV-Based City Dataset Builder
 * 
 * Ingests CA and US city CSVs and generates unified cities-data.json
 * License-compliant with SimpleMaps Free US Cities Database
 */

import fs from 'fs';
import path from 'path';

interface CityRecord {
  city: string;
  region: string; // Province/State code
  country: 'CA' | 'US';
  latitude: number;
  longitude: number;
  population?: number;
}

// Normalize string for search (lowercase, no accents)
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Parse Canadian cities CSV
function parseCanadianCities(csvPath: string): CityRecord[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const cities: CityRecord[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');
    
    if (parts.length < 9) continue;
    
    const name = parts[1]?.trim();
    const provinceCode = parts[4]?.trim();
    const lat = parseFloat(parts[8]?.trim() || '0');
    const lon = parseFloat(parts[9]?.trim() || '0');
    
    if (!name || !provinceCode || !lat || !lon) continue;
    
    cities.push({
      city: name,
      region: provinceCode,
      country: 'CA',
      latitude: lat,
      longitude: lon,
    });
  }
  
  return cities;
}

// Parse US cities CSV
function parseUSCities(csvPath: string): CityRecord[] {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const cities: CityRecord[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle quoted CSV values
    const match = line.match(/"([^"]*)","[^"]*","([^"]*)","[^"]*","[^"]*","[^"]*","([^"]*)","([^"]*)","([^"]*)"/);
    
    if (!match) continue;
    
    const name = match[1]?.trim();
    const stateCode = match[2]?.trim();
    const lat = parseFloat(match[3] || '0');
    const lon = parseFloat(match[4] || '0');
    const population = parseInt(match[5] || '0', 10);
    
    if (!name || !stateCode || !lat || !lon) continue;
    
    cities.push({
      city: name,
      region: stateCode,
      country: 'US',
      latitude: lat,
      longitude: lon,
      population: population || undefined,
    });
  }
  
  return cities;
}

// Build unified dataset
async function buildCitiesDataset() {
  console.log('[BUILD] Starting city dataset build...');
  
  const caPath = path.join(process.cwd(), 'uploads', 'ca-cities-sample.csv');
  const usPath = path.join(process.cwd(), 'uploads', 'uscities.csv');
  const outputPath = path.join(process.cwd(), 'public', 'cities-data.json');
  
  // Parse both CSVs
  console.log('[BUILD] Parsing Canadian cities...');
  const caCities = parseCanadianCities(caPath);
  console.log(`[BUILD] Loaded ${caCities.length} Canadian cities`);
  
  console.log('[BUILD] Parsing US cities...');
  const usCities = parseUSCities(usPath);
  console.log(`[BUILD] Loaded ${usCities.length} US cities`);
  
  // Combine
  const allCities = [...caCities, ...usCities];
  console.log(`[BUILD] Total cities: ${allCities.length}`);
  
  // Write to public directory
  const outputData = {
    metadata: {
      source: 'SimpleMaps Free US Cities Database + Canadian Cities',
      attribution: 'US data: https://simplemaps.com/data/us-cities (backlink required)',
      license: 'See license.txt for full terms',
      generated: new Date().toISOString(),
      counts: {
        canada: caCities.length,
        us: usCities.length,
        total: allCities.length,
      },
    },
    cities: allCities,
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`[BUILD] ✓ Written to ${outputPath}`);
  console.log('[BUILD] Dataset build complete.');
}

buildCitiesDataset().catch(console.error);
