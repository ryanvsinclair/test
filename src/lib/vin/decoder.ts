/**
 * VIN Decoding Service
 * 
 * CRITICAL: This is the ONLY place in the codebase where VIN decoding happens.
 * All VIN decoding must import and use decodeVin() from this file.
 * 
 * SAFETY RULES:
 * - NEVER return default/mock vehicle data
 * - NEVER silently fail (return null on failure)
 * - NEVER return partial data (all required fields or null)
 * - NEVER overwrite user-entered values (UI responsibility)
 */

export interface DecodedVinData {
  year: number;
  make: string;
  model: string;
  trim?: string;
  bodyClass?: string;
  engineCylinders?: number;
  engineDisplacement?: number;
  driveType?: string;
  fuelTypePrimary?: string;
}

export interface VinDecodeResult {
  success: true;
  data: DecodedVinData;
}

export interface VinDecodeFailure {
  success: false;
  error: string;
}

export type VinDecodeResponse = VinDecodeResult | VinDecodeFailure;

/**
 * Decode VIN using NHTSA free API
 * 
 * FUTURE UPGRADE PATH:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * To upgrade to a paid VIN decoder (ChromeData, DataOne, Edmunds):
 * 
 * 1. Replace the fetch() call in this function with your provider's API
 * 2. Replace normalizeNHTSAResponse() with your provider's response parser
 * 3. DO NOT change the return signature (VinDecodeResponse)
 * 4. DO NOT change any UI code
 * 5. Add your API key to environment variables
 * 6. Consider implementing caching (paid providers charge per VIN)
 * 
 * Example paid provider integration points:
 * 
 * // ChromeData:
 * const response = await fetch(`https://api.chromedata.com/vin/${vin}`, {
 *   headers: { 'Authorization': `Bearer ${process.env.CHROMEDATA_API_KEY}` }
 * });
 * 
 * // DataOne:
 * const response = await fetch(`https://vindecoder.dataonesoftware.com/decode`, {
 *   method: 'POST',
 *   body: JSON.stringify({ vin }),
 *   headers: { 'X-API-Key': process.env.DATAONE_API_KEY }
 * });
 * 
 * Paid providers typically offer:
 * - More accurate trim data
 * - Standard equipment lists
 * - Market pricing data
 * - Faster response times
 * - Higher rate limits
 * 
 * IMPORTANT: Always validate that year, make, and model are present
 * before returning success, regardless of provider.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export async function decodeVin(vin: string): Promise<VinDecodeResponse> {
  // Validate VIN format
  if (!vin || typeof vin !== 'string') {
    return {
      success: false,
      error: 'VIN is required',
    };
  }

  const cleanVin = vin.trim().toUpperCase();

  // VIN must be exactly 17 characters
  if (cleanVin.length !== 17) {
    return {
      success: false,
      error: 'VIN must be exactly 17 characters',
    };
  }

  // VIN cannot contain I, O, or Q (standardized restriction)
  if (/[IOQ]/.test(cleanVin)) {
    return {
      success: false,
      error: 'VIN cannot contain the letters I, O, or Q',
    };
  }

  try {
    // Call NHTSA VIN decoder API (free, no authentication required)
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${cleanVin}?format=json`
    );

    if (!response.ok) {
      return {
        success: false,
        error: 'VIN decode service unavailable',
      };
    }

    const json = await response.json();

    // NHTSA returns Results array, even on failure
    if (!json.Results || !Array.isArray(json.Results)) {
      return {
        success: false,
        error: 'Invalid response from VIN decode service',
      };
    }

    // Parse and validate response
    const decodedData = normalizeNHTSAResponse(json.Results);

    if (!decodedData) {
      return {
        success: false,
        error: 'Unable to decode VIN - incomplete vehicle data',
      };
    }

    return {
      success: true,
      data: decodedData,
    };
  } catch (error) {
    console.error('[VIN Decoder] Error:', error);
    return {
      success: false,
      error: 'Failed to decode VIN',
    };
  }
}

/**
 * Normalize NHTSA response to DecodedVinData
 * 
 * REQUIRED FIELDS: year, make, model
 * If any required field is missing, return null.
 * 
 * NEVER return partial data.
 * NEVER inject default values.
 */
function normalizeNHTSAResponse(results: any[]): DecodedVinData | null {
  // Helper to find value by variable ID or name
  const findValue = (variableId: number, variableName?: string): string | null => {
    const result = results.find(
      (r) =>
        r.VariableId === variableId ||
        (variableName && r.Variable === variableName)
    );
    return result?.Value && result.Value !== 'Not Applicable' ? result.Value : null;
  };

  // Extract required fields
  const year = findValue(29, 'Model Year');
  const make = findValue(26, 'Make');
  const model = findValue(28, 'Model');

  // Validate required fields
  if (!year || !make || !model) {
    console.warn('[VIN Decoder] Missing required fields:', { year, make, model });
    return null;
  }

  // Parse year
  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 2) {
    console.warn('[VIN Decoder] Invalid year:', year);
    return null;
  }

  // Extract optional fields
  const trim = findValue(109, 'Trim');
  const bodyClass = findValue(5, 'Body Class');
  const engineCylinders = findValue(9, 'Engine Number of Cylinders');
  const engineDisplacement = findValue(11, 'Displacement (L)');
  const driveType = findValue(15, 'Drive Type');
  const fuelType = findValue(24, 'Fuel Type - Primary');

  return {
    year: yearNum,
    make,
    model,
    trim: trim || undefined,
    bodyClass: bodyClass || undefined,
    engineCylinders: engineCylinders ? parseInt(engineCylinders) : undefined,
    engineDisplacement: engineDisplacement ? parseFloat(engineDisplacement) : undefined,
    driveType: driveType || undefined,
    fuelTypePrimary: fuelType || undefined,
  };
}

/**
 * Validate VIN format without decoding
 * Useful for client-side validation before API calls
 */
export function isValidVinFormat(vin: string): boolean {
  if (!vin || typeof vin !== 'string') {
    return false;
  }

  const cleanVin = vin.trim().toUpperCase();

  // Must be exactly 17 characters
  if (cleanVin.length !== 17) {
    return false;
  }

  // Cannot contain I, O, or Q
  if (/[IOQ]/.test(cleanVin)) {
    return false;
  }

  // Must be alphanumeric
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
    return false;
  }

  return true;
}
