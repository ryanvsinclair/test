#!/usr/bin/env node

/**
 * Complete Canadian Cities CSV Generator
 * 
 * Source: https://www.canada-city.ca/all-cities-in-canada.php (3,427 cities)
 * Fetched: All cities with province mappings
 * 
 * Generates standardized CSV with schema:
 * city,province,country,latitude,longitude,postal_prefix,search_key,region_code,is_capital,is_major_market,population_hint,timezone
 * 
 * Data Integrity:
 * - No fabricated data
 * - Coordinates, postal codes, population left blank (for future enrichment)
 * - Provinces verified from source
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Timezone mappings by province code
const TIMEZONE_MAP = {
  'AB': 'America/Edmonton',
  'BC': 'America/Vancouver',
  'MB': 'America/Winnipeg',
  'NB': 'America/Moncton',
  'NL': 'America/St_Johns',
  'NT': 'America/Yellowknife',
  'NS': 'America/Halifax',
  'NU': 'America/Iqaluit',
  'ON': 'America/Toronto',
  'PE': 'America/Halifax',
  'QC': 'America/Montreal',
  'SK': 'America/Regina',
  'YT': 'America/Whitehorse'
};

// Province name to code mapping
const PROVINCE_CODE = {
  'Alberta': 'AB',
  'British Columbia': 'BC',
  'Manitoba': 'MB',
  'New Brunswick': 'NB',
  'Newfoundland': 'NL',
  'Northwest Territories': 'NT',
  'Nova Scotia': 'NS',
  'Nunavut': 'NU',
  'Ontario': 'ON',
  'Prince Edward Island': 'PE',
  'Quebec': 'QC',
  'Saskatchewan': 'SK',
  'Yukon': 'YT'
};

// Provincial/territorial capitals (verified)
const CAPITALS = new Set([
  'Edmonton', 'Victoria', 'Winnipeg', 'Fredericton', 'St. John\'s',
  'Yellowknife', 'Halifax', 'Iqaluit', 'Toronto', 'Charlottetown',
  'Quebec', 'Regina', 'Whitehorse', 'Ottawa'
]);

// Major markets (top 25 metro areas by population)
const MAJOR_MARKETS = new Set([
  'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton',
  'Ottawa', 'Winnipeg', 'Quebec', 'Hamilton', 'Kitchener',
  'London', 'Victoria', 'Halifax', 'Oshawa', 'Windsor',
  'Saskatoon', 'Regina', 'St. Catharines', 'Barrie', 'Kelowna',
  'Abbotsford', 'Kingston', 'Guelph', 'Sherbrooke', 'Saguenay'
]);

function normalizeSearchKey(cityName) {
  return cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
    .replace(/^saint/i, 'st')
    .replace(/^sainte/i, 'ste');
}

function escapeCSV(value) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

console.log('[GENERATE] Fetching complete Canadian cities dataset...');

try {
  // Fetch data from website
  const rawData = execSync(
    'curl -s "https://www.canada-city.ca/all-cities-in-canada.php" | grep -oP \'\\d+:\\s+[^<]+\'',
    { encoding: 'utf-8' }
  );
  
  const lines = rawData.trim().split('\n');
  console.log(`[GENERATE] Fetched ${lines.length} cities from source`);
  
  // CSV Header
  const header = 'city,province,country,latitude,longitude,postal_prefix,search_key,region_code,is_capital,is_major_market,population_hint,timezone';
  const rows = [header];
  
  let successCount = 0;
  let skippedCount = 0;
  
  lines.forEach(line => {
    // Parse format: "123: City Name, Province Name"
    const match = line.match(/^\d+:\s+([^,]+),\s+(.+)$/);
    
    if (!match) {
      skippedCount++;
      return;
    }
    
    const [, cityName, provinceName] = match;
    const city = cityName.trim();
    const province = provinceName.trim();
    const regionCode = PROVINCE_CODE[province];
    
    if (!regionCode) {
      console.warn(`[WARN] Unknown province: ${province} for city: ${city}`);
      skippedCount++;
      return;
    }
    
    const searchKey = normalizeSearchKey(city);
    const timezone = TIMEZONE_MAP[regionCode] || '';
    const isCapital = CAPITALS.has(city) ? 'true' : 'false';
    const isMajorMarket = MAJOR_MARKETS.has(city) ? 'true' : 'false';
    
    // Build row (intentionally leaving blank fields for future enrichment)
    const row = [
      escapeCSV(city),
      escapeCSV(province),
      'CA',
      '', // latitude - blank
      '', // longitude - blank
      '', // postal_prefix - blank
      searchKey,
      regionCode,
      isCapital,
      isMajorMarket,
      '', // population_hint - blank
      timezone
    ].join(',');
    
    rows.push(row);
    successCount++;
  });
  
  // Write to file
  const outputPath = path.join(process.cwd(), 'uploads', 'ca-cities-sample.csv');
  fs.writeFileSync(outputPath, rows.join('\n'), 'utf-8');
  
  console.log(`[GENERATE] ✓ Successfully processed ${successCount} cities`);
  console.log(`[GENERATE] ✓ Skipped ${skippedCount} entries`);
  console.log(`[GENERATE] ✓ Written to ${outputPath}`);
  console.log(`[GENERATE] ✓ Schema: city,province,country,latitude,longitude,postal_prefix,search_key,region_code,is_capital,is_major_market,population_hint,timezone`);
  
} catch (error) {
  console.error('[GENERATE] ✗ Error:', error.message);
  process.exit(1);
}
