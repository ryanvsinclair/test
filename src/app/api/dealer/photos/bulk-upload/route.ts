import { NextRequest, NextResponse } from 'next/server';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHASE 2: Database Integration Placeholder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// When Prisma is reintroduced:
// 1. Uncomment: import { PrismaClient } from '@prisma/client';
// 2. Initialize: const prisma = new PrismaClient();
// 3. Replace stub implementations with actual database queries
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PhotoMatch {
  filename: string;
  matchType: 'stock_number' | 'vin' | 'unmatched';
  matchedIdentifier?: string;
  listingId?: string;
  s3Key?: string;
}

export interface PhotoUploadResult {
  total: number;
  matched: number;
  unmatched: number;
  matches: PhotoMatch[];
}

/**
 * Extract stock number or VIN from folder/filename
 */
function extractIdentifier(path: string): { stockNumber?: string; vin?: string } {
  // Remove file extension and clean path
  const cleaned = path.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  
  // Try folder-based matching (e.g., "STK-10234/front.jpg" or "1HGCM82633A004352/side.jpg")
  const folderMatch = cleaned.match(/([^\/\\]+)\/[^\/\\]+$/);
  if (folderMatch) {
    const folder = folderMatch[1];
    
    // Check if it's a VIN (17 alphanumeric characters)
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(folder)) {
      return { vin: folder.toUpperCase() };
    }
    
    // Check if it's a stock number (any format with letters/numbers/dashes)
    if (/^[A-Z0-9\-]+$/i.test(folder)) {
      return { stockNumber: folder };
    }
  }
  
  // Try filename-based matching (e.g., "STK-10234_front.jpg" or "1HGCM82633A004352_side.jpg")
  const filenameMatch = cleaned.match(/([A-HJ-NPR-Z0-9\-]+)_/i);
  if (filenameMatch) {
    const identifier = filenameMatch[1];
    
    // Check if it's a VIN
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(identifier)) {
      return { vin: identifier.toUpperCase() };
    }
    
    // Check if it's a stock number
    if (/^[A-Z0-9\-]+$/i.test(identifier)) {
      return { stockNumber: identifier };
    }
  }
  
  return {};
}

/**
 * Match photo to listing by stock number or VIN
 */
async function matchPhotoToListing(
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
    const zipFile = formData.get('file') as File;

    if (!zipFile) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!zipFile.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'File must be a ZIP archive' },
        { status: 400 }
      );
    }

    // TODO: Implement actual ZIP extraction and S3 upload
    // For now, return mock response structure
    
    // 1. Extract ZIP
    // 2. For each photo:
    //    - Extract identifier from folder/filename
    //    - Upload to S3
    //    - Match to listing
    //    - Create listingPhoto or unassignedPhoto record
    
    const mockMatches: PhotoMatch[] = [
      // Example matched photos
      {
        filename: 'STK-10234/front.jpg',
        matchType: 'stock_number',
        matchedIdentifier: 'STK-10234',
        listingId: 'listing-001',
        s3Key: 'dealers/dealer-001/photos/uuid-front.jpg',
      },
      // Example unmatched photo
      {
        filename: 'unknown/photo.jpg',
        matchType: 'unmatched',
      },
    ];

    const result: PhotoUploadResult = {
      total: mockMatches.length,
      matched: mockMatches.filter(m => m.matchType !== 'unmatched').length,
      unmatched: mockMatches.filter(m => m.matchType === 'unmatched').length,
      matches: mockMatches,
    };

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[Photo Bulk Upload API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process photo upload' },
      { status: 500 }
    );
  }
}
