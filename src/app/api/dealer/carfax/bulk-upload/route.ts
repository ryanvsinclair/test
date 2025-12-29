import { NextRequest, NextResponse } from 'next/server';

/**
 * BULK CARFAX UPLOAD API
 * 
 * CRITICAL RULES:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 1. NEVER parse or extract data from Carfax PDFs
 * 2. NEVER auto-populate listing attributes from Carfax
 * 3. NEVER summarize or interpret Carfax content
 * 4. Store PDFs and URLs ONLY
 * 5. All vehicle attributes remain dealer-declared
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Supported formats:
 * 1. ZIP of PDFs (named by stock number or VIN)
 * 2. CSV with columns: stock_number, vin, carfax_url
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 2: Database Integration Placeholder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// When Prisma is reintroduced:
// 1. Uncomment: import { PrismaClient } from '@prisma/client';
// 2. Initialize: const prisma = new PrismaClient();
// 3. Replace stub implementations with actual database queries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BulkCarfaxMatch {
  filename?: string;
  url?: string;
  stockNumber?: string;
  vin?: string;
  matchType: 'stock_number' | 'vin' | 'unmatched';
  listingId?: string;
  s3Key?: string;
}

export interface BulkCarfaxResult {
  total: number;
  matched: number;
  unmatched: number;
  matches: BulkCarfaxMatch[];
}

/**
 * Extract stock number or VIN from filename
 */
function extractIdentifier(filename: string): { stockNumber?: string; vin?: string } {
  const cleaned = filename.replace(/\.(pdf)$/i, '');
  
  // Try VIN pattern first (17 alphanumeric, no I/O/Q)
  const vinMatch = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/i);
  if (vinMatch) {
    return { vin: vinMatch[0].toUpperCase() };
  }
  
  // Try stock number pattern
  const stockMatch = cleaned.match(/(STK|STOCK)?[_-]?([A-Z0-9-]+)/i);
  if (stockMatch) {
    const stockNumber = stockMatch[2] || stockMatch[0];
    if (/[A-Z-]/.test(stockNumber)) {
      return { stockNumber };
    }
  }
  
  return {};
}

/**
 * Match Carfax to listing
 */
async function matchToListing(
  dealerId: string,
  stockNumber?: string,
  vin?: string
): Promise<{ listingId?: string; matchType?: 'stock_number' | 'vin' }> {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2: Replace with actual Prisma queries
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // if (stockNumber) {
  //   const listing = await prisma.listing.findFirst({
  //     where: {
  //       dealerId,
  //       stockNumber: { equals: stockNumber, mode: 'insensitive' },
  //     },
  //     select: { id: true },
  //   });
  //   if (listing) {
  //     return { listingId: listing.id, matchType: 'stock_number' };
  //   }
  // }
  // if (vin) {
  //   const listing = await prisma.listing.findFirst({
  //     where: {
  //       dealerId,
  //       vin: { equals: vin, mode: 'insensitive' },
  //     },
  //     select: { id: true },
  //   });
  //   if (listing) {
  //     return { listingId: listing.id, matchType: 'vin' };
  //   }
  // }
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  return {};
}

/**
 * Parse CSV with Carfax URLs
 */
function parseCarfaxCSV(content: string): Array<{ stockNumber?: string; vin?: string; url: string }> {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  const stockIdx = headers.findIndex(h => h.includes('stock'));
  const vinIdx = headers.findIndex(h => h.includes('vin'));
  const urlIdx = headers.findIndex(h => h.includes('url') || h.includes('link'));

  if (urlIdx === -1) return [];

  const rows: Array<{ stockNumber?: string; vin?: string; url: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    
    const url = cols[urlIdx];
    if (!url || !url.startsWith('http')) continue;

    rows.push({
      stockNumber: stockIdx >= 0 ? cols[stockIdx] : undefined,
      vin: vinIdx >= 0 ? cols[vinIdx]?.toUpperCase() : undefined,
      url,
    });
  }

  return rows;
}

/**
 * Bulk upload handler
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get('dealerId');
    const uploadType = searchParams.get('type'); // 'zip' or 'csv'

    if (!dealerId) {
      return NextResponse.json(
        { error: 'Missing dealerId parameter' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Handle ZIP of PDFs
    if (uploadType === 'zip' || file.name.endsWith('.zip')) {
      // TODO: Extract ZIP and process each PDF
      // For now, return mock response structure
      
      const mockMatches: BulkCarfaxMatch[] = [
        {
          filename: 'STK-10234.pdf',
          stockNumber: 'STK-10234',
          matchType: 'stock_number',
          listingId: 'listing-001',
          s3Key: `dealers/${dealerId}/carfax/STK-10234.pdf`,
        },
        {
          filename: '1HGCM82633A004352.pdf',
          vin: '1HGCM82633A004352',
          matchType: 'vin',
          listingId: 'listing-002',
          s3Key: `dealers/${dealerId}/carfax/1HGCM82633A004352.pdf`,
        },
        {
          filename: 'unknown.pdf',
          matchType: 'unmatched',
        },
      ];

      const result: BulkCarfaxResult = {
        total: mockMatches.length,
        matched: mockMatches.filter(m => m.matchType !== 'unmatched').length,
        unmatched: mockMatches.filter(m => m.matchType === 'unmatched').length,
        matches: mockMatches,
      };

      return NextResponse.json({
        success: true,
        result,
      });
    }

    // Handle CSV with URLs
    if (uploadType === 'csv' || file.name.endsWith('.csv')) {
      const content = await file.text();
      const rows = parseCarfaxCSV(content);

      const matches: BulkCarfaxMatch[] = [];

      for (const row of rows) {
        const match = await matchToListing(dealerId, row.stockNumber, row.vin);

        matches.push({
          url: row.url,
          stockNumber: row.stockNumber,
          vin: row.vin,
          matchType: match.listingId ? match.matchType! : 'unmatched',
          listingId: match.listingId,
        });

        // TODO: Update listing with Carfax URL
        // if (match.listingId) {
        //   await prisma.listing.update({
        //     where: { id: match.listingId },
        //     data: { carfaxUrl: row.url }
        //   });
        // }
      }

      const result: BulkCarfaxResult = {
        total: matches.length,
        matched: matches.filter(m => m.matchType !== 'unmatched').length,
        unmatched: matches.filter(m => m.matchType === 'unmatched').length,
        matches,
      };

      return NextResponse.json({
        success: true,
        result,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported file type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Bulk Carfax Upload API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
}
