import { NextRequest, NextResponse } from 'next/server';
import { createVehicleListing } from '@/lib/api/vehicle-upload';

/**
 * POST /api/upload/vehicle
 * Create new vehicle listing with marketplace mode validation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listing, sellerId } = body;
    
    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID required' },
        { status: 400 }
      );
    }
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing data required' },
        { status: 400 }
      );
    }
    
    // Validate marketplace mode is provided
    if (!listing.marketplaceMode) {
      return NextResponse.json(
        { error: 'Marketplace mode selection is required' },
        { status: 400 }
      );
    }
    
    const result = await createVehicleListing(listing, sellerId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        listingId: result.listingId,
        marketplaceMode: result.marketplaceMode,
        message: `Vehicle successfully listed in ${result.marketplaceMode?.replace('-', ' ')}`
      });
    } else {
      return NextResponse.json(
        { 
          error: result.error,
          validationErrors: result.validationErrors 
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('[Upload API] Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
