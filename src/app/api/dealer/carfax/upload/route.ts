import { NextRequest, NextResponse } from 'next/server';

/**
 * CARFAX DOCUMENT ATTACHMENT API
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
 * This API:
 * - Accepts Carfax PDF uploads or public URLs
 * - Matches files to listings by stock number or VIN
 * - Stores PDFs in S3 (AWS-ready)
 * - Associates Carfax document reference with listing
 * - Returns match results
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 2: Database Integration Placeholder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// When Prisma is reintroduced:
// 1. Uncomment: import { PrismaClient } from '@prisma/client';
// 2. Initialize: const prisma = new PrismaClient();
// 3. Replace stub implementations with actual database queries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CarfaxUploadMatch {
  filename?: string;
  url?: string;
  matchType: 'stock_number' | 'vin' | 'unmatched';
  matchedIdentifier?: string;
  listingId?: string;
  s3Key?: string;
}

export interface CarfaxUploadResult {
  total: number;
  matched: number;
  unmatched: number;
  matches: CarfaxUploadMatch[];
}

/**
 * Extract stock number or VIN from Carfax PDF filename
 * 
 * Expected formats:
 * - STK-10234_carfax.pdf
 * - 1HGCM82633A004352_carfax.pdf
 * - carfax_STK-10234.pdf
 * - STK-10234.pdf
 */
function extractIdentifierFromFilename(filename: string): { stockNumber?: string; vin?: string } {
  // Remove file extension and clean
  const cleaned = filename.replace(/\.(pdf)$/i, '');
  
  // Try to find VIN pattern (17 alphanumeric, no I/O/Q)
  const vinMatch = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/i);
  if (vinMatch) {
    return { vin: vinMatch[0].toUpperCase() };
  }
  
  // Try to find stock number pattern
  // Common patterns: STK-10234, STOCK-123, 10234, etc.
  const stockMatch = cleaned.match(/(STK|STOCK)?[_-]?([A-Z0-9-]+)/i);
  if (stockMatch) {
    const stockNumber = stockMatch[2] || stockMatch[0];
    // Stock numbers typically have letters or dashes
    if (/[A-Z-]/.test(stockNumber)) {
      return { stockNumber };
    }
  }
  
  return {};
}

/**
 * Match Carfax document to listing by stock number or VIN
 */
async function matchCarfaxToListing(
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
 * Single Carfax PDF upload
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { error: 'Missing dealerId parameter' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const publicUrl = formData.get('url') as string | null;

    if (!file && !publicUrl) {
      return NextResponse.json(
        { error: 'Either file or url must be provided' },
        { status: 400 }
      );
    }

    // Handle PDF upload
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          { error: 'File must be a PDF' },
          { status: 400 }
        );
      }

      // Extract identifier from filename
      const { stockNumber, vin } = extractIdentifierFromFilename(file.name);

      // Match to listing
      const match = await matchCarfaxToListing(dealerId, stockNumber, vin);

      // TODO: Upload to S3
      // const s3Key = `dealers/${dealerId}/carfax/${uuid()}.pdf`;
      // await s3.upload({ Bucket: 'carly-carfax', Key: s3Key, Body: file });

      const mockS3Key = `dealers/${dealerId}/carfax/mock-${file.name}`;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PHASE 2: Replace with actual Prisma update
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // if (match.listingId) {
      //   await prisma.listing.update({
      //     where: { id: match.listingId },
      //     data: { carfaxS3Key: mockS3Key }
      //   });
      // }
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      return NextResponse.json({
        success: true,
        match: {
          filename: file.name,
          matchType: match.listingId ? match.matchType : 'unmatched',
          matchedIdentifier: stockNumber || vin,
          listingId: match.listingId,
          s3Key: mockS3Key,
        },
      });
    }

    // Handle public URL
    if (publicUrl) {
      const urlStockNumber = searchParams.get('stockNumber');
      const urlVin = searchParams.get('vin');

      const match = await matchCarfaxToListing(dealerId, urlStockNumber || undefined, urlVin || undefined);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // PHASE 2: Replace with actual Prisma update
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // if (match.listingId) {
      //   await prisma.listing.update({
      //     where: { id: match.listingId },
      //     data: { carfaxUrl: publicUrl }
      //   });
      // }
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      return NextResponse.json({
        success: true,
        match: {
          url: publicUrl,
          matchType: match.listingId ? match.matchType : 'unmatched',
          matchedIdentifier: urlStockNumber || urlVin,
          listingId: match.listingId,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Carfax Upload API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process Carfax upload' },
      { status: 500 }
    );
  }
}
